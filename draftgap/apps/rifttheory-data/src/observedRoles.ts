import { Database } from "bun:sqlite";
import { resolve } from "node:path";
import { upsertSource } from "./database";
import { finishImportRun, startImportRun } from "./importRuns";

const ROLES = new Set(["top", "jungle", "mid", "bot", "support"]);
const PATCH_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;
const SOURCE_KEY_PATTERN = /^[a-z][a-z0-9_]{2,79}$/;

export type RoleObservationInput = {
  champion: {
    riotKey?: string;
    name?: string;
  };
  role: string;
  games: number;
  wins?: number | null;
  pickRate?: number | null;
};

export type RoleObservationFile = {
  schemaVersion: number;
  source: {
    key: string;
    label: string;
    url?: string | null;
    accessNote: string;
  };
  context: {
    patch: string;
    region: string;
    rankBracket: string;
    queue: string;
    observedAt: string;
  };
  observations: RoleObservationInput[];
};

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function readContext(input: RoleObservationFile) {
  const patch = requireString(input.context?.patch, "context.patch");
  if (!PATCH_PATTERN.test(patch))
    throw new Error("context.patch must look like 16.17 or 16.17.1");
  const observedAt = requireString(
    input.context?.observedAt,
    "context.observedAt",
  );
  if (Number.isNaN(Date.parse(observedAt)))
    throw new Error("context.observedAt must be an ISO date-time");
  return {
    patch,
    region: requireString(input.context?.region, "context.region"),
    rankBracket: requireString(
      input.context?.rankBracket,
      "context.rankBracket",
    ),
    queue: requireString(input.context?.queue, "context.queue"),
    observedAt: new Date(observedAt).toISOString(),
  };
}

function optionalHttpUrl(value: unknown) {
  if (value == null) return null;
  const raw = requireString(value, "source.url");
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw null;
    return url.toString();
  } catch {
    throw new Error("source.url must be an HTTP(S) URL or null");
  }
}

function resolveChampionId(
  database: Database,
  champion: RoleObservationInput["champion"],
) {
  const riotKey = champion?.riotKey?.trim();
  if (riotKey) {
    const match = database
      .query<
        { id: number },
        [string]
      >("SELECT id FROM champions WHERE riot_key = ?")
      .get(riotKey);
    if (!match) throw new Error(`Unknown Riot champion key: ${riotKey}`);
    return match.id;
  }

  const name = requireString(champion?.name, "observation.champion.name");
  const matches = database
    .query<{ id: number }, [string, string, string]>(
      `SELECT DISTINCT c.id
       FROM champions c
       LEFT JOIN champion_localizations cl ON cl.champion_id = c.id
       LEFT JOIN champion_aliases ca ON ca.champion_id = c.id
       WHERE c.default_name = ? COLLATE NOCASE
          OR cl.name = ? COLLATE NOCASE
          OR ca.alias = ? COLLATE NOCASE`,
    )
    .all(name, name, name);
  if (matches.length !== 1)
    throw new Error(
      matches.length
        ? `Ambiguous champion name: ${name}`
        : `Unknown champion name: ${name}`,
    );
  return matches[0]!.id;
}

function validateObservation(input: RoleObservationInput, index: number) {
  const prefix = `observations[${index}]`;
  const role = requireString(input?.role, `${prefix}.role`);
  if (!ROLES.has(role)) throw new Error(`${prefix}.role is unknown: ${role}`);
  if (!Number.isInteger(input?.games) || input.games <= 0)
    throw new Error(`${prefix}.games must be a positive integer`);
  if (
    input.wins != null &&
    (!Number.isInteger(input.wins) ||
      input.wins < 0 ||
      input.wins > input.games)
  )
    throw new Error(`${prefix}.wins must be between zero and games`);
  if (
    input.pickRate != null &&
    (!Number.isFinite(input.pickRate) ||
      input.pickRate < 0 ||
      input.pickRate > 1)
  )
    throw new Error(`${prefix}.pickRate must be a decimal from zero to one`);
  return role;
}

export async function importObservedRoleSnapshot(
  database: Database,
  raw: unknown,
  importer = "observed-role-json",
) {
  if (!raw || typeof raw !== "object")
    throw new Error("Role observation input must be a JSON object");
  const input = raw as RoleObservationFile;
  if (input.schemaVersion !== 1)
    throw new Error("Unsupported role observation schemaVersion");
  if (!Array.isArray(input.observations) || !input.observations.length)
    throw new Error("observations must contain at least one record");

  const sourceKey = requireString(input.source?.key, "source.key");
  if (!SOURCE_KEY_PATTERN.test(sourceKey))
    throw new Error(
      "source.key must use lowercase letters, numbers and underscores",
    );
  const context = readContext(input);
  const sourceUrl = optionalHttpUrl(input.source?.url);
  const sourceId = upsertSource(database, {
    key: sourceKey,
    label: requireString(input.source?.label, "source.label"),
    kind: "observed",
    url: sourceUrl,
    accessNote: requireString(input.source?.accessNote, "source.accessNote"),
  });
  const runId = startImportRun(database, importer, sourceId, context.patch);

  try {
    const observations = input.observations.map((observation, index) => {
      const role = validateObservation(observation, index);
      return {
        championId: resolveChampionId(database, observation.champion),
        role,
        games: observation.games,
        wins: observation.wins ?? null,
        pickRate: observation.pickRate ?? null,
      };
    });
    const uniqueRecords = new Set(
      observations.map(({ championId, role }) => `${championId}:${role}`),
    );
    if (uniqueRecords.size !== observations.length)
      throw new Error("observations repeat a champion and role in one context");

    database.transaction(() => {
      database
        .query(
          `DELETE FROM role_observations
           WHERE patch_version = ? AND region = ? AND rank_bracket = ?
             AND queue = ? AND source_id = ?`,
        )
        .run(
          context.patch,
          context.region,
          context.rankBracket,
          context.queue,
          sourceId,
        );
      const insert = database.query(
        `INSERT INTO role_observations
         (champion_id, role, patch_version, region, rank_bracket, queue,
          games, wins, pick_rate, source_id, observed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const observation of observations) {
        insert.run(
          observation.championId,
          observation.role,
          context.patch,
          context.region,
          context.rankBracket,
          context.queue,
          observation.games,
          observation.wins,
          observation.pickRate,
          sourceId,
          context.observedAt,
        );
      }
    })();
    finishImportRun(database, runId, "succeeded", observations.length);
    return {
      records: observations.length,
      source: sourceKey,
      context,
    };
  } catch (error) {
    finishImportRun(database, runId, "failed", 0, error);
    throw error;
  }
}

export async function importObservedRoles(
  database: Database,
  inputPath: string,
) {
  const path = resolve(inputPath);
  const raw: unknown = await Bun.file(path).json();
  return {
    ...(await importObservedRoleSnapshot(database, raw)),
    path,
  };
}
