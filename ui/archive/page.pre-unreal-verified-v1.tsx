"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:3210/api";

type StageState = "idle" | "ready" | "waiting" | "running" | "complete" | "blocked";
type PipelineMode = "web-builders" | "design-to-unreal";

type PipelineStatus = {
  connected: boolean;
  runId: string | null;
  objective: string | null;
  mode: PipelineMode;
  overall: "idle" | "queued" | "running" | "complete";
  stages: Record<string, StageState>;
  events: string[];
};

type PromotionStatus = {
  available: boolean;
  asset: { id: string; name: string; schemaVersion: string } | null;
  gates: Record<string, string>;
  promotedAt: string | null;
  registryVersion: string | null;
  studioUrl: string;
  promotedUrl: string | null;
};

const emptyStatus: PipelineStatus = {
  connected: false,
  runId: null,
  objective: null,
  mode: "web-builders",
  overall: "idle",
  stages: {
    cursor: "idle",
    preparation: "idle",
    claude: "idle",
    lovable: "idle",
    v0: "idle",
    verification: "idle",
    figma: "idle",
    shader: "idle",
    spline: "idle",
    promotion: "idle",
    unreal: "idle",
    assetQc: "idle",
  },
  events: [],
};

const webStages = [
  { key: "cursor", number: "01", label: "Cursor", detail: "Supervisor" },
  { key: "preparation", number: "02", label: "Brief agents", detail: "Parallel prep" },
  { key: "claude", number: "03", label: "Claude", detail: "Chrome director" },
  { key: "lovable", number: "04A", label: "Lovable", detail: "Builder stream" },
  { key: "v0", number: "04B", label: "v0", detail: "Builder stream" },
  { key: "verification", number: "05", label: "Reviewers", detail: "Parallel QA" },
] as const;

const designStages = [
  { key: "cursor", number: "01", label: "Cursor", detail: "Supervisor" },
  { key: "figma", number: "02", label: "Figma", detail: "Remote + Desktop" },
  { key: "shader", number: "03", label: "GLSL studio", detail: "Versioned shader" },
  { key: "spline", number: "04", label: "Spline", detail: "Live instrument" },
  { key: "promotion", number: "05", label: "Promote", detail: "Registry gate" },
  { key: "unreal", number: "06", label: "Unreal", detail: "Compile adapter" },
  { key: "assetQc", number: "07", label: "Asset QC", detail: "Fidelity proof" },
] as const;

const pipelineCopy = {
  "web-builders": {
    kicker: "CURSOR → CLAUDE → LOVABLE + v0",
    headline: "One brief.",
    accent: "A fleet of builders.",
    description: "Describe the outcome once. Relay prepares the brief, directs Claude in Chrome, fans the build out to Lovable and v0, then verifies both.",
    composer: "What should the agents build?",
    placeholder: "Example: Build a cinematic landing page for a generative identity engine with a working mobile layout...",
    suggestions: [
      "Build a premium launch page for my new product",
      "Create a clean dashboard for tracking creative projects",
      "Prototype a mobile-first AI workspace",
    ],
  },
  "design-to-unreal": {
    kicker: "FIGMA → GLSL → SPLINE → PROMOTION → UNREAL",
    headline: "Design once.",
    accent: "Ship a real 3D asset.",
    description: "Relay captures the Figma design contract, versions the live shader, packages the Spline scene, translates unsupported effects, and verifies the result inside Unreal.",
    composer: "What should the 3D pipeline create?",
    placeholder: "Example: Create a brushed-metal GLSL identity object in Figma, package it through Spline, and import a controllable material version into Unreal...",
    suggestions: [
      "Create a metallic shader asset for Unreal",
      "Convert a Spline scene into an Unreal level",
      "Build a versioned holographic identity object",
    ],
  },
} as const;

function statusLabel(state: StageState) {
  if (state === "complete") return "Complete";
  if (state === "running") return "Working";
  if (state === "waiting") return "Waiting";
  if (state === "ready") return "Ready";
  if (state === "blocked") return "Needs you";
  return "Standby";
}

