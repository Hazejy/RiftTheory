# MTG-inspired strategic identities

Assessment date: 2026-09-03

## Product decision

DraftOS adopts the MTG-inspired color framework associated with LS as its
primary strategic framework for describing draft identity, compatible game
plans, and the ability to pivot during a League of Legends draft.

Composition capabilities, descriptive statistics, contextual interactions,
and Execution Fit support and test the strategic framework. They do not
replace it.

The claim that this is the best drafting strategy is a product and coaching
position. DraftOS will make that position useful by documenting definitions,
showing reasoning, testing predictions, and recording evidence and limits.

## Primary expert reference

DraftOS treats LS, also known as IMLS, as its primary expert reference for
League of Legends drafting and for the MTG-inspired color framework. His
published explanations should be prioritized when definitions conflict with
secondary summaries.

This reference does not imply affiliation, endorsement, or collaboration.
DraftOS must cite the relevant public material and distinguish LS's concepts
from later DraftOS extensions and interpretations.

## Separation of concepts

```text
Capability
What can the champion do?

Strategic identity
How does the champion prefer to create and convert advantages?

Game plan
How should this composition win this specific game?

Context
Can allies enable the plan, and can opponents deny it?

Execution fit
Can this player and team execute the plan reliably?
```

## Potential value for DraftOS

- describe composition identity beyond isolated champion tags;
- identify whether picks support compatible game plans;
- preserve multiple draft directions and measure optionality;
- explain why a theoretically strong pick may reduce composition cohesion;
- compare proactive, reactive, enabling, flexible, and conditional patterns;
- connect draft choices to executable in-game plans.

## Modeling principles

- A champion may have more than one strategic identity.
- Identity may depend on role, build, patch, team composition, and intended plan.
- Multiple identities do not imply that every mode is available simultaneously.
- Color labels must be supported by written reasoning rather than authority alone.
- Team identity must not be calculated by simply counting champion colors.
- The framework begins as manually curated coaching knowledge.
- Statistical evidence may support or challenge a hypothesis but does not define
  strategic identity on its own.

## Relationship to existing DraftOS systems

### Composition Debt

The intended strategic identity determines which capabilities are required.

### Draft Optionality

Multi-identity champions may preserve more coherent future draft paths.

### Draft Robustness

The system should test whether an identity remains executable after realistic
opposing responses.

### Execution Fit

A theoretically coherent identity has limited value when the roster cannot
execute its required patterns.

### Coaching Hypotheses

Color-based reasoning should generate testable expectations about lane states,
tempo, objective setup, positioning, resource allocation, and fight selection.

## Research requirements for implementation

1. Establish definitions from the strongest available primary explanations.
2. Record disagreements and changes in the framework over time.
3. Create examples and counterexamples for each identity.
4. Review champion classifications with domain experts.
5. Test whether the framework improves draft explanations and decisions.
6. Avoid presenting subjective classifications as official Riot data.

## Initial sources

- LS MTG color and draft identity explanation:
  <https://www.youtube.com/watch?v=T5MFmezx5ow>
- Secondary overview of the framework:
  <https://thegamehaus.com/league-of-legends/cloud9/a-quick-explanation-of-ls-color-theory-in-league-of-legends-drafts/2022/02/10/>

These sources establish a research direction, not a finalized DraftOS taxonomy.
