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
bun run --filter @rifttheory/frontend build
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
   `bun run --filter @rifttheory/frontend serve --port 3011`.
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

Am 25. September wurden fuenf weitere vorlaeufige Rollenprofile fuer Syndra
Mid, Nami Support, Garen Top, Milio Support und Yunara Bot mit offiziellen
Riot-Kit-Links aufgenommen und offline exportiert. Der lokale Solo-Queue-Audit
zeigt damit 1.554 / 3.410 (45,6 %) und der getrennte Profi-Audit
6.820 / 13.810 (49,4 %) Picks mit Coaching-Profil. Das ist Abdeckung, keine
Validierung der Empfehlungen. Yunara Bot hat weiterhin keine Rollenfaehigkeits-
Evidenz. Der gespeicherte Champion-Snapshot ist 16.17.1; der Online-Patchcheck
meldet 16.19.1. Datenbankintegritaet, 102 Frontend/Core-Tests, Workspace-
TypeScript und `git diff --check` waren erfolgreich. Der interaktive Desktop-
Smoke-Test blieb offen, weil Computer Use keine Verbindung zum nativen Dienst
herstellen konnte. Der lokale NSIS-Build war erfolgreich. Installer:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.809.604 Bytes), SHA-256
`106E618C4F6F636E1DEEF604080E6BBECAD5271F398A8A70655279D7581A5BA3`.
Die bekannte Tauri-Warnung zur fehlenden `__TAURI_BUNDLE_TYPE`-Markierung bleibt.

Danach wurde Yunara Bot mit den eng begrenzten Rollenfaehigkeiten `poke` und
`wave_clear` ergaenzt. Der Eintrag verlinkt die offizielle Riot-Championseite
und bezeichnet die Tags als vorlaeufige RiftTheory-Interpretation; Engage,
Schutz oder ein Matchup-Urteil werden daraus nicht abgeleitet. Data Dragon ist
nun auf 16.19.1 aktualisiert. Aus dem oeffentlichen DraftGap-Datensatz wurden
852 Rollenstichproben fuer Patch 16.19 importiert; Yunara Bot hat dort
67.821 beobachtete Spiele (Emerald+, alle Regionen, Erhebung 25. September).
Der Online-Patchcheck zeigt keinen ausstehenden Patch mehr. Die historische
Evidenz-Abdeckung betraegt jetzt 3.099 / 3.410 im Solo-Queue-Pilot und
13.481 / 13.810 im Profi-Audit. Diese Audits validieren keine aktuelle
Empfehlung: Nur zehn Pilot-Picks und kein Profi-Pick stammen aus 16.19.
Datenbankintegritaet, 103 Frontend/Core-Tests, TypeScript, gezielter ESLint-Lauf
und lokaler NSIS-Build sind erfolgreich. Installer:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.829.159 Bytes), SHA-256
`668CD7146027E040C7F588A7C75C5DCDCFD221617104EA90B513F01FC0FED267`.
Die bekannte Tauri-Bundle-Warnung besteht. Eine interaktive Sichtpruefung ist
weiterhin offen, da der native Computer-Use-Dienst nicht erreichbar war.

Weiterer Coach-Durchgang am 25. September: Sieben vorlaeufige Coaching-Profile
fuer Talon Jungle, Karma Support, Pyke Support, Leona Support, Ryze Mid,
Rumble Top und Orianna Mid wurden mit Riot-Kit-Links exportiert. Die Profil-
Abdeckung steigt im lokalen Pilot auf 1.707 / 3.410 (50,1 %) und im Profi-
Audit auf 8.143 / 13.810 (59,0 %) beobachtete Picks. Die Tags und Profile
sind damit verfuegbar, aber nicht durch Matchergebnisse validiert. Die
Strategy-Evidenzansicht zeigt bei Rollenfaehigkeiten nun lesbare Quellenlabels
und vorhandene Links. Der vorhandene Profi-Backtest wurde reproduziert; sein
Spieler-/Team-Baseline-Modell bleibt besser als die getesteten Draftvarianten.
Eine Draft-Siegwahrscheinlichkeit wird weiterhin nicht ausgegeben. 103
Frontend/Core-Tests, TypeScript, ESLint, Datenbankintegritaet und `git diff
--check` sind gruen. Die interaktive Sichtpruefung scheiterte erneut an der
fehlenden Browser-/App-Anbindung; der lokale Produktionsserver startet.
Der neue lokale NSIS-Installer wurde erfolgreich gebaut:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.826.274 Bytes), SHA-256
`4D12B0233230B1528C95D8FD06D3AF9D77A9E746C2F649CB52B507A8F5093970`.
Die bekannte Tauri-Warnung zur Bundle-Markierung bleibt bestehen.

Naechster Draft-Coach-Schritt: Die chronologische Vorschau prueft jetzt die
gesamte unmittelbare Gegner-Pickphase als eine Antwort. B1 fuehrt zu R1+R2,
R1+R2 zu B2+B3 und R4 zu B4+B5; einzelne Antworten bleiben einzeln. Jede
angezeigte Doppelantwort hat eine legale gemeinsame Rollenbelegung, und
DraftGap-Stichproben werden fuer beide Picks getrennt gezeigt. Wenn danach vor
einer Banphase ein eigener Pick oder Doppelpick folgt, wird ein legaler,
heuristisch gewaehlter Fallback mit beantworteten Beduerfnissen angezeigt.
Die zweite Banphase stoppt diesen Pfad; nach ihr wird keine scheinbar sichere
Fortsetzung aus dem alten Zustand angezeigt. Die Ausgabe bleibt ein begrenzter
Szenario-Stresstest, keine optimale Draftsuche oder validierte Siegchance.
Ein Integrationstest prueft B1 -> R1+R2 -> B2+B3 mit dem ausgelieferten
Championpool auf legale Rollen und eindeutige Champions.
Verifiziert: 104 Frontend/Core-Tests, Workspace-TypeScript, gezielter ESLint,
`git diff --check` und lokaler NSIS-Build. Installer:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.831.748 Bytes), SHA-256
`DEC7CA103EF3922D958C82BF0DEB6E4B99E45A3061A4EEEEA7533091A111B62B`.
Die bekannte Tauri-Bundle-Warnung besteht; interaktive Sichtpruefung bleibt
wegen fehlender Browser-/App-Anbindung offen.

## Weiterarbeit am 26. September 2026

Der Pick-Order-Coach verfolgt fuer B3 und R3 nun auch die naechste eigene
Pickphase hinter den vier zweiten Bans. Ein begrenzter Stresstest nimmt die
fuehrende heuristische Wahl, laesst die zwei gegnerischen Bans nacheinander
jeweils einen Champion dieser Wahl treffen und sucht danach erneut eine legale
Wahl. Nach B3 geschieht dies pro angezeigter R3-Antwort; nach R3 ohne
vorherigen Gegnerpick. Eigene Zwischen-Bans und tatsaechliche Gegnerentscheidungen
bleiben offen. Die UI nennt diese Grenze und behauptet weder optimale Bans
noch eine gesicherte Fortsetzung.

Die gezielten Tests fuer Sequenz, zwei gegnerische Bans und legale Rollen wurden
ergaenzt und bestanden (4 Tests, 54 Assertions). Der Workspace-Typecheck war
ebenfalls erfolgreich. Die unsichtbare lokale Testanbindung brach beim Starten
von Bun mit `Transport closed` ab; nach ausdruecklicher Freigabe des Nutzers
wurde genau ein sichtbarer Befehlslauf fuer Tests und Typecheck verwendet.
Interaktive Sichtpruefung und ein neuer Installer stehen fuer diesen Stand aus.

Abschluss am 26. September: Die gesamte Frontend/Core-Suite bestand mit 104
Tests und 442 Assertions; Workspace-Typecheck, gezielter ESLint-Lauf,
Frontend-Produktionsbuild und `git diff --check` waren erfolgreich. Der aktuelle
NSIS-Installer wurde gebaut:
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
(5.831.665 Bytes), SHA-256
`A83BE07F26D85B8D1B0B1A82C0FBB10775D3594A24BB47AAE007C73A2BC45337`.
Die bekannte Tauri-Warnung zu `__TAURI_BUNDLE_TYPE` bleibt bestehen. Eine
interaktive native Desktop-Pruefung des neuesten Stands wurde nicht ausgefuehrt,
da der Nutzer die stoerenden Codex-Terminalfenster zuerst behoben haben wollte. Als
konkrete Ursache fuer wiederholte Starts am Turn-Ende wurde ein `notify`-Eintrag
in der persoenlichen Codex-Konfiguration gefunden, der
`codex-computer-use.exe` aufrief. Dieser Eintrag wurde entfernt und die
Originalkonfiguration im Temp-Verzeichnis gesichert; der Erfolg muss nach dem
naechsten Turn-Ende beobachtet werden.

Anschliessend wurde die gebaute Produktionsvorschau mit unsichtbarem Headless-
Chrome geprueft: Strategy-Tab oeffnet, Kandidatenliste wird gefuellt, Ashe-
Vergleich oeffnet und scrollt in den sichtbaren Bereich. Auf 1440 x 1000 und
390 x 844 wurde das Layout aufgenommen; bei 390 Pixeln gab es keinen
Dokument-Seitenueberlauf. Die konkrete B3/R3-Banphase wurde in diesem
ersten Browser-Smoke-Test nicht durchgeklickt; ihre Reihenfolge, legalen
Antworten und erneute Auswahl nach zwei Ziel-Bans waren zu diesem Zeitpunkt
durch die gezielten Logiktests abgedeckt.

Abnahme-Durchlauf danach: In der Produktionsvorschau und in der frisch gebauten
nativen Windows-EXE wurden alle zehn chronologischen Slots B1-B5/R1-R5 mit
einer legalen schrittweise aufgebauten Beispielbelegung geoeffnet. Jede
Slot-Ansicht zeigte den erwarteten Pick-Order-Coach und eine oeffnende
Kandidatenvorschau; bei keinem Slot trat Dokument-Seitenueberlauf bei 1440 px
auf. Die Doppelpick-Fenster R1+R2, B2+B3 und B4+B5 sowie die unmittelbaren
Gegnerantworten entsprachen der Draft-Reihenfolge. B2, B3 und R3 zeigten die
zweite Banphase; R3 zeigte zwei Ziel-Bans und eine neu berechnete legale Wahl.
Die native B3-Ansicht wurde zusaetzlich als Screenshot kontrolliert: drei
R3-Antwortzweige, je zwei Ziel-Bans und danach neu berechnete B4+B5-Picks waren
lesbar. Der Durchlauf nutzte die `RIFTTHEORY_DEBUG`-Schnittstelle
zum Setzen der Beispielpicks und klickte die Kandidatenvorschau in der UI. Er
prueft damit die gerenderten Strategy-Ablaufe, aber keine Installation des NSIS-
Pakets oder manuelle Maus- und Tastatureingaben an einem sichtbaren Fenster.

