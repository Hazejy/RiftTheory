import { resolve } from "node:path";

export const WORKSPACE_ROOT = resolve(import.meta.dir, "../../../..");
export const DATABASE_PATH = resolve(
  WORKSPACE_ROOT,
  "data/runtime/rifttheory.sqlite",
);
export const CURATED_DATA_DIR = resolve(WORKSPACE_ROOT, "data");
export const INTERACTION_EVIDENCE_PATH = resolve(
  CURATED_DATA_DIR,
  "interaction_evidence.json",
);
export const WEB_EXPORT_PATH = resolve(
  WORKSPACE_ROOT,
  "draftgap/apps/frontend/public/data/rifttheory-knowledge.json",
);
export const MIGRATIONS_DIR = resolve(import.meta.dir, "../migrations");
