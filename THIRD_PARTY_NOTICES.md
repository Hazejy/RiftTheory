# Third-party notices

The application is now named RiftTheory (formerly DraftOS). The upstream MIT
license and copyright remain unchanged. Attribution is retained in these files;
it is no longer displayed as a banner over the draft workspace.

## DraftGap

The `draftgap/` directory contains a modified copy of
[DraftGap by Vigo Vlugt](https://github.com/vigovlugt/draftgap).

- Upstream version: 3.2.1
- Imported commit: `9b79e8668cff4dfd2ba55a01cfa62d5895f98675`
- Import date: 2026-09-04
- Copyright (c) 2026 Vigo Vlugt
- License: MIT; the complete upstream notice and license remain in
  [draftgap/LICENSE](draftgap/LICENSE).

DraftOS changes include branding, a curated strategy view, local storage keys,
loopback-only local serving, disabled Google Analytics initialization and disabled
upstream desktop updates. This is an independent fork, not an official DraftGap release.

Dependency licenses remain applicable to their respective packages. The source
license does not establish permission to redistribute all external datasets,
League of Legends assets or third-party trademarks. Those need separate review
before distribution or public hosting. No upstream data-collection or publishing
jobs were run as part of this import.

## Fonts

Inter, Roboto and Plus Jakarta Sans are bundled through their Fontsource variable
font packages (5.3.0). Each uses the SIL Open Font License 1.1. Complete copyright
and license notices are shipped in `draftgap/apps/frontend/public/licenses/` and
copied into the web build under `/licenses/`. These fonts use system fallbacks
for Korean and Chinese glyphs.
