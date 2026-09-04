# MTG-inspired strategic identities

Assessment date: 2026-09-03

Update 2026-09-04: the user-supplied spreadsheet legend was read directly. The
new [evidence review](draft-intelligence-review.md) clarifies Green's item/shared
timings, White's committed in-game mode and the limits of color-only counters.
Its UI guide distinguishes source paraphrases from conditional coaching synthesis.
Original video content remains unreviewed where retrieval yielded only metadata.

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

## Working color definitions v0.1

These definitions describe draft behavior rather than champion lore. They are
an initial interpretation of the available LS material and must be refined as
stronger primary explanations are reviewed.

### White

Flexible and accommodating. White identities can support multiple compatible
game plans or change their contribution according to what the composition
needs. Their value often comes from preserving coherent options.

### Blue

Reactive, controlling, and denying. Blue identities prefer to reduce opposing
options, prevent successful action, gain time, and convert control into later
advantages.

### Black

Conditional and trade-off driven. Black identities can create unusual or
game-warping advantages when specific requirements are met, often accepting a
cost, restriction, or narrow execution condition.

### Red

Proactive, aggressive, and action oriented. Red identities seek pressure,
damage, tempo, or forcing plays and are often more direct or linear in how
they create advantages.

### Green

Enabling and amplifying. Green identities increase the effectiveness of allies,
accelerate access to important power, or help a composition reach and use its
intended strengths.

### Multi-color identities

Colors are dimensions rather than exclusive champion classes. A multi-color
identity describes how several strategic behaviors combine. DraftOS must keep
the written reasoning visible instead of treating a color combination as a
self-explanatory label.

### Main colors, off colors, and colorless identities

The reference spreadsheet distinguishes between a main color and an off color.
A main color is strongly expressed by the champion's kit, core items, team
interaction, and scaling. An off color may emerge only through a particular
build, playstyle, matchup, or composition.

Colorless is retained as a possible category for champions or pairings with a
dedicated theme that causes the draft to form around them. It is not a synonym
for missing data.

The spreadsheet is outdated, so its champion assignments are research inputs
rather than current facts. DraftOS will store the reasoning, role, patch, and
context for classifications that it adopts.

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
- Community-maintained champion color spreadsheet shared as a structural
  reference:
  <https://docs.google.com/spreadsheets/d/1ea8M5VYR6qNS005Hd6DyplX9Z5UZOjmYYxzpTgyueF0/edit?gid=0#gid=0>

These sources establish a research direction, not a finalized DraftOS taxonomy.
