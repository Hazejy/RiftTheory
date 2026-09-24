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
- Zweiter Durchgang am 21. September: Auch die Sortierung und die Hinweistexte
  der Ersatzkandidaten nutzen jetzt den tatsächlichen aktuellen Draft als Basis.
  Bereits vorhandener Schutz wird nicht als neu gewonnene Antwort gezählt;
  schon vorher festgelegte Rollen werden nicht als neu verlorener Flex ausgegeben.
- Doppelte Champions und nicht auflösbare Rollen werden jetzt explizit gemeldet.
  Pläne, Zeitfenster und Empfehlungen werden bei widersprüchlicher Ausgangslage
  zurückgehalten. Ein Ersatz, der den Konflikt behebt, bleibt möglich; er bekommt
  aber keine erfundenen Vorher/Nachher-Vorteile aus einem ungültigen Ausgangsdraft.
- Eine gewählte Vorschau wird fokussiert und in den sichtbaren Bereich gescrollt.
  Beim Schließen kehrt der Fokus zur Kandidatenkarte beziehungsweise Suche zurück.
  Änderungen am Draft löschen die alte Vorschau dauerhaft, statt sie bei Rückkehr
  zur alten Belegung unbeabsichtigt wieder einzublenden.

## Verifikation des aktuellen Codes

Die folgenden Prüfungen wurden am 21. September erfolgreich ausgeführt:

```powershell
cd RiftTheory
bun test apps/frontend/src/utils packages/core/src
bun run typecheck
bun run --filter @draftgap/frontend build
cd apps/frontend
& ./node_modules/.bin/eslint.exe src/utils/strategyReview.ts src/utils/strategyReview.test.ts src/components/rifttheory/StrategyWorkspace.tsx
& ./node_modules/.bin/tauri.exe build --no-bundle
```

Ergebnis des zweiten Durchgangs: **86 Tests bestanden**, Workspace-TypeScript
erfolgreich und finaler ESLint-Lauf mit `--max-warnings 0` erfolgreich.
Details zum finalen Desktop-Build stehen im neuesten Abschnitt des
Rechercheprotokolls; frühere Build-Größen gelten nicht automatisch für diesen Stand.
Auf anderen Plattformen den lokal installierten ESLint-Launcher ohne `.exe` nutzen.
Bei einer frischen Kopie zuerst `bun install --frozen-lockfile` in `RiftTheory/`.

**Die neuen Änderungen vom 21. September sind noch nicht visuell geprüft.**
Die Browser-Anbindung war nicht verfügbar. Der anschließende Computer-Use-Versuch
wurde vom Tool gestoppt, weil die aktuelle Browser-URL unter Windows nicht
zuverlässig bestimmt werden konnte. Das ist keine bestätigte Fehlfunktion der App.

Der dokumentierte native Smoke-Test vom 20. September gilt nur für den damaligen
Stand. Im zweiten Durchgang am 21. September wurde der finale Quellcode erfolgreich
mit `tauri build --no-bundle` gebaut, einschließlich Vite-Produktion und optimierter
Windows-EXE. Dieser neue Build wurde **noch nicht interaktiv geprüft**. Er liegt
lokal unter `RiftTheory/apps/frontend/src-tauri/target/release/RiftTheory.exe` und
wird nicht als Binärdatei eingecheckt. Kein Installer oder neuer App-Release gehört
zu dieser Übergabe. Die bestehende Bundle-Warnung bleibt bestehen
(943,39 kB Haupt-JavaScript / 306,65 kB gzip).

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
5. Fehlerhafte Rollenbelegung testen: sichtbare Meldung, keine scheinbar sicheren
   Pläne; ein passender Ersatz darf den Konflikt beheben. Kandidatenhinweise und
   Vergleich müssen dieselben neu beantworteten Anforderungen nennen.
6. Tastaturfokus beim Öffnen/Schließen prüfen sowie Layout bei schmalem und breitem
   Fenster. Vorschau nach Rollenwechsel darf auch nach dem Zurückwechseln nicht
   wieder auftauchen. Anschließend nativen Smoke-Test durchführen; Build-Erfolg
   allein ersetzt diese Prüfung nicht.

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

## Weiterarbeit am 23. September 2026

