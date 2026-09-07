CREATE TABLE IF NOT EXISTS trait_definitions (
    trait_key TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (
        category IN ('access', 'control', 'durability', 'pressure', 'tempo', 'utility')
    ),
    definition TEXT NOT NULL,
    contextual INTEGER NOT NULL DEFAULT 0 CHECK (contextual IN (0, 1)),
    created_at TEXT NOT NULL
) STRICT;

INSERT OR IGNORE INTO trait_definitions
    (trait_key, category, definition, contextual, created_at)
VALUES
    ('threat_range', 'pressure', 'Distance at which a champion can credibly pressure opponents.', 0, CURRENT_TIMESTAMP),
    ('target_access', 'access', 'Reliability of reaching and affecting a chosen target.', 1, CURRENT_TIMESTAMP),
    ('wave_clear', 'pressure', 'Speed and repeatability of damaging a minion wave.', 0, CURRENT_TIMESTAMP),
    ('wave_access_safety', 'access', 'Ability to approach and use wave clear while under enemy pressure.', 1, CURRENT_TIMESTAMP),
    ('engage', 'control', 'Reliability of starting a favorable fight.', 1, CURRENT_TIMESTAMP),
    ('disengage', 'control', 'Reliability of stopping or escaping an enemy initiation.', 1, CURRENT_TIMESTAMP),
    ('poke', 'pressure', 'Repeatable damage delivered before a committed fight.', 1, CURRENT_TIMESTAMP),
    ('siege', 'pressure', 'Ability to pressure objectives or structures without committing to a fight.', 1, CURRENT_TIMESTAMP),
    ('mobility', 'access', 'Ability to reposition or cross space during a play.', 0, CURRENT_TIMESTAMP),
    ('frontline', 'durability', 'Ability to occupy dangerous space for the team.', 1, CURRENT_TIMESTAMP),
    ('peel', 'utility', 'Ability to protect an ally from target access or engage.', 1, CURRENT_TIMESTAMP),
    ('sustain', 'durability', 'Ability to restore or preserve resources through repeated exchanges.', 1, CURRENT_TIMESTAMP),
    ('side_lane_pressure', 'tempo', 'Ability to create meaningful side-lane pressure without the full team.', 1, CURRENT_TIMESTAMP),
    ('terrain_control', 'control', 'Ability to reshape or deny movement through an area.', 1, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS champion_role_traits (
    id INTEGER PRIMARY KEY,
    champion_id INTEGER NOT NULL REFERENCES champions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('top', 'jungle', 'mid', 'bot', 'support')),
    trait_key TEXT NOT NULL REFERENCES trait_definitions(trait_key),
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    patch_version TEXT NOT NULL DEFAULT 'unknown',
    assessment_method TEXT NOT NULL CHECK (
        assessment_method IN ('manual', 'ai_assisted', 'observed', 'hybrid')
    ),
    confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    review_status TEXT NOT NULL CHECK (
        review_status IN ('unreviewed', 'provisional', 'reviewed', 'outdated')
    ),
    reasoning TEXT NOT NULL,
    conditions_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(conditions_json)),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    updated_at TEXT NOT NULL,
    UNIQUE (champion_id, role, trait_key, patch_version)
) STRICT;

CREATE TABLE IF NOT EXISTS interaction_rule_predicates (
    interaction_rule_id INTEGER PRIMARY KEY REFERENCES interaction_rules(id) ON DELETE CASCADE,
    subject_trait_key TEXT NOT NULL REFERENCES trait_definitions(trait_key),
    object_trait_key TEXT NOT NULL REFERENCES trait_definitions(trait_key),
    comparison TEXT NOT NULL CHECK (comparison IN ('subject_greater', 'both_at_least')),
    subject_min_level INTEGER NOT NULL CHECK (subject_min_level BETWEEN 1 AND 5),
    object_min_level INTEGER NOT NULL CHECK (object_min_level BETWEEN 1 AND 5),
    minimum_difference INTEGER NOT NULL DEFAULT 0 CHECK (minimum_difference BETWEEN 0 AND 4),
    severity TEXT NOT NULL CHECK (severity IN ('note', 'warning', 'strong'))
) STRICT;

CREATE INDEX IF NOT EXISTS champion_role_traits_lookup
    ON champion_role_traits (champion_id, role, patch_version);
CREATE INDEX IF NOT EXISTS interaction_rule_predicates_traits
    ON interaction_rule_predicates (subject_trait_key, object_trait_key);
