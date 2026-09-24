# Coach evidence coverage — 24 September 2026

## Scope

`research/audit-coach-coverage.ts` joined the locally saved [ChainCC open
data](https://chaincc.lol/free/data) team and player exports for patches
16.16–16.18. It used the **final observed champion roles** only to inspect
whether the shipped RiftTheory knowledge snapshot has a corresponding profile.
This is a retrospective **coverage audit**, not a test of historical pick
decisions, a Solo Queue sample, or a win-probability result. The source offers
five ordered pick fields per side, but the audit does not assume that their
values establish what a drafter knew at each decision.

Reproduce from the workspace root:

```powershell
bun research/audit-coach-coverage.ts data/runtime/pro/chaincc-teams-2026.csv.gz data/runtime/pro/chaincc-players-2026.csv.gz 16.16
```

## Results

| Measure | Result |
| --- | ---: |
| Audited games / observed picks | 1,381 / 13,810 |
| Legal joined games skipped | 0 |
| Picks with any recorded role capability | 13,207 (95.6%) |
| Picks with a `reviewed` role capability | 0 |
| Picks with a role-specific color profile | 363 (2.6%) |
| Picks with a provisional champion-wide color baseline | 2,477 (17.9%) |
| Picks with only a historical champion-wide color reference | 10,970 (79.4%) |
| Picks with a role-specific coaching profile | 5,576 (40.4%) |
| Games with a primary plan on both sides | 1,338 / 1,381 |

The snapshot is labeled patch 16.17. All 707 shipped capability entries have
`review_status: curated`; none is a patch-reviewed kit or matchup finding.
Accordingly, high apparent plan coverage measures the current **rule engine's
ability to form hypotheses from curated tags**. It does not prove those plans
are correct. A champion-wide historical color is an identity reference, not a
role-, build-, matchup- or patch-specific conclusion. The Strategy UI now
labels these color source tiers and discloses the capability limitation.

The recent pro sample is 625 games on 16.16, 654 on 16.17 and 102 on 16.18.
Only the middle cohort matches the snapshot's patch number; even there, the
curated capability entries lack a reviewed patch version. Pro pick frequency
helps prioritize editorial work but must not be treated as Solo Queue pick
frequency or as evidence that a champion is strong.

## Work queue from missing profiles

The largest missing role-capability cases are Yunara bot (274 observed picks),
Zaahen top (56), Varus top (32), Aatrox jungle (22) and Viktor bot (20).
The largest missing role-specific coaching cases are Ryze mid (318), Rumble
top (305), Orianna mid (285), Lulu support (280), Yunara bot (274), Syndra
mid (272), Milio support (269), K'Sante top (262), Ambessa top (245) and Bard
support (245). These counts are repeated appearances in professional games,
not independent observations or an ordered recommendation list.

Next, review a small set of high-use profiles against versioned official kit
and item sources, record role/build conditions and counterexamples, then rerun
this audit. For Solo Queue, collect a broader and separately dated sample
before training a draft outcome model. The local `RIOT_API_KEY` environment
variable is currently absent; the existing campaign collector can be planned
offline and requires a privately held key for real collection. No key belongs
in this repository, chat or desktop installer.

## Separate Solo Queue pilot check

`research/audit-coach-soloq.ts` applies the same coverage definitions to the
existing normalized Riot Match-V5 pilot without printing match or player IDs:

```powershell
bun research/audit-coach-soloq.ts data/runtime/soloq/euw1-DIAMOND-I.jsonl
```

All 489 stored matches pass the structural audit. The recent-patch subset
16.16–16.19 contains 341 games and 3,410 observed champion-role picks.

| Measure | Recent Solo Queue pilot |
| --- | ---: |
| Any recorded role capability | 3,067 / 3,410 (89.9%) |
| Patch-reviewed role capability | 0 |
| Role-specific color profile | 23 / 3,410 (0.7%) |
| Historical champion-wide color reference | 2,916 / 3,410 (85.5%) |
| Role-specific coaching profile | 1,182 / 3,410 (34.7%) |
| Both teams receive a provisional primary plan | 328 / 341 games |

The largest missing coaching profiles in this small pilot are Thresh support
(50 observed picks), Ornn top (42), Lulu support (39), Viego jungle (39), and
Zed mid (37). Missing role capability is led by Yunara bot (32), Syndra bot
(16), Viktor bot (15) and Yasuo bot (12). These are **editorial priorities for
this sample**, not population estimates. The pilot is seeded from one EUW
Diamond-I ladder page; the ranks of all ten match participants are unverified.
Match-V5 here stores final teams and roles, not a recorded sequence of draft
decisions. Therefore this check cannot validate a B1–R5 recommendation or
the quality of an opponent response.

## Provisional kit-review batch

Five role-specific coaching profiles were added for Thresh support, Ornn top,
Lulu support, Viego jungle and Zed mid. Each links to the official Riot champion
page for its kit reference and is labeled `manual`, `provisional` and patch
`unknown`. The timing and execution assessments are RiftTheory interpretations;
they are not Riot balance claims or validated item-build recommendations.

After rebuilding the offline knowledge export, the same coverage commands show
1,389 / 3,410 Solo Queue pilot picks with a coaching profile (40.7%, previously
1,182 / 3,410 or 34.7%) and 5,977 / 13,810 pro picks (43.3%, previously
5,576 / 13,810 or 40.4%). These increases reflect 207 and 401 repeated
observed picks respectively, not an improvement in win prediction or proof of
profile accuracy. The largest remaining missing Solo Queue pilot coaching cases
are Syndra mid (35), Nami support (34), Garen top (32), Milio support (32) and
Yunara bot (32). Capability and color coverage did not change.
