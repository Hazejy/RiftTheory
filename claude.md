# Claude Code – RiftTheory / Strategy-Tab

Dies ist die Hauptarbeitsumgebung für den SolidJS-Strategy-Tab. Lies zu Beginn jeder Sitzung:

- `docs/strategy-handoff.md` — Gesamtkontext, Grenzen und nächste Aufgaben
- `research/strategy-workspace-review-2026-09.md` — aktuelle Codebasiseinschätzung und Teststatus
- `git status` — uncommited/unpushed Changes prüfen

**Arbeitsregeln:**
1. Arbeite an der konkreten Nutzeraufgabe bis zu einer überprüften Änderung (Tests + ts). Frage nur, wenn wichtige Entscheidung/Berechtigung fehlt.
2. Schreibe bei Fehlerkorrekturen zuerst Regressionstests. Ein Build-Pass ist kein UI-Test.
3. Trenne belegte Fakten, statistische Daten und strategische Hypothesen. Erfinde keine Matchup-Vorteile oder Winrates.
4. Ändere keine fremden Dateien außerhalb von `apps/frontend/`, `apps/server/` und `docs/research/`.

**Workflow:**
- Start → Handoff + review lesen → git status → Plan für Aufgabe erstellen → Implementieren mit Test-first → Verifizieren (bun test + ts) → Update Handoff.
- Wenn am Strategy-Tab: lies auch `research/strategy-workspace-review-2026-09.md` und prüfe den betroffenen Code.