- Im Strategy-Tab steht nun eine explizite Antwort auf die Siegerfrage. Nur bei
  einem vollständigen, legalen Hauptdraft und verfügbarem Datensatz für den
  angefragten Rang erscheint die Richtung des bestehenden Rating-Modells.
  Der angezeigte Wert ist ein Elo-artig transformierter Rating-Index, **keine
  kalibrierte Siegwahrscheinlichkeit**. Live-Snapshots, fehlerhafte oder
  unvollständige Drafts behalten die Aussage „Winner unresolved“.
- Kandidatenkarten zeigen neue Anforderungen des Gegners und Antworten, die der
  Gegner durch den Wechsel gewinnt. Die Sortierung betrachtet nach den eigenen
  beantworteten Anforderungen auch diese beidseitige Änderung. Sie ist weiterhin
  eine bedingte, begrenzte Heuristik und keine GTO-/Minimax-Lösung.
- In den eingecheckten Projektdateien liegt kein Match-Ausgangskorpus für eine
  zeitlich getrennte Kalibrierung oder Validierung der Draft-Prognose. Eine
  belastbare Siegwahrscheinlichkeit erfordert diese zusätzliche Datenbasis
  samt Patch-, Rang-, Spieler- und Seitenkontrolle.
- Der vom Nutzer genannte Film wurde anhand des Titels als
  [LS: Draft Kingdom – Almost the Greatest Upset in Worlds History](https://www.youtube.com/watch?v=bLRPjFacrf8)
  identifiziert (veröffentlicht am 23. Oktober 2024; fünf Spielabschnitte laut
  Videobeschreibung). Ein auswertbarer Filmtext oder Transkript war über die
  verfügbaren Quellen nicht zugänglich. Aus dem Titel und der Beschreibung
  wurden deshalb keine konkreten Draft-Behauptungen übernommen.
- Geprüft: 91 Frontend/Core-Tests, Workspace-TypeScript, gezielter ESLint-Lauf,
  Produktions-Frontend-Build und `git diff --check`. Der Build meldet weiterhin
  ein großes Hauptbundle (945,26 kB / 309,55 kB gzip). Eine visuelle Prüfung
  war nicht möglich, weil Computer Use weder einen Browser noch eine App
  zurückgab; der Preview-Server startete lokal erfolgreich.

### Ergebnisdaten und getrennte Modelle

Der Nutzer will Profi- und Solo-Queue-Prognosen **getrennt**. Die Datenprüfung,
der erste chronologische Pro-Backtest und der vorbereitete offizielle Riot-
Collector stehen in
[`research/pro-draft-outcome-study-2026-09-23.md`](../research/pro-draft-outcome-study-2026-09-23.md).
9.204 Pro-Spiele wurden konsistent zusammengeführt. Der stärkste geprüfte
Pro-Baselinewert kommt aus früheren Team-/Spielerergebnissen; die bisher
getesteten Draft-Merkmale verbesserten ihn nicht. Deshalb wurde kein neues
Wahrscheinlichkeitsmodell in den Strategy-Tab eingebaut. Der Solo-Queue-Collector
ist typgeprüft und synthetisch getestet. Ein vom Nutzer gestarteter EUW-Diamond-
Durchlauf speicherte 489 unterschiedliche Ranked-Spiele mit vollständigen
Drafts und konsistenten Ergebnissen unter `data/runtime/soloq/` (gitignoriert).
Das ist ein Pipeline-Pilot; für eine belastbare Solo-Queue-Prognose fehlen noch
größere, breiter geschichtete Daten und zeitliche Validierung. Den API-Schlüssel
niemals in Git, die App-Binary oder einen Chat kopieren.

## Kopierbarer Auftrag für eine lokale KI

> Lies zuerst `docs/strategy-handoff.md` und
> `research/strategy-workspace-review-2026-09.md`. Arbeite am neuen Strategy-Tab
> unter `RiftTheory/apps/frontend/src/` weiter. Prüfe zunächst die neuen
> beidseitigen Pick-Vergleiche und die Suche nach Doppelpicks in der laufenden UI.
> Behalte die dokumentierten Evidenzgrenzen und die Trennung von Live-Draft-Snapshot
> und Hauptdraft bei. Führe zu Änderungen passende Tests und TypeScript aus und
> dokumentiere, was tatsächlich geprüft wurde. Ein Release ist nicht erforderlich.

## Solo-Queue-Prüfung am 24. September 2026

Die Produktanforderung für einen LS-inspirierten Draft Coach mit Pick-Reihenfolge,
Farben, Power-Fenstern, Gegnerantworten und späterer GTO-artiger Suche steht in
[`docs/draft-coach-blueprint.md`](draft-coach-blueprint.md). Sie trennt
Coach-Erklärungen, validierte Siegwahrscheinlichkeiten und den Wert eines
einzelnen Pick-Slots.
Der Coach ist für **alle zehn Picks B1–B5 und R1–R5** geplant. Vorhandene
DraftGap-Champion-, Duo- und Matchup-Daten dienen als statistische Grundlage.
Die Live-Draft-Sequenz wurde korrigiert: R3 liegt vor der zweiten Banphase,
danach folgen R4, B4, B5 und R5. Ältere lokal gespeicherte Drafts werden über
den ersten noch fehlenden Schritt fortgesetzt, ohne ihre Picks/Bans zu löschen.
Die 2026er Profi-Regel „First Selection“ kann erste Wahl und Teamseite trennen;
dieser Variantenmodus ist im Live-Draft-UI noch nicht umgesetzt und muss vor
einer vollständigen Pro-Draft-Suche explizit modelliert werden.
Die korrigierte Desktop-Oberfläche wurde noch nicht interaktiv geprüft.

### Testbarer Coach-Stand vom 24. September 2026

Der Strategy-Tab zeigt jetzt für jeden ausgewählten Pick-Slot B1–R5 eine
positionsbezogene Coach-Frage und die folgende Pick-/Banfolge. Bei einem
nachträglich bearbeiteten Slot weist er darauf hin, dass später bekannte Picks
keine historische Entscheidung beweisen. Die Kandidatenvorschau bündelt
beantwortete/neue Anforderungen, gewonnene/verlorene Pläne,
Gegnerantworten sowie Timing und Ressourcen. Bei einem vollständigen,
legalen Hauptdraft erscheint dort auch der vorhandene DraftGap-Rating-Index
mit Champion-, Duo- und Matchup-Beiträgen, ausdrücklich ohne
Wahrscheinlichkeitsanspruch. Das ist ein erster deterministischer Coach-Stand,
noch keine trainierte GTO-Suche oder AI-Chatfunktion.

Verifiziert: 95 Frontend/Core-Tests, Workspace-TypeScript, gezielter ESLint-Lauf,
Frontend-Produktionsbuild, `git diff --check` und lokaler Tauri-NSIS-Build.
Installer: `RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/`
`RiftTheory_3.2.10_x64-setup.exe` (5.804.191 Bytes; SHA-256
`6FC388C40C9D6DB38BC29D7531419A2CB295311A75AE59B5FC521C20F25E73F3`).
Tauri meldete beim Bundling eine Warnung zur fehlenden
`__TAURI_BUNDLE_TYPE`-Markierung; ein automatischer Updater wird für diesen
lokalen Teststand nicht vorausgesetzt. Interaktive Sicht- und Tastaturprüfung
steht aus, weil Computer Use weder Browser noch App bereitstellte. Kein
Installer wurde veröffentlicht oder verteilt.

Die englische Strategy-Oberfläche zeigt jetzt das Urteil und die bedingte
Draft-Einschätzung nebeneinander, danach pro Team Thema, Hauptfarben aller
Picks, Erfolgsbedingung und mögliche Gegnerantwort. Mechanik-, Timing- und
Quellendetails sind aufklappbar. Die Kandidatenkarten zeigen ihre wichtigste
Begründung und eine Antwort bzw. offene Anforderung. In der Vorschau stehen
Farbprofil samt Begründung sowie Gewinn, Kosten, Win Condition und Timing vor
dem aufklappbaren vollständigen Vergleich. Der Shortlist-Algorithmus und die
Evidenzgrenzen sind unverändert; die neue Anordnung behauptet keine kalibrierte
Siegwahrscheinlichkeit. Nach dieser UI-Änderung erneut geprüft: 95 Tests,
TypeScript, gezielter ESLint-Lauf, Frontend-Produktionsbuild, `git diff --check`
und lokaler NSIS-Build. Interaktive Sichtprüfung steht weiterhin aus.

Der nächste Coach-Schritt trennt R3 und R4 im Kandidatenfenster, weil die
zweite Banphase dazwischenliegt. Für chronologische Vorschauen mit einem
unmittelbar folgenden Gegner-Pick zeigt die App bis zu drei legale,
fähigkeitsgestützte Antwort-Szenarien. Die Antwort-Sortierung prüft zuerst,
ob sie einen bisherigen eigenen Plan entfernt oder neue eigene Bedürfnisse
erzeugt. Das ist ein begrenzter Stress-Test des aktuellen Pools, keine
prognostizierte Gegnerwahl und keine optimale Antwort im Spielbaum. Bei R3
weist die Vorschau stattdessen auf die noch offenen Bans hin; rückblickende
Pick-Edits bekommen keine scheinbar historische Antwortliste. Verifiziert:
96 Frontend/Core-Tests, TypeScript, ESLint, Frontend-Produktionsbuild,
`git diff --check` und lokaler NSIS-Build. Das Desktop-Fenster wurde nicht
interaktiv visuell geprüft.

Der Teamplan zeigt nun für jeden Pick die Hauptfarben und seinen belegten
Beitrag zum primären Thema: `Core`, `Supports`, `Unclear` oder `Unconfirmed`.
Die Vorschau zeigt denselben Themenbezug neben dem Farbprofil und dessen
Begründung. Diese Einordnung verwendet nur die aktuelle Rollen- und
Fähigkeitsevidenz; eine Farbe allein begründet keine Team-Synergie.
Die Farbnamen dieser englischen Coach-Ansicht bleiben auch bei anderer
App-Sprache Englisch. Verifiziert: 97 Frontend/Core-Tests, TypeScript,
gezielter ESLint-Lauf, `git diff --check` und lokaler NSIS-Build. Eine
interaktive Sichtprüfung bleibt offen.

Die Pick-Vorschau vergleicht nun den ausgewählten Kandidaten mit einer
anderen legalen Wahl im selben Pick-Fenster. Bei Doppelpicks bleibt der
Vergleich ein Doppelpicks-Vergleich; unterschiedliche Rollenbelegungen zählen
als eigene Wahl. Beide Seiten zeigen Team-Thema, beantwortete Bedürfnisse,
neu erzeugten Gegnerdruck und neue Kosten. Ein Klick öffnet die Alternative
mit ihren Farben, Theme-Fit und Antwort-Szenarien. Die Alternative stammt
aus der begrenzten Heuristik-Shortlist, auch wenn die Suche aktuell nur den
ausgewählten Champion zeigt; daraus folgt kein bewiesener Best-in-Slot-Wert.
Verifiziert: 98 Frontend/Core-Tests, TypeScript, gezielter ESLint-Lauf,
Frontend-Produktionsbuild, `git diff --check` und lokaler NSIS-Build.
Interaktive Desktop-Sichtprüfung steht aus.

Ein neuer retrospektiver Evidenz-Audit steht in
[`research/coach-evidence-audit-2026-09-24.md`](../research/coach-evidence-audit-2026-09-24.md).
Er vergleicht 1.381 jüngere Profi-Spiele mit dem ausgelieferten Wissens-Snapshot,
ohne Spielresultate zur Bestätigung von Pick-Empfehlungen zu verwenden.
Von 13.810 beobachteten Picks haben 5.576 ein rollenspezifisches Coaching-Profil,
363 ein rollenspezifisches Farbprofil und 10.970 nur eine historische,
championweite Farbreferenz. Alle 707 ausgelieferten Fähigkeits-Tags sind
kuratiert und ohne Patch-Verifikation. Die Strategy-Oberfläche nennt nun die
Herkunft der Farben sowie die Grenze dieser Fähigkeits-Tags. Abgelehnte oder
veraltete Rollenfarben werden nicht mehr als gültiges Rollenprofil angezeigt.
Nach diesen Änderungen geprüft: 99 Frontend/Core-Tests, TypeScript,
gezielter ESLint-Lauf, `git diff --check` und lokaler NSIS-Build.
Der getrennte Solo-Queue-Evidenzcheck steht ebenfalls im Bericht. Er umfasst
341 Spiele auf Patch 16.16–16.19: nur 23 von 3.410 Picks haben ein
rollenspezifisches Farbprofil, 1.182 ein Coaching-Profil für Timing und
Ressourcen. Dies ist ein kleiner EUW-Pilot, kein repräsentativer Qualitätswert
für alle Ränge oder Regionen. Für breitere Erhebung fehlt im aktuellen Prozess
ein lokal gesetzter `RIOT_API_KEY`; der Schlüssel wurde nicht ausgegeben.

`research/audit-riot-soloq.ts` prüft den lokal gespeicherten Pilotdatensatz
reproduzierbar und gibt nur aggregierte Zahlen aus. Alle 489 Zeilen sind
eindeutig und strukturell gültig; sie verteilen sich über Mai bis September und
zehn Patches. Eine beispielhafte zeitliche Trennung mit siebentägigen Lücken
ergibt lediglich 265 Trainings-, 32 Validierungs- und 60 Testspiele. Die
Validierung enthält ausschließlich Patch 16.17; der Test fast ausschließlich
16.18. Deshalb wurde daraus weder ein Solo-Queue-Wahrscheinlichkeitsmodell
trainiert noch eine neue Aussage in der App angezeigt. Die Details und der
Wiederholungsbefehl stehen im Ergebnisdaten-Bericht. Die Daten stammen von
Spielern einer EUW-Diamond-I-Leiterseite; der Rang aller zehn Teilnehmer pro
Match ist damit nicht belegt. Für größere, breiter geschichtete Kohorten ist
ein gültiger, privat gehaltener Riot-API-Schlüssel nötig.

Geprüft: sechs Research-Tests, TypeScript für Audit und Collector,
`git diff --check`; der Offline-Audit des vorhandenen Datensatzes meldet
0 Dubletten und 0 ungültige Spiele. Neue Sammlungen speichern nun Leiterseite,
Rangstufe, Division und Erhebungszeit pro Zeile als Herkunft der Stichprobe.

Die Champion-Suche im Strategy-Tab zeigt jetzt legale Picks ohne Rollenprofil
in einem eigenen Bereich. Sie verschwinden nicht mehr stillschweigend aus der
Auswahl und werden nicht in die heuristische Shortlist einsortiert. Karte und
Vorschau benennen die fehlende Evidenz; andere Teampläne bleiben sichtbar,
werden aber nicht dem unbewerteten Pick zugeschrieben. Der gezielte Test für
Suche, Bans und Rollenkonflikte ist grün (40 Tests in `strategyReview.test.ts`).
TypeScript, ESLint, Frontend-Produktionsbuild und `git diff --check` sind grün.
Neuer lokaler NSIS-Installer: `RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`,
5.801.449 Bytes, SHA-256 `5BB6C3CDB943AA1386BD28C70296FEE0511A3E04267B0546F3190F042C7B9DBA`.
Die bekannte Tauri-Warnung zur fehlenden `__TAURI_BUNDLE_TYPE`-Markierung
bleibt. Interaktive Sichtprüfung steht weiterhin aus.

Nutzerpräferenz für die weitere Arbeit: Die vorhandenen DraftGap-Datensätze
sind die primäre Statistikbasis. Keine Pflicht für den Nutzer, Tests,
Datensammlung oder einen Riot-API-Schlüssel zu organisieren. Der separate
Solo-Queue-Collector bleibt reine optionale Forschung. Als nächstes die
vorhandenen Champion-Rollen-, Duo- und Matchup-Werte im Pick-Vergleich besser
erklären, einschließlich Stichprobengröße und unbekannter Werte. Eine
kalibrierte Draft-Siegwahrscheinlichkeit wird aus dem bestehenden Rating
nicht abgeleitet.

Umsetzung: Die Kandidatenvorschau zeigt jetzt vorhandene DraftGap-Stichproben
direkt am Pick. Rollenwerte stammen vom aktuellen Patch, Duo- und Matchup-Werte
aus dem 30-Tage-Datensatz des aktiven Rangs. Prozentwerte tragen immer die
Spielzahl; Stichproben unter der eingestellten Mindestzahl werden markiert.
Die Auswahl priorisiert weiterhin bedingte Draftantworten und behandelt diese
deskriptiven Raten nicht als kausalen Pick-Effekt oder Prognose eines
unfertigen Drafts. Kein zusätzlicher Riot-API-Key und keine neue Erhebung sind
für dieses Feature nötig.

Geprüft: gezielter DraftGap-Evidenztest und Strategy-Tests (41 erfolgreich),
Frontend-TypeScript, gezielter ESLint-Lauf, `git diff --check` und neuer
Tauri-NSIS-Build. Aktueller Installer am selben Pfad:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`,
5.804.326 Bytes, SHA-256
`39DFBF7C608D6A663E97753282DFDAB5C9FFB0D0FCDD666FE6218AA2242702D3`.
Die Tauri-Bundle-Warnung besteht weiterhin; interaktive Sichtprüfung steht aus.

Gleicher-Slot-Vergleich erweitert: Die zwei Kandidaten zeigen nun ihre
DraftGap-Rollenstichproben direkt nebeneinander, auch solange der Draft offen
ist. Sobald beide Teams vollständig und legal sind, vergleicht die Vorschau
zusätzlich für beide Varianten den DraftGap-Rating-Index unter denselben
Gegnern und im selben Pick-Fenster. Fehlende Champions/Rollen im aktiven
Datensatz oder nicht endliche Modellwerte unterdrücken die Zahl. Das ist ein
Modellvergleich, keine kalibrierte Siegwahrscheinlichkeit oder kausale
Pick-Wirkung. Geprüft: 44 gezielte Tests, TypeScript, ESLint,
`git diff --check`, Frontend-Produktionsbuild und NSIS-Build. Neuer Installer
am selben Pfad: 5.804.252 Bytes, SHA-256
`749490341719320D895B4B8E0E46AF0E25CF6608216C04883FC73F0BDF9B2BF3`.
In den Matchup-Stichproben erscheint ein bekannter direkter Rollengegner vor
größeren Stichproben gegen andere Rollen; ungültige Raten werden verworfen.

Für vollständige Hauptdrafts gibt es jetzt zusätzlich einen aufklappbaren
DraftGap-Modell-Screen für den gewählten belegten Pick-Slot. Er hält die
anderen neun Picks und eindeutige Rollenbelegungen fest, respektiert Bans und
verfügbare Champions, bewertet legale Rollen-Ersatzpicks mit dem bestehenden
DraftGap-Modell und zeigt die drei höchsten Rating-Indizes. Jeder Treffer kann
in der Coach-Vorschau mit Theme, Farben und Gegenantworten geprüft werden.
Die Ansicht ist rückblickend und bildet weder ursprünglichen Informationsstand
noch künftige Draftzüge als optimales Spiel ab. Geprüft: 45 gezielte Tests,
TypeScript, ESLint, Frontend-Produktionsbuild, `git diff --check` und lokaler
NSIS-Build. Aktueller Installer am selben Pfad: 5.805.105 Bytes, SHA-256
`DFB6B485E14D490E1765D6B20395E0460761848D4482B3691FA17309D771684E`.
Der Modell-Screen zeigt zusätzlich das Rating des bisherigen Picks und die
Differenz jedes Ersatzpicks in Rating-Index-Punkten.
Unmittelbare Gegnerantworten zeigen nun, soweit vorhanden, DraftGap-Rollen-
und Matchup-Stichproben neben der taktischen Begründung. Diese deskriptiven
Daten bestimmen nicht die Wahrscheinlichkeit der tatsächlichen Gegnerwahl.

Fünf häufige Solo-Queue-Rollen erhielten vorläufige Coaching-Profile mit
offizieller Riot-Kit-Referenz: Thresh Support, Ornn Top, Lulu Support, Viego
Jungle und Zed Mid. Die Profile nennen Level-/Cooldown-Fenster, Voraussetzungen
und Gegenplay; sie beanspruchen weder Patch-Review noch einen belegten
Item-Build. `data:build:offline` exportierte sie in den Desktop-Snapshot und
die Datenbankintegrität wurde geprüft. Die Abdeckung im lokalen Solo-Queue-
Pilot steigt von 1.182 auf 1.389 der 3.410 Picks, im getrennten Profi-Audit
von 5.576 auf 5.977 der 13.810 Picks. Das ist nur Evidenz-Abdeckung, keine
Empfehlungsvalidierung. Die Detailansicht verlinkt Kit-Quellen und kennzeichnet
das Coaching als RiftTheory-Interpretation. DraftGap-Raten werden in der UI
jetzt zutreffend als rangbereinigt statt als rohe Winrates beschrieben.
Der abschliessende NSIS-Build fuer diesen Stand war erfolgreich. Installer:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.806.178 Bytes), SHA-256
`3894638EB0AF913AE0842F6742587A43BCB73DCA53E62BC5724D82879C4045CF`.