## Stand nach Antwort-Screen und Umbenennung (2026-09-26)

Der Strategy-Vergleich prueft zwei Picks im selben Slot nun auch gegen bis zu
drei legale heuristische Gegnerantworten. Liegt vor der naechsten Banphase noch
eine eigene Wahl, wird ein legaler Ersatzzug gezeigt. Ein Vorteil wird nur bei
vollstaendiger, strukturell dominierender Evidenz behauptet; sonst bleibt das
Ergebnis offen. Das ist ein begrenzter Screen, kein geloester Minimax-Baum und
keine kalibrierte Gewinnwahrscheinlichkeit. Doppelpick-Kandidaten behalten
jetzt Vertreter aus allen Rollen, statt durch ein globales Top-12-Limit
gueltige Paare zu verlieren.

Die App-Anzeige, FAQ, Download-Dialog, Workspace-Pakete, Imports und interne
Debug-Kennung verwenden RiftTheory. Die Download-Seite zeigt auf die
RiftTheory-Releases. Externe Dataset-URLs, Quellmetadaten und Lizenzhinweise
benennen weiterhin die tatsaechliche Upstream-Quelle. Nach der Umbenennung:
95 Frontend-Tests, Typecheck aller vier Pakete, Quellcode-ESLint ohne Fehler,
Produktions-Build und NSIS-Build erfolgreich. Die Produktionsvorschau zeigte
B1- und B3-Antwortvergleiche sowie B3-Ban-Fallbacks ohne Seitenueberlauf.
Der Installer wurde unter
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.10_x64-setup.exe`
erneut erstellt. Die bekannte Tauri-Warnung zu `__TAURI_BUNDLE_TYPE` bleibt.

## Live-Rollenwechsel (2026-09-26)

Ein gesperrter Champion konnte bisher nicht direkt von Jungle auf Mid
umgestellt werden: Der erste Klick hob nur die Sperre auf; der LCU-Poll setzte
die automatisch zugewiesene Rolle anschliessend wieder ein. Die Pick-Karte
zeigt jetzt alle fuenf Rollen und erlaubt einen direkten Wechsel. Manuelle
Vorgaben bleiben fuer denselben Champion und Slot waehrend der laufenden
Champ Select erhalten. Bei Champion- oder Sessionwechsel verfallen sie.
Gezielte Tests pruefen wiederholte LCU-Zuweisungen, Entsperren und Wechsel.
In der gebauten Weboberflaeche wurde Ekko in R1 von Jungle auf Mid geklickt.
Die vollstaendige Frontend-Suite meldete danach 97 erfolgreiche Tests; der
Windows-Installer wurde fuer Version 3.2.11 unter
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`
erstellt.

## Response Tree v1 (2026-09-27)

`apps/frontend/src/utils/draftResponseTree.ts` enthält einen reinen, deterministischen
Draftzustand mit Patch, Kontext, Rang, Region, expliziter First-Pick-Seite,
Aktionscursor, Picks, Bans, Rollen, Pool, Ownership und serienbedingten
Sperren. Ein Zustandsübergang verwirft falsche Reihenfolge, Dubletten,
gesperrte, nicht verfügbare und rollenunmögliche Picks. Die Live-Snapshot-
Sperren stammen weiter aus `strategyLiveDraft.ts` und `core/live-draft/series.ts`;
Team Fearless, Global Fearless, Ironman und Side Swap sind dort getestet.

Die Suche nutzt die bestehende `strategyOptions`-Evidenz als begrenzten
Kandidaten- und Ban-Target-Screen. Sie verfolgt pro gewähltem Einzel- oder
Doppelpick legale Aktionen bis zum nächsten abgeschlossenen eigenen
Pick-Fenster; B3 und R3 laufen durch alle vier zweiten Bans. Für zwei
Alternativen entstehen aus demselben Zustand Principal Variations. Die UI zeigt
die Aktionsfolge, verbleibende Needs und Pläne, Ressourcen- und Damage-Read,
Abdeckung, Such-ID, Tiefe, Knoten, abgeschnittene Shortlist-Äste und einen
konservativen Dominanzentscheid. Bei fehlender Evidenz oder Trade-offs bleibt
das Urteil offen. Der frühere Drei-Antwort-Vergleich wird in der
Vergleichskarte durch diesen Pfad ersetzt; die bestehenden allgemeinen
Antwort- und Ban-Szenarien bleiben erhalten.

Geprüft: `bun test` im Frontend (114 Tests, 608 Assertions),
gezielter Response-Tree-Test (4 Tests, 119 Assertions),
`bun run typecheck`, `bunx eslint src` (0 Fehler, bestehende Warnung in
`DraftPrepCalendar.tsx:42`), und Frontend-Produktionsbuild. Der Build meldet
weiter die bekannte Warnung für einen großen JavaScript-Chunk. Desktopcode
war nicht betroffen; ein neuer Tauri/NSIS-Build wurde nicht ausgeführt.
Die lokale Produktionsvorschau startete, aber die Computer-Use-Umgebung meldete
keine verfügbaren Browser oder Apps. Daher fehlt für diesen Stand ein
interaktiver Smoke-Test auf B1/B3/R3/R5 und schmaler Breite.

Grenzen: Die Ban-Ziele kommen aus einem einzelnen heuristischen Pick-Screen.
Die Suche betrachtet nur eine kleine Pick-Beam und keinen vollständigen
Draftbaum; der Knoten-Cap kann Linien als `unresolved` beenden. Rating-Index,
Matchups und Comfort werden nicht zu einem kalibrierten Outcome-Wert
vermischt. Pool-Comfort-Daten fehlen weiterhin; die Suche behauptet dazu
nichts. Nächster Schritt mit größtem Produktwert: die Suche in einen Worker
verlagern, Ban- und Pick-Branches anhand derselben mehrdimensionalen
Evidenz verlässlich breiter screenen und die vier UI-Smoke-Slots interaktiv
prüfen.

## Optionale Spielerpools (2026-09-27)

`packages/core/src/draft/player-pool.ts` modelliert Spieler, mögliche Rollen,
explizit verfügbare Champions, gemeldeten Comfort, Quelle, Datum und
Confidence. Eine fehlende Verfügbarkeitsliste bedeutet unbekannt und
schränkt den Draft nicht ein. Eine eingetragene Liste begrenzt legale Picks
für diesen Spieler hart. Flex-Picks prüfen weiterhin mögliche Rollen und
benötigen verschiedene Spieler für verschiedene Picks.

Im Strategy-Tab können Blue und Red ihre Solo-Queue-Spielerprofile optional
eingeben. Namen werden gegen den aktiven Champion-Datensatz aufgelöst;
unbekannte Namen werden gemeldet. Die Daten bleiben lokal gespeichert und
werden beim Wechsel von Draft, Rolle, Pool oder Datensatz in der Vorschau
neu berücksichtigt. `strategyOptions`, der Response Tree und der rückblickende
Replacement-Screen beachten eingetragene Verfügbarkeit. Der Coach zeigt
gemeldeten Comfort getrennt an, ohne daraus einen nicht validierten Bonus
oder eine statistische Aussage zu machen. Live-Serien-Snapshots verwenden
die lokalen Solo-Queue-Profile nicht, weil die Teamidentität nach Side Swap
anders sein kann.

Grenzen: Es gibt noch keinen Import verifizierter Profi-Roster oder
Spielerhistorien und keine aus Spielen abgeleitete Comfort-Schätzung. Die
Profile sind manuelle Selbstauskünfte. Der nächste produktive Schritt ist
ein interaktiver UI-Smoke-Test der Pool-Eingabe und der vier kritischen
Draft-Slots; danach die Suche in einen Worker auslagern.

Verifikation dieses Schritts: Frontend `bun test` 116 Tests / 611 Assertions,
Core `bun test` 11 Tests / 22 Assertions, Workspace-Typecheck und
Frontend-Produktionsbuild erfolgreich. `bunx eslint src` hat null Fehler;
der bestehende Hinweis in `DraftPrepCalendar.tsx:42` bleibt. Der Build meldet
weiter den großen Haupt-Chunk. Ein interaktiver Browser ist in der aktuellen
Computer-Use-Umgebung weiterhin nicht verfügbar.

## Response Tree im Worker (2026-09-27)

Die zwei Principal Variations werden nun in
`apps/frontend/src/workers/draftResponseTree.worker.ts` berechnet. Der
Strategy-Tab erstellt eine reproduzierbare Request-ID aus Draftzustand,
Pool, Datensatz, Config und beiden Kandidaten. Bei Änderung wird der laufende
Worker beendet; ein altes Ergebnis wird nicht mehr gerendert. Während der
Suche erscheint ein Status, bei Worker-Fehler ein sichtbarer Fehlertext.
Ein gezielter Test prüft Abbruch und Stale-Result-Filter.

Verifikation: Frontend `bun test` 118 Tests / 618 Assertions, Workspace-
Typecheck und Produktionsbuild erfolgreich. Vite erzeugte ein separates
`draftResponseTree.worker`-Bundle. Nach dem finalen Lint-Fix meldete der
gezielte ESLint-Lauf für die geänderten Worker-/Strategy-Dateien null
Warnungen. Der projektweite Lint meldete zuvor den bestehenden Hinweis in
`DraftPrepCalendar.tsx:42` und einen inzwischen behobenen Hinweis in
`StrategyWorkspace.tsx`. Kein Desktopcode wurde in diesem Schritt geändert.
Die Browser-/App-Inventur der Computer-Use-Umgebung war erneut leer. Die
lokale Produktionsvorschau startete auf Port 3011, aber auch das Öffnen eines
sichtbaren In-App-Browsers meldete `Browser is not available: iab`.
Der interaktive UI-Smoke-Test bleibt deshalb offen.

## Suchabdeckung und Abbruchgründe (2026-09-27)

Die Search-Ausgabe trennt nun die Anzahl unterstützter Aktionsmöglichkeiten
von den tatsächlich expandierten Aktionen. `pruned` zählt die ausgelassenen
unterstützten Möglichkeiten über alle besuchten Knoten, einschließlich der
von der bestehenden Kandidaten-Shortlist entfernten Champions. Ein Pfad
speichert ausdrücklich `window_complete`, `draft_complete`, `node_cap` oder
`no_supported_action`. Beim Knotenlimit oder ohne unterstützte Fortsetzung
bleibt sein Urteil `unresolved`; die UI zeigt keine fertige Why-now-
Begründung aus diesem Teilpfad. Gezielt getestet wurden beide Abbruchfälle,
die Zählkonsistenz und weiterhin alle zehn Slots.

