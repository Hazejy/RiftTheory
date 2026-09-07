import { Database } from "bun:sqlite";
import { upsertSource } from "./database";
import { finishImportRun, startImportRun } from "./importRuns";

const COLORS = ["red", "green", "blue", "white", "black", "colorless"] as const;

const CHAMPION_ALIASES: Record<string, string> = {
  "Dr Mundo": "Dr. Mundo",
  Nunu: "Nunu & Willump",
  Victor: "Viktor",
};

const SOURCE = {
  key: "community_mtg_colors_historical",
  label: "Historical community MTG color spreadsheet",
  kind: "historical" as const,
  url: "https://docs.google.com/spreadsheets/d/1ea8M5VYR6qNS005Hd6DyplX9Z5UZOjmYYxzpTgyueF0/edit?gid=0#gid=0",
  accessNote:
    "Champion-wide historical reference. It is not current-patch, role-specific, matchup, or win-probability evidence.",
};

const SOURCE_VERSION = "snapshot-2026-09-06";

type Color = (typeof COLORS)[number];
type ParsedBaseline = {
  champion: string;
  main: Color[];
  off: Color[];
};

type ProvisionalBaselineInput = {
  champion_name: string;
  main_colors: Color[];
  off_colors: Color[];
  reasoning: string;
  review_status: "provisional";
  source_version: string;
};

function parseSnapshot(text: string): ParsedBaseline[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (
    lines.shift()?.trim() !== "champion,red,green,blue,white,black,colorless"
  ) {
    throw new Error("Historical color snapshot has an unexpected header");
  }
  return lines.map((line, index) => {
    const cells = line.split(",").map((cell) => cell.trim());
    if (cells.length !== 7 || !cells[0]) {
      throw new Error(`Invalid historical color row ${index + 2}`);
    }
    const assignments = cells.slice(1);
    if (
      assignments.some(
        (value) => value !== "" && value !== "X" && value !== "O",
      )
    ) {
      throw new Error(`Invalid X/O assignment for ${cells[0]}`);
    }
    const main = COLORS.filter(
      (_, colorIndex) => assignments[colorIndex] === "X",
    );
    const off = COLORS.filter(
      (_, colorIndex) => assignments[colorIndex] === "O",
    );
    if (!main.length) {
      throw new Error(
        `${cells[0]} must have at least one historical main color`,
      );
    }
    return {
      champion: CHAMPION_ALIASES[cells[0]] ?? cells[0],
      main,
      off,
    };
  });
}

