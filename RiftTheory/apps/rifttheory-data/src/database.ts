import { Database } from "bun:sqlite";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DATABASE_PATH, MIGRATIONS_DIR } from "./paths";

export function openDatabase(path = DATABASE_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  const database = new Database(path, { create: true, strict: true });
  database.run("PRAGMA foreign_keys = ON");
  database.run("PRAGMA journal_mode = WAL");
  database.run("PRAGMA busy_timeout = 5000");
  return database;
}

export async function migrateDatabase(database: Database) {
  database.run(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
    ) STRICT`);
  const applied = new Set(
    database
      .query<{ version: number }, []>("SELECT version FROM schema_migrations")
      .all()
      .map((row) => row.version),
  );
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_[\w-]+\.sql$/.test(file))
    .sort();
  for (const file of files) {
    const version = Number(file.split("_", 1)[0]);
    if (applied.has(version)) continue;
    const sql = await Bun.file(join(MIGRATIONS_DIR, file)).text();
    database.transaction(() => {
      database.exec(sql);
      database
        .query(
          "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
        )
        .run(version, file, new Date().toISOString());
    })();
  }
}

export function upsertSource(
  database: Database,
  input: {
    key: string;
    label: string;
    kind: "official" | "observed" | "manual" | "ai_assisted" | "historical";
    url?: string | null;
    accessNote?: string | null;
  },
) {
  database
    .query(
      `INSERT INTO sources
            (source_key, label, kind, url, access_note, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(source_key) DO UPDATE SET
                label = excluded.label,
                kind = excluded.kind,
                url = COALESCE(excluded.url, sources.url),
                access_note = COALESCE(excluded.access_note, sources.access_note)`,
    )
    .run(
      input.key,
      input.label,
      input.kind,
      input.url ?? null,
      input.accessNote ?? null,
      new Date().toISOString(),
    );
  return database
    .query<
      { id: number },
      [string]
    >("SELECT id FROM sources WHERE source_key = ?")
    .get(input.key)!.id;
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replaceAll(/[’']/g, "")
    .replaceAll(/[^\p{L}\p{N}]+/gu, "-")
    .replaceAll(/^-|-$/g, "")
    .toLowerCase();
}

export function upsertChampion(
  database: Database,
  input: {
    riotKey?: string | null;
    slug: string;
    name: string;
    patch?: string;
  },
) {
  const existing = input.riotKey
    ? database
        .query<
          { id: number },
          [string, string]
        >("SELECT id FROM champions WHERE riot_key = ? OR slug = ? LIMIT 1")
        .get(input.riotKey, input.slug)
    : database
        .query<
          { id: number },
          [string]
        >("SELECT id FROM champions WHERE slug = ?")
        .get(input.slug);
  const now = new Date().toISOString();
  if (existing) {
    database
      .query(
        `UPDATE champions SET
                riot_key = COALESCE(?, riot_key), slug = ?, default_name = ?, active = 1,
                first_seen_patch = COALESCE(first_seen_patch, ?),
                last_seen_patch = COALESCE(?, last_seen_patch), updated_at = ?
                WHERE id = ?`,
      )
      .run(
        input.riotKey ?? null,
        input.slug,
        input.name,
        input.patch ?? null,
        input.patch ?? null,
        now,
        existing.id,
      );
    return existing.id;
  }
  database
    .query(
      `INSERT INTO champions
            (riot_key, slug, default_name, first_seen_patch, last_seen_patch, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.riotKey ?? null,
      input.slug,
      input.name,
      input.patch ?? null,
      input.patch ?? null,
      now,
    );
  return Number(
    database
      .query<{ id: number }, []>("SELECT last_insert_rowid() AS id")
      .get()!.id,
  );
}

export function verifyDatabase(database: Database) {
  const integrity = database
    .query<{ integrity_check: string }, []>("PRAGMA integrity_check")
    .get();
  const foreignKeys = database
    .query<Record<string, unknown>, []>("PRAGMA foreign_key_check")
    .all();
  if (integrity?.integrity_check !== "ok" || foreignKeys.length) {
    throw new Error("Database integrity verification failed");
  }
}
