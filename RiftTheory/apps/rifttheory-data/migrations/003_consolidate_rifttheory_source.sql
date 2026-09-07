UPDATE patches
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE champion_aliases
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE champion_localizations
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE role_observations
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE capability_profiles
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE strategic_profiles
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE interaction_rules
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

UPDATE import_runs
SET source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
)
WHERE source_id = (
    SELECT id FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
)
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);

DELETE FROM sources
WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile_md'
AND EXISTS (
    SELECT 1 FROM sources
    WHERE source_key = 'rifttheory_ai_assisted_synthesis_evidence_and_limits_research_anivia_mid_profile'
);