function requireText(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function validateColors(
  champion: string,
  main: unknown,
  off: unknown,
): asserts main is Color[] {
  if (!Array.isArray(main) || !main.length || !Array.isArray(off)) {
    throw new Error(`${champion} has invalid color arrays`);
  }
  const all = [...main, ...off];
  if (all.some((color) => !COLORS.includes(color as Color))) {
    throw new Error(`${champion} has an unknown color`);
  }
  if (new Set(all).size !== all.length) {
    throw new Error(`${champion} repeats a color assignment`);
  }
}

export async function importColorBaselines(
  database: Database,
  historicalPath: string,
  provisionalPath: string,
) {
  const runId = startImportRun(database, "color-baselines");
  let records = 0;
  try {
    const historical = parseSnapshot(await Bun.file(historicalPath).text());
    const provisional = (await Bun.file(
      provisionalPath,
    ).json()) as ProvisionalBaselineInput[];
    if (!Array.isArray(provisional)) {
      throw new Error("Provisional color baselines must be an array");
    }
    const historicalSourceId = upsertSource(database, SOURCE);
    const provisionalSourceId = upsertSource(database, {
      key: "riot_kit_rifttheory_provisional_colors",
      label:
        "Riot Data Dragon kit data with RiftTheory provisional interpretation",
      kind: "ai_assisted",
      url: "https://ddragon.leagueoflegends.com/cdn/16.17.1/data/en_US/championFull.json",
      accessNote:
        "Champion-wide working classification from official kit text. Current builds, role context, matchups, and numeric tuning still require review.",
    });
    database.transaction(() => {
      database
        .query(
          `DELETE FROM champions
           WHERE riot_key IS NULL
             AND EXISTS (
               SELECT 1 FROM champion_color_baselines cb
               WHERE cb.champion_id = champions.id
             )
             AND NOT EXISTS (
               SELECT 1 FROM strategic_profiles sp
               WHERE sp.champion_id = champions.id
             )
             AND NOT EXISTS (
               SELECT 1 FROM capability_profiles cp
               WHERE cp.champion_id = champions.id
             )
             AND NOT EXISTS (
               SELECT 1 FROM role_observations ro
               WHERE ro.champion_id = champions.id
             )`,
        )
        .run();
      const resolveChampionId = (name: string) => {
        const championId = database
          .query<{ id: number }, [string]>(
            `SELECT id FROM champions
             WHERE lower(default_name) = lower(?) AND riot_key IS NOT NULL
             LIMIT 1`,
          )
          .get(name)?.id;
        if (!championId) {
          throw new Error(
            `Color baseline champion is not in the Riot catalogue: ${name}`,
          );
        }
        return championId;
      };
      const writeBaseline = (input: {
        champion: string;
        main: Color[];
        off: Color[];
        reasoning: string;
        reviewStatus: "historical" | "provisional";
        sourceId: number;
        sourceVersion: string;
      }) => {
        const championId = resolveChampionId(input.champion);
        const reasoning = input.reasoning;
        database
          .query(
            `INSERT INTO champion_color_baselines
              (champion_id, reasoning, review_status, confidence, source_id, source_version, updated_at)
              VALUES (?, ?, ?, NULL, ?, ?, ?)
              ON CONFLICT(champion_id) DO UPDATE SET
                reasoning = excluded.reasoning,
                review_status = excluded.review_status,
                confidence = excluded.confidence,
                source_id = excluded.source_id,
                source_version = excluded.source_version,
                updated_at = excluded.updated_at`,
          )
          .run(
            championId,
            reasoning,
            input.reviewStatus,
            input.sourceId,
            input.sourceVersion,
            new Date().toISOString(),
          );
        const baselineId = database
          .query<
            { id: number },
            [number]
          >("SELECT id FROM champion_color_baselines WHERE champion_id = ?")
          .get(championId)!.id;
        database
          .query(
            "DELETE FROM champion_color_baseline_colors WHERE baseline_id = ?",
          )
          .run(baselineId);
        for (const [assignment, colors] of [
          ["main", input.main],
          ["off", input.off],
        ] as const) {
          for (const color of colors) {
            database
              .query(
                `INSERT INTO champion_color_baseline_colors
                  (baseline_id, color, assignment) VALUES (?, ?, ?)`,
              )
              .run(baselineId, color, assignment);
            records += 1;
          }
        }
      };
      for (const baseline of historical) {
        writeBaseline({
          champion: baseline.champion,
          main: baseline.main,
          off: baseline.off,
          reasoning:
            "Historical champion-wide reference. Use as an initial classification only; role, build, matchup, patch, and team context still require review.",
          reviewStatus: "historical",
          sourceId: historicalSourceId,
          sourceVersion: SOURCE_VERSION,
        });
      }
      for (const baseline of provisional) {
        const champion = requireText(
          baseline.champion_name,
          "baseline.champion_name",
        );
        validateColors(champion, baseline.main_colors, baseline.off_colors);
        if (baseline.review_status !== "provisional") {
          throw new Error(`${champion} must be provisional`);
        }
        writeBaseline({
          champion,
          main: baseline.main_colors,
          off: baseline.off_colors,
          reasoning: requireText(baseline.reasoning, "baseline.reasoning"),
          reviewStatus: baseline.review_status,
          sourceId: provisionalSourceId,
          sourceVersion: requireText(
            baseline.source_version,
            "baseline.source_version",
          ),
        });
      }
    })();
    finishImportRun(database, runId, "succeeded", records);
    return {
      historicalChampions: historical.length,
      provisionalChampions: provisional.length,
      records,
    };
  } catch (error) {
    finishImportRun(database, runId, "failed", records, error);
    throw error;
  }
}
