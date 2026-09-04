PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY,
    source_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('official', 'observed', 'manual', 'ai_assisted', 'historical')),
    url TEXT,
    access_note TEXT,
    created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS patches (
    id INTEGER PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    discovered_at TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id)
) STRICT;

CREATE TABLE IF NOT EXISTS champions (
    id INTEGER PRIMARY KEY,
    riot_key TEXT UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    default_name TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    first_seen_patch TEXT,
    last_seen_patch TEXT,
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS champion_aliases (
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    alias TEXT NOT NULL COLLATE NOCASE,
    locale TEXT NOT NULL DEFAULT 'und',
    source_id INTEGER NOT NULL REFERENCES sources(id),
    PRIMARY KEY (alias, locale)
) STRICT;

CREATE TABLE IF NOT EXISTS champion_localizations (
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    patch_version TEXT NOT NULL,
    PRIMARY KEY (champion_id, locale)
) STRICT;

CREATE TABLE IF NOT EXISTS role_observations (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'jungle', 'mid', 'bot', 'support')),
    patch_version TEXT NOT NULL,
    region TEXT NOT NULL,
    rank_bracket TEXT NOT NULL,
    queue TEXT NOT NULL,
    games INTEGER NOT NULL CHECK (games >= 0),
    wins INTEGER CHECK (wins IS NULL OR (wins >= 0 AND wins <= games)),
    pick_rate REAL CHECK (pick_rate IS NULL OR (pick_rate >= 0 AND pick_rate <= 1)),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    observed_at TEXT NOT NULL,
    UNIQUE (champion_id, role, patch_version, region, rank_bracket, queue, source_id)
) STRICT;

CREATE TABLE IF NOT EXISTS capability_profiles (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'jungle', 'mid', 'bot', 'support')),
    capability TEXT NOT NULL,
    strength REAL NOT NULL DEFAULT 1 CHECK (strength >= 0 AND strength <= 1),
    patch_version TEXT NOT NULL DEFAULT 'unknown',
    assessment_method TEXT NOT NULL CHECK (assessment_method IN ('manual', 'ai_assisted', 'observed', 'hybrid')),
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    review_status TEXT NOT NULL DEFAULT 'unreviewed',
    reasoning TEXT,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    updated_at TEXT NOT NULL,
    UNIQUE (champion_id, role, capability, patch_version)
) STRICT;

CREATE TABLE IF NOT EXISTS strategic_profiles (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'jungle', 'mid', 'bot', 'support')),
    patch_version TEXT NOT NULL DEFAULT 'unknown',
    reasoning TEXT NOT NULL,
    review_status TEXT NOT NULL,
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    updated_at TEXT NOT NULL,
    UNIQUE (champion_id, role, patch_version)
) STRICT;

CREATE TABLE IF NOT EXISTS strategic_colors (
    strategic_profile_id INTEGER NOT NULL REFERENCES strategic_profiles(id) ON DELETE CASCADE,
    color TEXT NOT NULL CHECK (color IN ('white', 'blue', 'black', 'red', 'green', 'colorless')),
    assignment TEXT NOT NULL CHECK (assignment IN ('main', 'off')),
    weight REAL NOT NULL DEFAULT 1 CHECK (weight > 0 AND weight <= 1),
    PRIMARY KEY (strategic_profile_id, color, assignment)
) STRICT;

CREATE TABLE IF NOT EXISTS interaction_rules (
    id INTEGER PRIMARY KEY,
    rule_key TEXT NOT NULL UNIQUE,
    subject_tag TEXT NOT NULL,
    object_tag TEXT NOT NULL,
    relation TEXT NOT NULL,
    condition_text TEXT NOT NULL,
    effect_text TEXT NOT NULL,
    patch_version TEXT NOT NULL DEFAULT 'unknown',
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    review_status TEXT NOT NULL DEFAULT 'unreviewed',
    source_id INTEGER NOT NULL REFERENCES sources(id),
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS import_runs (
    id INTEGER PRIMARY KEY,
    importer TEXT NOT NULL,
    source_id INTEGER REFERENCES sources(id),
    patch_version TEXT,
    status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    records_written INTEGER NOT NULL DEFAULT 0 CHECK (records_written >= 0),
    started_at TEXT NOT NULL,
    finished_at TEXT,
    error_message TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS role_observations_lookup
    ON role_observations (champion_id, role, patch_version);
CREATE INDEX IF NOT EXISTS capabilities_lookup
    ON capability_profiles (champion_id, role, patch_version);
CREATE INDEX IF NOT EXISTS strategies_lookup
    ON strategic_profiles (champion_id, role, patch_version);
