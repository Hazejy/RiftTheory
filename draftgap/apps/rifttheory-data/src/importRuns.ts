import { Database } from "bun:sqlite";

export function startImportRun(
  database: Database,
  importer: string,
  sourceId?: number,
  patch?: string,
) {
  database
    .query(
      `INSERT INTO import_runs
            (importer, source_id, patch_version, status, started_at)
            VALUES (?, ?, ?, 'running', ?)`,
    )
    .run(importer, sourceId ?? null, patch ?? null, new Date().toISOString());
  return Number(
    database
      .query<{ id: number }, []>("SELECT last_insert_rowid() AS id")
      .get()!.id,
  );
}

export function finishImportRun(
  database: Database,
  id: number,
  status: "succeeded" | "failed",
  records: number,
  error?: unknown,
) {
  database
    .query(
      `UPDATE import_runs SET
            status = ?, records_written = ?, finished_at = ?, error_message = ?
            WHERE id = ?`,
    )
    .run(
      status,
      records,
      new Date().toISOString(),
      error instanceof Error ? error.message : error ? String(error) : null,
      id,
    );
}
