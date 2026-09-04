import { Database } from "bun:sqlite";
import { finishImportRun, startImportRun } from "./importRuns";
import { upsertChampion, upsertSource } from "./database";

const RIOT_SOURCE = {
  key: "riot_data_dragon",
  label: "Riot Data Dragon",
  kind: "official" as const,
  url: "https://developer.riotgames.com/docs/lol#data-dragon",
  accessNote:
    "Official versioned static data; publication can lag the live patch.",
};
const LOCALES = ["en_US", "ko_KR", "zh_CN"] as const;

type RiotChampion = { id: string; key: string; name: string };
type ChampionResponse = { data: Record<string, RiotChampion> };

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return (await response.json()) as T;
}

export async function syncRiotData(database: Database) {
  const sourceId = upsertSource(database, RIOT_SOURCE);
  const versions = await fetchJson<string[]>(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  );
  const patch = versions[0];
  if (!patch || !/^\d+\.\d+\.\d+$/.test(patch))
    throw new Error("Riot returned no valid Data Dragon version");
  const runId = startImportRun(database, "riot-data-dragon", sourceId, patch);
  let records = 0;
  try {
    const localized = await Promise.all(
      LOCALES.map(async (locale) => ({
        locale,
        response: await fetchJson<ChampionResponse>(
          `https://ddragon.leagueoflegends.com/cdn/${encodeURIComponent(patch)}/data/${locale}/champion.json`,
        ),
      })),
    );
    const englishResponse = localized.find(
      ({ locale }) => locale === "en_US",
    )?.response;
    if (!englishResponse)
      throw new Error("Riot returned no English champion data");
    const english = Object.values(englishResponse.data).filter(
      (champion) => !champion.id.startsWith("Jade_"),
    );
    database.transaction(() => {
      database
        .query(
          `INSERT INTO patches (version, discovered_at, source_id)
                    VALUES (?, ?, ?) ON CONFLICT(version) DO UPDATE SET
                    discovered_at = excluded.discovered_at, source_id = excluded.source_id`,
        )
        .run(patch, new Date().toISOString(), sourceId);
      for (const champion of english) {
        const championId = upsertChampion(database, {
          riotKey: champion.key,
          slug: champion.id.toLowerCase(),
          name: champion.name,
          patch,
        });
        for (const { locale, response } of localized) {
          const translated = Object.values(response.data).find(
            (entry) => entry.key === champion.key,
          );
          if (!translated) continue;
          database
            .query(
              `INSERT INTO champion_localizations
                            (champion_id, locale, name, source_id, patch_version)
                            VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(champion_id, locale) DO UPDATE SET
                                name = excluded.name, source_id = excluded.source_id,
                                patch_version = excluded.patch_version`,
            )
            .run(championId, locale, translated.name, sourceId, patch);
          database
            .query(
              `INSERT INTO champion_aliases
                            (champion_id, alias, locale, source_id) VALUES (?, ?, ?, ?)
                            ON CONFLICT(alias, locale) DO UPDATE SET
                                champion_id = excluded.champion_id, source_id = excluded.source_id`,
            )
            .run(championId, translated.name, locale, sourceId);
          records += 1;
        }
      }
    })();
    finishImportRun(database, runId, "succeeded", records);
    return { patch, champions: english.length, records };
  } catch (error) {
    finishImportRun(database, runId, "failed", records, error);
    throw error;
  }
}
