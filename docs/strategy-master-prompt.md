# Master-Prompt: RiftTheory Strategy bis zur bestmöglichen Draft-Beratung ausbauen

Kopiere den folgenden Prompt vollständig in einen neuen Codex-Task im Projekt
`C:\Users\Löltgen\Documents\vscode\Projekt DraftOS`.

---

Du arbeitest am produktiven SolidJS-/Tauri-Projekt **RiftTheory** unter
`RiftTheory/`. Baue den Strategy-Tab zu einer außergewöhnlich guten League-of-
Legends-Draft-Beratung aus. Arbeite autonom, implementiere echte Verbesserungen
und bleibe nicht bei einem Audit oder einem Plan stehen. Prüfe zuerst den
aktuellen Arbeitsbaum, weil dort bereits wichtige, noch nicht eingecheckte
Änderungen liegen können. Erhalte fremde Änderungen und überschreibe sie nicht.

## Produktvision

Der Strategy-Tab soll für jeden Pick und jeden vollständigen Draft erklären:

1. Was ist in diesem konkreten Zustand die beste **unterstützte** Wahl?
2. Warum passt sie zu Rollen, Teamplan, Farben, Tempo, Ressourcen,
   Power-Spikes, Spielerpool und Pick-Reihenfolge?
3. Was ist die stärkste legale Antwort des Gegners?
4. Welcher eigene Fallback bleibt nach dieser Antwort und nach folgenden Bans?
5. Warum sind die wichtigsten Alternativen schlechter, riskanter oder nur ein
   anderer Trade-off?
6. Wie gewinnen Blue und Red jeweils den fertigen Draft, wann sind ihre Fenster,
   was müssen sie vermeiden und wie kann die Gegenseite antworten?

Die Denkweise darf von LS-Draft-Analysen und TCG-/MTG-Drafting inspiriert sein:
Optionswert, Signale, offene Farben/Rollen, Deckkohärenz, Antworten,
Informationspreis, Ressourcen und gemeinsame Timing-Fenster. Imitiere LS nicht
und schreibe ihm keine unbelegten Aussagen zu. Farben sind eine strategische
Linse, keine erfundene feste Counter-Matrix und kein Ersatz für Champion-Kits,
Rollen, Matchups oder Spielausführung.

Das langfristige Ziel ist eine robuste, minimaxartige Draftsuche. Nenne das
Produkt erst dann GTO, Nash-gelöst oder optimal, wenn diese Aussage mathematisch
und empirisch belegt ist. Bis dahin verwende präzise Begriffe wie „bounded
adversarial search“, „screened response“, „robust in the searched lines“ oder
„unresolved“. Eine ehrliche, nachvollziehbare Empfehlung ist wertvoller als
eine falsche präzise Zahl.

## Lies vor Änderungen diese Quellen vollständig

- `docs/draft-coach-blueprint.md`
- `docs/strategy-handoff.md`
- `docs/rifttheory-architecture.md`
- `research/pro-draft-outcome-study-2026-09-23.md`
- Aktive UI: `RiftTheory/apps/frontend/src/components/rifttheory/StrategyWorkspace.tsx`
- Such-/Fensterlogik: `RiftTheory/apps/frontend/src/utils/draftCoach.ts`
- Strategieauswertung: `RiftTheory/apps/frontend/src/utils/strategyReview.ts`
- Kompositionsanalyse: `RiftTheory/apps/frontend/src/utils/compositionCoach.ts`
- Live-/Serienregeln: `RiftTheory/apps/frontend/src/utils/strategyLiveDraft.ts`
- Statistik-Evidenz: `riftTheoryPickEvidence.ts`,
  `riftTheoryReplacementScreen.ts` und die Dataset-/Rating-Helfer

`RiftTheoryStrategy.tsx` ist nur ein historischer Vergleich und nicht die aktive
Strategy-Route. Verwechsle diese Dateien nicht.

## Bereits umgesetzt – nicht noch einmal von vorn bauen

