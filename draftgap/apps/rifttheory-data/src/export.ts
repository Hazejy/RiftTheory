import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
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
  const observations = database
    .query<Record<string, string | number | null>, []>(
      `SELECT
            ro.champion_id, ro.role, ro.patch_version, ro.region, ro.rank_bracket,
            ro.queue, ro.games, ro.wins, ro.pick_rate, ro.observed_at, s.source_key
            FROM role_observations ro JOIN sources s ON s.id = ro.source_id
            ORDER BY ro.champion_id, ro.role, ro.patch_version`,
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
      roleObservations: observations.filter(
        (row) => row.champion_id === champion.id,
      ),
    })),
  };
  mkdirSync(dirname(path), { recursive: true });
  await Bun.write(path, JSON.stringify(result, null, 2) + "\n");
  return { path, champions: champions.length, bytes: Bun.file(path).size };
}