Verifikation: Frontend `bun test` 119 Tests / 643 Assertions,
Workspace-Typecheck, `bunx eslint src` (0 Fehler, nur bestehender Hinweis in
`DraftPrepCalendar.tsx:42`) und Frontend-Produktionsbuild erfolgreich. Die
bekannte Chunkgrößenwarnung bleibt. Desktopcode war nicht betroffen.

## Entscheidungskarte und Deckvergleich (2026-09-27)

Der Strategy-Tab startet die Worker-Suche für die führende unterstützte Wahl
und eine Alternative bereits am aktuellen Slot. Die oberste Entscheidungskarte
zeigt den konservativen Dominanzstatus, den gespeicherten Antwortpfad,
Kit-Abdeckung und die Such-ID; Details bleiben in der Pick-Vorschau. Ein
`unresolved`-Urteil wird nicht als Gewinnwahrscheinlichkeit dargestellt.

`strategyDeckComparison.ts` liest für beide Seiten nur die bereits aufgelösten
Rollenprofile und den vorhandenen Teamplan. Eine aufklappbare Gegenüberstellung
zeigt dokumentierte Werkzeuge, Kernakteure, nicht belegten Anschluss an den
Kernplan, Damage, Einkommen, Power-Kurven, Flex, nächste Need und
Gegenantwort. Unbekannte Tools bleiben `Unconfirmed`; fehlende Tags gelten
nicht als Abwesenheit. Farben und Quellen bleiben im angrenzenden Teamplan
sichtbar. Konkrete gemeinsame Ultimate- oder Item-Fenster erfordern weiterhin
Matchup- und Spielsituationsdaten und werden hier nicht erfunden.

Beim Audit wurden zwei Legalitätsfälle geschlossen: Bans müssen jetzt auf
Champions im aktiven Pool zielen; eine explizit leere Ownership-Menge erlaubt
keinen Pick. Der Fingerprint berücksichtigt zusätzlich die tatsächlichen
Kit-/Coaching-/Profilinhalte und eine abweichende Aktionssequenz, damit neue
Evidenz bei gleicher Datensatz-ID ein altes Worker-Ergebnis invalidiert.

Verifikation: Frontend `bun test` 121 Tests / 657 Assertions, Workspace-
Typecheck, `bunx eslint src` (0 Fehler, nur bestehende Solid-Warnung in
`DraftPrepCalendar.tsx:42`) und Frontend-Produktionsbuild erfolgreich. Der
Build erzeugt den separaten Worker und meldet weiterhin den großen Haupt-
Chunk. Kein Desktopcode wurde für diesen Schritt geändert. Der interaktive
UI-Smoke-Test für B1/B3/R3/R5 und ein schmales Fenster bleibt offen, weil die
Computer-Use-Umgebung keine Browser- oder App-Oberfläche anbietet.

Nächster Produktwert: die Ban- und Pick-Beam mit einer expliziten
mehrdimensionalen Branch-Auswahl erweitern. Der jetzige adversariale Pfad
screened nur eine kleine heuristische Auswahl; insbesondere ein nicht
gescreenter Ban kann die angezeigte Fortsetzung ändern.

## Branch-Auswahl mit offengelegten Trade-offs (2026-09-27)

Die Response-Suche wählt innerhalb ihrer Pick-/Ban-Beam nun per
mehrdimensionaler Dominanz über Needs, Pläne, Flex, Kit-Abdeckung, Damage und
Ressourcen. Wenn keine untersuchte Fortsetzung die anderen eindeutig
dominiert, verwendet sie einen stabilen Tie-Break nur für den angezeigten
Pfad. Die abweichenden Dimensionen werden als `branchTradeoffs` gespeichert,
der Pfad bleibt `unresolved`, und der Strategy-Tab unterdrückt daraus eine
Why-now-Behauptung. Bei lückenhafter Evidenz wird ebenfalls keine Dominanz
abgeleitet. Ein gezielter Test prüft die Richtung der adversarialen Auswahl,
echte Trade-offs und fehlende Evidenz.

Ein Test mit `banBeam: 2` und `maxNodes: 256` geht reproduzierbar und legal
durch die zweite Banphase. Die Produktionskonfiguration bleibt vorerst bei
`banBeam: 1`, bis Laufzeit und Abdeckung auf dem echten Datensatz gemessen
sind. Die UI beschreibt die gezeigte Gegnerlinie deshalb als gescreenten
adversarialen Ast und kennzeichnet einen offenen Branch-Vergleich.

Verifikation nach diesem Schritt: Frontend `bun test` 123 Tests /
668 Assertions, Workspace-Typecheck, `bunx eslint src` (0 Fehler, weiterhin
eine bestehende Warnung in `DraftPrepCalendar.tsx:42`) und Frontend-Build
erfolgreich. Der neue gezielte Suchtest wurde nach der abschließenden
Typkorrektur erneut ausgeführt (8 Tests / 162 Assertions); der breitere
Ban-Beam besucht nachweislich mehr Knoten als der schmale Lauf.

Die oberste Entscheidungskarte zerlegt den gespeicherten Suchpfad nun in
Gegneraktion, eigene Fortsetzung und verbleibende Needs/Ressourcen; die
verglichene Alternative steht direkt daneben. Bei B3 enthält die Antwort
sowohl Picks als auch zwei gegnerische Bans, was der Pfadtest ausdrücklich
prüft. Nach dieser UI-Ergänzung: Frontend `bun test` 123 Tests /
672 Assertions, Typecheck, gezielter ESLint und Produktionsbuild erfolgreich.

## Breiterer Gegner-Ban-Screen und Benchmark (2026-09-27)

`apps/frontend/scripts/benchmark-response-tree.ts` misst alle zehn Slots
reproduzierbar mit den 172 Champions, für die der ausgelieferte
Wissens-Snapshot nutzbare Rollenfähigkeiten enthält. Der Benchmark erzeugt
synthetische, legale Vor-Picks; er misst **nicht** den live geladenen
Rang-Datensatz oder reale Draft-Häufigkeiten. Beim Lauf am 27.09.2026 lag
die breitere B3-Linie mit `pickBeam: 2`, zwei Gegner-Ban-Zielen und
`maxNodes: 256` bei 139 Knoten und etwa 0,4 Sekunden pro Kandidat. R3 lag
bei 18 Knoten und etwa 0,07 Sekunden. Keine der zehn gemessenen Linien
erreichte den Knoten-Cap. Diese Einzelmessung ist keine Laufzeitgarantie.
Mit `--ranked` lädt dasselbe Script den validierten Emerald+-Current-Patch-
Datensatz der App. Der Lauf am 27.09.2026 verwendete Version `16.19.1`
mit 173 Champions im aktiven Rollenpool; die breite B3-Linie brauchte
139 Knoten und etwa 0,33 bis 0,45 Sekunden, R3 18 Knoten und etwa
0,06 bis 0,08 Sekunden. Auch hier erreichte keiner der zehn Slots den
Knoten-Cap. Das sind synthetische Vor-Drafts auf echten Rollenstichproben,
kein repräsentativer Lasttest über Match-Häufigkeiten oder Hardware.

Die Produktionskonfiguration nutzt diese Begrenzung jetzt. Eigene Bans
bleiben bei einem unterstützten Ziel, gegnerische Bans können zwei Ziele
verzweigen. Diese asymmetrische Breite verhindert in der gemessenen B3-Linie
den vorherigen Abbruch bei 256 Knoten. Die UI nennt die getrennten Breiten
und zeigt weiterhin Knoten, ausgelassene Möglichkeiten und offene
Trade-offs. Ein Legalitätstest spielt die breitere Suche für alle zehn Slots
mit Blue und Red als First Pick nach; ein Doppelpick-Test prüft, dass bereits
festgelegte Picks nicht als späterer Fallback erscheinen.

Der Fingerprint unterscheidet jetzt auch `owned: undefined` (Ownership
unbekannt) von einer explizit leeren Ownership-Menge (kein legaler Pick).
Computer Use meldete bei der erneuten Inventur wieder `apps: []` und
`browsers: []`. Ein interaktiver UI-Smoke-Test für B1/B3/R3/R5 und ein
schmales Fenster ist deshalb weiterhin nicht als bestanden dokumentiert.
Die lokale Vite-Produktionsvorschau startete auf Port 3011; sowohl Chrome
als auch der sichtbare In-App-Browser meldeten beim Öffnen ausdrücklich
`Browser is not available`.
Ein versuchter Solid-SSR-Test wurde entfernt, weil Bun die TSX-Datei in
diesem Testsetup mit einem React-JSX-Transform lädt; er wäre kein valider
UI-Nachweis gewesen.

Verifikation: Frontend `bun test` 125 Tests / 830 Assertions, Workspace-
Typecheck, `bunx eslint src scripts/benchmark-response-tree.ts` (0 Fehler,
eine bestehende Warnung in `DraftPrepCalendar.tsx:42`) und
Frontend-Produktionsbuild erfolgreich. Der Build meldet weiterhin einen
großen Haupt-Chunk. Desktopcode wurde in diesem Schritt nicht geändert.
Nächster Schritt: echte UI-Smokes auf einer verfügbaren Oberfläche und
danach Laufzeitprofile über mehrere häufige Draftzustände und Geräte,
bevor die Suche noch weiter verbreitert wird.

## Erklärungstreue und leere Ownership (2026-09-27)

Der Response Tree behandelt eine ausdrücklich leere Ownership-Menge nun
bereits am Kandidaten-Screen als null unterstützte Möglichkeiten. Die
Zustandsübergänge hatten solche Picks schon blockiert; die angezeigte
Abdeckung meldet sie jetzt ebenfalls nicht mehr als mögliche Antwort.
Fehlende Ownership-Daten bleiben als `undefined` provider-neutral.

Die zwei Principal Variations erzeugen jetzt strukturierte
`ComparisonReason`-Einträge. Die Pick-Vorschau zeigt nur Dimensionen, die
sich in den gespeicherten Pfaden tatsächlich unterscheiden: eigene und
gegnerische Needs/Pläne, Rollenbelegungen, Kit-Abdeckung, Damage,
Ressourcen, Evidenzunsicherheit und Suchstatus. Lange Vergleiche öffnen
weitere Unterschiede progressiv. Ein Test prüft, dass die Reason-Werte
direkt den Bewertungsvektoren entsprechen und auch gegnerische
Unterschiede nicht unterschlagen werden. Die Texte geben weiterhin keine
kalibrierte Win Probability aus.

