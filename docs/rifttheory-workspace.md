# RiftTheory workspace update

DraftOS is now RiftTheory. The app title, active strategy component, desktop
product identity and new launcher use that name. Existing source history,
upstream package names and the legacy Python module remain unchanged.
Start with `start-rifttheory.cmd`; the old launcher remains compatible.

## Technical foundation, not final visual identity

DraftGap remains the statistical and UI foundation. The top attribution banner
and local-fork badge have been removed from the workspace. The complete MIT
license and copyright are retained in `draftgap/LICENSE` and third-party notices.
Model limitations remain available within analysis and strategy, not above the
draft overlay. A new logo and broader visual redesign are explicitly deferred.

## Automatic pick order

The ally side is Blue and the opponent side is Red in this local workspace.
Clicking a champion fills the first empty chronological slot:

`B1 -> R1 -> R2 -> B2 -> B3 -> R3 -> R4 -> B4 -> B5 -> R5`

This order is a default, not a restriction. Click a side to target its first empty
slot (or its first slot when full), or click any sidebar/sequence slot to target it
directly, including occupied slots for replacement. After a pick, automatic order
resumes at the first remaining empty slot. The selected target is highlighted.
Replacement suggestions exclude the outgoing champion from the candidate team.

The user's example omitted R3; this implementation includes it so both teams
receive five picks. Pick slots are not lane assignments. Assigning or changing a
role does not consume another pick. Duplicate champions cannot be added by the
normal champion-click flow. Clearing a slot makes that chronological slot next
again; resetting the draft starts at B1. When all ten slots are filled, the app
opens analysis. This is a pick sequence, not a complete pick/ban phase engine.

## Languages and sources

The header language selector offers English, Korean and Simplified Chinese.
It changes draft controls, role labels, champion search/names, strategy labels,
main analysis headings and common table/card labels. Preferences are saved under
`rifttheory-config`; existing DraftOS preferences and favourites are carried over
without deleting the old entries.

English and Chinese champion names come from the upstream dataset. Korean names
are requested from Riot Data Dragon's `ko_KR/champion.json` for the same version
as the current-patch dataset, matched by champion key. This only adds names; it
does not replace statistics or send selections. A six-second timeout and English
fallback keep a missing translation file from blocking the draft. The language
control reports that fallback. Search preserves Unicode letters, including Hangul.

Curated source reasoning is retained in English and labelled as original source
text. Some inherited advanced settings, tooltips, FAQ and beta-build tools are
still English. This is not a claim that every inherited screen is fully localized.
Human review of Korean and Chinese terminology is still advisable before release.

## Data versus strategic knowledge

### Champ Colors and appearance

The Champ Colors tab lists the complete upstream champion catalogue in a compact,
searchable table. Each recorded champion-role profile has its own row with main
colors, off colors, review status and expandable source reasoning. Champions with
no local profile remain visible as unassessed; colorless is never a missing-data
placeholder. Filters support localized/English names, recorded roles, colors and
profile availability. Changing these filters does not change the draft. Clicking
a champion's name or portrait adds them to the selected target without locking a
role. Catalogue picks keep Champ Colors open, including the tenth pick; local
search and filters remain intact while the target advances. Normal Draft-tab
completion still opens analysis. Already-picked and banned champions are unavailable. The expandable color
guide explains the working definitions, main/off colors and multiple identities
in English, Korean and Chinese; it does not add new champion classifications.

The catalogue patch is separate from the assessment patch shown in each profile's
evidence. The existing Anivia Mid profile is still provisional and not patch-verified.
No additional champion color assignments are inferred by this UI.

Settings now offer three fonts (Inter, Roboto, Plus Jakarta Sans) and three dark themes
(Obsidian, Aurora, Nebula), applied immediately and saved to the local config.
Inter/Obsidian are the defaults. Old Graphite/Midnight/Forest preferences migrate
to Obsidian/Aurora/Nebula. Palettes include subtle workspace/header gradients,
accented active tabs and miniature theme previews. Fontsource files are bundled locally,
with Korean/Chinese system fallbacks. Font licenses ship in public/licenses.
Theme palettes do not change strategic color meanings or
Blue/Red team identity. Invalid saved appearance values fall back to defaults.

The Risk Level question-mark/FAQ shortcut has been replaced with short inline
explanations and translated level labels in English, Korean and Chinese. It controls
small-sample weighting, not playstyle. The underlying risk calculation is unchanged.

Blue Side and Red Side headings now use their matching colors. Their header menus
are replaced with accessible one-click trash buttons that reset only that team's
picks. Empty teams have a disabled reset button. Each individual pick on both
sides has a direct trash button and the same separate options menu for reset,
statistics links, analysis and role selection. Role icons remain on picks.

### Conditional color guide

The expanded guide separates paraphrased community-sheet definitions from
RiftTheory coaching interpretations. Each color has strengths/targets, weaknesses/
opposing answers and a concrete question before locking a pick. A same-color
Anivia/Xerath access scenario and four whole-draft checks demonstrate why labels
cannot produce automatic matchup verdicts. Content remains available in EN/KO/ZH.

