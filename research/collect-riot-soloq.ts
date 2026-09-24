/** Collect a small, reproducible ranked cohort from Riot's official API.
 * Example (key must be set privately in the environment):
 * bun research/collect-riot-soloq.ts euw1 DIAMOND I 1 25 20
 * Args: platform tier division ladderPage maxPlayers matchesPerPlayer.
 * Output and pseudonym salt stay under gitignored data/runtime/soloq/.
 * Source: https://developer.riotgames.com/apis (League-V4, Match-V5).
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHmac, randomBytes } from "node:crypto";

export const ROUTING: Record<string, string> = {
    euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe",
    na1: "americas", br1: "americas", la1: "americas", la2: "americas",
    kr: "asia", jp1: "asia", tw2: "sea", sg2: "sea", ph2: "sea", th2: "sea", vn2: "sea", oc1: "sea",
};
const ROLES: Record<string, string> = {
    TOP: "top", JUNGLE: "jungle", MIDDLE: "mid", BOTTOM: "bot", UTILITY: "support",
};

type RiotParticipant = {
    puuid: string;
    teamId: number;
    teamPosition: string;
    championId: number;
    win: boolean;
};
type RiotMatch = {
    metadata: { matchId: string };
    info: {
        queueId: number;
        gameVersion: string;
        gameStartTimestamp: number;
        gameDuration: number;
        participants: RiotParticipant[];
        teams: { teamId: number; bans: { championId: number; pickTurn: number }[]; win: boolean }[];
    };
};

export function normalizeRankedMatch(
    match: RiotMatch,
    platform: string,
    pseudonym: (puuid: string) => string,
) {
    const info = match.info;
    if (info.queueId !== 420 || info.gameDuration < 300 || info.participants.length !== 10 || info.teams.length !== 2)
        return undefined;
    const sides = [100, 200].map((id) => {
        const team = info.teams.find((entry) => entry.teamId === id);
        const participants = info.participants.filter((entry) => entry.teamId === id);
        if (!team || participants.length !== 5 || new Set(participants.map((p) => p.teamPosition)).size !== 5 || participants.some((p) => !ROLES[p.teamPosition] || !p.championId || !p.puuid))
            return undefined;
        return {
            teamId: id,
            won: team.win,
            bans: [...team.bans].sort((a, b) => a.pickTurn - b.pickTurn).map((ban) => ban.championId).filter((id) => id > 0),
            picks: participants.map((p) => ({ role: ROLES[p.teamPosition], championId: p.championId, playerId: pseudonym(p.puuid) })),
        };
    });
    const [blueSide, redSide] = sides;
    if (!blueSide || !redSide || blueSide.won === redSide.won || new Set(info.participants.map((p) => p.championId)).size !== 10 || !Number.isFinite(info.gameStartTimestamp))
        return undefined;
    if (info.participants.some((p) => p.win !== (p.teamId === 100 ? blueSide.won : redSide.won)))
        return undefined;
    return {
        source: "riot-match-v5",
        matchId: match.metadata.matchId,
        platform,
        queueId: 420,
        startTime: new Date(info.gameStartTimestamp).toISOString(),
        patch: info.gameVersion.split(".").slice(0, 2).join("."),
        blue: blueSide,
        red: redSide,
    };
}

async function collect() {
    const [platform, tier, division, pageText, playersText, matchesText] = process.argv.slice(2);
    const routing = ROUTING[platform?.toLowerCase()];
    const allowedTiers = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"];
    if (!routing || !allowedTiers.includes(tier) || !["I", "II", "III", "IV"].includes(division))
        throw new Error("Provide a supported platform, tier and division. Example: euw1 DIAMOND I 1 25 20");
    const page = Number(pageText), maxPlayers = Number(playersText), perPlayer = Number(matchesText);
    if (![page, maxPlayers, perPlayer].every(Number.isInteger) || page < 1 || maxPlayers < 1 || maxPlayers > 100 || perPlayer < 1 || perPlayer > 100)
        throw new Error("Page must be positive, players 1-100, matches per player 1-100");
    const key = process.env.RIOT_API_KEY;
    if (!key) throw new Error("Set RIOT_API_KEY privately in the environment; never paste it into a source file or chat");
    const outputDir = join(import.meta.dir, "..", "data", "runtime", "soloq");
    mkdirSync(outputDir, { recursive: true });
    const saltPath = join(outputDir, "pseudonym-salt.bin");
    if (!existsSync(saltPath)) writeFileSync(saltPath, randomBytes(32));
    const salt = readFileSync(saltPath);
    const pseudonym = (puuid: string) => createHmac("sha256", salt).update(puuid).digest("hex");
    const outPath = join(outputDir, `${platform}-${tier}-${division}.jsonl`);
    const seen = new Set<string>();
    if (existsSync(outPath))
        for (const line of readFileSync(outPath, "utf8").split(/\r?\n/)) {
            if (!line.trim()) continue;
            seen.add((JSON.parse(line) as { matchId: string }).matchId);
        }
    let lastRequest = 0;
    const request = async <T>(url: string): Promise<T> => {
        for (let attempt = 0; attempt < 5; attempt++) {
            const delay = Math.max(0, 1500 - (Date.now() - lastRequest));
            if (delay) await Bun.sleep(delay);
            lastRequest = Date.now();
            const response = await fetch(url, { headers: { "X-Riot-Token": key }, signal: AbortSignal.timeout(15_000) });
            if (response.ok) return await response.json() as T;
            if (response.status === 429 || response.status >= 500) {
                const retry = Number(response.headers.get("Retry-After"));
                await Bun.sleep(Number.isFinite(retry) && retry > 0 ? retry * 1000 : 2000 * 2 ** attempt);
                continue;
            }
            throw new Error(`Riot API returned HTTP ${response.status}; verify key, route and endpoint`);
        }
        throw new Error("Riot API request failed after retries");
    };
    const platformUrl = `https://${platform}.api.riotgames.com`;
    const regionUrl = `https://${routing}.api.riotgames.com`;
    const ladderPath = ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier)
        ? `/lol/league/v4/${tier.toLowerCase()}leagues/by-queue/RANKED_SOLO_5x5`
        : `/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}?page=${page}`;
    const ladderResponse = await request<{ entries?: { puuid?: string }[] } | { puuid?: string }[]>(platformUrl + ladderPath);
    const entries = Array.isArray(ladderResponse) ? ladderResponse : ladderResponse.entries ?? [];
    const puuids = [...new Set(entries.map((entry) => entry.puuid).filter((puuid): puuid is string => Boolean(puuid)))].slice(0, maxPlayers);
    if (!puuids.length) throw new Error("Ladder returned no PUUIDs; inspect Riot's current League-V4 schema");
    let discovered = 0, saved = 0, rejected = 0;
    const matchIds = new Set<string>();
    for (const puuid of puuids) {
        const url = `${regionUrl}/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?queue=420&start=0&count=${perPlayer}`;
        for (const id of await request<string[]>(url)) if (!seen.has(id)) matchIds.add(id);
    }
    discovered = matchIds.size;
    for (const id of matchIds) {
        const match = await request<RiotMatch>(`${regionUrl}/lol/match/v5/matches/${encodeURIComponent(id)}`);
        const normalized = normalizeRankedMatch(match, platform, pseudonym);
        if (!normalized) { rejected++; continue; }
        // This describes the ladder seed, not the verified rank of all ten
        // participants in the match. Keep it on each row when pages are merged.
        appendFileSync(outPath, JSON.stringify({
            ...normalized,
            sampledFrom: { platform, tier, division, page, collectedAt: new Date().toISOString() },
        }) + "\n");
        saved++;
    }
    console.log(JSON.stringify({ platform, tier, division, page, players: puuids.length, discovered, saved, rejected, alreadySaved: seen.size, output: outPath }));
}

if (import.meta.main) await collect();
