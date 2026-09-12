import { Database } from "bun:sqlite";
import { mkdirSync, renameSync } from "node:fs";
import { dirname } from "node:path";
import { WEB_EXPORT_PATH } from "./paths";

type ChampionRow = {
  id: number;
  riot_key: string | null;
  slug: string;
  default_name: string;
  active: number;
  first_seen_patch: string | null;
  last_seen_patch: string | null;
};

type RoleTraitRow = {
  champion_id: number;
  role: string;
  trait: string;
  level: number;
  patch_version: string;
  assessment_method: string;
  confidence: number | null;
  review_status: string;
  reasoning: string;
  conditions_json: string;
  source_key: string;
};

type ColorBaselineRow = {
  id: number;
  champion_id: number;
  reasoning: string;
  review_status: string;
  confidence: number | null;
  source_key: string;
  source_url: string | null;
  source_version: string;
};

type CoachingProfileRow = {
  champion_id: number;
  role: string;
  damage_focus: string;
  power_curve: string;
  resource_demand: string;
  execution_demand: number;
  spike_notes_json: string;
  reasoning: string;
  patch_version: string;
  assessment_method: string;
  confidence: number | null;
  review_status: string;
  source_key: string;
  source_url: string | null;
};

export async function exportWebData(
  database: Database,
  path = WEB_EXPORT_PATH,
) {
  const champions = database
    .query<ChampionRow, []>(
      `SELECT id, riot_key, slug, default_name, active,
            first_seen_patch, last_seen_patch FROM champions ORDER BY default_name`,
    )
    .all();
  const localizations = database
    .query<
      {
        champion_id: number;
        locale: string;
        name: string;
        patch_version: string;
      },
      []
    >(
      "SELECT champion_id, locale, name, patch_version FROM champion_localizations",
    )
    .all();
  const capabilities = database
    .query<Record<string, string | number | null>, []>(
      `SELECT
            cp.champion_id, cp.role, cp.capability, cp.strength, cp.patch_version,
            cp.assessment_method, cp.confidence, cp.review_status, cp.reasoning,
            s.source_key FROM capability_profiles cp JOIN sources s ON s.id = cp.source_id
            ORDER BY cp.champion_id, cp.role, cp.capability`,
    )
    .all();
  const strategies = database
    .query<Record<string, string | number | null>, []>(
      `SELECT
            sp.id, sp.champion_id, sp.role, sp.patch_version, sp.reasoning,
            sp.review_status, sp.confidence, s.source_key, s.url AS source_url
            FROM strategic_profiles sp JOIN sources s ON s.id = sp.source_id
            ORDER BY sp.champion_id, sp.role`,
    )
    .all();
  const colors = database
    .query<
      {
        strategic_profile_id: number;
        color: string;
        assignment: string;
        weight: number;
      },
      []
    >(
      "SELECT strategic_profile_id, color, assignment, weight FROM strategic_colors ORDER BY strategic_profile_id, assignment, color",
    )
    .all();
  const colorBaselines = database
    .query<ColorBaselineRow, []>(
      `SELECT
            cb.id, cb.champion_id, cb.reasoning, cb.review_status,
            cb.confidence, cb.source_version, s.source_key,
            s.url AS source_url
            FROM champion_color_baselines cb
            JOIN sources s ON s.id = cb.source_id
            ORDER BY cb.champion_id`,
    )
    .all();
  const baselineColors = database
    .query<{ baseline_id: number; color: string; assignment: string }, []>(
      `SELECT baseline_id, color, assignment
       FROM champion_color_baseline_colors
       ORDER BY baseline_id, assignment, color`,
    )
    .all();
  const observations = database
    .query<Record<string, string | number | null>, []>(
      `SELECT
            ro.champion_id, ro.role, ro.patch_version, ro.region, ro.rank_bracket,
            ro.queue, ro.games, ro.wins, ro.pick_rate, ro.observed_at, s.source_key,
            SUM(ro.games) OVER snapshot AS sample_total,
            CAST(ro.games AS REAL) / SUM(ro.games) OVER snapshot AS role_share
            FROM role_observations ro JOIN sources s ON s.id = ro.source_id
            WINDOW snapshot AS (
              PARTITION BY ro.champion_id, ro.patch_version, ro.region,
                           ro.rank_bracket, ro.queue, ro.source_id
            )
            ORDER BY ro.champion_id, ro.role, ro.patch_version`,
    )
    .all();
  const traitDefinitions = database
    .query<
      {
        trait_key: string;
        category: string;
        definition: string;
        contextual: number;
      },
      []
    >(
      "SELECT trait_key, category, definition, contextual FROM trait_definitions ORDER BY trait_key",
    )
    .all()
    .map((definition) => ({
      ...definition,
      contextual: Boolean(definition.contextual),
    }));
  const roleTraits = database
    .query<RoleTraitRow, []>(
      `SELECT
            crt.champion_id, crt.role, crt.trait_key AS trait, crt.level,
            crt.patch_version, crt.assessment_method, crt.confidence,
            crt.review_status, crt.reasoning, crt.conditions_json, s.source_key
            FROM champion_role_traits crt JOIN sources s ON s.id = crt.source_id
            ORDER BY crt.champion_id, crt.role, crt.trait_key`,
    )
    .all()
    .map((trait) => {
      const { conditions_json, ...row } = trait;
      return {
        ...row,
        conditions: JSON.parse(String(conditions_json)) as string[],
      };
    });
  const coachingProfiles = database
    .query<CoachingProfileRow, []>(
      `SELECT
            cp.champion_id, cp.role, cp.damage_focus, cp.power_curve,
            cp.resource_demand, cp.execution_demand, cp.spike_notes_json,
            cp.reasoning, cp.patch_version, cp.assessment_method,
            cp.confidence, cp.review_status, s.source_key,
            s.url AS source_url
       FROM coaching_profiles cp
       JOIN sources s ON s.id = cp.source_id
       ORDER BY cp.champion_id, cp.role, cp.patch_version`,
    )
    .all()
    .map(({ spike_notes_json, ...profile }) => ({
      ...profile,
      spike_notes: JSON.parse(spike_notes_json) as string[],
    }));
  const interactionRules = database
    .query<Record<string, string | number | null>, []>(
      `SELECT
            ir.rule_key, ir.relation, ir.condition_text, ir.effect_text,
            ir.patch_version, ir.confidence, ir.review_status, s.source_key,
            p.subject_trait_key, p.object_trait_key, p.comparison,
            p.subject_min_level, p.object_min_level, p.minimum_difference,
            p.severity, p.subject_impact
            FROM interaction_rules ir
            JOIN interaction_rule_predicates p ON p.interaction_rule_id = ir.id
            JOIN sources s ON s.id = ir.source_id
            ORDER BY ir.rule_key`,
    )
    .all();
  const sources = database
    .query<
      Record<string, string | number | null>,
      []
    >("SELECT source_key, label, kind, url, access_note FROM sources ORDER BY source_key")
    .all();
  const latestPatch = database
    .query<
      { version: string; discovered_at: string },
      []
    >("SELECT version, discovered_at FROM patches ORDER BY id DESC LIMIT 1")
    .get();
  const schemaVersion =
    database
      .query<
        { version: number },
        []
      >("SELECT MAX(version) AS version FROM schema_migrations")
      .get()?.version ?? 0;

  const result = {
    metadata: {
      schemaVersion,
      generatedAt: new Date().toISOString(),
      latestPatch: latestPatch ?? null,
      sourceCount: sources.length,
    },
    sources,
    traitDefinitions,
    interactionRules,
    champions: champions.map((champion) => ({
      riotKey: champion.riot_key,
      slug: champion.slug,
      name: champion.default_name,
      active: Boolean(champion.active),
      firstSeenPatch: champion.first_seen_patch,
      lastSeenPatch: champion.last_seen_patch,
      localizations: Object.fromEntries(
        localizations
          .filter((row) => row.champion_id === champion.id)
          .map((row) => [
            row.locale,
            { name: row.name, patch: row.patch_version },
          ]),
      ),
      capabilities: capabilities.filter(
        (row) => row.champion_id === champion.id,
      ),
      strategicProfiles: strategies
        .filter((row) => row.champion_id === champion.id)
        .map((profile) => ({
          ...profile,
          colors: colors.filter(
            (color) => color.strategic_profile_id === profile.id,
          ),
        })),
      colorBaseline:
        colorBaselines
          .filter((baseline) => baseline.champion_id === champion.id)
          .map((baseline) => ({
            ...baseline,
            scope: "champion",
            colors: baselineColors
              .filter((color) => color.baseline_id === baseline.id)
              .map((color) => ({ ...color, weight: 1 })),
          }))[0] ?? null,
      roleObservations: observations.filter(
        (row) => row.champion_id === champion.id,
      ),
      roleTraits: roleTraits
        .filter((row) => row.champion_id === champion.id)
        .map(({ champion_id: _championId, ...trait }) => trait),
      coachingProfiles: coachingProfiles
        .filter((row) => row.champion_id === champion.id)
        .map(({ champion_id: _championId, ...profile }) => profile),
    })),
  };
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await Bun.write(temporaryPath, JSON.stringify(result, null, 2) + "\n");
  renameSync(temporaryPath, path);
  return { path, champions: champions.length, bytes: Bun.file(path).size };
}