- B1–B5 und R1–R5 besitzen chronologische Coach-Fenster.
- Doppelpick-Fenster sowie die zweite Banphase werden berücksichtigt.
- Zwei Kandidaten im selben Slot können gegen bis zu drei heuristische
  Gegnerantworten verglichen werden; ein legaler eigener Fallback wird gezeigt,
  sofern er vor den nächsten Bans liegt.
- Bounded Target-Ban-Szenarien berechnen nach der zweiten Banphase neue Picks.
- Rollen-, Duo- und Matchup-Stichproben, Spielzahlen, dünne Stichproben und
  fehlende Daten sind teilweise sichtbar.
- Fertige Drafts besitzen einen rückblickenden Replacement-Screen mit dem
  bestehenden unkalibrierten Rating-Index.
- Farben, Themes, Ressourcen, Damage, Timing, Kit-Interaktionen, Flex-Evidenz
  und Quellen sind in unterschiedlichen Tiefen vorhanden.
- Normal, Team Fearless, Global Fearless und Ironman besitzen Grundlogik.
- Manuelle Live-Rollenwahl bleibt während derselben Champ Select bestehen.
- Produkt- und interne Paketnamen verwenden RiftTheory; echte externe URLs,
  Quellen- und Lizenzangaben behalten ihre korrekte Herkunft.

Behandle diesen Stand als Ausgangspunkt. Prüfe ihn am Code, statt die Liste blind
zu glauben.

## Was noch fehlt

### 1. Ein echtes gemeinsames Zustands- und Suchmodell

Extrahiere die Draftsuche aus der großen UI-Komponente in reine, getestete
Module. Ein Zustand muss mindestens enthalten:

- Patch, Queue/Profi-Kontext, Rang und Region
- Seite mit First Pick und aktueller Slot
- Picks, Bans und tatsächliche nächste Aktionsfolge
- alle legalen Rollenbelegungen und verbleibende Flex-Unsicherheit
- verfügbare Champions, Ownership, Team-/Spielerpools und Comfort
- Serienregeln einschließlich Fearless/Ironman
- Datensatzstatus, Evidenzabdeckung und Unsicherheit

Implementiere einen deterministischen legalen Zustandsübergang. Keine doppelten
Champions, keine gebannten oder gesperrten Picks, keine unmöglichen Rollen und
keine falsche B1–B5/R1–R5-Reihenfolge. First Pick darf nicht stillschweigend aus
„Blue“ abgeleitet werden.

Ersetze die heutige flache Auswahl schrittweise durch eine begrenzte alternierende
Suche über Pick- und Ban-Aktionen. Nutze Beam Search, Alpha-Beta oder eine andere
nachvollziehbare Begrenzung, aber gib Suchbreite, Tiefe, abgeschnittene Äste und
Abdeckung in der Ausgabe an. Der erste sinnvolle Meilenstein sucht vom aktuellen
Slot mindestens bis zum nächsten abgeschlossenen eigenen Pick-Fenster nach einer
Gegnerantwort; an der zweiten Banphase muss er durch die Bans bis zum nächsten
Pick-Fenster gehen. Danach kann die Tiefe kontrolliert erweitert werden.

Solange kein validiertes skalares Outcome-Modell existiert, nutze eine
mehrdimensionale Bewertung statt erfundener Prozentwerte. Halte getrennt:

- offene eigene Needs und neu erzeugte Verpflichtungen
- eigene und gegnerische belastbare Pläne
- Rollen-/Flex- und Informationswert
- Theme-/Farb-Kohärenz mit Abdeckung
- Ressourcen- und Damage-Konflikte
- Kit-basierte Antworten und Gegenantworten
- vorhandenen statistischen Rating-Index und seine Stichprobengröße
- Evidenzabdeckung und Unsicherheit

Ein Kandidat darf einen anderen nur „dominieren“, wenn er in den verglichenen
Dimensionen nachweislich nicht schlechter und in mindestens einer besser ist.
Bei echten Trade-offs lautet das Ergebnis „unresolved“ und die UI erklärt den
Trade-off. Verwende stabile Tie-Breaker nur für die Darstellung, nicht als
vorgebliche Stärke.

### 2. Recommendation und Alternatives müssen denselben Zustand vergleichen

