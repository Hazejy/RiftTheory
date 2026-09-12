import { Database } from "bun:sqlite";
import { join } from "node:path";
import { CURATED_DATA_DIR } from "./paths";
import { finishImportRun, startImportRun } from "./importRuns";
import { slugify, upsertChampion, upsertSource } from "./database";

const ROLES = new Set(["top", "jungle", "mid", "bot", "support"]);
const COLORS = new Set(["white", "blue", "black", "red", "green", "colorless"]);
const DAMAGE_FOCUSES = new Set([
  "physical",
  "magic",
  "mixed",
  "utility",
  "build_dependent",
]);
const POWER_CURVES = new Set([
  "early",
  "early_mid",
  "mid",
  "mid_late",
  "late",
  "timing_dependent",
]);
const RESOURCE_DEMANDS = new Set(["low", "medium", "high"]);
const ASSESSMENT_METHODS = new Set([
  "manual",
  "ai_assisted",
  "observed",
  "hybrid",
]);

type CapabilityInput = {
  name: string;
  role?: string | string[];
  Role?: string | string[];
  capabilities: string[];
  source: string;
};

type StrategicInput = {
  champion_name: string;
  role: string;
  patch: string | null;
  review_status: string;
  source_url: string | null;
  identity: {
    main_colors: string[];
    off_colors: string[];
    reasoning: string;
    source_name: string;
  };
};

type CoachingInput = {
  champion_name: string;
  role: string;
  damage_focus: string;
  power_curve: string;
  resource_demand: string;
  execution_demand: number;
  spike_notes: string[];
  reasoning: string;
  patch: string | null;
  assessment_method: string;
  confidence: number | null;
  review_status: string;
  source_name: string;
  source_url?: string | null;
};

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

async function readArray(path: string) {
  const value: unknown = await Bun.file(path).json();
  if (!Array.isArray(value)) throw new Error(`${path} must contain an array`);
  return value;
}

function sourceKey(value: string) {
  return slugify(value).replaceAll("-", "_").slice(0, 80);
}

function normalizedRoles(value: string | string[], championName: string) {
  const aliases: Record<string, string> = {
    adc: "bot",
    botlane: "bot",
    midlane: "mid",
    toplane: "top",
  };
  const roles = Array.isArray(value) ? value : [value];
  if (!roles.length) throw new Error(`${championName} must have a role`);
  return [
    ...new Set(
      roles.map((role) => {
        if (typeof role !== "string" || !role.trim())
          throw new Error(`${championName} has an invalid role`);
        const normalized = role.trim().toLowerCase();
        return aliases[normalized] ?? normalized;
      }),
    ),
  ].map((role) => {
    if (!ROLES.has(role))
      throw new Error(`Unknown role for ${championName}: ${role}`);
    return role;
  });
}