Verifikation: Frontend `bun test` 126 Tests / 838 Assertions,
Workspace-Typecheck, `bunx eslint src scripts/benchmark-response-tree.ts`
(0 Fehler, bestehende Warnung in `DraftPrepCalendar.tsx:42`) und
Frontend-Produktionsbuild erfolgreich. Der große Haupt-Chunk bleibt eine
Build-Warnung; Desktopcode war nicht betroffen. Interaktive UI-Smokes
bleiben wegen der nicht verfügbaren Browser-/App-Oberfläche offen.

## Live-Banphase als Zustandsgrenze (2026-09-27)

`strategyResponseState.ts` bildet den sichtbaren Pick-Slot nun außerhalb der
UI auf einen reinen `DraftState` ab. Im Live-Snapshot ist `ally` immer die
aktuelle Blue-Seite und `opponent` Red; Teamnamen und Serien-Sperren werden
bei Side Swap durch `captureStrategyGame` den aktuellen Seiten zugewiesen.
Ein Test prüft die Zuordnung der Sperren nach Side Swap sowie Ownership und
Spielerpools im normalen Draft.

Während `pendingBans` wahr ist, nennt der Live-Snapshot bereits den Pick
nach der zweiten Banphase. Eine Suche ab diesem Pick würde vier noch offene
Bans überspringen. Der Adapter gibt deshalb bis zum Abschluss der Bans
keinen Response-Tree-Request frei; die UI zeigt dafür einen Status und
kennzeichnet die weiter sichtbaren Pick-Optionen als vorläufig. Nach
aktualisiertem Live-Snapshot startet der Tree aus dem dann gültigen Pool.
Der Test hält diesen Abbruch explizit fest. Ein vollständiger Banphase-
Startbaum aus dem aktuellen Ban-Slot bleibt ein weiterer Suchschritt.

Verifikation: Frontend `bun test` 129 Tests / 848 Assertions, Workspace-
Typecheck, `bunx eslint src scripts/benchmark-response-tree.ts` (0 Fehler,
eine bestehende Warnung in `DraftPrepCalendar.tsx:42`) und Frontend-
Produktionsbuild erfolgreich. Keine Desktopdatei wurde in diesem Schritt
geändert. Der interaktive UI-Smoke-Test bleibt mangels verfügbarer Browser-
oder App-Oberfläche offen.

## Live-Ban-Szenarien bis zum nächsten Pick (2026-09-27)

Der Live-Snapshot speichert jetzt die tatsächlich nächste Draftaktion als
`pendingAction`. `pendingBanDraftState` prüft, ob diese Aktion ein Ban ist
und ob der nächste Pick zum sichtbaren Slot passt. Ältere Snapshots ohne
diese Information bleiben lesbar, zeigen aber keine erfundene Ban-Folge.

`searchPendingBans` geht vom offenen Ban-Slot legal und deterministisch
durch die restlichen Bans bis zum nächsten Pick. Die Suche screent bis zu
zwei Gegner-Ban-Ziele und ein eigenes Ban-Ziel je Schritt, mit einem Cap
von 64 Knoten. Pro Ban-Pfad zeigt sie zwei führende unterstützte
Pick-Optionen aus dem dann verbleibenden Pool, die Zahl weiterer
unterstützter Optionen, ausgelassene Ban-Ziele, Such-ID und Abbruchstatus.
Es sind Szenarien, keine Vorhersagen der Gegneraktion oder Beweise für
den besten Pick. Der normale Response Tree startet weiterhin erst nach
den tatsächlich abgeschlossenen Bans.

Gezielte Tests spielen alle vier zweiten Bans nach und prüfen legale
Folge-Picks, Serien-Sperren, Knotenlimit und den nächsten Slot. Auf dem
aktiven Emerald+-Datensatz `16.19.1` benötigte der Ban-Screen im
synthetischen R4-Vorzustand 9 Knoten und etwa 45–47 ms; er ergab vier
bedingte Pfade ohne Abbruch. Der erweiterte Benchmark mit 30 synthetischen
Vor-Drafts (drei Varianten je Slot) meldete für die Produktkonfiguration
`pickBeam 2 / opponentBanBeam 2 / maxNodes 256` eine P95-Laufzeit von
273 ms, maximal 518 ms und keinen Knoten-Cap. Diese Messung stammt von
diesem Gerät und ist keine Garantie für andere Geräte oder häufige reale
Drafts.

Nächster Abnahmeschritt bleibt der interaktive UI-Smoke-Test für
B1/B3/R3/R5, die laufende zweite Banphase und ein schmales Fenster auf
einer verfügbaren Browser-/App-Oberfläche. Ein unabhängiger Future-Patch-
Outcome-Test fehlt weiterhin; daher keine kalibrierte Win Probability.

Abschlussprüfung dieses Schritts: Frontend `bun test` 130 Tests /
907 Assertions, `bun run typecheck` für alle vier Workspace-Pakete,
`bunx eslint src scripts/benchmark-response-tree.ts` ohne Fehler
(eine bereits bestehende Solid-Warnung in `DraftPrepCalendar.tsx:42`),
Frontend-Produktionsbuild und `git diff --check` erfolgreich. Der Build
meldet weiterhin den großen Haupt-Chunk. Desktopcode wurde in diesem
Schritt nicht geändert; ein neuer Tauri/NSIS-Build war deshalb nicht nötig.

## Ban-Szenarien im Worker (2026-09-27)

Die bedingte Ban-Suche läuft jetzt ebenfalls im bestehenden Response-Worker.
Ein eigener Request-Fingerprint enthält Draftzustand, Pool, Datensatz und
Suchkonfiguration. Beim Wechsel des Zustands wird der laufende Worker
beendet; die UI rendert nur Ergebnisse mit der aktuellen ID und zeigt
während der Berechnung einen Status. Ein Test prüft Abbruch und veraltete
Ergebnisse nach einem Datensatzwechsel.

Geprüft: Frontend `bun test` 131 Tests / 913 Assertions, Typecheck aller
vier Workspace-Pakete, `bunx eslint src scripts/benchmark-response-tree.ts`
mit null Fehlern (bestehende Solid-Warnung in `DraftPrepCalendar.tsx:42`)
und Frontend-Produktionsbuild. Der Build enthält das Worker-Bundle und
meldet weiterhin den großen Haupt-Chunk. Desktopcode wurde nicht geändert.
Die Computer-Use-Inventur meldete erneut `apps: []`, `browsers: []`;
ein interaktiver UI-Smoke-Test kann in dieser Umgebung noch nicht als
bestanden gelten.

## Entscheidung zuerst und Desktop-Abnahme (2026-09-27)

Die aktuelle Entscheidungskarte und die bedingten Ban-Szenarien stehen im
Strategy-Tab nun direkt nach den Draft-Slots und vor Teamplan,
Deckvergleich und Detailansicht. Die DOM-Reihenfolge entspricht damit
der gewünschten Lesereihenfolge. Die vorhandene Suche und ihre
Evidenzgrenzen wurden dabei nicht verändert.

Nach dieser Änderung: Frontend `bun test` 131 Tests / 913 Assertions,
Typecheck aller vier Pakete, `bunx eslint src scripts/benchmark-response-tree.ts`
ohne Fehler (die bestehende Solid-Warnung in `DraftPrepCalendar.tsx:42`)
und `git diff --check` erfolgreich. Der finale Tauri/NSIS-Build erzeugte
`apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`.
Die CLI meldete dabei `__TAURI_BUNDLE_TYPE variable not found in binary`;
laut Meldung könnte das den Updater dieses Pakets betreffen. Der große
Frontend-Chunk bleibt eine separate Build-Warnung.

Der interaktive Smoke-Test für B1/B3/R3/R5, laufende Bans und ein schmales
Fenster ist weiterhin offen. Die lokale Vite-Vorschau lief auf Port 3011,
aber Computer Use meldete `apps: []`, `browsers: []`; sowohl der sichtbare
In-App-Browser als auch Chrome antworteten mit `Browser is not available`.
Die Vorschau wurde danach gestoppt. Eine Sicht- oder Tastaturprüfung wird
daher nicht als bestanden behauptet.

Nach erneuter Prüfung: `cargo test --locked` im Tauri-Projekt bestand mit
zwei Tests für die LCU-Credential-Erkennung. Die lokale Kombination ist
`tauri-cli 2.11.4`, Rust-`tauri 2.9.5` und `tauri-utils 2.8.1`.
Ein Versionswechsel wurde ohne belegten Fix der Bundle-Typ-Warnung nicht
vorgenommen. Die UI-Inventur blieb leer; für den abschließenden
interaktiven Smoke-Test wird eine erreichbare Browser- oder App-Oberfläche
benötigt.

## Interaktiver B1-Smoke im Projekt-Build (2026-09-27)

Über den Windows-App-Zugriff wurde der frisch gebaute
`src-tauri/target/release/RiftTheory.exe` als eigenes Fenster gestartet;
der Prozesspfad wurde von den zwei installierten AppData-Fenstern
unterschieden. Im Strategy-Tab war B1 im leeren Draft sichtbar:
Entscheidungskarte direkt nach den Slots, Ashe als gescreente Wahl,
Jhin als Alternative, Blitzcrank/Anivia als Gegnerantwort sowie
Aurelion Sol/Alistar als eigene Fortsetzung. Die vollständige
gescreente B1→R1→R2→B2→B3-Folge wurde angezeigt. Das Urteil blieb
ausdrücklich `unresolved`, ohne Win-Probability-Behauptung.

Ein Wechsel zu B3 zeigte korrekt den retrospektiven Zustand ohne
chronologische Empfehlung, da die vorherigen Picks noch leer waren.
Für einen echten B3/R3/R5-Smoke müssen die Vor-Picks im Testdraft
gesetzt werden. Während dieser Vorbereitung wurde das Projektfenster
minimiert; Windows Computer Use meldete wiederholt gleichzeitige
Nutzereingaben und verweigerte die weitere Aktivierung. Die übrigen
Slots und das schmale Fenster sind daher noch nicht interaktiv
abgenommen. Der Nutzer wurde gebeten, genau das Projekt-Build-Fenster
im Vordergrund bereitzustellen.

## Erneuter Abnahmeversuch (2026-09-28)

Der Windows-App-Zugriff meldet trotz erneutem Verbindungsversuch
`Computer Use native pipe is unavailable`; die zweite UI-Inventur zeigt
`apps: []`, `browsers: []`. Das geöffnete Projektfenster ist für die
Automatisierung damit derzeit nicht erreichbar. B3, R3, R5 und die
schmale Fensterbreite bleiben interaktiv ungeprüft. Eine Sichtprüfung
wird nicht aus Code- oder Testresultaten abgeleitet.

