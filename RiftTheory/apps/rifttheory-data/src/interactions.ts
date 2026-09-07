import { Database } from "bun:sqlite";
import { resolve } from "node:path";
import { upsertSource } from "./database";
import { finishImportRun, startImportRun } from "./importRuns";

const ROLES = new Set(["top", "jungle", "mid", "bot", "support"]);
const METHODS = new Set(["manual", "ai_assisted", "observed", "hybrid"]);
const REVIEWS = new Set(["unreviewed", "provisional", "reviewed", "outdated"]);
const SOURCE_KINDS = new Set([
  "official",
  "manual",
  "ai_assisted",
  "historical",
]);
const COMPARISONS = new Set(["subject_greater", "both_at_least"]);
const SEVERITIES = new Set(["note", "warning", "strong"]);
const IMPACTS = new Set(["favorable", "unfavorable", "informational"]);
const PATCH_PATTERN = /^\d+\.\d+(?:\.\d+)?$/;
const KEY_PATTERN = /^[a-z][a-z0-9_]{2,79}$/;

type SourceKind = "official" | "manual" | "ai_assisted" | "historical";

type InteractionSourceInput = {
  key: string;
  label: string;
  kind: SourceKind;
  url?: string | null;
  accessNote: string;
};

type InteractionProfileInput = {
  champion: { riotKey?: string; name?: string };
  role: string;
  patch: string | null;
  assessmentMethod: string;
  reviewStatus: string;
  sourceKey: string;
  traits: Array<{
    trait: string;
    level: number;
    confidence?: number | null;
    reasoning: string;
    conditions?: string[];
  }>;
};

type InteractionRuleInput = {
  ruleKey: string;
  subjectTrait: string;
  objectTrait: string;
  comparison: string;
  subjectMinimum: number;
  objectMinimum: number;
  minimumDifference: number;
  relation: string;
  severity: string;
  subjectImpact: string;
  condition: string;
  effect: string;
  patch: string | null;
  confidence: number | null;
  reviewStatus: string;
  sourceKey: string;
};

type InteractionEvidenceFile = {
  schemaVersion: number;
  sources: InteractionSourceInput[];
  profiles: InteractionProfileInput[];
  rules: InteractionRuleInput[];
};

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`${field} must be a non-empty string`);
  return value.trim();
}

function requireKey(value: unknown, field: string) {
  const key = requireString(value, field);
  if (!KEY_PATTERN.test(key))
    throw new Error(
      `${field} must use lowercase letters, numbers and underscores`,
    );
  return key;
}

function requireEnum(
  value: unknown,
  field: string,
  allowed: ReadonlySet<string>,
) {
  const candidate = requireString(value, field);
  if (!allowed.has(candidate))
    throw new Error(`${field} is unknown: ${candidate}`);
  return candidate;
}

function patchVersion(value: unknown, field: string) {
  if (value == null) return "unknown";
  const patch = requireString(value, field);
  if (!PATCH_PATTERN.test(patch))
    throw new Error(`${field} must look like 16.17 or 16.17.1`);
  return patch;
}

function optionalHttpUrl(value: unknown, field: string) {
  if (value == null) return null;
  const raw = requireString(value, field);
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw null;
    return url.toString();
  } catch {
    throw new Error(`${field} must be an HTTP(S) URL or null`);
  }
}

function optionalConfidence(value: unknown, field: string) {
  if (value == null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  )
    throw new Error(`${field} must be a decimal from zero to one or null`);
  return value;
}

function level(value: unknown, field: string) {
  if (
    !Number.isInteger(value) ||
    (value as number) < 1 ||
    (value as number) > 5
  )
    throw new Error(`${field} must be an integer from one to five`);
  return value as number;
}

function resolveChampionId(
  database: Database,
  champion: InteractionProfileInput["champion"],
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
  const name = requireString(champion?.name, "profile.champion.name");
  const matches = database
    .query<{ id: number }, [string, string]>(
      `SELECT DISTINCT c.id
       FROM champions c
       LEFT JOIN champion_localizations cl ON cl.champion_id = c.id
       WHERE c.default_name = ? COLLATE NOCASE OR cl.name = ? COLLATE NOCASE`,
    )
    .all(name, name);
  if (matches.length !== 1)
    throw new Error(
      matches.length
        ? `Ambiguous champion name: ${name}`
        : `Unknown champion name: ${name}`,
    );
  return matches[0]!.id;
}

function requireTrait(database: Database, value: unknown, field: string) {
  const trait = requireString(value, field);
  const known = database
    .query<
      { found: number },
      [string]
    >("SELECT 1 AS found FROM trait_definitions WHERE trait_key = ?")
    .get(trait);
  if (!known) throw new Error(`${field} is unknown: ${trait}`);
  return trait;
}