The visible source/limits section and external reference links have been removed
from the guide at the user's request. Source provenance remains in the internal
research documents; the teaching content and conditional wording are unchanged.
See [the research review](../research/draft-intelligence-review.md) for the existing
model audit, future recommendation design and the explicitly incomplete video
review. No strategic ranker or new champion classifications were activated.

### Knowledge storage

The broad champion catalogue and statistical observations are already supplied
by DraftGap's external datasets. The app does not yet have its own champion
database. Curated capabilities and colors still come from the small local JSON
profiles. Anivia Mid is provisional; missing knowledge is never inferred from a
champion's statistical presence. A local knowledge database is planned separately,
not implemented by this update.

## Verification

### RiftTheory visual language and keyboard controls

The web interface now uses an original, code-native 24px SVG icon family in
`draftgap/apps/frontend/src/components/icons/RiftIcons.tsx`. Faceted geometry,
clipped corners and consistent line weights replace the inherited Heroicons
throughout navigation, actions, analysis cards and notifications. At the user's
request, role filters and role indicators retain the familiar League-style
glyphs from the original assets, including the all-roles glyph.
Champion portraits, item art and operating-system badges remain
recognizable source assets. Native installer icons are not regenerated here.
The header centers a new RiftTheory mark/wordmark, with dataset status on the
left and utilities on the right. Tabs and draft panels have separate framed
surfaces; the existing three themes still control the accents. The browser
favicon uses the same mark.

The keyboard button opens a localized EN/KO/ZH shortcut reference:

- `1`–`5`: select the numbered slot on the current side, including filled slots.
- `B` / `R`: target Blue / Red's first empty slot (slot 1 if full).
- `D` / `A` / `S` / `C`: Draft / analysis / strategy / Champ Colors.
- `/`: focus the visible champion search. `?`: open shortcut help.

Selecting a slot never inserts or deletes a champion. Catalogue picks continue
to stay in Champ Colors. Shortcuts are ignored while typing, composing text,
using modifiers or interacting with dialogs/menus; holding a key does not repeat
the action. A persisted switch disables the single-key shortcuts. There is no
destructive reset hotkey. Native Tab navigation and browser Find are preserved.
After a Draft-table pick, search no longer takes focus automatically; the slot
shortcuts remain available. Press `/` to search again. Legacy mouse-hover keys
(including R to delete a pick) were removed to avoid conflicts with side selection;
their obsolete shortcut hints were also removed from the options menu.
The defaults above can now be edited individually in the keyboard dialog.
Single-character bindings are saved locally, compared without case, and validated
for conflicts. Clearing a field unbinds its action; a restore-defaults button is
available. The older table letter aliases were removed so custom letters do not
trigger a second action. Table arrow navigation remains available outside menus
and dialogs.

The Reset draft action is now a bordered icon button with a destructive hover
state. Both teams have the same per-slot options and direct trash controls.

### Custom theme and shareable draft image

Settings > Appearance includes a custom Hex editor with eight fields: background,
panels/header, inset panels, controls, text, secondary text, accent and borders.
Each supports a picker and a validated six-digit Hex field. Preview is separate
from Apply. The preference is persisted and normalized on reload; malformed
stored colors fall back safely. Low text contrast generates a warning. The editor
itself keeps readable fixed colors and offers a reset to recover from poor choices.
Obsidian is the hidden safe default/reset state; Aurora and Nebula were removed
from both the UI and accepted settings. Older saved preset names migrate to
Obsidian. A random-palette action generates coordinated dark Hex colors from one
random hue, preserving readable light text rather than choosing every field
independently. It changes only the preview until Apply is pressed. Semantic
champion colors and Blue/Red team identities are not overridden.

The header camera button downloads a 1200x820 PNG draft-only snapshot, not a
pixel-for-pixel browser screenshot. It includes both sides, all ten pick slots,
selected champions and portraits, locked roles (otherwise role open), patch and
timestamp. It uses the active palette, font and language. It does not include
unconfirmed hovers, menus, other tabs or inferred win probabilities. State is
captured before asynchronous portrait loading; no draft data is uploaded. Image
loading has a timeout and falls back to labelled placeholders. Errors and partial
portrait exports are reported; duplicate clicks are disabled during export.

Browser verification covered duplicate-key rejection, remapping slot 3 to key 6,
using the remap after reload, invalid Hex input, applying and retaining a custom
color after reload, resetting preferences, and downloading/visually inspecting
a PNG with Anivia. QA preferences were restored to defaults afterward.
The guide's X/Main and O/Off definitions now explicitly include kit, core items,
team interactions, scaling, alternative builds, playstyle and matchup.

Browser checks confirmed Red + 3 selects R3, Blue + 5 selects B5, an Anivia
catalogue click fills B5 without navigating away, numeric input remains text
inside search, and modal interaction does not trigger slot shortcuts.

Type checking and the production build passed. A short browser check exercised
all ten chronological clicks, manual side/slot selection, automatic resumption,
replacement in a complete draft, individual and team resets, picking Anivia from
Champ Colors, the color guide and loading all three fonts. Earlier checks covered
Korean champion search and Chinese strategy labels. No automated test suite was run. The inherited bundle
size warning remains non-fatal. No Git commit or public deployment was performed.