Ohne Quellcodeänderung erneut geprüft: Frontend `bun test` mit 131
bestandenen Tests und 913 Assertions, Typecheck aller vier Pakete sowie
`git diff --check` erfolgreich. Die CSS-Durchsicht ergab keinen
hinreichend belegten Darstellungsfehler für eine Änderung ohne UI-Befund.

## Such-ID bei geänderter Pick-Evidenz (2026-09-28)

Der Response-Fingerprint enthält jetzt Namen und dieselben relevanten
Evidenzfelder für bereits gesetzte Picks wie für den Kandidatenpool.
Zuvor konnten sich Namen oder Evidenz eines gesetzten Picks ändern,
ohne die Such-ID zu ändern. Der Worker-Client hätte dadurch ein altes
Ergebnis weiterhin als aktuell ansehen können. Ein Regressionstest
prüft beide Fälle und schlug vor der Korrektur fehl.

Geprüft: Frontend `bun test` 131 Tests / 915 Assertions, Typecheck aller
vier Pakete, `bunx eslint src scripts/benchmark-response-tree.ts` mit
null Fehlern (bestehende Solid-Warnung in `DraftPrepCalendar.tsx:42`),
Frontend-Produktionsbuild und `git diff --check` erfolgreich. Der große
Haupt-Chunk bleibt eine Build-Warnung. Kein Desktopcode wurde geändert.
Der interaktive Smoke-Test für B3/R3/R5 und schmales Fenster bleibt wegen
der nicht erreichbaren Computer-Use-Verbindung offen.

## Abnahmeversuch am 29. September 2026

Der vorhandene Arbeitsbaum wurde auf dem aktuellen Stand belassen. Der native
Computer-Use-Zugriff scheiterte bei `sky.list_apps()` zweimal mit
`Computer Use native pipe is unavailable: failed to connect native pipe:
Das System kann die angegebene Datei nicht finden. (os error 2)`.
Die zweite Computer-Use-Oberfläche meldete `apps: []`, `browsers: []`;
direktes Öffnen der lokalen Vorschau in `iab` und `chrome` endete jeweils
mit `Browser is not available`. Die Produktionsvorschau lieferte unter
`http://127.0.0.1:3011/` HTTP 200, war aber nicht interaktiv erreichbar.
Deshalb sind B3, R3, R5 mit vollständigen Vor-Picks, die laufende zweite
Banphase, das schmale Fenster, Tastaturfokus und aufklappbare Details in der
UI weiterhin **nicht abgenommen**. Es wurde kein UI-Erfolg aus reinen
Code- oder Logiktests abgeleitet und kein UI-Befund ohne Beobachtung repariert.

Die vorhandenen Regressionstests prüfen alle zehn legalen Zustandsfolgen,
Doppelpick-Fenster, zweite Bans, Side Swap, Ownership, Player Pools und das
Verwerfen veralteter Worker-Ergebnisse. Vollständig neu ausgeführt:
`bun test` im Frontend (131 Tests, 915 Assertions),
`bunx eslint src scripts/benchmark-response-tree.ts` (0 Fehler),
`bun run typecheck` für vier Pakete sowie zusätzlich
`bunx turbo typecheck --force` (vier Pakete ohne Cache),
`bun run --filter @rifttheory/frontend build` und `git diff --check`.
ESLint meldet weiterhin nur die bestehende Solid-Warnung in
`DraftPrepCalendar.tsx:42`; Vite meldet weiterhin den großen Haupt-Chunk
(1.013,47 kB / 329,39 kB gzip). Die erwarteten 503-Warnungen in den
Dataset-Fallback-Tests stammen aus simulierten Fehlerantworten. Desktopcode
wurde bei diesem Abnahmeversuch nicht geändert; ein neuer Tauri/NSIS-Build
war nicht erforderlich. Der nächste zwingende Schritt ist, die
Computer-Use-Verbindung beziehungsweise eine steuerbare Browser-Oberfläche
für die ausstehende interaktive Abnahme bereitzustellen.

## Interaktive Abnahme über lokale Produktionsvorschau (2026-09-29)

Der zuvor genannte UI-Blocker wurde für die Browser-Abnahme umgangen: Ein
isolierter Headless-Chrome lief außerhalb der Sandbox gegen die lokale
Produktionsvorschau auf Port 3011. Die native Computer-Use-Pipe blieb
unerreichbar. Die folgenden Beobachtungen stammen aus echten DOM-Aktionen
und einem Screenshot des gerenderten Browsers, nicht aus Logiktests allein.

- Der Hauptdraft wurde in tatsächlicher Reihenfolge über die Draft-Tabelle
  gesetzt: B1 Ashe (Bot), R1 Vi (Jungle), R2 Janna (Support), B2 Poppy (Top),
  B3 Anivia (Mid), R3 Ahri (Mid), R4 Aphelios (Bot), B4 Ivern (Jungle),
  B5 Bard (Support). B3 mit vier Vor-Picks zeigte eine gescreente Folge
  B3 → R3 → vier zweite Bans → R4 → B4/B5. R3 mit fünf Vor-Picks zeigte
  R3 → vier zweite Bans → R4. R5 mit neun Vor-Picks zeigte nur den finalen
  R5-Pick und keine erfundene spätere Antwort. Alle drei Entscheidungen
  behielten das ungelöste, nicht kalibrierte Urteil bei.
- Eine lokale Live-Serie wurde durch sechs erste Bans und sechs Picks bis
  zur offenen zweiten Banphase gespielt. `Analyze game` zeigte vier
  bedingte Ban-Pfade mit legalen R4-Optionen, aber keine normale
  Entscheidungskarte. Danach bannte Red Alistar und Blitzcrank; Blue
  bannte Aatrox und Ambessa.
  Ein neuer Snapshot zeigte keine Ban-Szenarien mehr und startete den
  normalen R4-Response-Tree mit R4 Aphelios → B4 Karma → B5 Akshan →
  R5 Camille. Mit nur einem wieder geöffneten Ban blieb die normale
  Entscheidung erneut ausgeblendet.
- Bei 430 Pixeln betrug die Dokumentbreite 430 Pixel sowohl für R5 als
  auch für die laufende Banphase. Die Entscheidung und der Rückweg in
  den Live Draft blieben bedienbar. Ein visueller Screenshot der R5-Karte
  bestätigte lesbaren Text und sichtbare Aktion. Die Vorschau erhielt
  beim Öffnen Fokus; nach dem Schließen kehrte der Fokus zum Auslöser
  zurück. Die Suchmethoden-Details und Banmethoden-Details ließen sich
  mit Enter öffnen und zeigten einen sichtbaren Fokusrahmen.
- Im zweiten Spiel tauschten die Teamseiten automatisch. Ein manueller
  `Swap sides` im noch leeren zweiten Spiel kehrte sie erneut um; beide
  `Analyze game`-Snapshots nannten die jeweils richtigen Teams auf Blue
  und Red. Ein manueller Red-Top-Spielerpool mit nur Camille senkte die
  R5-Shortlist im Hauptdraft von 54 auf eine legale Option; die alte
  Aatrox-Entscheidung verschwand und die Karte zeigte Camille ohne
  vorgetäuschte zweite Wahl. Ownership ohne LCU-Verbindung wurde nur in
  den bestehenden Logiktests geprüft, nicht interaktiv.

Bei dieser Abnahme trat kein reproduzierbarer UI-Fehler auf; deshalb wurde
kein Produktcode verändert und kein neuer Regressionstest erfunden. Der
isolierte Browser prüfte die Produktions-Weboberfläche; die native
Tauri-WebView und der NSIS-Installer wurden anschließend getrennt geprüft.
Die strategischen
Evidenzgrenzen und Winrates blieben unverändert.

Abschlussgates nach der UI-Abnahme: Frontend `bun test` erneut 131 Tests /
915 Assertions; `bunx eslint src scripts/benchmark-response-tree.ts` mit
0 Fehlern und dem bestehenden Hinweis in `DraftPrepCalendar.tsx:42`;
`bun run typecheck` für vier Pakete erfolgreich (Turbo-Cache, zuvor in
dieser Sitzung zusätzlich mit `bunx turbo typecheck --force` ohne Cache
bestätigt); Frontend-Produktionsbuild erfolgreich. Der Haupt-Chunk bleibt
bei 1.013,47 kB / 329,39 kB gzip über Vites Warnschwelle. Der aktuelle
Tauri/NSIS-Build erzeugte lokal
`RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`.
Die bekannte Tauri-Warnung zur fehlenden `__TAURI_BUNDLE_TYPE`-Markierung
bleibt; ein Updater-Lauf dieses Installers wurde nicht geprüft.
`cargo test --locked` bestand mit zwei Rust-Tests. Zu diesem Zeitpunkt war
der Installer noch nicht installiert; er wurde nicht veröffentlicht.
`git diff --check` wurde nach
dieser Dokumentation abschließend geprüft.

## Nativer Projekt-Build und Installer-Prüfung (2026-09-29)

Die Computer-Use-Verbindung war später wieder verfügbar. Der zunächst über
die App-Inventur gestartete Prozess war die bereits installierte App unter
`AppData/Local/RiftTheory`; er wurde ausdrücklich nicht als Projekt-Build
gezählt. Danach wurde die frisch gebaute
`apps/frontend/src-tauri/target/release/RiftTheory.exe` direkt gestartet und
anhand des von Windows zurückgegebenen Prozess- und Fensterpfads eindeutig
ausgewählt. Nach dem Laden zeigte ihre native WebView den Strategy-Tab,
die B1-Entscheidung, den gescreenten B1 → R1 → R2 → B2 → B3-Pfad und die
Vergleichsvorschau für Ashe. Die Vorschau ließ sich öffnen und schließen;
das Urteil blieb ungelöst und ohne Wahrscheinlichkeitsbehauptung.

Der Versuch, zusätzlich das native Fenster schmal zu ziehen, wurde wegen
einer gleichzeitig vor dem Projektfenster erscheinenden anderen Anwendung
abgebrochen. Die schmale Ansicht, Fokus und aufklappbare Details sind in
der lokalen Produktions-Weboberfläche wie oben beschrieben geprüft; diese
Teilprüfungen werden nicht als native WebView-Tests umetikettiert. Beide
von diesem Test gestarteten RiftTheory-Prozesse wurden danach beendet.

Der NSIS-Installer wurde erfolgreich gebaut und liegt lokal unter
`apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`
(5.858.409 Bytes, SHA-256
`EE5FEA58328C1EEEBBCD20E53D28132C9C2304369071023EED7742AED6EA161E`).
Er ist nicht digital signiert. Die bestehende Installation unter AppData
wurde anschließend mit diesem lokalen Installer still aktualisiert:
Installationsprozess Exitcode 0. Die installierte
`AppData/Local/RiftTheory/RiftTheory.exe` ist 17.818.624 Bytes groß und hat
denselben SHA-256-Hash wie die frisch gebaute Projekt-EXE:
`3F1A08522007932EA36CA9FEF3F6DC4C6FFDFFB8C2095EE518EFECC98CE003DB`.

