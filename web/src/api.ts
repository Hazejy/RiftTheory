import type { Profile, Report } from "./types";

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status}). Please check your selection and try again.`,
    );
  }
  return response.json();
}

export async function loadCatalog(signal: AbortSignal): Promise<Profile[]> {
  const body = await request("/api/champions", { signal });
  if (!Array.isArray(body.profiles))
    throw new Error("Unsupported champion catalog.");
  return body.profiles;
}

export async function analyze(
  picks: string[],
  signal: AbortSignal,
): Promise<Report> {
  const report = await request("/api/analyze", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ picks }),
  });
  if (
    report.schema_version !== 1 ||
    !Array.isArray(report.champions) ||
    !Array.isArray(report.capability_assessments)
  ) {
    throw new Error(
      "Unsupported analysis format. Update the app and server together.",
    );
  }
  return report;
}
