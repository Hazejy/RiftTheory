import { Database } from "bun:sqlite";
import {
  importObservedRoleSnapshot,
  type RoleObservationFile,
  type RoleObservationInput,
} from "../observedRoles";

export const DRAFTGAP_CURRENT_PATCH_URL =
  "https://bucket.draftgap.com/datasets/v5/current-patch.json";

const ROLE_BY_INDEX = {
  0: "top",
  1: "jungle",
  2: "mid",
  3: "bot",
  4: "support",
} as const;

type DraftGapRole = { games?: unknown; wins?: unknown };
type DraftGapChampion = {
  key?: unknown;
  statsByRole?: Record<string, DraftGapRole>;
};
type DraftGapDataset = {
  version?: unknown;
  date?: unknown;
  championData?: Record<string, DraftGapChampion>;
};

function requireDataset(raw: unknown) {
  if (!raw || typeof raw !== "object")
    throw new Error("DraftGap returned no dataset object");
  const dataset = raw as DraftGapDataset;
  if (
    typeof dataset.version !== "string" ||
    !/^\d+\.\d+\.\d+$/.test(dataset.version)
  )
    throw new Error("DraftGap dataset has no valid Data Dragon version");
  if (
    typeof dataset.date !== "string" ||
    Number.isNaN(Date.parse(dataset.date))
  )
    throw new Error("DraftGap dataset has no valid collection date");
  if (!dataset.championData || typeof dataset.championData !== "object")
    throw new Error("DraftGap dataset has no championData map");
  return {
    version: dataset.version,
    date: new Date(dataset.date).toISOString(),
    championData: dataset.championData,
  };
}

function extractObservations(champions: Record<string, DraftGapChampion>) {
  const observations: RoleObservationInput[] = [];
  for (const [mapKey, champion] of Object.entries(champions)) {
    const riotKey =
      typeof champion.key === "string" && champion.key ? champion.key : mapKey;
    if (!/^\d+$/.test(riotKey))
      throw new Error(`DraftGap champion has an invalid Riot key: ${riotKey}`);
    if (!champion.statsByRole || typeof champion.statsByRole !== "object")
      throw new Error(`DraftGap champion ${riotKey} has no role statistics`);

    for (const [index, role] of Object.entries(ROLE_BY_INDEX)) {
      const games = champion.statsByRole[index]?.games;
      if (games === 0) continue;
      if (!Number.isInteger(games) || (games as number) < 0)
        throw new Error(
          `DraftGap champion ${riotKey} has invalid ${role} games`,
        );
      observations.push({
        champion: { riotKey },
        role,
        games: games as number,
      });
    }
  }
  if (!observations.length)
    throw new Error("DraftGap dataset contains no positive role samples");
  return observations;
}

export async function syncDraftGapRoleSamples(
  database: Database,
  url = DRAFTGAP_CURRENT_PATCH_URL,
) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok)
    throw new Error(`DraftGap dataset request returned ${response.status}`);
  const dataset = requireDataset(await response.json());
  const patch = dataset.version.split(".").slice(0, 2).join(".");
  const snapshot = {
    schemaVersion: 1,
    source: {
      key: "draftgap_dataset_v5_current_patch",
      label: "DraftGap current-patch dataset v5",
      url,
      accessNote:
        "Public DraftGap aggregate collected from Lolalytics for Emerald+ ranked games across all regions. Only role game samples are imported; normalized wins, matchup estimates and synergies are excluded.",
    },
    context: {
      patch,
      region: "all",
      rankBracket: "emerald_plus",
      queue: "ranked_solo_5x5",
      observedAt: dataset.date,
    },
    observations: extractObservations(dataset.championData),
  } satisfies RoleObservationFile;

  return {
    ...(await importObservedRoleSnapshot(
      database,
      snapshot,
      "draftgap-role-samples-v5",
    )),
    datasetVersion: dataset.version,
  };
}