export async function importCuratedData(database: Database) {
  const runId = startImportRun(database, "curated-json");
  let records = 0;
  try {
    const capabilities = (await readArray(
      join(CURATED_DATA_DIR, "champion_profiles.json"),
    )) as CapabilityInput[];
    const strategies = (await readArray(
      join(CURATED_DATA_DIR, "strategic_profiles.json"),
    )) as StrategicInput[];
    const coachingProfiles = (await readArray(
      join(CURATED_DATA_DIR, "coaching_profiles.json"),
    )) as CoachingInput[];
    database.transaction(() => {
      for (const profile of capabilities) {
        const name = requireString(profile.name, "capability.name");
        const roles = normalizedRoles(profile.role ?? profile.Role ?? [], name);
        if (
          !Array.isArray(profile.capabilities) ||
          !profile.capabilities.length
        )
          throw new Error(`${name} must have at least one capability`);
        const sourceName = requireString(profile.source, "capability.source");
        const sourceId = upsertSource(database, {
          key: sourceKey(sourceName),
          label: sourceName,
          kind: sourceName.includes("ai") ? "ai_assisted" : "manual",
        });
        const championId = upsertChampion(database, {
          slug: slugify(name),
          name,
        });
        for (const role of roles) {
          for (const rawCapability of profile.capabilities) {
            const capability = requireString(rawCapability, "capability");
            if (!/^[a-z][a-z0-9_]*$/.test(capability))
              throw new Error(`Invalid capability: ${capability}`);
            database
              .query(
                `INSERT INTO capability_profiles
                            (champion_id, role, capability, patch_version, assessment_method,
                             review_status, source_id, updated_at)
                            VALUES (?, ?, ?, 'unknown', ?, 'curated', ?, ?)
                            ON CONFLICT(champion_id, role, capability, patch_version) DO UPDATE SET
                                assessment_method = excluded.assessment_method,
                                review_status = excluded.review_status,
                                source_id = excluded.source_id,
                                updated_at = excluded.updated_at`,
              )
              .run(
                championId,
                role,
                capability,
                sourceName.includes("ai") ? "ai_assisted" : "manual",
                sourceId,
                new Date().toISOString(),
              );
            records += 1;
          }
        }
      }

      for (const profile of strategies) {
        const name = requireString(
          profile.champion_name,
          "strategy.champion_name",
        );
        const role = requireString(profile.role, "strategy.role");
        if (!ROLES.has(role)) throw new Error(`Unknown role: ${role}`);
        const main = profile.identity?.main_colors;
        const off = profile.identity?.off_colors;
        if (!Array.isArray(main) || !main.length || !Array.isArray(off))
          throw new Error(`${name} has invalid strategic colors`);
        for (const color of [...main, ...off]) {
          if (!COLORS.has(color)) throw new Error(`Unknown color: ${color}`);
        }
        if (main.some((color) => off.includes(color)))
          throw new Error(`${name} repeats a main color as an off color`);
        const sourceName = requireString(
          profile.identity.source_name,
          "strategy.identity.source_name",
        );
        const sourceId = upsertSource(database, {
          key: sourceKey(sourceName),
          label: sourceName,
          kind: sourceName.toLowerCase().includes("ai")
            ? "ai_assisted"
            : "manual",
          url: profile.source_url,
        });
        const championId = upsertChampion(database, {
          slug: slugify(name),
          name,
        });
        const patch = profile.patch ?? "unknown";
        database
          .query(
            `INSERT INTO strategic_profiles
                        (champion_id, role, patch_version, reasoning, review_status,
                         source_id, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(champion_id, role, patch_version) DO UPDATE SET
                            reasoning = excluded.reasoning,
                            review_status = excluded.review_status,
                            source_id = excluded.source_id,
                            updated_at = excluded.updated_at`,
          )
          .run(
            championId,
            role,
            patch,
            requireString(profile.identity.reasoning, "strategy.reasoning"),
            requireString(profile.review_status, "strategy.review_status"),
            sourceId,
            new Date().toISOString(),
          );
        const strategicId = database
          .query<
            { id: number },
            [number, string, string]
          >("SELECT id FROM strategic_profiles WHERE champion_id = ? AND role = ? AND patch_version = ?")
          .get(championId, role, patch)!.id;
        database
          .query("DELETE FROM strategic_colors WHERE strategic_profile_id = ?")
          .run(strategicId);
        for (const [assignment, colors] of [
          ["main", main],
          ["off", off],
        ] as const) {
          for (const color of colors) {
            database
              .query(
                `INSERT INTO strategic_colors
                                (strategic_profile_id, color, assignment, weight)
                                VALUES (?, ?, ?, 1)`,
              )
              .run(strategicId, color, assignment);
            records += 1;
          }
        }
      }

      for (const profile of coachingProfiles) {
        const name = requireString(
          profile.champion_name,
          "coaching.champion_name",
        );
        const role = requireString(profile.role, "coaching.role").toLowerCase();
        if (!ROLES.has(role)) throw new Error(`Unknown coaching role: ${role}`);
        const damageFocus = requireString(
          profile.damage_focus,
          "coaching.damage_focus",
        );
        if (!DAMAGE_FOCUSES.has(damageFocus))
          throw new Error(`Unknown damage focus for ${name}: ${damageFocus}`);
        const powerCurve = requireString(
          profile.power_curve,
          "coaching.power_curve",
        );
        if (!POWER_CURVES.has(powerCurve))
          throw new Error(`Unknown power curve for ${name}: ${powerCurve}`);
        const resourceDemand = requireString(
          profile.resource_demand,
          "coaching.resource_demand",
        );
        if (!RESOURCE_DEMANDS.has(resourceDemand))
          throw new Error(
            `Unknown resource demand for ${name}: ${resourceDemand}`,
          );
        if (
          !Number.isInteger(profile.execution_demand) ||
          profile.execution_demand < 1 ||
          profile.execution_demand > 5
        )
          throw new Error(
            `${name} execution_demand must be an integer from 1 to 5`,
          );
        if (
          !Array.isArray(profile.spike_notes) ||
          profile.spike_notes.some(
            (note) => typeof note !== "string" || !note.trim(),
          )
        )
          throw new Error(`${name} has invalid spike_notes`);
        const assessmentMethod = requireString(
          profile.assessment_method,
          "coaching.assessment_method",
        );
        if (!ASSESSMENT_METHODS.has(assessmentMethod))
          throw new Error(
            `Unknown assessment method for ${name}: ${assessmentMethod}`,
          );
        if (
          profile.confidence !== null &&
          (typeof profile.confidence !== "number" ||
            profile.confidence < 0 ||
            profile.confidence > 1)
        )
          throw new Error(`${name} confidence must be null or between 0 and 1`);

        const sourceName = requireString(
          profile.source_name,
          "coaching.source_name",
        );
        const sourceId = upsertSource(database, {
          key: sourceKey(sourceName),
          label: sourceName,
          kind: assessmentMethod === "ai_assisted" ? "ai_assisted" : "manual",
          url: profile.source_url,
        });
        const championId = upsertChampion(database, {
          slug: slugify(name),
          name,
        });
        database
          .query(
            `INSERT INTO coaching_profiles
              (champion_id, role, damage_focus, power_curve, resource_demand,
               execution_demand, spike_notes_json, reasoning, patch_version,
               assessment_method, confidence, review_status, source_id, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(champion_id, role, patch_version) DO UPDATE SET
               damage_focus = excluded.damage_focus,
               power_curve = excluded.power_curve,
               resource_demand = excluded.resource_demand,
               execution_demand = excluded.execution_demand,
               spike_notes_json = excluded.spike_notes_json,
               reasoning = excluded.reasoning,
               assessment_method = excluded.assessment_method,
               confidence = excluded.confidence,
               review_status = excluded.review_status,
               source_id = excluded.source_id,
               updated_at = excluded.updated_at`,
          )
          .run(
            championId,
            role,
            damageFocus,
            powerCurve,
            resourceDemand,
            profile.execution_demand,
            JSON.stringify(profile.spike_notes.map((note) => note.trim())),
            requireString(profile.reasoning, "coaching.reasoning"),
            profile.patch ?? "unknown",
            assessmentMethod,
            profile.confidence,
            requireString(profile.review_status, "coaching.review_status"),
            sourceId,
            new Date().toISOString(),
          );
        records += 1;
      }
    })();
    finishImportRun(database, runId, "succeeded", records);
    return records;
  } catch (error) {
    finishImportRun(database, runId, "failed", records, error);
    throw error;
  }
}
