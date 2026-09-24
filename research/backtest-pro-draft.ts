/** Offline, leakage-aware draft probability experiment for ChainCC pro games.
 * Usage: bun research/backtest-pro-draft.ts teams.csv.gz players.csv.gz
 * Source: https://chaincc.lol/free/data (CC BY 4.0, attribution required).
 * Only pregame fields enter the model. Nothing is exported to the app.
 */
import { auditDraftRows, readRows, type Row } from "./audit-chaincc-drafts";

type Game = {
    id: string;
    date: string;
    patch: string;
    league: string;
    blueTeam: string;
    redTeam: string;
    blueWon: number;
    blue: Map<string, string>;
    red: Map<string, string>;
    bluePlayers: Map<string, string>;
    redPlayers: Map<string, string>;
    blueBans: string[];
    redBans: string[];
    teamDifference: number;
    playerDifference: number;
    familiarityDifference: number;
};
type Variant = "side" | "team" | "player" | "draft_only" | "draft" | "interactions" | "bans";
type Example = { y: number; features: [number, number][] };

const ROLES = ["top", "jng", "mid", "bot", "sup"];
const sigmoid = (x: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, x))));
const logit = (p: number) => Math.log(Math.max(1e-6, p) / Math.max(1e-6, 1 - p));

export function prepareGames(teams: Row[], players: Row[]): Game[] {
    const teamPairs = new Map<string, Row[]>();
    const playerGroups = new Map<string, Row[]>();
    for (const row of teams) teamPairs.set(row.game_id, [...(teamPairs.get(row.game_id) ?? []), row]);
    for (const row of players) playerGroups.set(row.game_id, [...(playerGroups.get(row.game_id) ?? []), row]);
    const games: Game[] = [];
    for (const [id, pair] of teamPairs) {
        const blue = pair.find((row) => row.side === "Blue");
        const red = pair.find((row) => row.side === "Red");
        const members = playerGroups.get(id) ?? [];
        if (!blue || !red || pair.length !== 2 || members.length !== 10) continue;
        const roster = (side: string) => new Map(members.filter((row) => row.side === side).map((row) => [row.position, row.champion]));
        const people = (side: string) => new Map(members.filter((row) => row.side === side).map((row) => [row.position, `${blue.league}:${row.playername}`]));
        const blueRoster = roster("Blue"), redRoster = roster("Red");
        if (ROLES.some((role) => !blueRoster.get(role) || !redRoster.get(role))) continue;
        if (blue.result === red.result || !["TRUE", "FALSE"].includes(blue.result)) continue;
        if ([blue, red].some((row) => [1, 2, 3, 4, 5].some((i) => !row[`pick${i}`]))) continue;
        games.push({
            id, date: blue.date.slice(0, 10), patch: blue.patch, league: blue.league,
            blueTeam: blue.team_id || blue.team_name, redTeam: red.team_id || red.team_name,
            blueWon: Number(blue.result === "TRUE"), blue: blueRoster, red: redRoster,
            bluePlayers: people("Blue"), redPlayers: people("Red"),
            blueBans: [1, 2, 3, 4, 5].map((i) => blue[`ban${i}`]).filter(Boolean),
            redBans: [1, 2, 3, 4, 5].map((i) => red[`ban${i}`]).filter(Boolean),
            teamDifference: 0, playerDifference: 0, familiarityDifference: 0,
        });
    }
    games.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    // Prior-game empirical strength is known before each draft. Use the same
    // frozen value for all matches on one date to avoid unknown intra-day order.
    const records = new Map<string, { wins: number; losses: number }>();
    const playerRecords = new Map<string, { wins: number; losses: number }>();
    const championGames = new Map<string, number>();
    for (let i = 0; i < games.length;) {
        let end = i + 1;
        while (end < games.length && games[end].date === games[i].date) end++;
        const strength = (team: string) => {
            const r = records.get(team) ?? { wins: 0, losses: 0 };
            return Math.log((r.wins + 5) / (r.losses + 5));
        };
        const playerStrength = (player: string) => {
            const r = playerRecords.get(player) ?? { wins: 0, losses: 0 };
            return Math.log((r.wins + 5) / (r.losses + 5));
        };
        const average = (game: Game, side: "blue" | "red", value: (player: string, role: string, champion: string) => number) =>
            ROLES.reduce((sum, role) => sum + value(game[`${side}Players`].get(role)!, role, game[side].get(role)!), 0) / ROLES.length;
        for (let j = i; j < end; j++) {
            games[j].teamDifference = strength(games[j].blueTeam) - strength(games[j].redTeam);
            games[j].playerDifference = average(games[j], "blue", playerStrength) - average(games[j], "red", playerStrength);
            const familiarity = (player: string, role: string, champion: string) => Math.log1p(championGames.get(`${player}:${role}:${champion}`) ?? 0);
            games[j].familiarityDifference = average(games[j], "blue", familiarity) - average(games[j], "red", familiarity);
        }
        for (let j = i; j < end; j++) {
            const game = games[j];
            for (const [team, won] of [[game.blueTeam, game.blueWon], [game.redTeam, 1 - game.blueWon]] as const) {
                const r = records.get(team) ?? { wins: 0, losses: 0 };
                if (won) r.wins++; else r.losses++;
                records.set(team, r);
            }
            for (const [side, won] of [["blue", game.blueWon], ["red", 1 - game.blueWon]] as const)
                for (const role of ROLES) {
                    const player = game[`${side}Players`].get(role)!;
                    const r = playerRecords.get(player) ?? { wins: 0, losses: 0 };
                    if (won) r.wins++; else r.losses++;
                    playerRecords.set(player, r);
                    const key = `${player}:${role}:${game[side].get(role)}`;
                    championGames.set(key, (championGames.get(key) ?? 0) + 1);
                }
        }
        i = end;
    }
    return games;
}