## Retrospektiver Pilot mit lokalen Matches (2026-09-29)

Die lokale Riot-Match-V5-Datei `data/runtime/soloq/euw1-DIAMOND-I.jsonl`
liefert echte Endaufstellungen und Rollen, aber keine historische Pick-Reihenfolge
oder zweite Ban-Reihenfolge. Die folgenden B1–R5-Eingaben sind deshalb
**illustrative, chronologisch legale Rekonstruktionen der aufgezeichneten
Rollen**, keine Replays der tatsächlichen Draft-Entscheidungen. Sie prüfen
Darstellung, Bedienung und Grenzen der Ausgaben. Ein Matchausgang belegt keine
Empfehlungsqualität.

| Match | Aufgezeichnetes Ergebnis | Vollständiger Vergleich der App | R5-Fenster vor dem letzten Pick |
| --- | --- | --- | --- |
| `EUW1_7992567789` | Red gewann | Ratingindex Red 55,6 / Blue 44,4 | Alistar · support vs Blitzcrank · support; keine spätere Gegneraktion |
| `EUW1_7980186298` | Red gewann | Ratingindex Blue 52,4 / Red 47,6 | Brand · support vs Camille · support; Kitabdeckung 4/5 |
| `EUW1_7991577772` | Blue gewann | Ratingindex Blue 53,2 / Red 46,8 | Alistar · support vs Blitzcrank · support; struktureller Vorsprung nur in den geprüften Zweigen |

Der erste Fall wurde mit allen zehn Picks und zugewiesenen Rollen in der
nativen Projekt-EXE durchgespielt. Die beiden weiteren Fälle wurden mit echten
DOM-Aktionen in der lokalen Produktionsvorschau durchgespielt. Die App zeigt
den Ratingindex ausdrücklich als unkalibriert, ohne Anpassung an Spielerstärke.
Die drei Einzelfälle sind keine Kalibrierungs- oder Outcome-Studie. Historische
Gegnerreaktionen, tatsächliche Bans und Lock-in-Zeitpunkte bleiben unbekannt.
Der Strategy-Bestand wurde weder hinsichtlich Matchups noch Winrates geändert.

Der Pilot fand zwei Darstellungsfehler. Im finalen R5-Fenster stand trotz
`draft_complete` noch „Reached the next decision window“. Ein zuerst
fehlschlagender Regressionstest deckt nun den Abschlussstatus ab; die UI zeigt
„Draft complete“. Ein Flex-Vergleich nannte nur „Camille“, obwohl die für R5
gewählte Rolle Support war. Der aktuelle Datensatz führt Camille auf Support
als etablierte Rolle mit 19.399 Spielen und 28,7 % Anteil; der Vergleich war
legal, aber unklar beschriftet. Ein zweiter zuerst fehlschlagender Test sichert
die Rollenangabe; die UI zeigt „Compared with: Camille · support“.

Beide Korrekturen wurden im neu gebauten Produktionsbundle erneut interaktiv
geprüft. Bei 430 px Viewportbreite betrug `documentElement.scrollWidth` 430 px;
die R5-Karte und „Inspect this line“ blieben erreichbar, die Vorschau öffnete
sich. Der native Schmalfenster-Test bleibt auf dieser Maschine offen: Eine
gleichzeitig aktive Vollbildanwendung überlagerte die Desktop-App und die
Computer-Use-Eingabe meldete konkurrierende Nutzereingabe. Der Browser-Test
wird nicht als native Prüfung ausgegeben.

Finale Prüfungen nach beiden Korrekturen: Frontend `bun test` 133 Tests / 919
Assertions; `bunx eslint src scripts/benchmark-response-tree.ts` 0 Fehler und
der bestehende `solid/reactivity`-Hinweis in `DraftPrepCalendar.tsx:42`;
`bun run typecheck` 4/4 Pakete erfolgreich (Frontend neu berechnet, drei
unveränderte Pakete aus Turbo-Cache); Frontend-Produktionsbuild erfolgreich.
Der Haupt-Chunk beträgt 1.013,55 kB / 329,45 kB gzip und überschreitet weiter
Vites 500-kB-Warnschwelle. `bunx tauri build --bundles nsis` erfolgreich mit
der bestehenden `__TAURI_BUNDLE_TYPE`-Warnung; `cargo test --locked` 2/2.
Der finale lokale Installer
`apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`
ist 5.855.473 Bytes groß und hat SHA-256
`9DABC8C4864DF21D730F655C9A61D9AABAFD06F385D5CCC6C97817496923B907`.
Das stille Update der bestehenden App beendete sich mit Exitcode 0; die
installierte EXE und Projekt-EXE haben beide SHA-256
`4E62E6016AB15BBA580931C7F84CA2EFFA0BAF54CB8A92107FADE9D38C0E72E3`.
`git diff --check` war vor dieser Dokumentation erfolgreich und wird danach
nochmals ausgeführt. Ein Updater- oder Uninstallationslauf wurde nicht geprüft.
Kein Release, Push oder Tag.

## Release-Candidate-Abnahme am 1. Oktober 2026

**Bewertung: GO fuer einen lokalen Release Candidate 3.2.11.** Diese Bewertung
setzt eine ausdrueckliche Freigabe vor jeder Veroeffentlichung voraus. Der
vorhandene umfangreiche uncommittete Arbeitsbaum wurde nicht zurueckgesetzt,
ausgecheckt, committed oder gepusht. Matchups, Winrates und strategische
Wissensdaten wurden nicht veraendert.

### Korrekturen und Regressionen

- Der gespeicherte Live Draft akzeptierte ein `games`-Array mit `null`-Eintrag
  oder defekter Aktion; spaeter konnte `game.actions.length` die Ansicht
  abbrechen. `liveDraftStorage.test.ts` war vor der Korrektur rot und prueft
  nun ungueltige sowie gueltige Spielstaende. Der Loader prueft jedes Spiel,
  die Aktionen und die Serienkonfiguration vor der Verwendung. Ein zweiter
  zuerst roter Test prueft fehlende Lock-Daten. Einen verworfenen lokalen
  Rohwert loescht der initiale Mount nicht; eine neu gestartete Serie ersetzt
  ihn erst durch Nutzeraktion. Die gezielten Tests bestanden mit 2 Tests und
  5 Assertions.
- Die Produktions-Contexts exportierten `RIFTTHEORY_DEBUG` mit Draft-Aktionen
  und Datensatz-Zugriff auf `window`. Diese Entwicklungs-Schnittstelle wurde
  entfernt. Der finale Produktionsordner enthaelt die Kennung nicht; auch
  die installierte WebView meldete `debug: false`. Das CDP-Smoke-Script liegt
  nur unter `apps/frontend/scripts/` und wird nicht in die App gebuendelt.
- Die Tauri-Konfiguration und der Installer waren 3.2.11, die Windows-EXE
  meldete aber `FileVersion` und `ProductVersion` 0.1.0. `Cargo.toml` und
  `Cargo.lock` tragen nun 3.2.11. Nach dem Neubau meldeten Projekt- und
  installierte EXE `ProductName=RiftTheory`, `FileVersion=3.2.11` und
  `ProductVersion=3.2.11`.
- Die frueheren Korrekturen sind im aktuellen Code und in der finalen nativen
  R5-Ansicht vorhanden: `draft_complete` wird als `Draft complete` angezeigt;
  `formatResponseChoice` nennt die Rolle eines Flex-Picks. Die bestehenden
  gezielten Tests dafuer sind gruen.

### Technische Gates auf dem finalen Quellstand

| Verzeichnis | Befehl | Ergebnis |
| --- | --- | --- |
| `RiftTheory/apps/frontend` | `bun test` | 135 bestanden, 0 fehlgeschlagen, 924 Assertions |
| `RiftTheory/apps/frontend` | `bunx eslint src scripts/benchmark-response-tree.ts` | Exit 0, 0 Fehler, 1 bestehende `solid/reactivity`-Warnung |
| `RiftTheory` | `bun run typecheck` | 4/4 Pakete bestanden, 3 aus Turbo-Cache |
| `RiftTheory` | `bun run --filter @rifttheory/frontend build` | Exit 0; separater Response-Worker im Bundle |
| `RiftTheory/apps/frontend` | `bunx tauri build --bundles nsis` | Exit 0; EXE und NSIS erzeugt |
| `RiftTheory/apps/frontend/src-tauri` | `cargo test --locked` | 2/2 Rust-Tests bestanden |
| Repository-Wurzel | `git diff --check` | Exit 0 nach dieser Dokumentation |

Der erste NSIS-Versuch im Sandbox-Kontext scheiterte an `Access is denied`
beim Lesen der Vite-Konfiguration; derselbe Befehl ausserhalb der Sandbox
bestand. Ein zwischenzeitlicher Typecheck-Fehler betraf ausschliesslich die
fehlende Moduldeklaration des lokalen CDP-Smoke-Scripts; nach `export {}`
bestanden der gezielte Typecheck und die komplette Gate-Folge. Die simulierten
503-Ausgaben in den Dataset-Tests sind erwartete Fehlerantworten.

Zusaetzliche Abnahmebefehle: `bun test src/components/workspaces/liveDraftStorage.test.ts`
(2/2), `cargo metadata --locked --no-deps --format-version 1` (Paket `app`
3.2.11),
`bun scripts/release-smoke-cdp.ts native-live`, `native-sequence`,
`native-r5` und `native-interact` (Ergebnisse unten), `Get-FileHash -Algorithm SHA256`
sowie `Get-Item ... .VersionInfo` (Hash und Version unten). Das lokale Update
lief mit `Start-Process <Installer> -ArgumentList '/S' -Wait`; danach wurde
die installierte AppData-EXE explizit gestartet.
`rg` pruefte den finalen `dist`-Ordner auf Debug-Kennung, Entwicklungs-URL
und offensichtliche Token-/Schluesselmarker. `git diff --check` hatte
Exitcode 0; Git gab nur CRLF-Normalisierungswarnungen aus.

### Interaktive Oberflaechenpruefungen

**Native, finale installierte EXE:** Gestarteter Prozesspfad war
`C:\Users\Löltgen\AppData\Local\RiftTheory\RiftTheory.exe`. Die WebView lud
mit Patch-/Aktualitaetsanzeige, Live Draft oeffnete seine lokale Serienmaske,
Strategy berechnete die B1-Entscheidung und die Vorschau oeffnete und schloss.
Die League-Statusanzeige zeigte eine bestehende Verbindung; in einem frueheren
Testlauf wechselte sie sichtbar zu `CLIENT NOT CONNECTED`, ohne die Strategy-
Ansicht abzubrechen. Ein echtes aktives League-Champ-Select war nicht
verfuegbar und wird hier nicht behauptet.