Für jeden Slot B1–B5/R1–R5:

- Zeige die besten unterstützten Einzel- oder Doppelpick-Linien.
- Vergleiche sie unter identischen bereits bekannten Picks, Bans, Rollen,
  Pools, Serienregeln und künftig möglichen Aktionen.
- Zeige die stärkste gefundene Gegnerantwort und den besten eigenen Fallback.
- Erkläre „Why now?“: Was sich durch genau diesen Pick-Slot ändert.
- Erkläre „Why not X?“ für mindestens die wichtigsten Alternativen anhand des
  tatsächlich berechneten Asts, nicht mit generischem Text.
- Zeige, welche Rolle/Information festgelegt wird und welche Optionen offen
  bleiben.
- Unbewertete Champions bleiben legal auffindbar, werden aber nicht ohne
  Evidenz als beste Wahl gerankt.

Erklärungen müssen aus strukturierten Reason-Codes und dem ausgewählten
Suchpfad entstehen. Die UI darf keine Begründung anzeigen, die der berechneten
Linie widerspricht.

### 3. „TCG Deck Comparison“ als verständliche Draft-Ansicht

Baue eine kompakte, hochwertige Gegenüberstellung beider „Decks“:

- Primär-/Sekundärfarben mit Evidenzstatus
- Kernplan, Enabler, Payoffs und Karten/Champions ohne klaren Anschluss
- Engage, Follow-up, Peel, Disengage, Poke, Siege, Catch, Frontline,
  Waveclear, Side-Lane, Terrain Control und Target Access
- Damage-Verteilung und nachhaltige Schadensquellen
- Farm-/Ressourcenverteilung und konkurrierende Carries
- gemeinsame Level-/Item-/Ultimate-Fenster
- Flex-/Informationswert und bereits gezeigte Rollen
- „What this deck needs next“ und „What breaks this deck“

Die Ansicht soll erklären, nicht bloß bunte Badges addieren. Champion-spezifische
Kit-Fakten brauchen eine versionsgebundene Quelle. Ein Farbprofil allein darf
kein Matchup entscheiden.

### 4. Player Pools, Comfort und Kontext

Füge ein sauberes Modell für Team- und Spielerpools hinzu:

- Spieler → mögliche Rollen → verfügbare/komfortable Champions
- Confidence/Quelle/Stand der Pool-Daten
- Pro-Kontext getrennt von Solo Queue
- Ownership als harte Einschränkung, Comfort als erklärter Faktor
- Serienweite Sperren und Side Swap

Wenn keine Pool-Daten existieren, darf der Coach keine Comfort-Aussage erfinden.
Die Suche muss dann provider-neutral ohne diesen Faktor weiterarbeiten.

### 5. Statistik und Outcome-Modelle wissenschaftlich sauber halten

Der heutige Rating-Index ist nützlich, aber keine kalibrierte Draft-
Siegwahrscheinlichkeit. Der vorhandene Profi-Backtest zeigte, dass Team-/Spieler-
Priors die getesteten Draftfeatures schlagen. Die Solo-Queue-Stichprobe ist für
ein belastbares Modell zu klein und patch-konfundiert. Zeige daher vorerst keine
scheinbar präzise Win Probability für unvollständige Drafts.

Wenn du Outcome-Modellierung weiterführst:

- Pro und Solo Queue strikt getrennt trainieren und validieren.
- Nur Pre-Game-Information verwenden; keine Dauer, Gold, Kills oder Objectives.
- Zeitlich getrennte Future-Patch-Tests und Embargos verwenden.
- Gegen Side-, Champion-, Spieler- und Team-Baselines vergleichen.
- Log Loss, Brier Score, Kalibrierung, Konfidenzintervalle und Coverage melden.
- Komplexität verwerfen, wenn sie eine starke Baseline nicht zuverlässig schlägt.
- Erst nach erfolgreicher unabhängiger Validierung erwarteten Wert, robusten Wert
  und Unsicherheitsintervalle als numerische Entscheidungshilfe integrieren.