function featureEntries(game: Game, variant: Variant): [string, number][] {
    const entries: [string, number][] = [["bias", 1]];
    if (variant === "side") return entries;
    if (variant !== "draft_only")
        entries.push(["prior-team-log-odds", game.teamDifference]);
    if (variant === "team") return entries;
    if (variant !== "draft_only") {
        entries.push(["prior-player-log-odds", game.playerDifference]);
        entries.push(["player-champion-familiarity", game.familiarityDifference]);
    }
    if (variant === "player") return entries;
    for (const role of ROLES) {
        entries.push([`champion:${role}:${game.blue.get(role)}`, 0.4]);
        entries.push([`champion:${role}:${game.red.get(role)}`, -0.4]);
    }
    if (variant === "draft" || variant === "draft_only") return entries;
    for (const [side, sign] of [[game.blue, 1], [game.red, -1]] as const)
        for (let i = 0; i < ROLES.length; i++)
            for (let j = i + 1; j < ROLES.length; j++) {
                const left = `${ROLES[i]}:${side.get(ROLES[i])}`;
                const right = `${ROLES[j]}:${side.get(ROLES[j])}`;
                entries.push([`synergy:${left}|${right}`, sign * 0.2]);
            }
    for (const role of ROLES) {
        const blue = game.blue.get(role)!;
        const red = game.red.get(role)!;
        const [first, second] = [blue, red].sort();
        entries.push([`matchup:${role}:${first}|${second}`, (blue === first ? 1 : -1) * 0.3]);
    }
    if (variant === "bans") {
        for (const ban of game.blueBans) entries.push([`ban:${ban}`, 0.2]);
        for (const ban of game.redBans) entries.push([`ban:${ban}`, -0.2]);
    }
    return entries;
}

function encode(games: Game[], variant: Variant, vocabulary: Map<string, number>, fit: boolean): Example[] {
    return games.map((game) => ({
        y: game.blueWon,
        features: featureEntries(game, variant).flatMap(([key, value]) => {
            let index = vocabulary.get(key);
            if (index === undefined && fit) {
                index = vocabulary.size;
                vocabulary.set(key, index);
            }
            return index === undefined ? [] : [[index, value] as [number, number]];
        }),
    }));
}

function predict(weights: Float64Array, example: Example): number {
    let score = 0;
    for (const [index, value] of example.features) score += weights[index] * value;
    return sigmoid(score);
}

function train(rows: Example[], features: number, penalty: number): Float64Array {
    const weights = new Float64Array(features);
    let seed = 42;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
    const order = rows.map((_, i) => i);
    for (let epoch = 0; epoch < 40; epoch++) {
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        const rate = 0.08 / Math.sqrt(1 + epoch / 5);
        for (const index of order) {
            const row = rows[index];
            const error = row.y - predict(weights, row);
            for (const [feature, value] of row.features)
                weights[feature] += rate * (error * value - (feature ? penalty * weights[feature] : 0));
        }
    }
    return weights;
}

function metrics(rows: Example[], probabilities: number[]) {
    let loss = 0, brier = 0, correct = 0, ece = 0;
    const bins = Array.from({ length: 10 }, () => ({ count: 0, predicted: 0, actual: 0 }));
    rows.forEach((row, i) => {
        const p = Math.max(1e-6, Math.min(1 - 1e-6, probabilities[i]));
        loss -= row.y * Math.log(p) + (1 - row.y) * Math.log(1 - p);
        brier += (p - row.y) ** 2;
        correct += Number((p >= 0.5) === Boolean(row.y));
        const bin = bins[Math.min(9, Math.floor(p * 10))];
        bin.count++; bin.predicted += p; bin.actual += row.y;
    });
    for (const bin of bins) if (bin.count) ece += bin.count * Math.abs(bin.predicted / bin.count - bin.actual / bin.count);
    const n = rows.length;
    return { games: n, logLoss: +(loss / n).toFixed(4), brier: +(brier / n).toFixed(4), accuracy: +(correct / n).toFixed(4), ece10: +(ece / n).toFixed(4) };
}

