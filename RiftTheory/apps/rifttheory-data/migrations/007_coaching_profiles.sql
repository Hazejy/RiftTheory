CREATE TABLE IF NOT EXISTS coaching_profiles (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'jungle', 'mid', 'bot', 'support')),
    damage_focus TEXT NOT NULL CHECK (damage_focus IN ('physical', 'magic', 'mixed', 'utility', 'build_dependent')),
    power_curve TEXT NOT NULL CHECK (power_curve IN ('early', 'early_mid', 'mid', 'mid_late', 'late', 'timing_dependent')),
    resource_demand TEXT NOT NULL CHECK (resource_demand IN ('low', 'medium', 'high')),
    execution_demand INTEGER NOT NULL CHECK (execution_demand BETWEEN 1 AND 5),
    spike_notes_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(spike_notes_json)),
    reasoning TEXT NOT NULL,
    patch_version TEXT NOT NULL DEFAULT 'unknown',
    assessment_method TEXT NOT NULL CHECK (assessment_method IN ('manual', 'ai_assisted', 'observed', 'hybrid')),
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    review_status TEXT NOT NULL DEFAULT 'unreviewed',
    source_id INTEGER NOT NULL REFERENCES sources(id),
    updated_at TEXT NOT NULL,
    UNIQUE (champion_id, role, patch_version)
) STRICT;

CREATE INDEX IF NOT EXISTS coaching_profiles_lookup
    ON coaching_profiles (champion_id, role, patch_version);