Ein Sprachmodell darf strukturierte Befunde verständlich formulieren und
Rückfragen beantworten. Es darf keine neuen Mechanik-, Matchup- oder
Wahrscheinlichkeitsfakten ohne überprüfbare Quelle erzeugen.

### 6. Daten- und Evidenzabdeckung

Erweitere Rollenprofile priorisiert nach Nutzung und fehlender Coach-Abdeckung.
Jeder Eintrag soll Rolle, Patch/Version, Quelle, Review-Status, konkrete
Fähigkeiten, Voraussetzungen, Timing und Gegenplay trennen. Veralte Einträge
bleiben als historisch markiert oder werden unterdrückt. Aktualisiere nicht
mechanisch hunderte Champions mit geratenen Tags.

Statistische Quellen müssen Rang, Region, Patch, Zeitraum, Stichprobengröße und
Unavailable/Stale-Status transportieren. Fehlende Werte bleiben unbekannt.
Provider-Namen gehören in Provenance/Lizenzen; das Produkt-Branding bleibt
RiftTheory.

### 7. UX, Performance und Barrierefreiheit

Die Hauptansicht soll zuerst eine klare Entscheidung zeigen und Details
progressiv öffnen:

1. Recommendation/Urteil
2. stärkste Gegnerantwort und eigener Fallback
3. Warum diese Wahl / warum die Alternative schlechter ist
4. Deckvergleich und Timing
5. Statistik, Evidenz, Quellen und Suchdetails

Vermeide Textwände und doppelte Aussagen. Desktop und schmale Fenster dürfen
nicht horizontal überlaufen. Tastaturbedienung, sichtbarer Fokus, korrekte
Buttons/Labels und Screenreader-Namen sind Pflicht. Teure Suche gehört hinter
Memoization oder in einen Worker; die UI muss während der Suche bedienbar bleiben.
Zeige einen reproduzierbaren Search-ID/Fingerprint für Debugging und verwerfe
veraltete Ergebnisse, wenn sich Draft oder Datensatz ändern.

## Konkreter nächster Meilenstein – damit beginnen

Liefere zuerst einen überprüfbaren **Response Tree v1**:

1. Definiere provider-neutrale `DraftState`, `DraftAction`, `SearchConfig`,
   `EvaluationVector`, `SearchNode` und `PrincipalVariation` außerhalb der UI.
2. Adaptiere den vorhandenen `draftCoachWindow`, `strategyOptions`,
   `screenDraftChoice` und `draftBanStress`, statt alles wegzuwerfen.
3. Suche für alle zehn Slots legal und alternierend bis zum nächsten sinnvollen
   eigenen Entscheidungsfenster; überquere die zweite Banphase korrekt.
4. Erzeuge pro Top-Kandidat einen nachvollziehbaren Pfad:
   eigener Pick → stärkste gescreente Antwort → eigene Reaktion/Ban-Folge.
5. Vergleiche mindestens zwei Kandidaten mit derselben SearchConfig und gib
   Dominanz oder benannte Trade-offs aus.
6. Rendere die Principal Variation im Strategy-Tab und leite „Why recommended“
   sowie „Why not alternative“ direkt aus ihr ab.
7. Zeige Tiefe, untersuchte Knoten, Pruning/Beam-Limit, Evidenzabdeckung und
   „not solved / not calibrated“ in einem aufklappbaren Methodenteil.

Dieser Meilenstein darf weiterhin heuristisch sein, muss aber gegenüber dem
heutigen Drei-Antwort-Screen eine echte, getestete Zustandsfolge und einen
reproduzierbaren Antwortpfad liefern.

## Abnahmekriterien

- B1–B5 und R1–R5 besitzen Tests für Reihenfolge, Seiten, Doppelpick-Fenster,
  zweite Banphase und Fallback.
- Keine Linie enthält doppelte, gebannte, gesperrte, nicht verfügbare oder
  rollenunmögliche Picks.
- Flex-Picks behalten mehrere Rollen, bis eine Festlegung nötig ist.
- Normal, Team Fearless, Global Fearless und Ironman verändern den legalen Pool
  korrekt; Side Swap wird getestet.