function exactLogLoss(rows: Example[], probabilities: number[]) {
    return rows.reduce((sum, row, i) => {
        const p = Math.max(1e-6, Math.min(1 - 1e-6, probabilities[i]));
        return sum - row.y * Math.log(p) - (1 - row.y) * Math.log(1 - p);
    }, 0) / rows.length;
}

function fitCalibration(rows: Example[], raw: number[]): [number, number] {
    let slope = 1, offset = 0;
    for (let step = 0; step < 60; step++) {
        let gSlope = 0, gOffset = 0, hSS = 1e-3, hSO = 0, hOO = 1e-3;
        rows.forEach((row, i) => {
            const x = logit(raw[i]);
            const p = sigmoid(slope * x + offset);
            const error = p - row.y;
            const curvature = p * (1 - p);
            gSlope += error * x; gOffset += error;
            hSS += curvature * x * x; hSO += curvature * x; hOO += curvature;
        });
        const det = hSS * hOO - hSO * hSO;
        if (det <= 0) break;
        const dSlope = (gSlope * hOO - gOffset * hSO) / det;
        const dOffset = (gOffset * hSS - gSlope * hSO) / det;
        slope -= Math.max(-0.5, Math.min(0.5, dSlope));
        offset -= Math.max(-0.5, Math.min(0.5, dOffset));
        if (Math.abs(dSlope) + Math.abs(dOffset) < 1e-6) break;
    }
    return [Math.max(0, slope), offset];
}

function splitChronologically(games: Game[]) {
    const dates = [...new Set(games.map((game) => game.date))].sort();
    const trainEnd = dates[Math.floor(dates.length * 0.7)];
    const validationEnd = dates[Math.floor(dates.length * 0.85)];
    const afterEmbargo = (date: string) => new Date(new Date(date).getTime() + 7 * 86400000).toISOString().slice(0, 10);
    return {
        train: games.filter((game) => game.date < trainEnd),
        validation: games.filter((game) => game.date >= afterEmbargo(trainEnd) && game.date < validationEnd),
        test: games.filter((game) => game.date >= afterEmbargo(validationEnd)),
        cutoffs: { trainEnd, validationEnd, testStart: afterEmbargo(validationEnd) },
    };
}

export function backtest(teams: Row[], players: Row[]) {
    const audit = auditDraftRows(teams, players);
    const games = prepareGames(teams, players);
    if (games.length !== audit.validGames) throw new Error("Training set does not match audited valid games");
    const split = splitChronologically(games);
    if (![split.train, split.validation, split.test].every((part) => part.length >= 100)) throw new Error("Insufficient chronological cohorts");
    const candidates = ["side", "team", "player", "draft_only", "draft", "interactions", "bans"] as const;
    const results = candidates.flatMap((variant) => [0.001, 0.01, 0.1].map((penalty) => {
        const vocabulary = new Map<string, number>();
        const trainRows = encode(split.train, variant, vocabulary, true);
        const valRows = encode(split.validation, variant, vocabulary, false);
        const weights = train(trainRows, vocabulary.size, penalty);
        const valRaw = valRows.map((row) => predict(weights, row));
        return {
            variant, penalty, features: vocabulary.size,
            validation: metrics(valRows, valRaw),
            validationLoss: exactLogLoss(valRows, valRaw),
            weights, vocabulary, valRows, valRaw,
        };
    }));
    const chosen = [...results].sort((a, b) => a.validationLoss - b.validationLoss)[0];
    const testRows = encode(split.test, chosen.variant, chosen.vocabulary, false);
    const testRaw = testRows.map((row) => predict(chosen.weights, row));
    const calibration = fitCalibration(chosen.valRows, chosen.valRaw);
    const calibrated = testRaw.map((p) => sigmoid(calibration[0] * logit(p) + calibration[1]));
    const best = {
        variant: chosen.variant, penalty: chosen.penalty, features: chosen.features,
        validation: chosen.validation,
        testRaw: metrics(testRows, testRaw),
        testCalibrated: metrics(testRows, calibrated),
        calibration: { slope: +calibration[0].toFixed(4), offset: +calibration[1].toFixed(4) },
    };
    return {
        source: "ChainCC 2026 pro matches, CC BY 4.0",
        audit: { totalGames: audit.distinctGames, validGames: audit.validGames, lastDate: audit.lastDate },
        split: { ...split.cutoffs, trainGames: split.train.length, validationGames: split.validation.length, testGames: split.test.length },
        selectionRule: "lowest raw validation log loss; test is reported only after selection",
        best,
        candidates: results.map(({ variant, penalty, features, validation }) => ({ variant, penalty, features, validation })),
    };
}

if (import.meta.main) {
    const [teamPath, playerPath] = process.argv.slice(2);
    if (!teamPath || !playerPath) throw new Error("Provide team and player CSV(.gz) paths");
    console.log(JSON.stringify(backtest(readRows(teamPath), readRows(playerPath)), null, 2));
}
