import { afterEach, describe, expect, it, vi } from "vitest";
import { analyze, loadCatalog } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("local HTTP adapter", () => {
  it("rejects an incompatible report version", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            schema_version: 2,
            champions: [],
            capability_assessments: [],
          }),
        }),
    );
    await expect(
      analyze(["Anivia:mid"], new AbortController().signal),
    ).rejects.toThrow("Unsupported analysis format");
  });
  it("shows a safe fallback for non-JSON server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("not JSON");
        },
      }),
    );
    await expect(loadCatalog(new AbortController().signal)).rejects.toThrow(
      "Request failed (502)",
    );
  });
  it("passes picks and abort signal to the local API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          schema_version: 1,
          champions: [],
          capability_assessments: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    await analyze(["Anivia:mid"], controller.signal);
    expect(fetchMock).toHaveBeenCalledWith("/api/analyze", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: '{"picks":["Anivia:mid"]}',
    });
  });
  it("rejects a malformed catalog", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({ profiles: null }),
        }),
    );
    await expect(loadCatalog(new AbortController().signal)).rejects.toThrow(
      "Unsupported champion catalog",
    );
  });
});