export default function Home() {
  const [mode, setMode] = useState<PipelineMode>("web-builders");
  const [objective, setObjective] = useState("");
  const [status, setStatus] = useState<PipelineStatus>(emptyStatus);
  const [promotion, setPromotion] = useState<PromotionStatus>({
    available: false,
    asset: null,
    gates: {},
    promotedAt: null,
    registryVersion: null,
    studioUrl: "http://127.0.0.1:3210/studio-v3/",
    promotedUrl: null,
  });
  const [notice, setNotice] = useState("");
  const [launching, setLaunching] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API}/status`, { cache: "no-store" });
      if (!response.ok) throw new Error("status unavailable");
      const next = (await response.json()) as PipelineStatus;
      setStatus(next);
    } catch {
      setStatus((current) => ({ ...current, connected: false }));
    }
  }, []);

  const refreshPromotion = useCallback(async () => {
    try {
      const response = await fetch(`${API}/promotion`, { cache: "no-store" });
      if (!response.ok) throw new Error("promotion unavailable");
      setPromotion((await response.json()) as PromotionStatus);
    } catch {
      setPromotion((current) => ({ ...current, available: false }));
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshPromotion();
    const timer = window.setInterval(() => {
      refreshStatus();
      refreshPromotion();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [refreshPromotion, refreshStatus]);

  const runPipeline = async () => {
    const cleaned = objective.trim();
    if (!cleaned) {
      setNotice("Describe what you want the builders to make.");
      return;
    }

    setLaunching(true);
    setNotice("");

    try {
      const response = await fetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objective: cleaned, mode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not start the run.");
      setPromptReady(true);
      setNotice("Cursor is open with the pipeline prompt ready.");
      await refreshStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not reach the local launcher.");
    } finally {
      setLaunching(false);
    }
  };

  const submitToCursor = async () => {
    setLaunching(true);
    try {
      const response = await fetch(`${API}/submit`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Cursor could not be focused.");
      setPromptReady(false);
      setNotice("Pipeline submitted. Live progress will appear here.");
      await refreshStatus();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Click Cursor and press Enter.");
    } finally {
      setLaunching(false);
    }
  };

  const openUnreal = async () => {
    setLaunching(true);
    setNotice("");
    try {
      const response = await fetch(`${API}/open-unreal`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unreal could not be opened.");
      setNotice("Unreal Engine is opening the Lyra 5.7 destination project.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unreal could not be opened.");
    } finally {
      setLaunching(false);
    }
  };

  const activeMode = status.overall === "idle" ? mode : status.mode;
  const activeStages = activeMode === "design-to-unreal" ? designStages : webStages;
  const copy = pipelineCopy[mode];
  const completed = useMemo(
    () => activeStages.filter((stage) => status.stages[stage.key] === "complete").length,
    [activeStages, status.stages],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">R</span>
          <div>
            <p className="eyebrow">LOCAL ORCHESTRATOR</p>
            <p className="brand-name">Relay</p>
          </div>
        </div>
        <div className={`connection-pill ${status.connected ? "online" : "offline"}`}>
          <span className="signal-dot" />
          {status.connected ? "Local engine online" : "Connecting locally"}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="kicker">{copy.kicker}</p>
          <h1>{copy.headline}<br /><span>{copy.accent}</span></h1>
          <p className="hero-description">{copy.description}</p>
        </div>

        <div className="composer-card">
          <div className="composer-header">
            <span>{copy.composer}</span>
            <span className="shortcut">LOCAL ONLY</span>
          </div>
          <div className="mode-switch" aria-label="Pipeline route">
            <button
              className={mode === "web-builders" ? "active" : ""}
              type="button"
              onClick={() => setMode("web-builders")}
            >
              Web builders
            </button>
            <button
              className={mode === "design-to-unreal" ? "active" : ""}
              type="button"
              onClick={() => setMode("design-to-unreal")}
            >
              Design → Unreal
            </button>
          </div>
          <textarea
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder={copy.placeholder}
            aria-label="Pipeline objective"
          />
          <div className="suggestion-row">
            {copy.suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => setObjective(suggestion)}>
                {suggestion.split(" ").slice(0, 3).join(" ")}
              </button>
            ))}
          </div>
          <div className="composer-actions">
            <p>{objective.length}/3000</p>
            <button
              className="run-button"
              type="button"
              onClick={runPipeline}
              disabled={launching || objective.trim().length === 0 || objective.length > 3000}
            >
              <span>{launching ? "Preparing…" : "Run pipeline"}</span>
              <span className="arrow">↗</span>
            </button>
          </div>
          {notice && <p className="notice">{notice}</p>}
          {promptReady && (
            <div className="confirm-strip">
              <div>
                <strong>Prompt ready in Cursor</strong>
                <span>Send it when you are ready.</span>
              </div>
              <button type="button" onClick={submitToCursor} disabled={launching}>
                Send now
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="pipeline-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LIVE PIPELINE</p>
            <h2>{status.runId ? `Run ${status.runId}` : "Waiting for a brief"}</h2>
          </div>
          <div className="progress-readout">
            <span>{completed}/{activeStages.length}</span>
            <p>stages complete</p>
          </div>
        </div>

        <div className="stage-grid">
          {activeStages.map((stage) => {
            const state = status.stages[stage.key] ?? "idle";
            return (
              <article className={`stage-card state-${state}`} key={stage.key}>
                <div className="stage-topline">
                  <span className="stage-number">{stage.number}</span>
                  <span className="stage-status"><i />{statusLabel(state)}</span>
                </div>
                <h3>{stage.label}</h3>
                <p>{stage.detail}</p>
                <div className="activity-line" />
              </article>
            );
          })}
        </div>
      </section>

      {mode === "design-to-unreal" && (
        <section className="unreal-section" id="unreal-view">
          <div className="section-heading">
            <div>
              <p className="eyebrow">UNREAL DESTINATION</p>
              <h2>Lyra 5.7 live-engine view</h2>
            </div>
            <span className="unreal-gate">COMPILE PENDING</span>
          </div>

          <div className="unreal-console">
            <div className="unreal-viewport">
              <div className="viewport-toolbar">
                <span>UNREAL ENGINE 5.7</span>
                <span>REFRACT / ORGANIC GLOW INSTRUMENT</span>
              </div>
              <div className="viewport-grid" aria-label="Unreal verification viewport">
                <div className="viewport-reticle" />
                <div className="viewport-empty">
                  <span>NO VERIFIED UNREAL FRAME YET</span>
                  <h3>The adapter exists. The material still needs its first live compile.</h3>
                  <p>
                    Relay will replace this state with captured Unreal evidence only after the
                    promoted controls render correctly inside the destination project.
                  </p>
                </div>
              </div>
            </div>

            <aside className="unreal-inspector">
              <p className="eyebrow">DESTINATION EVIDENCE</p>
              <div className="evidence-row">
                <span>Project</span>
                <b>Lyra 5.7</b>
              </div>
              <div className="evidence-row">
                <span>Behavior contract</span>
                <b className="pass">PASS</b>
              </div>
              <div className="evidence-row">
                <span>Registry</span>
                <b>{promotion.registryVersion ?? "Pending"}</b>
              </div>
              <div className="evidence-row">
                <span>Material adapter</span>
                <b className="pending">TRANSLATE</b>
              </div>
              <div className="evidence-row">
                <span>Live compile</span>
                <b className="pending">PENDING</b>
              </div>
              <div className="unreal-controls">
                <p>Target controls</p>
                <div><span>Morph</span><i style={{ width: "55%" }} /></div>
                <div><span>Flow</span><i style={{ width: "60%" }} /></div>
                <div><span>Heat</span><i style={{ width: "65%" }} /></div>
                <div><span>Grab · Stretch · Twist · Scale</span><i style={{ width: "82%" }} /></div>
              </div>
              <button className="unreal-open-button" type="button" onClick={openUnreal} disabled={launching}>
                {launching ? "Opening Unreal…" : "Open Unreal Editor"}
                <span>↗</span>
              </button>
            </aside>
          </div>
        </section>
      )}

      <section className="lower-grid">
        <article className="activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ACTIVITY</p>
              <h2>What is happening</h2>
            </div>
            <span className={`overall overall-${status.overall}`}>{status.overall}</span>
          </div>
          <div className="event-list">
            {status.events.length > 0 ? status.events.map((event, index) => (
              <div className="event-row" key={`${event}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{event}</p>
              </div>
            )) : (
              <div className="empty-state">
                <span>◇</span>
                <p>Your run history will appear here.</p>
              </div>
            )}
          </div>
        </article>

        <aside className="readiness-panel">
          <p className="eyebrow">FIRST-RUN CHECK</p>
          {mode === "design-to-unreal" ? (
            <>
              <h2>{promotion.available ? "First instrument promoted" : "Promotion Gate is ready"}</h2>
              <p>
                {promotion.available
                  ? `${promotion.asset?.name} passed the schema, shader-control, direct-manipulation, and append-only gates. Unreal compilation remains the final proof.`
                  : "Validate the visual-behavior contract, create the next immutable registry, then prove the adapter in Unreal."}
              </p>
              <div className="link-stack">
                <a href={promotion.studioUrl} target="_blank" rel="noreferrer">
                  Open Spline Lab v3 <span>↗</span>
                </a>
                {promotion.promotedUrl && (
                  <a href={promotion.promotedUrl} target="_blank" rel="noreferrer">
                    Open promoted REFRACT v40 <span>↗</span>
                  </a>
                )}
              </div>
              <div className="readiness-list">
                <div><span className="ready-dot" />Figma remote + desktop <b>Connected path</b></div>
                <div><span className="ready-dot" />Visual-behavior schema <b>{promotion.gates.schema ?? "Ready"}</b></div>
                <div><span className="ready-dot" />Registry <b>{promotion.registryVersion ?? "Awaiting asset"}</b></div>
                <div><span className="warn-dot" />Unreal material compile <b>{promotion.gates.unrealMaterialCompile ?? "Pending"}</b></div>
              </div>
            </>
          ) : (
            <>
              <h2>One sign-in remains</h2>
              <p>Cursor, Claude, and v0 are ready. Sign in to Lovable once before the first build.</p>
              <a href="https://lovable.dev/login" target="_blank" rel="noreferrer">
                Open Lovable sign-in <span>↗</span>
              </a>
              <div className="readiness-list">
                <div><span className="ready-dot" />Cursor app <b>Ready</b></div>
                <div><span className="ready-dot" />Claude extension <b>Installed</b></div>
                <div><span className="ready-dot" />v0 workspace <b>Ready</b></div>
                <div><span className="warn-dot" />Lovable workspace <b>Sign in</b></div>
              </div>
            </>
          )}
        </aside>
      </section>

      <footer>
        <p>Relay keeps accepted projects intact and creates new iterations by default.</p>
        <span>LOCAL CONTROL SURFACE · v2</span>
      </footer>
    </main>
  );
}
