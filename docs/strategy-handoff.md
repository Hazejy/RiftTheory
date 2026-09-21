# Strategy-Tab: Übergabe an die nächste KI

Stand: 21. September 2026. Dieser Branch sichert die bisher uncommittete
Strategy-Arbeit auf Basis von `fefc0dc` und die Erweiterungen vom 21. September.
Es handelt sich um einen Entwicklungsstand, nicht um einen neuen Release.

## Einstieg

Das Git-Repository enthält mehrere Projekte. Die betroffene SolidJS-/Tauri-App
liegt im Unterordner **`RiftTheory/`**. Befehle unten dort ausführen.

- Einstieg der Oberfläche: `apps/frontend/src/components/rifttheory/StrategyWorkspace.tsx`
- Kompositionsanalyse, legale Kandidaten, Paarbildung und Vorher/Nachher-Vergleich:
  `apps/frontend/src/utils/strategyReview.ts`
- Bedingte Fähigkeitshinweise: `apps/frontend/src/utils/strategyMechanics.ts`
  und `components/rifttheory/StrategyMechanicsPanel.tsx`
- Live-Draft-Übergabe: `apps/frontend/src/utils/strategyLiveDraft.ts`,
  `contexts/StrategySession.ts` und `components/workspaces/LiveDraftView.tsx`
- Detailfenster-Fix: `components/draft/DraftTable.tsx`,
  `components/rifttheory/SuggestionEvidenceBadges.tsx` und `components/common/Table.tsx`
- Ausführliche Recherche, Grenzen und frühere Prüfungen:
  [`research/strategy-workspace-review-2026-09.md`](../research/strategy-workspace-review-2026-09.md).

Die verkürzten `components/`- und `contexts/`-Pfade beziehen sich ebenfalls auf
`RiftTheory/apps/frontend/src/`.

## Was umgesetzt ist

- Eigenständiger Strategy-Arbeitsbereich mit Rollenbelegung, Teamplänen,
  Bedingungen, Gegenmöglichkeiten, Zeitfenstern und Herkunft der Einschätzungen.
- Legale Einzel- und Doppelpicks mit Rollenauflösung, Bans und Serienrestriktionen.
- Expliziter Live-Draft-Snapshot über **Analyze game**. Er bleibt vom Hauptdraft
  getrennt; Änderungen im Live Draft erfordern eine erneute Übergabe.
- Zwölf Champions mit einzelnen versionsgebundenen Fähigkeitshinweisen;
  keine vollständige Prüfung aller Kits oder Spell-Interaktionen.
- Detaildialog außerhalb virtualisierter Tabellenzeilen, damit ein Remount ihn
  nicht schließt. Enter auf einem enthaltenen Button löst keinen Row-Pick aus.
- Neu am 21. September: Vorschau vergleicht beide Teams vor/nach dem Pick.
  Beim Austausch gehört der ausgehende Champion zum tatsächlichen Ausgangsdraft.
  Neue/verlorene Pläne sowie beantwortete/neue Anforderungen werden sichtbar.
- Neu am 21. September: Die Suche verlangt bei einem Paar nur einen passenden
  Champion. Partner dürfen aus dem übrigen legalen Pool stammen. Ohne Suchtext
  bleibt die Top-12-Auswahl bestehen; mit Suche werden maximal zwölf passende
  Champions und zwölf weitere Partner betrachtet, inklusive legaler Rollenvarianten.

## Verifikation des aktuellen Codes

Die folgenden Prüfungen wurden am 21. September erfolgreich ausgeführt:

```powershell
cd RiftTheory
bun test apps/frontend/src/utils packages/core/src
bun run typecheck
bun run --filter @draftgap/frontend build
cd apps/frontend
& ./node_modules/.bin/eslint.exe src/utils/strategyReview.ts src/utils/strategyReview.test.ts src/components/rifttheory/StrategyWorkspace.tsx
```

