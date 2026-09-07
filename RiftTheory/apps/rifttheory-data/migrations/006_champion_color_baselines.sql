CREATE TABLE IF NOT EXISTS champion_color_baselines (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL UNIQUE REFERENCES champions(id) ON DELETE CASCADE,
    reasoning TEXT NOT NULL,
    review_status TEXT NOT NULL CHECK (
        review_status IN ('historical', 'unreviewed', 'provisional', 'reviewed', 'outdated')
    ),
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    source_version TEXT NOT NULL,
    updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS champion_color_baseline_colors (
    baseline_id INTEGER NOT NULL REFERENCES champion_color_baselines(id) ON DELETE CASCADE,
    color TEXT NOT NULL CHECK (color IN ('white', 'blue', 'black', 'red', 'green', 'colorless')),
    assignment TEXT NOT NULL CHECK (assignment IN ('main', 'off')),
    PRIMARY KEY (baseline_id, color, assignment)
) STRICT;

CREATE INDEX IF NOT EXISTS champion_color_baselines_lookup
    ON champion_color_baselines (champion_id, review_status);
