ALTER TABLE interaction_rule_predicates
ADD COLUMN subject_impact TEXT NOT NULL DEFAULT 'informational'
CHECK (subject_impact IN ('favorable', 'unfavorable', 'informational'));