Ergebnis: **79 Tests bestanden**, TypeScript erfolgreich, gezielter ESLint-Lauf
erfolgreich und Produktionsbuild erfolgreich. Bestehende Bundle-Warnung:
Haupt-JavaScript etwa 941,47 kB minifiziert / 308,30 kB gzip.
Auf anderen Plattformen den lokal installierten ESLint-Launcher ohne `.exe` nutzen.
Bei einer frischen Kopie zuerst `bun install --frozen-lockfile` in `RiftTheory/`.

**Die neuen Änderungen vom 21. September sind noch nicht visuell geprüft.**
Die Browser-Anbindung war nicht verfügbar. Der anschließende Computer-Use-Versuch
wurde vom Tool gestoppt, weil die aktuelle Browser-URL unter Windows nicht
zuverlässig bestimmt werden konnte. Das ist keine bestätigte Fehlfunktion der App.

Der dokumentierte native Smoke-Test vom 20. September gilt nur für den damaligen
Stand. Seit den neuen Vergleichs-/Suchänderungen wurde kein nativer Build erstellt
oder geprüft. Kein Installer oder neuer App-Release gehört zu dieser Übergabe.

## Sinnvolle nächste Schritte

1. Produktionsvorschau starten: in `RiftTheory/`
   `bun run --filter @draftgap/frontend serve --port 3011`.
2. Im Strategy-Tab einen Doppelpick-Slot auswählen und einen einzelnen Champion
   suchen. Prüfen, dass Paare mit anders benannten Partnern angeboten werden.
3. Eine Vorschau auf beiden Seiten öffnen. Zuordnung von Blue/Red, aktueller Plan,
   neuer Plan und Gegnerantwort prüfen. Die echten Picks müssen unverändert bleiben.
4. Einen belegten Slot ersetzen: beispielsweise Schutz gegen einen Entry-Pick
   entfernen. Verlorene Schutzroute und neue Anforderungen müssen gegenüber dem
   ursprünglichen Draft erscheinen. Wechsel von Slot/Rolle/Bans muss eine veraltete
   Vorschau verwerfen. Auch den Live-Draft-Snapshot prüfen.
5. Layout bei schmalem und breitem Fenster prüfen. Danach bei Bedarf nativen
   Tauri-Build und Smoke-Test durchführen; diese Prüfungen ehrlich protokollieren.

## Fachliche Grenzen beibehalten

- Strategische Aussagen sind bedingte Hypothesen, keine kalibrierten Winrates.
- Fähigkeiten über mehrere mögliche Rollen nur verwenden, wenn sie in jeder
  legalen Rollenbelegung belegt sind. Fehlende Daten nicht als Vorteil auslegen.
- Self-Escape ist kein Beleg für Teamschutz; Sustain nicht automatisch Teamheilung.
- Keine garantierte Lane-Priority, Spell-Unterbrechung oder Item-Schwelle erfinden.
- Fähigkeitshinweise sind an Data Dragon 16.18.1 gebunden. Neue mechanische Aussagen
  anhand offizieller versionsgebundener Quellen prüfen und Grenzen sichtbar halten.
- Der alte `RiftTheoryStrategy.tsx` bleibt als Vergleich im Repository;
  `App.tsx` verwendet `StrategyWorkspace.tsx`.

## Kopierbarer Auftrag für eine lokale KI

> Lies zuerst `docs/strategy-handoff.md` und
> `research/strategy-workspace-review-2026-09.md`. Arbeite am neuen Strategy-Tab
> unter `RiftTheory/apps/frontend/src/` weiter. Prüfe zunächst die neuen
> beidseitigen Pick-Vergleiche und die Suche nach Doppelpicks in der laufenden UI.
> Behalte die dokumentierten Evidenzgrenzen und die Trennung von Live-Draft-Snapshot
> und Hauptdraft bei. Führe zu Änderungen passende Tests und TypeScript aus und
> dokumentiere, was tatsächlich geprüft wurde. Ein Release ist nicht erforderlich.