In der final installierten EXE wurden die Picks ueber die Draft-Tabelle
chronologisch gesetzt: B1 Ashe (Bot), R1 Vi (Jungle), R2 Janna (Support),
B2 Poppy (Top), B3 Anivia (Mid), R3 Ahri (Mid), R4 Aphelios (Bot),
B4 Ivern (Jungle), B5 Bard (Support). Mit vier Vor-Picks zeigte B3 eine
Fortsetzung B3 -> R3 -> vier zweite Bans -> R4 -> B4/B5. Mit fuenf
Vor-Picks zeigte R3 R3 -> vier zweite Bans -> R4. Mit neun Vor-Picks zeigte
R5 nur den letzten Pick, `Draft complete` und keine erfundene spaetere
Gegneraktion. Die strukturellen Urteile blieben offen und wurden nicht als
Gewinnwahrscheinlichkeit ausgegeben.

Das **tatsaechliche native Fenster** wurde ueber WebView2-CDP auf 430 px
gesetzt; `outerWidth`, `innerWidth` und `documentElement.scrollWidth` waren
jeweils 430 px. R5-Entscheidung und `Inspect this line` blieben erreichbar.
Die Vorschau erhielt beim Oeffnen Fokus. `Search method and uncertainty`
liess sich mit Enter oeffnen und schliessen; nach `Close comparison` kehrte
der Fokus zu `Inspect this line` zurueck. Die Hauptansicht blieb gefuellt.

**Browser, lokale Produktionsvorschau:** Ein isolierter Headless-Chrome
oeffnete `http://127.0.0.1:3011/`; Draft und Strategy renderten, B1 wurde
berechnet und eine Vorschau geoeffnet. Bei 430 px war die Dokumentbreite
ebenfalls 430 px. Eine lokale CDP-Injektion liess externe `fetch`-Aufrufe
scheitern; die Konsole zeigte fehlgeschlagene Dataset-Anfragen, waehrend die
Ansicht anschliessend weiter renderte. Der gezielte Loader-Test prueft
Cache-Fallback, Rang-Fallback, Wiederverwendung voriger Daten und einen
Fehler ohne Daten. Ein vollstaendiger nativer Netzwerkausfall wurde nicht
simuliert. Das zwischenzeitliche Loeschen von IndexedDB bei offener Browser-
Seite erzeugte einen haengenden Testlauf und gilt nicht als Produktbefund.

Die am 29. September dokumentierten interaktiven Browser-Pruefungen fuer
laufende zweite Bans, Side Swap und Player Pools sowie die Tests fuer
Ownership und veraltete Worker-Ergebnisse gelten weiterhin fuer diese
unveraenderten Fachpfade; sie werden nicht als heute erneut durchgefuehrte
native Aktionen ausgegeben. Die finale Suite enthaelt diese Regressionen.

### Artefakt und Grenzen

- Finaler Installer:
  `RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.11_x64-setup.exe`;
  **5.860.320 Bytes**; SHA-256
  `99A6C572EAACA596516D6D29F031121605804184CC0C72656734187579606FF3`.
- Stilles lokales Update ueber die vorhandene Installation: Exitcode 0.
  Installierte und Projekt-EXE sind 17.818.624 Bytes gross und haben beide
  SHA-256 `2716BE07F65C8B5E8A71260BC02817DF6EEB96C79DA55364B6F310A1EED418E4`.
  Die installierte EXE wurde danach gestartet und interaktiv geprueft.
- Artefakt-Scan: keine `RIFTTHEORY_DEBUG`-Kennung, kein Entwicklungsendpunkt
  `127.0.0.1:3000`/`localhost:3000`, kein `RIOT_API_KEY`, kein privater
  Schluesselblock und kein GitHub-Token-Praefix im Produktionsordner. Die
  Fehlalarme eines breiten `sk-`-Musters waren CSS-`mask-image`-Bezeichner.
- Bestehende Warnungen: `DraftPrepCalendar.tsx:42` (`solid/reactivity`),
  Vite-Haupt-Chunk 1.013,83 kB (Buildwarnschwelle 500 kB), Tauri-
  `__TAURI_BUNDLE_TYPE`-Markierung fehlt. Das lokale NSIS-Update bestand;
  ein automatischer Updater wurde nicht geprueft. Der Installer ist nicht
  digital signiert. Deinstallation wurde zum Schutz vorhandener Nutzerdaten
  nicht getestet.
- Fachliche Grenzen bleiben: begrenzter, nicht vollstaendig geloester
  Response Tree; kein kalibriertes Outcome-Modell; Match-V5-Dateien enthalten
  Endaufstellungen und Rollen, aber keine historische Pick-/Ban-Reihenfolge.
  Rekonstruierte Folgen sind keine echten Replays. Ein aktives LCU-Champ-
  Select samt Wiederverbindung wurde heute mangels entsprechender Session
  nicht end-to-end geprueft.

Keine bekannte ungeloeste P0- oder P1-Stoerung. Kein Push, Tag, Release oder
oeffentliches Hochladen wurde ausgefuehrt.

## UX-Nachtrag und lokaler Release Candidate 3.2.12 (1. Oktober 2026)

Der Nutzer autorisierte die Umsetzung der nach dem 3.2.11-RC vorgeschlagenen
UI- und Technikverbesserungen. Die vorhandene uncommittete Arbeit blieb erhalten;
es gab keinen Reset, Checkout, Push, Tag oder Upload. Die Version steht in Root-
und Frontend-`package.json`, Tauri-Konfiguration, Cargo-Manifest und beiden
Lockfiles auf 3.2.12. Windows-EXE-Metadaten melden RiftTheory 3.2.12.

### Tatsächliche Änderungen und Regressionen

- Die bestehende Strategy-Entscheidung zeigt jetzt zwei direkt anwählbare
  Kandidaten, eine knappe Rollen-/Patch-/Suchabdeckungszeile und aufklappbare
  Gründe/Unsicherheit. Der vorhandene ausführliche Same-Slot-Vergleich bleibt
  die Grundlage. Es wurde keine neue Winrate oder strategische Behauptung
  erfunden. Beim Öffnen der Alternative erhält die Vorschau Fokus; nach dem
  Schließen kehrt er zur auslösenden Taste zurück.
- Der manuelle Draft speichert Picks und Rollen als validierten lokalen Snapshot.
  Undo/Redo sind im Draft und Strategy erreichbar. Defekte, doppelte oder
  strukturell ungültige Snapshots werden nicht geladen und nicht automatisch
  überschrieben. Hover, LCU-Picks und LCU-Bans werden nicht als manuelle
  Draft-Aktionen gespeichert. Bei Schreibfehlern erscheint eine sichtbare
  Meldung. Die letzten 30 manuell geänderten Board-Zustände bleiben für Undo
  in der laufenden Sitzung; nach App-Neustart wird der letzte Board-Zustand
  restauriert, nicht die Undo-Historie.
- Browser-Test fand zuerst einen echten Restore-Fehler: B1 war gespeichert,
  aber nach Neustart noch als aktiver Slot markiert. Der neue Test
  `manualDraftStorage.test.ts` prüft B1 -> R1; Restore, Undo und Redo setzen
  den nächsten offenen chronologischen Slot. Derselbe Test prüft Format,
  beschädigte Daten, Duplikate und unzulässige Rollen.
- Ein UI-Regressionscheck fand, dass Solid `Suspense` während einer neuen
  Response-Berechnung die gesamte Strategy-Ansicht durch „Loading workspace“
  ersetzte. Der Check wurde vor der Korrektur rot. `DeferredView` lädt große
  Arbeitsbereiche einmalig bei Bedarf und zeigt einen Retry bei Importfehlern,
  ohne ihre späteren Datenberechnungen aus der Oberfläche zu entfernen.
- Der Produktionsstart-Chunk sank von 1.013,83 kB bei 3.2.11 auf 486,24 kB
  bei 3.2.12 (160,64 kB gzip im Tauri-Build). Strategy, Draft-Tabelle,
  Analyse, Workspaces und Einstellungen liegen in separaten Chunks. Die
  bisherige Vite-Warnung über 500 kB tritt nicht mehr auf.
- Ein simulierter Offline-Start ohne IndexedDB-Cache reproduzierte eine
  leere Hauptfläche: ein fehlgeschlagener Solid-Ressourcenabruf wurde vor der
  Fehleransicht als Exception gelesen. Der neue Browser-Regressionscheck
  schlug zuerst fehl. `DatasetContext` liest den Fehlerzustand vor dem Wert;
  danach zeigte dieselbe Produktionsvorschau die Statistik-Fehlermeldung,
  „Retry statistics“ und lokale Draft-Prep-Arbeitsbereiche.

### Finale technische Gates nach dem letzten Code-Fix

Ausgeführt in den angegebenen Verzeichnissen, jeweils Exitcode 0:

```powershell
cd RiftTheory/apps/frontend
bun test                                  # 138 pass, 0 fail, 931 assertions
bunx eslint src scripts/benchmark-response-tree.ts # 0 errors, 1 warning
cd ../..
bun run typecheck                         # 4/4 Pakete erfolgreich, 3 Cache-Hits
bun run --filter @rifttheory/frontend build # erfolgreich; Start-Chunk 486,23 kB
cd apps/frontend
bunx tauri build --bundles nsis           # erfolgreich; Start-Chunk 486,24 kB
cd src-tauri
cargo test --locked                       # 2 pass, 0 fail
cd "C:\Users\Löltgen\Documents\vscode\Projekt DraftOS"
git diff --check                          # erfolgreich; CRLF-Hinweise
```

Die einzige ESLint-Warnung bleibt `DraftPrepCalendar.tsx:42`
(`solid/reactivity`). Tauri meldet weiter die fehlende
`__TAURI_BUNDLE_TYPE`-Markierung. Automatische Updates wurden nicht aktiviert
oder geprüft; `createUpdaterArtifacts` bleibt `false`, der Installer ist nicht
signiert. Für einen signierten Updatekanal fehlen ein verwalteter Signierschlüssel
und ein überprüfbarer Endpunkt. Die lokale NSIS-Installation funktioniert.

### UI-Prüfung: Browser und native App getrennt

