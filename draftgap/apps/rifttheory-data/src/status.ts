import { Database } from "bun:sqlite";

export function getStatus(database: Database) {
  const count = (table: string) =>
    database
      .query<{ count: number }, []>(`SELECT COUNT(*) AS count FROM ${table}`)
      .get()!.count;
  return {
    schemaVersion:
      database
        .query<
          { version: number },
          []
        >("SELECT MAX(version) AS version FROM schema_migrations")
        .get()?.version ?? 0,
    latestPatch:
      database
        .query<
          { version: string },
          []
        >("SELECT version FROM patches ORDER BY id DESC LIMIT 1")
        .get()?.version ?? null,
    champions: count("champions"),
    localizations: count("champion_localizations"),
    capabilities: count("capability_profiles"),
    strategicProfiles: count("strategic_profiles"),
    roleObservations: count("role_observations"),
    roleObservationContexts: database
      .query<{ count: number }, []>(
        `SELECT COUNT(*) AS count FROM (
          SELECT DISTINCT patch_version, region, rank_bracket, queue, source_id
          FROM role_observations
        )`,
      )
      .get()!.count,
    latestObservedPatch:
      database
        .query<{ patch_version: string }, []>(
          `SELECT patch_version FROM role_observations
           ORDER BY observed_at DESC LIMIT 1`,
        )
        .get()?.patch_version ?? null,
    interactionRules: count("interaction_rules"),
    sources: count("sources"),
    failedImports: database
      .query<
        { count: number },
        []
      >("SELECT COUNT(*) AS count FROM import_runs WHERE status = 'failed'")
      .get()!.count,
  };
}
