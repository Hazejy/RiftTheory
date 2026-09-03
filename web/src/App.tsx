import { useEffect, useRef, useState } from "react";
import { analyze, loadCatalog } from "./api";
import {
  roles,
  type Color,
  type Profile,
  type Report,
  type Role,
} from "./types";

const labels: Record<Role, string> = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  bot: "Bot",
  support: "Support",
};
const readable = (value: string) => value.replaceAll("_", " ");
const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
function Colors({ values }: { values: Color[] }) {
  return (
    <div className="colors">
      {values.length ? (
        values.map((color) => (
          <span className={`color color-${color}`} key={color}>
            {color}
          </span>
        ))
      ) : (
        <span className="muted">None recorded</span>
      )}
    </div>
  );
}

export default function App() {
  const [catalog, setCatalog] = useState<Profile[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [reload, setReload] = useState(0);
  const [selection, setSelection] = useState<Partial<Record<Role, string>>>({});
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const count = Object.values(selection).filter(Boolean).length;

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    loadCatalog(controller.signal)
      .then((profiles) => {
        if (!controller.signal.aborted) setCatalog(profiles);
      })
      .catch((reason) => {
        if (!controller.signal.aborted)
          setCatalogError(
            `Could not load local profiles. ${errorMessage(reason)}`,
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  function changeSelection(next: Partial<Record<Role, string>>) {
    activeRequest.current?.abort();
    setSelection(next);
    setReport(null);
    setBusy(false);
    setError("");
  }

  function starterPicks() {
    const next: Partial<Record<Role, string>> = {};
    for (const profile of catalog) {
      if (
        (profile.champion_name === "Anivia" && profile.role === "mid") ||
        (profile.champion_name === "Malphite" && profile.role === "top")
      ) {
        next[profile.role] = profile.champion_name;
      }
    }
    changeSelection(next);
  }

  async function runAnalysis() {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const result = await analyze(
        roles
          .filter((role) => selection[role])
          .map((role) => `${selection[role]}:${role}`),
        controller.signal,
      );
      if (!controller.signal.aborted) setReport(result);
    } catch (reason) {
      if (!controller.signal.aborted)
        setError(`Analysis unavailable. ${errorMessage(reason)}`);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#workspace" aria-label="DraftOS workspace">
          <span className="brand-symbol" aria-hidden="true">
            D
          </span>
          <span>
            Draft<span className="brand-light">OS</span>
          </span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav-active" href="#workspace">
          <span className="nav-dot" /> Draft lab{" "}
          <span className="nav-count">01</span>
        </a>
        <div className="sidebar-note">
          <span className="eyebrow">BUILT FOR CLARITY</span>
          <p>
            A reason behind
            <br />
            every pick.
          </p>
          <span className="muted">
            League of Legends
            <br />
            Local research prototype
          </span>
        </div>
        <div className="sidebar-footer">
          <span className="status-dot" /> Local workspace <span>v0.1</span>
        </div>
      </aside>

      <main id="workspace">
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>{" "}
            <strong>Draft lab</strong>
          </span>
          <span className="pill">LOCAL PROTOTYPE</span>
        </header>
        <div className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">DRAFT WORKSPACE / 01</div>
              <h1>
                Build a plan.
                <br className="mobile-break" /> Understand your draft.
              </h1>
              <p>
                Connect champion capabilities with strategic identity. Keep the
                reasoning visible.
              </p>
            </div>
            <span className="version-label">
              BASELINE
              <br />
              <strong>01</strong>
            </span>
          </div>

          <div className="scope-note">
            <span className="scope-mark" aria-hidden="true">
              i
            </span>
            <div>
              <strong>A small catalog. An honest starting point.</strong>
              <span>
                Only Anivia Mid and Malphite Top are currently recorded. Missing
                data is not a verdict on role viability.
              </span>
            </div>
          </div>

          <div className="workspace-grid">
            <section
              className="panel selection-panel"
              aria-labelledby="selection-heading"
            >
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">YOUR COMPOSITION</span>
                  <h2 id="selection-heading">Select your picks</h2>
                </div>
                <span className="pick-count">
                  {count}
                  <span> / 5</span>
                </span>
              </div>
              <p className="panel-intro">
                Assign known profiles to fixed roles.
              </p>
              {catalogLoading && (
                <p role="status" className="notice">
                  Loading local profiles…
                </p>
              )}
              {catalogError && (
                <div role="alert" className="error-box">
                  {catalogError}
                  <button
                    className="text-button"
                    onClick={() => setReload((value) => value + 1)}
                  >
                    Retry loading profiles
                  </button>
                </div>
              )}
              <div className="role-list">
                {roles.map((role, index) => {
                  const available = catalog.filter(
                    (profile) => profile.role === role,
                  );
                  const name = selection[role];
                  return (
                    <div
                      className={`role-slot ${name ? "selected" : ""}`}
                      key={role}
                    >
                      <span className="slot-index" aria-hidden="true">
                        0{index + 1}
                      </span>
                      <div className="slot-content">
                        <label htmlFor={`role-${role}`}>{labels[role]}</label>
                        <select
                          id={`role-${role}`}
                          value={name || ""}
                          disabled={
                            catalogLoading ||
                            !!catalogError ||
                            !available.length
                          }
                          onChange={(event) =>
                            changeSelection({
                              ...selection,
                              [role]: event.target.value,
                            })
                          }
                        >
                          <option value="">
                            {available.length
                              ? "Choose a champion"
                              : "No local profile yet"}
                          </option>
                          {available.map((profile) => (
                            <option
                              value={profile.champion_name}
                              key={profile.champion_name}
                              disabled={roles.some(
                                (other) =>
                                  other !== role &&
                                  selection[other] === profile.champion_name,
                              )}
                            >
                              {profile.champion_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {name && (
                        <button
                          className="remove-button"
                          aria-label={`Remove ${name} from ${labels[role]}`}
                          onClick={() =>
                            changeSelection({ ...selection, [role]: "" })
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="selection-tools">
                <button
                  className="text-button"
                  onClick={starterPicks}
                  disabled={catalogLoading || !!catalogError || !catalog.length}
                >
                  Use starter picks
                </button>
                <button
                  className="text-button muted"
                  onClick={() => changeSelection({})}
                  disabled={!count}
                >
                  Clear all
                </button>
              </div>
              <button
                className="analyze-button"
                disabled={!count || busy || !!catalogError || catalogLoading}
                onClick={runAnalysis}
              >
                {busy ? "Analyzing…" : "Analyze composition"}
                <span aria-hidden="true">→</span>
              </button>
              <p className="selection-caption">
                Partial selections are welcome. No account required.
              </p>
            </section>

            <section
              className="analysis-column"
              aria-label="Composition analysis"
              aria-busy={busy}
            >
              <div className="analysis-heading">
                <div>
                  <span className="eyebrow">THE REASONING</span>
                  <h2>Composition overview</h2>
                </div>
                <span className="pill subtle">
                  {report ? "ANALYSIS READY" : "AWAITING SELECTION"}
                </span>
              </div>
              {error && (
                <div className="error-box" role="alert">
                  {error}
                  <p>
                    Your picks are still here. Check the local server, then
                    analyze again.
                  </p>
                </div>
              )}
              {busy && (
                <div className="empty-state panel" role="status">
                  <div className="empty-diagram" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>Reading your composition</h3>
                  <p>Checking recorded capabilities and strategic profiles.</p>
                </div>
              )}
              {!busy && !report && !error && (
                <div className="empty-state panel">
                  <div className="empty-diagram" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="eyebrow">START WITH YOUR PICKS</span>
                  <h3>Make the draft explainable.</h3>
                  <p>
                    Select a champion on the left, then analyze.
                    <br />
                    See what your picks provide — and what is not yet known.
                  </p>
                  <div className="empty-tags">
                    <span>Capabilities</span>
                    <span>Strategic colors</span>
                    <span>Evidence</span>
                  </div>
                </div>
              )}

              {report && (
                <div className="results" aria-live="polite">
                  <div className="capability-grid">
                    {report.capability_assessments.map((item) => (
                      <article
                        className={`capability-card ${item.is_missing ? "missing" : "provided"}`}
                        key={item.capability}
                      >
                        <span className="eyebrow">
                          {readable(item.capability)}
                        </span>
                        <strong>
                          {item.is_missing ? "Not covered" : "Provided"}
                        </strong>
                        <span>
                          {item.is_missing
                            ? "No provider in this selection"
                            : item.providers.join(", ")}
                        </span>
                      </article>
                    ))}
                  </div>
                  <p className="baseline-note">
                    A capability baseline, not a draft score. Missing coverage
                    in a partial draft is not a recommendation.
                  </p>
                  {report.champions.map((champion) => (
                    <article
                      className="panel champion-card"
                      key={`${champion.champion_name}:${champion.role}`}
                    >
                      <div className="champion-heading">
                        <div
                          className={`portrait portrait-${champion.champion_name.toLowerCase()}`}
                          aria-hidden="true"
                        >
                          {champion.champion_name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="eyebrow">
                            {labels[champion.role]}
                          </span>
                          <h3>{champion.champion_name}</h3>
                        </div>
                        <span className="review-status">
                          {champion.strategy?.review_status ||
                            "Not yet assessed"}
                        </span>
                      </div>
                      <div className="capability-tags">
                        {champion.capabilities.map((capability) => (
                          <span key={capability}>{readable(capability)}</span>
                        ))}
                      </div>
                      <p className="data-caption">
                        Capability source:{" "}
                        {readable(champion.capability_source)}
                      </p>
                      {champion.strategy ? (
                        <>
                          <div className="color-groups">
                            <div>
                              <span className="field-label">MAIN COLORS</span>
                              <Colors values={champion.strategy.main_colors} />
                            </div>
                            <div>
                              <span className="field-label">OFF COLORS</span>
                              <Colors values={champion.strategy.off_colors} />
                            </div>
                          </div>
                          <div className="reasoning">
                            <span className="field-label">
                              WHY THIS IDENTITY
                            </span>
                            <p>{champion.strategy.reasoning}</p>
                          </div>
                          <details>
                            <summary>Sources & assessment limits</summary>
                            <p>{champion.strategy.source_name}</p>
                            <p>
                              Assessment patch:{" "}
                              {champion.strategy.patch ||
                                "Unknown — not patch-verified"}
                            </p>
                            {champion.strategy.source_url &&
                            /^https?:\/\//i.test(
                              champion.strategy.source_url,
                            ) ? (
                              <a
                                href={champion.strategy.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open reference source ↗
                              </a>
                            ) : (
                              <p>No public source link recorded.</p>
                            )}
                            <p>
                              Review status applies to the strategic identity
                              only.
                            </p>
                          </details>
                        </>
                      ) : (
                        <div className="unknown-strategy">
                          <strong>Strategic identity not yet assessed</strong>
                          <p>
                            Capabilities are recorded, but no role-matched color
                            assessment exists. No colors have been inferred.
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                  <aside className="limits">
                    <h3>Know the limits</h3>
                    <ul>
                      {report.limitations.map((limit) => (
                        <li key={limit}>{limit}</li>
                      ))}
                    </ul>
                  </aside>
                </div>
              )}
              <div className="analysis-footer">
                <span>EXPLAINABLE BY DESIGN</span>
                <span>No generated win chances. No hidden score.</span>
              </div>
            </section>
          </div>
          <footer className="page-footer">
            <span>
              DraftOS <span className="slash">/</span> Strategy, made explicit.
            </span>
            <span>Independent project. Not endorsed by Riot Games.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
