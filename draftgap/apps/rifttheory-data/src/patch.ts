import { WEB_EXPORT_PATH } from "./paths";
import { discoverLatestRiotPatch } from "./riot";

type PublishedKnowledge = {
  metadata?: {
    latestPatch?: { version?: unknown } | null;
  };
};

export async function readPublishedPatch(path = WEB_EXPORT_PATH) {
  const file = Bun.file(path);
  if (!(await file.exists())) return null;

  try {
    const knowledge = (await file.json()) as PublishedKnowledge;
    const version = knowledge.metadata?.latestPatch?.version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}

export async function checkPatchStatus() {
  const [latestRiotPatch, publishedPatch] = await Promise.all([
    discoverLatestRiotPatch(),
    readPublishedPatch(),
  ]);
  return {
    latestRiotPatch,
    publishedPatch,
    updateAvailable: latestRiotPatch !== publishedPatch,
  };
}