- Gleicher Zustand plus gleiche Config ergibt dieselbe Principal Variation.
- Änderungen an Draft, Rolle, Ban, Pool, Patch oder Datensatz invalidieren alte
  Suchergebnisse.
- Jede Recommendation zeigt Kosten, Gegnerantwort, Fallback, Alternative,
  Evidenzabdeckung und Unsicherheit.
- Keine Zahl wird als Win Probability bezeichnet, solange sie nicht für diesen
  Kontext zeitlich getrennt kalibriert wurde.
- Unvollständige Evidenz erzeugt keinen stillen Bonus und keine erfundene
  Champion-Aussage.
- Die Erklärung entspricht dem gespeicherten Suchpfad.
- Keine Regression der Live-Rollenwahl, Dataset-Fallbacks oder gespeicherten
  Workspaces.
- UI-Smoke-Tests prüfen mindestens B1, B3, R3 und R5 sowie ein schmales Fenster.
- Tests, Typecheck, Quellcode-Lint, Produktionsbuild und – wenn Desktopcode
  betroffen ist – Tauri/NSIS-Build sind erfolgreich.

## Architektur- und Arbeitsregeln

- `packages/core` bleibt provider-neutral und importiert nichts aus `apps/*`,
  SolidJS oder Tauri.
- UI rendert State und ruft Actions auf; Such- und Coachinglogik gehört in reine
  Module, nicht weiter in `StrategyWorkspace.tsx`.
- Externe Payloads werden an Adaptergrenzen validiert.
- Nutze die bestehende Statistik und Coach-Evidenz; dupliziere keine Matchup-
  Wahrheit als ungetestete Handregel.
- Bewahre lokale, nicht zu dieser Aufgabe gehörende Änderungen. Prüfe vor jeder
  Änderung `git status` und relevante Diffs.
- Schreibe gezielte Tests für Zustandsübergänge, Legalität, Branch-Auswahl und
  Erklärungstreue. Vermeide Tests, die nur Implementierungsdetails spiegeln.
- Aktualisiere `docs/strategy-handoff.md` am Ende mit tatsächlichem Stand,
  geprüften Befehlen, Grenzen und nächstem Schritt.
- Veröffentliche, tagge oder lade nichts extern hoch, außer der Nutzer bittet im
  neuen Task ausdrücklich darum.

## Verifikation

Nutze die im aktuellen Arbeitsbaum tatsächlich vorhandenen Scripts. Mindestens:

```powershell
cd RiftTheory/apps/frontend
bun test
bunx eslint src

cd ../..
bun run typecheck
bun run --filter @rifttheory/frontend build
```

Wenn Tauri-/Desktopcode betroffen ist:

```powershell
cd RiftTheory/apps/frontend
& .\node_modules\.bin\tauri.exe build --bundles nsis
```

Führe nach jedem sinnvollen Abschnitt die passenden gezielten Tests aus und am
Ende die vollständigen relevanten Gates. Dokumentiere bestehende Warnungen
getrennt von neuen Fehlern.

## Erwartete Arbeitsweise und Abschlussbericht

Beginne mit einer kurzen Bestandsaufnahme des aktuellen Codes und der lokalen
Änderungen. Entscheide dann den kleinsten Architektur-Schritt, der Response Tree
v1 real macht, und implementiere ihn vollständig. Frage nicht bei jeder
Routineentscheidung nach. Stoppe nicht nach einem Mockup oder einer weiteren
Roadmap.

Berichte am Ende knapp und überprüfbar:

- was sich für den Nutzer verändert hat,
- welche Module und Datenverträge entstanden sind,
- welche Draftpfade jetzt wirklich gesucht werden,
- welche Tests/Builds gelaufen sind,
- welche Aussagen weiterhin bewusst nicht gemacht werden,
- welcher konkrete nächste Schritt den größten zusätzlichen Produktwert bringt.

Das Qualitätsziel ist nicht möglichst viel Text oder möglichst viele Scores.
Das Ziel ist der beste nachvollziehbare Draft-Coach: legal, kontextbewusst,
adversarial, evidenzgebunden, ehrlich bei Unsicherheit und in der UI sofort
verständlich.

---