export async function importInteractionEvidenceFile(
  database: Database,
  raw: unknown,
) {
  if (!raw || typeof raw !== "object")
    throw new Error("Interaction evidence input must be a JSON object");
  const input = raw as InteractionEvidenceFile;
  if (input.schemaVersion !== 2)
    throw new Error("Unsupported interaction evidence schemaVersion");
  if (!Array.isArray(input.sources) || !input.sources.length)
    throw new Error("sources must contain at least one record");
  if (!Array.isArray(input.profiles) || !Array.isArray(input.rules))
    throw new Error("profiles and rules must be arrays");

  const sourceIds = new Map<string, number>();
  for (const [index, source] of input.sources.entries()) {
    const prefix = `sources[${index}]`;
    const key = requireKey(source?.key, `${prefix}.key`);
    if (sourceIds.has(key)) throw new Error(`Duplicate source key: ${key}`);
    const kind = requireEnum(
      source?.kind,
      `${prefix}.kind`,
      SOURCE_KINDS,
    ) as SourceKind;
    sourceIds.set(
      key,
      upsertSource(database, {
        key,
        label: requireString(source?.label, `${prefix}.label`),
        kind,
        url: optionalHttpUrl(source?.url, `${prefix}.url`),
        accessNote: requireString(source?.accessNote, `${prefix}.accessNote`),
      }),
    );
  }

  const runId = startImportRun(database, "interaction-evidence-json");
  let records = 0;
  try {
    const profiles = input.profiles.map((profile, profileIndex) => {
      const prefix = `profiles[${profileIndex}]`;
      const role = requireEnum(profile?.role, `${prefix}.role`, ROLES);
      const patch = patchVersion(profile?.patch, `${prefix}.patch`);
      const reviewStatus = requireEnum(
        profile?.reviewStatus,
        `${prefix}.reviewStatus`,
        REVIEWS,
      );
      if (reviewStatus === "reviewed" && patch === "unknown")
        throw new Error(`${prefix} cannot be reviewed without a patch`);
      const sourceKey = requireKey(profile?.sourceKey, `${prefix}.sourceKey`);
      const sourceId = sourceIds.get(sourceKey);
      if (!sourceId)
        throw new Error(`${prefix}.sourceKey is not declared: ${sourceKey}`);
      if (!Array.isArray(profile.traits) || !profile.traits.length)
        throw new Error(`${prefix}.traits must contain at least one record`);
      const traits = profile.traits.map((trait, traitIndex) => {
        const traitPrefix = `${prefix}.traits[${traitIndex}]`;
        const conditions = trait.conditions ?? [];
        if (
          !Array.isArray(conditions) ||
          conditions.some(
            (condition) => typeof condition !== "string" || !condition.trim(),
          )
        )
          throw new Error(
            `${traitPrefix}.conditions must contain non-empty strings`,
          );
        return {
          trait: requireTrait(database, trait?.trait, `${traitPrefix}.trait`),
          level: level(trait?.level, `${traitPrefix}.level`),
          confidence: optionalConfidence(
            trait?.confidence,
            `${traitPrefix}.confidence`,
          ),
          reasoning: requireString(
            trait?.reasoning,
            `${traitPrefix}.reasoning`,
          ),
          conditions: [
            ...new Set(conditions.map((condition) => condition.trim())),
          ],
        };
      });
      if (new Set(traits.map((trait) => trait.trait)).size !== traits.length)
        throw new Error(`${prefix}.traits repeats a trait`);
      return {
        championId: resolveChampionId(database, profile.champion),
        role,
        patch,
        assessmentMethod: requireEnum(
          profile?.assessmentMethod,
          `${prefix}.assessmentMethod`,
          METHODS,
        ),
        reviewStatus,
        sourceId,
        traits,
      };
    });
    const profileKeys = profiles.map(
      (profile) => `${profile.championId}:${profile.role}:${profile.patch}`,
    );
    if (new Set(profileKeys).size !== profileKeys.length)
      throw new Error("profiles repeats a champion, role and patch");

    const rules = input.rules.map((rule, ruleIndex) => {
      const prefix = `rules[${ruleIndex}]`;
      const sourceKey = requireKey(rule?.sourceKey, `${prefix}.sourceKey`);
      const sourceId = sourceIds.get(sourceKey);
      if (!sourceId)
        throw new Error(`${prefix}.sourceKey is not declared: ${sourceKey}`);
      const patch = patchVersion(rule?.patch, `${prefix}.patch`);
      const reviewStatus = requireEnum(
        rule?.reviewStatus,
        `${prefix}.reviewStatus`,
        REVIEWS,
      );
      if (reviewStatus === "reviewed" && patch === "unknown")
        throw new Error(`${prefix} cannot be reviewed without a patch`);
      const difference = rule?.minimumDifference;
      if (!Number.isInteger(difference) || difference < 0 || difference > 4)
        throw new Error(
          `${prefix}.minimumDifference must be an integer from zero to four`,
        );
      return {
        ruleKey: requireKey(rule?.ruleKey, `${prefix}.ruleKey`),
        subjectTrait: requireTrait(
          database,
          rule?.subjectTrait,
          `${prefix}.subjectTrait`,
        ),
        objectTrait: requireTrait(
          database,
          rule?.objectTrait,
          `${prefix}.objectTrait`,
        ),
        comparison: requireEnum(
          rule?.comparison,
          `${prefix}.comparison`,
          COMPARISONS,
        ),
        subjectMinimum: level(rule?.subjectMinimum, `${prefix}.subjectMinimum`),
        objectMinimum: level(rule?.objectMinimum, `${prefix}.objectMinimum`),
        minimumDifference: difference,
        relation: requireKey(rule?.relation, `${prefix}.relation`),
        severity: requireEnum(rule?.severity, `${prefix}.severity`, SEVERITIES),
        subjectImpact: requireEnum(
          rule?.subjectImpact,
          `${prefix}.subjectImpact`,
          IMPACTS,
        ),
        condition: requireString(rule?.condition, `${prefix}.condition`),
        effect: requireString(rule?.effect, `${prefix}.effect`),
        patch,
        confidence: optionalConfidence(
          rule?.confidence,
          `${prefix}.confidence`,
        ),
        reviewStatus,
        sourceId,
      };
    });
    if (new Set(rules.map((rule) => rule.ruleKey)).size !== rules.length)
      throw new Error("rules repeats a ruleKey");

    database.transaction(() => {
      const insertTrait = database.query(
        `INSERT INTO champion_role_traits
         (champion_id, role, trait_key, level, patch_version, assessment_method,
          confidence, review_status, reasoning, conditions_json, source_id, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(champion_id, role, trait_key, patch_version) DO UPDATE SET
           level = excluded.level,
           assessment_method = excluded.assessment_method,
           confidence = excluded.confidence,
           review_status = excluded.review_status,
           reasoning = excluded.reasoning,
           conditions_json = excluded.conditions_json,
           source_id = excluded.source_id,
           updated_at = excluded.updated_at`,
      );
      for (const profile of profiles) {
        database
          .query(
            `DELETE FROM champion_role_traits
             WHERE champion_id = ? AND role = ? AND patch_version = ?`,
          )
          .run(profile.championId, profile.role, profile.patch);
        for (const trait of profile.traits) {
          insertTrait.run(
            profile.championId,
            profile.role,
            trait.trait,
            trait.level,
            profile.patch,
            profile.assessmentMethod,
            trait.confidence,
            profile.reviewStatus,
            trait.reasoning,
            JSON.stringify(trait.conditions),
            profile.sourceId,
            new Date().toISOString(),
          );
          records += 1;
        }
      }

      const ruleSourceIds = new Set(rules.map((rule) => rule.sourceId));
      for (const sourceId of ruleSourceIds) {
        database
          .query("DELETE FROM interaction_rules WHERE source_id = ?")
          .run(sourceId);
      }
      for (const rule of rules) {
        database
          .query(
            `INSERT INTO interaction_rules
             (rule_key, subject_tag, object_tag, relation, condition_text,
              effect_text, patch_version, confidence, review_status, source_id, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            rule.ruleKey,
            rule.subjectTrait,
            rule.objectTrait,
            rule.relation,
            rule.condition,
            rule.effect,
            rule.patch,
            rule.confidence,
            rule.reviewStatus,
            rule.sourceId,
            new Date().toISOString(),
          );
        const interactionRuleId = database
          .query<
            { id: number },
            [string]
          >("SELECT id FROM interaction_rules WHERE rule_key = ?")
          .get(rule.ruleKey)!.id;
        database
          .query(
            `INSERT INTO interaction_rule_predicates
             (interaction_rule_id, subject_trait_key, object_trait_key, comparison,
              subject_min_level, object_min_level, minimum_difference, severity,
              subject_impact)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .run(
            interactionRuleId,
            rule.subjectTrait,
            rule.objectTrait,
            rule.comparison,
            rule.subjectMinimum,
            rule.objectMinimum,
            rule.minimumDifference,
            rule.severity,
            rule.subjectImpact,
          );
        records += 1;
      }
    })();
    finishImportRun(database, runId, "succeeded", records);
    return { profiles: profiles.length, rules: rules.length, records };
  } catch (error) {
    finishImportRun(database, runId, "failed", records, error);
    throw error;
  }
}

export async function importInteractionEvidence(
  database: Database,
  inputPath: string,
) {
  const path = resolve(inputPath);
  const raw: unknown = await Bun.file(path).json();
  return { ...(await importInteractionEvidenceFile(database, raw)), path };
}
