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