**Browser, lokale Produktionsvorschau:** Ein isoliertes Chrome-Profil auf
`http://127.0.0.1:3011/` prüfte manuelles Speichern, Undo, Redo, Reload,
R1 als nächstes Fenster nach gespeichertem B1, 430 px
`innerWidth = scrollWidth`, direkten Alternativ-Klick, Vorschau-Fokus und
Fokus-Rückkehr. Eine beschädigte gespeicherte Draft-Zeichenfolge ließ den
Draft leer und die App bedienbar; der Rohwert blieb bis zu einer bewussten
neuen Speicherung bestehen. Mit abgefangenen externen Fetches und leerem
IndexedDB-Cache zeigte die final gebaute Ansicht einen sichtbaren Fehler,
Retry und Draft Prep. Der Netzwerkfehler war simuliert, kein physisches
Trennen der Verbindung.

**Native Projekt-EXE und final installierte EXE:** WebView2-CDP prüfte in der
3.2.12-EXE B3, R3 und R5 nach chronologisch gesetzten Vor-Picks. B3 und R3
zeigten die zweite Banphase; R5 zeigte `Draft complete`. Das tatsächlich
schmale native Fenster hatte `outerWidth = innerWidth = scrollWidth = 430`.
Die R5-Alternative öffnete die Vorschau, `Search method and uncertainty`
ließ sich mit Enter öffnen und der Fokus kehrte nach dem Schließen zu
`Try Ambessa` zurück. Die installierte App öffnete auch den nachgeladenen
Live-Draft-Arbeitsbereich. Das ist kein Test in einem aktiven League-
Champ-Select; der Client zeigte lediglich eine bestehende Verbindung.

Nach einem Installationslauf erschien ein zuvor sichtbarer Neun-Pick-Draft
leer. Die Ursache war aus diesem Lauf nicht rekonstruierbar. Daraufhin wurde
ein kontrollierter Test mit einem eindeutigen lokalen Testeintrag und einem
neu gespeicherten Neun-Pick-Draft durchgeführt: Beide überstanden einen
App-Neustart und eine weitere stille Installation desselben Installers.
Der Testeintrag wurde entfernt. Diese Beobachtung belegt Datenbewahrung im
kontrollierten Updatefall; sie erklärt den früheren leeren Zustand nicht.

### Finales lokales Artefakt und Bewertung

- Installer: `RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.12_x64-setup.exe`;
  **5.881.471 Bytes**; SHA-256
  `C3DC7E0658BA23276CA4B86B84A169EC9996D9FD96606A2603DFBF44F9953CDD`.
- Stilles Update über die vorhandene Installation: Exitcode 0. Projekt- und
  installierte EXE: je 17.839.104 Bytes, gleicher SHA-256
  `D3A26837225B9A27AF9EC04F4D4A312BF3AD9945732F032A33398257680AA1E2`.
  Die gestartete installierte EXE liegt unter
  `C:\Users\Löltgen\AppData\Local\RiftTheory\RiftTheory.exe`.
- Scan der JS-Produktionsartefakte auf `RIFTTHEORY_DEBUG`, Entwicklungsport
  3000, `TAURI_SIGNING_PRIVATE_KEY` und `GITHUB_TOKEN`: null Treffer.
- **GO für einen lokalen, manuell installierbaren Release Candidate 3.2.12**
  ohne bekannte offene P0-/P1-Störung. Kein GO für einen automatischen
  Updatekanal: Signierung, Update-Artefakte und `__TAURI_BUNDLE_TYPE` sind
  dafür ungeklärt. Ein aktiver LCU-Draft, automatische Updates und
  Deinstallation wurden in diesem Nachtrag nicht end-to-end geprüft.

## Finaler Windows-RC 3.2.14 (1. Oktober 2026)

Der Nutzer bat um Abschluss und GitHub-Upload. Den echten Test in einem aktiven
League-Champ-Select ließ er ausdrücklich aus. Diese Strecke wird daher nicht
als bestanden bezeichnet. Die vorherige Arbeit und alle lokalen Daten blieben
erhalten. 3.2.13 war ein lokal installierter Zwischenstand; 3.2.14 ist das
finale Artefakt nach einer weiteren Fehlerkorrektur.

### Änderungen und Regressionen

- Ein zuvor beobachteter leerer manueller Draft ließ sich nicht deterministisch
  reproduzieren. Als Datenrettung wird vor jeder manuellen Änderung ein
  nichtleeres Board separat gesichert. „Restore previous board“ stellt es aus
  Draft und Strategy wieder her. Der Test `manualDraftStorage.test.ts` prüft
  die Nichtleer-Bedingung; die installierte 3.2.13-App bestand den nativen
  Reset-/Restore-Versuch mit einem Neun-Pick-Board und identischem Snapshot.
  Das ist eine Schadensbegrenzung, keine nachgewiesene Ursachenbehebung.
- Der native Start ohne LeagueClient zeigte fälschlich „CLIENT CONNECTED“:
  Champ-Select- und Gameflow-Aufruf lieferten beide `null`, während der
  Riot-Client-Prozess lief. `lcu-api.test.ts` war zuerst rot und prüft jetzt,
  dass ein fehlender Gameflow-Endpunkt als nicht verfügbar gilt. 3.2.14 zeigt
  nach Installation korrekt „CLIENT NOT CONNECTED“. Ein echter aktiver Draft
  und Wiederverbindung wurden auf Nutzerwunsch nicht durchgespielt.
- Der Tauri-Updater ist registriert, sein öffentlicher Schlüssel und der
  GitHub-Releases-Endpunkt sind konfiguriert. Die privaten Schlüsseldateien
  liegen außerhalb des Repositories in `%USERPROFILE%\.tauri` mit auf den
  Benutzer beschränkten Dateirechten. Der NSIS-Build erzeugt eine `.sig`;
  `update-manifest.ts` erzeugt `latest.json` mit Versions-, Namens- und
  Signaturprüfung. Zwei gezielte Tests für das Manifest bestanden. In den
  Einstellungen gibt es eine Updateprüfung mit sichtbaren Erfolgs- und
  Fehlerzuständen sowie eine bewusste Installationsaktion. Der vorherige,
  nicht funktionsfähige S3-Kopierschritt wurde entfernt.
- Die Tauri-CLI meldet weiterhin, dass `__TAURI_BUNDLE_TYPE` in der EXE nicht
  gefunden wird. Ein expliziter Link-Versuch beseitigte das nicht und wurde
  wieder entfernt. Die Signatur wurde erzeugt und das Manifest stimmt mit der
  `.sig`-Datei überein; ein automatisches Update von einer älteren Version
  auf 3.2.14 wurde nicht end-to-end getestet. Der Updatekanal bleibt deshalb
  als ungeprüft gekennzeichnet. Windows-Authenticode-Signierung fehlt mangels
  Zertifikat; die Tauri-Updater-Signatur ist davon getrennt.

### Gates nach dem finalen Code

Alle folgenden Befehle endeten mit Exitcode 0:

```powershell
cd RiftTheory/apps/frontend
bun test                                   # 142 pass, 0 fail, 939 Assertions
bunx eslint src scripts/benchmark-response-tree.ts # 0 Fehler, 1 Warnung
cd ../..
bun run typecheck                          # 4/4 Pakete erfolgreich
bun run --filter @rifttheory/frontend build # erfolgreich, Haupt-Chunk 487,16 kB
cd apps/frontend
bunx tauri build --bundles nsis            # NSIS + .sig erfolgreich
cd src-tauri
cargo test --locked                        # 2 pass, 0 fail
cd "C:\Users\Löltgen\Documents\vscode\Projekt DraftOS"
git diff --check                           # erfolgreich, nur CRLF-Hinweise
```

`bun install --frozen-lockfile --dry-run` prüfte zusätzlich die korrigierte
Lockfile-Syntax erfolgreich. ESLint meldet weiterhin ausschließlich
`DraftPrepCalendar.tsx:42` (`solid/reactivity`). Der Tauri-Build meldet die
oben beschriebene Bundle-Markierung. Ein Scan der finalen JS-Artefakte fand
keinen privaten Updater-Schlüssel, `GITHUB_TOKEN`,
`TAURI_SIGNING_PRIVATE_KEY` oder Entwicklungsendpunkt auf Port 3000.

### Oberflächen und Installation

**Browser:** Der 3.2.12-Produktionsvorschau-Test bei 430 px, inklusive
Draft-Restore, Fokus-Rückkehr und simuliertem Offline-Start, bleibt als
früherer Befund dokumentiert. Für 3.2.14 wurde kein neuer Browser-Smoke-Test
behauptet.

**Native installierte 3.2.14-App:** Lokales NSIS-Update Exitcode 0;
Projekt- und installierte EXE je 19.723.264 Bytes mit demselben SHA-256
`3F48EB5FC76FAD5C51139C6880B729AB35F2E79F0D5F3EF069809C9A62827F30`.
Die App wurde eindeutig aus `%LOCALAPPDATA%\RiftTheory\RiftTheory.exe`
gestartet. Ein gespeichertes Neun-Pick-Board und ein eindeutiger Testeintrag
überstanden die Installation; der Testeintrag wurde danach entfernt. Die
native Strategy hatte `innerWidth = outerWidth = scrollWidth = 430`, zeigte
bei vollständigen Vor-Picks R5 und „Draft complete“, öffnete die
Alternative, ließ die Details mit Enter öffnen und gab nach dem Schließen
den Fokus an „Try Ambessa“ zurück. Die Settings-Updateprüfung zeigte vor
Bereitstellung von `latest.json` einen sichtbaren Fehler statt einer leeren
Ansicht. Kein LeagueClient-Prozess lief; der Status war korrekt nicht verbunden.
B3, R3, zweite Banphase, Side Swap, Ownership, Player Pools und Worker-
Aktualität waren im früheren nativen/browserbasierten RC-Abnahmelauf
geprüft, nicht erneut im finalen 3.2.14-Smoke-Test.

Installer: `RiftTheory/apps/frontend/src-tauri/target/release/bundle/nsis/RiftTheory_3.2.14_x64-setup.exe`;
**6.287.437 Bytes**; SHA-256
`30A43BA4A555404E7B2C3EC58ADC6FF929DC7BAD92975DA8D1A6D1E903E37377`.
Daneben liegen die `.sig` (424 Bytes) und das erzeugte `latest.json`.

**Bewertung:** GO für einen manuell installierbaren Windows-Release-Candidate
ohne bekannte offene P0-/P1-Störung. Der automatische Updatepfad ist wegen
der Bundle-Warnung und fehlendem End-to-End-Update noch kein geprüfter GO.
Ein aktiver LCU-Champ-Select ist auf Nutzerwunsch ungeprüft. Der frühere
leere Draft bleibt in seiner Ursache ungeklärt; die neue Wiederherstellung
reduziert das Datenverlustrisiko. Keine historische Pick-/Ban-Reihenfolge wird
aus Match-V5-Endaufstellungen erfunden.
