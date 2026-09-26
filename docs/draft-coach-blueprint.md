# RiftTheory Draft Coach: Entscheidungsmodell

Stand: 24. September 2026. Ziel ist eine tiefgehende, durch Quellen und
Gegenbeispiele überprüfbare Draft-Beratung, inspiriert durch die vom Nutzer
bereitgestellten LS-Draft-Kingdom-Referenzen. Die App gibt keine Aussagen als
persönliche Meinung von LS aus und imitiert ihn nicht. Die vorhandenen Bilder
belegen Themen wie Farben, Kohärenz, Optionswert, Antworten und probabilistisches
Denken; ein vollständiger, überprüfter Videotext liegt nicht vor.

Eine direkt lesbare [LS-Interviewantwort](https://www.invenglobal.com/articles/13666/part-2-of-talking-with-ls-riot-saved-my-life-with-this-game-i-was-homeless-i-was-struggling-i-didnt-have-anywhere-to-go-back-to)
nennt Lane-Matchups, Level-/Item-Schwellen, Ressourcenbedarf, Spielerpools und
die Fähigkeit, nach einer gegnerischen Festlegung noch zu pivotieren. Das sind
Prüffragen für den Coach, keine zeitlosen Champion-Urteile. Die offizielle
[MTG-Draft-Erklärung zu Farben und Signalen](https://magic.wizards.com/en/news/feature/signals-booster-draft-2015-01-19)
veranschaulicht den Wert offener Optionen. Sie liefert keine automatische
Farben-Gegenmatrix für League; Champion-Kits, Rollen, Bans und Spielausführung
müssen getrennt geprüft werden.

## Die Fragen, die die App beantworten muss

1. **Fertiger Draft:** Wie gewinnen Blue und Red jeweils? Welche Bedingungen,
   Zeitfenster und Gegenmaßnahmen entscheiden darüber? Eine numerische
   Siegwahrscheinlichkeit erscheint nur, wenn ein getrenntes Modell für den
   jeweiligen Kontext auf späteren Matchdaten kalibriert wurde.
2. **Aktueller Pick-Slot:** Welche legalen Picks erhalten den höchsten Wert,
   nachdem Gegnerantworten, nächste Bans und restliche Picks berücksichtigt
   wurden? Was ist die stärkste glaubwürdige Antwort und welche eigene Reaktion
   bleibt dann? Das gilt für **jeden Slot B1–B5 und R1–R5**, einschließlich
   der Banphase zwischen den Pickphasen.
3. **Pick-Reihenfolge:** Welche Information wurde früh preisgegeben? Welche
   Rollen/Pläne blieben offen oder wurden festgelegt? Welcher Gegner-Pick oder
   Ban wurde dadurch ermöglicht? Ein früher Pick ist nur dann ein Fehler, wenn
   eine konkrete Alternative im selben Zustand unter relevanten Antworten
   besser abschneidet.
4. **Coach-Erklärung:** Welche Kit-Fakten sind belegt, welche strategischen
   Folgerungen sind bedingt, und welche statistischen Effekte sind gemessen?
   Jede Empfehlung nennt Voraussetzungen, Gegnerantwort und Fallback.

## Ein gemeinsames Zustandsmodell

Der Zustand enthält Patch, Queue/Profi-Kontext, Seite, Pick-Slot, Picks, Bans,
legale Rollenbelegungen, Team- und Spieler-Pools, Serienregeln, verfügbare
Champion-Daten und Unsicherheit. Die Seite mit dem ersten Pick ist ein eigener
Parameter; sie darf nicht immer aus Blue/Red abgeleitet werden. Ein Kandidat
wird für genau diesen Zustand
geprüft; bei Flex-Picks bleiben mehrere Rollen bis zur Festlegung möglich.
Fehlende Evidenz bleibt fehlend und wird nicht als Vorteil verrechnet.

Die bestehende DraftGap-Grundlage liefert Champion-/Rollen-, Duo- und
Matchup-Statistiken samt Rating. Sie bleibt als statistische Evidenz erhalten;
der Rating-Index ist noch keine validierte volle Draft-Siegwahrscheinlichkeit.
Der Coach verbindet diese Daten mit den bedingten Strategy-Analysen, statt
Counterpicks oder Synergien ein zweites Mal als ungeprüfte Regeln zu erfinden.

### Jeder Pick-Slot bekommt seinen eigenen Blick

| Slot | Entscheidende Frage zusätzlich zum allgemeinen Draft-Vergleich |
| --- | --- |
| B1 | Welche Antworten übersteht der erste Pick, und welche Rollen/Pläne bleiben offen? |
| R1 | Welcher Teil der Doppelantwort greift B1 an, welcher eröffnet den eigenen Plan? |
| R2 | Wie ergänzt R2 den ersten Red-Pick, ohne beide Rollen und das Theme zu früh festzulegen? |
| B2 | Welche Antwort auf R1/R2 ist jetzt nötig, und was kann B3 noch offenhalten? |
| B3 | Welches Paar entsteht mit B2, und was darf Red auf R3 dagegen tun? |
| R3 | Wie schließt Red die erste Pickphase ab, bevor die zweite Banphase beginnt? |
| R4 | Welche durch die neuen Bans veränderte Lücke schließt Red, und was bleibt für B4/B5 offen? |
| B4 | Welche der letzten offenen Rollen und Funktionen muss Blue jetzt sichern? |
| B5 | Wie vervollständigt Blue den Plan vor Reds letzter Antwort, und was ist angreifbar? |
| R5 | Welche letzte Antwort verbessert den fertigen Draft tatsächlich, ohne neue Lücken zu öffnen? |

Das sind Prüffragen, keine festen Urteile. Die Analyse benutzt an jeder Stelle
dieselbe legale Aktionsfolge und simuliert die übrigen Slots und Bans.

Für jeden Champion und jede belegte Rolle werden Fähigkeiten und Bedingungen
als überprüfbare Einträge geführt: Reichweite/Zugang, Initiation, Follow-up,
Schutz, Disengage, Wellenkontrolle, Schaden, Ressourcenbedarf, Item- und
Level-Fenster sowie Gegenmaßnahmen. Item-Spikes werden nur genannt, wenn Patch,
Build und vorausgesetzte Ressourcen passen. Farben beschreiben ein mögliches
Spielmuster und seine Kosten; Haupt-/Nebenfarbe und alternative Builds sind
keine gleichzeitig garantierten Kräfte. Die vorhandenen `colorGuide.ts`,
`colorEvidence.ts`, `compositionCoach.ts` und `strategyReview.ts` sind der
Ausgangspunkt. Die Farbzuordnung allein entscheidet kein Matchup.

## Entscheidung in zwei Rechenstufen

**Stufe A – Wert eines fertigen Drafts.** Separate Modelle für Solo Queue und
Profispiele verwenden nur vor Spielbeginn verfügbare Merkmale. Sie werden gegen
Seiten-, Champion-/Rollen- und gegebenenfalls vor Spielbeginn bekannte
Spielerstärke-Baselines auf zukünftigen Patches geprüft. Die Auswertung umfasst
Log Loss, Brier Score, Kalibrierung, Unsicherheit und Abdeckung. Strategische
Merkmale wie Theme, Farben und Power-Fenster erhalten erst numerisches Gewicht,
wenn sie im zeitlich getrennten Vergleich tatsächlich helfen. Keine
Postgame-Werte wie Dauer, Gold oder Objectives gelangen in die Vorhersage.

**Stufe B – Wert eines aktuellen Picks.** Ein legaler Draftbaum betrachtet
Gegnerantworten, weitere Bans und eigene Folgepicks. Eine beobachtete
Draft-Policy schätzt, was Gegner wahrscheinlich spielen; eine adversariale
Suche prüft zusätzlich starke Gegenantworten. Die Ausgabe trennt erwarteten
Wert, robusten Wert und Unsicherheit. Ein enger, überprüfter Suchraum kann eine
GTO-artige Näherung ergeben. Eine globale Nash-Lösung oder ein kausaler
Pick-Effekt wird nicht behauptet.

Für unvollständige Drafts darf die App keine scheinbar präzise Prozentzahl
aus dem Rating eines hypothetisch vervollständigten Drafts ableiten. Solange
Stufe A oder B nicht validiert sind, werden Kandidaten als bedingte Szenarien
ohne numerischen Siegwert angezeigt.

## Coach-Ausgabe für einen Pick

Eine Pick-Karte soll in dieser Reihenfolge antworten:

- **Urteil:** geeignet, bedingt oder riskant; bei validiertem Modell zusätzlich
  erwarteter und robuster Wert mit Unsicherheitsbereich.
- **Was gewinnt der Pick?** Konkreter Plan, Rollen-/Farb- und Theme-Anschluss,
  Zugang zu Zielen, Power-Fenster und benötigte Ressourcen.
- **Was kostet er?** Verlorene Flex-Option, offenes Team-Bedürfnis,
  verschlechtertes Zeitfenster oder zu früh gezeigte Information.
- **Stärkste Gegnerantwort:** Ein legaler Pick/Ban oder Spielplan, die
  Voraussetzungen angreifen; danach der beste eigene Fallback.
- **Warum jetzt?** Vergleich mit mindestens einer legalen Alternative im
  identischen Slot und mit den tatsächlich noch folgenden Picks/Bans.
- **Evidenz:** Versionsgebundene Kit-Quelle, Datenbasis oder ausdrücklich
  gekennzeichnete RiftTheory-Interpretation. Widersprüche und fehlende Daten
  bleiben sichtbar.

Ein Sprachmodell darf diese strukturierten Befunde zu einer verständlichen
Coach-Erklärung verbinden und Rückfragen beantworten. Es erzeugt keine neuen
Mechanik-, Matchup- oder Wahrscheinlichkeitsfakten ohne überprüfbaren Beleg.

## Umsetzung in überprüfbaren Schritten

1. **Coach für alle zehn Slots vertiefen:** Ein gemeinsamer Zustands- und
   Antwortbaum für B1–B5 und R1–R5 mit aktueller DraftGap-Statistik und
   Strategy-Analyse, Farben, Flex, Item-/Level-Fenstern, Gegnerantwort und
   Fallback. Ohne erfundene Wahrscheinlichkeiten.
2. **DraftGap vollständig nutzen:** Vorhandene Patch-/Rangdaten für
   Champion-Rollen, Duos und Matchups im Coach sichtbarer machen. Kandidaten
   am aktuellen Draftzustand vergleichen und Stichprobengrößen sowie fehlende
   Werte anzeigen. Der Nutzer muss keine Daten sammeln oder Tests durchführen.
3. **Fertigdraft-Modell nur bei echtem Mehrwert ergänzen:** Die vorhandene
   DraftGap-Bewertung ist die statistische Grundlage. Eine eigene Erhebung ist
   optional und wird erst begonnen, wenn eine konkrete, mit DraftGap nicht
   beantwortbare Frage und eine verfügbare Datenquelle vorliegen. Eine
   kalibrierte Siegchance bleibt bis zu einer unabhängigen Validierung aus.
4. **Draftsuche validieren:** Legale Züge, Antwortqualität, Alternativen und
   Suchstabilität an historischen Drafts und gezielten Expertenszenarien
   prüfen. Ausgabe mit Unsicherheit und nachprüfbarem Antwortpfad.

Automatisierte Prüfungen konzentrieren sich auf vier Risiken: ungültige Züge,
verdeckte Datenleckage, falsche Wahrscheinlichkeitskalibrierung und eine
Erklärung, die ihren berechneten Antwortpfad nicht widerspiegelt. Der Nutzer
muss diese Tests nicht manuell durchführen.
