import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { analyze, loadCatalog } from "./api";
import type { Report } from "./types";

vi.mock("./api", () => ({ analyze: vi.fn(), loadCatalog: vi.fn() }));
const sample: Report = {
  schema_version: 1,
  analysis_type: "baseline_capability_check",
  is_demo: false,
  limitations: ["Not a draft score or win probability."],
  champions: [
    {
      champion_name: "Anivia",
      role: "mid",
      capabilities: ["wave_clear"],
      capability_source: "manually_curated",
      strategy: {
        main_colors: ["blue"],
        off_colors: ["white"],
        reasoning: "A provisional test interpretation.",
        source_name: "Test source",
        patch: null,
        source_url: "https://example.com/source",
        review_status: "provisional",
      },
    },
  ],
  capability_assessments: [
    { capability: "engage", providers: [], is_missing: true },
    { capability: "wave_clear", providers: ["Anivia"], is_missing: false },
  ],
};
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadCatalog).mockResolvedValue([
    { champion_name: "Anivia", role: "mid", capabilities: ["wave_clear"] },
    {
      champion_name: "Malphite",
      role: "top",
      capabilities: ["engage", "frontline"],
    },
  ]);
  vi.mocked(analyze).mockResolvedValue(sample);
});

describe("Draft workspace", () => {
  it("starts empty and cannot analyze without picks", async () => {
    render(<App />);
    await screen.findByRole("option", { name: "Anivia" });
    expect(
      (
        screen.getByRole("button", {
          name: "Analyze composition",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Jungle") as HTMLSelectElement).disabled,
    ).toBe(true);
    expect(screen.getByText("Make the draft explainable.")).toBeTruthy();
  });
  it("sends a real selection and shows evidence and missing coverage", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("option", { name: "Anivia" });
    await user.selectOptions(screen.getByLabelText("Mid"), "Anivia");
    await user.click(
      screen.getByRole("button", { name: "Analyze composition" }),
    );
    expect(
      await screen.findByText("A provisional test interpretation."),
    ).toBeTruthy();
    expect(analyze).toHaveBeenCalledWith(
      ["Anivia:mid"],
      expect.any(AbortSignal),
    );
    expect(screen.getByText("Not covered")).toBeTruthy();
    await user.click(screen.getByText("Sources & assessment limits"));
    expect(
      screen.getByText("Assessment patch: Unknown — not patch-verified"),
    ).toBeTruthy();
    expect(
      screen.getByText("Open reference source ↗").getAttribute("href"),
    ).toBe("https://example.com/source");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryByText("A provisional test interpretation.")).toBeNull();
  });
  it("does not invent colors for an unassessed champion", async () => {
    vi.mocked(analyze).mockResolvedValue({
      ...sample,
      champions: [
        {
          champion_name: "Malphite",
          role: "top",
          capabilities: ["frontline"],
          capability_source: "manually_curated",
          strategy: null,
        },
      ],
    });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("option", { name: "Malphite" });
    await user.selectOptions(screen.getByLabelText("Top"), "Malphite");
    await user.click(
      screen.getByRole("button", { name: "Analyze composition" }),
    );
    expect(
      await screen.findByText("Strategic identity not yet assessed"),
    ).toBeTruthy();
    expect(screen.queryByText("MAIN COLORS")).toBeNull();
  });
  it("handles catalog failure and retries", async () => {
    vi.mocked(loadCatalog).mockRejectedValueOnce(new Error("Server offline"));
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("alert")).toBeTruthy();
    await user.click(screen.getByText("Retry loading profiles"));
    await screen.findByRole("option", { name: "Anivia" });
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("retains selection after an analysis failure", async () => {
    vi.mocked(analyze).mockRejectedValueOnce(new Error("Server offline"));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("option", { name: "Anivia" });
    await user.click(screen.getByText("Use starter picks"));
    await user.click(
      screen.getByRole("button", { name: "Analyze composition" }),
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByLabelText("Mid") as HTMLSelectElement).value).toBe(
      "Anivia",
    );
  });
  it("ignores a late result after selection changes", async () => {
    let resolve!: (report: Report) => void;
    vi.mocked(analyze).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("option", { name: "Anivia" });
    await user.selectOptions(screen.getByLabelText("Mid"), "Anivia");
    await user.click(
      screen.getByRole("button", { name: "Analyze composition" }),
    );
    await waitFor(() => expect(analyze).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await act(async () => resolve(sample));
    expect(screen.queryByText("A provisional test interpretation.")).toBeNull();
    expect(screen.getByText("Make the draft explainable.")).toBeTruthy();
  });
});
