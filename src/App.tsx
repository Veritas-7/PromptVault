import { useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import "./App.css";
import type { ImproveResult, PromptRecord, ScanResult } from "./types";

type ScanState = "idle" | "scanning" | "ready" | "failed";
const PREVIEW_LIMIT = 1000;

function App() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [improvement, setImprovement] = useState<ImproveResult | null>(null);

  const prompts = result?.prompts ?? [];
  const filteredPrompts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return prompts.slice(-200).reverse();
    return prompts
      .filter((prompt) => {
        return (
          prompt.text.toLowerCase().includes(needle) ||
          prompt.source.toLowerCase().includes(needle) ||
          (prompt.cwd ?? "").toLowerCase().includes(needle)
        );
      })
      .slice(-200)
      .reverse();
  }, [prompts, query]);

  const selectedPrompt = useMemo(() => {
    return prompts.find((prompt) => prompt.id === selectedId) ?? filteredPrompts[0] ?? null;
  }, [filteredPrompts, prompts, selectedId]);

  async function runScan() {
    setScanState("scanning");
    setError(null);
    setImprovement(null);
    try {
      const parsedLimit = limit.trim() ? Number(limit) : undefined;
      const next = await invoke<ScanResult>("scan_prompts", {
        options: {
          limit: parsedLimit,
          preview_limit: PREVIEW_LIMIT,
          include_markdown: false,
        },
      });
      setResult(next);
      setSelectedId(next.prompts[next.prompts.length - 1]?.id ?? null);
      setScanState("ready");
    } catch (err) {
      setError(String(err));
      setScanState("failed");
    }
  }

  async function runImprove(prompt: PromptRecord | null) {
    if (!prompt) return;
    setImproving(true);
    setError(null);
    try {
      const next = await invoke<ImproveResult>("improve_prompt", {
        request: {
          prompt: prompt.text,
          context: `${prompt.source} · ${prompt.cwd ?? "unknown workspace"}`,
        },
      });
      setImprovement(next);
    } catch (err) {
      setError(String(err));
    } finally {
      setImproving(false);
    }
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">PromptVault</p>
          <h1>Agent prompt intelligence</h1>
        </div>
        <div className="actions">
          <label className="limit-control">
            <span>Limit</span>
            <input
              min={100}
              max={100000}
              step={100}
              type="number"
              placeholder="All"
              value={limit}
              onChange={(event) => setLimit(event.currentTarget.value)}
            />
          </label>
          <button className="primary" disabled={scanState === "scanning"} onClick={runScan}>
            <RefreshCw size={18} />
            {scanState === "scanning" ? "Scanning" : "Scan"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="notice error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </section>
      ) : null}

      {result ? (
        <section className="notice">
          <FileText size={18} />
          <span>
            {result.output_path} · preview {result.returned_prompt_count.toLocaleString()} /{" "}
            {result.stats.total_prompts.toLocaleString()}
          </span>
        </section>
      ) : null}

      <section className="metrics">
        <Metric icon={<ClipboardList size={18} />} label="Prompts" value={result?.stats.total_prompts ?? 0} />
        <Metric icon={<Search size={18} />} label="Preview" value={result?.returned_prompt_count ?? 0} />
        <Metric icon={<FileText size={18} />} label="Files" value={result?.stats.total_files ?? 0} />
        <Metric icon={<Brain size={18} />} label="Words" value={result?.stats.total_words ?? 0} />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="Avg words"
          value={(result?.stats.average_words ?? 0).toFixed(1)}
        />
      </section>

      <section className="workspace">
        <aside className="panel sources-panel">
          <div className="panel-heading">
            <h2>Sources</h2>
            <span>{result?.generated_at ? new Date(result.generated_at).toLocaleString() : "not scanned"}</span>
          </div>
          <div className="sources">
            {(result?.stats.source_summaries ?? []).map((source) => (
              <div className="source-row" key={source.id}>
                <div>
                  <strong>{source.label}</strong>
                  <span>{source.root_path}</span>
                </div>
                <div className={`status ${source.status}`}>
                  {source.status === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {source.prompts_found}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="panel analysis-panel">
          <div className="panel-heading">
            <h2>Frequency</h2>
            <span>words and prompt starts</span>
          </div>
          <div className="frequency-grid">
            <FrequencyColumn title="Words" items={result?.stats.top_words ?? []} />
            <FrequencyColumn title="Phrases" items={result?.stats.top_phrases ?? []} />
            <FrequencyColumn title="Repeats" items={result?.stats.repeated_prompts ?? []} />
          </div>
        </section>
      </section>

      <section className="prompt-grid">
        <section className="panel prompt-list-panel">
          <div className="panel-heading">
            <h2>Prompts</h2>
            <span>
              {result
                ? `${result.returned_prompt_count.toLocaleString()} loaded${
                    result.prompts_truncated ? " · latest preview" : ""
                  }`
                : "not loaded"}
            </span>
            <div className="searchbox">
              <Search size={16} />
              <input
                value={query}
                placeholder="Filter"
                onChange={(event) => setQuery(event.currentTarget.value)}
              />
            </div>
          </div>
          <div className="prompt-list">
            {filteredPrompts.map((prompt) => (
              <button
                className={`prompt-row ${prompt.id === selectedPrompt?.id ? "active" : ""}`}
                key={prompt.id}
                onClick={() => {
                  setSelectedId(prompt.id);
                  setImprovement(null);
                }}
              >
                <span className="prompt-meta">
                  {prompt.source} · {prompt.word_count} words
                </span>
                <strong>{oneLine(prompt.text)}</strong>
                {prompt.risk_flags.length ? (
                  <span className="risk">
                    <AlertTriangle size={13} />
                    {prompt.risk_flags.join(", ")}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h2>Selected</h2>
            <button disabled={!selectedPrompt || improving} onClick={() => runImprove(selectedPrompt)}>
              <Sparkles size={17} />
              {improving ? "Improving" : "Improve"}
            </button>
          </div>
          {selectedPrompt ? (
            <>
              <div className="selected-meta">
                <span>{selectedPrompt.source}</span>
                <span>{selectedPrompt.timestamp ?? "unknown time"}</span>
                <span>{selectedPrompt.cwd ?? "unknown workspace"}</span>
              </div>
              <pre className="prompt-text">{selectedPrompt.text}</pre>
            </>
          ) : (
            <div className="empty">Run a scan to load prompts.</div>
          )}
        </section>

        <section className="panel improve-panel">
          <div className="panel-heading">
            <h2>Recommendation</h2>
            <span>{improvement?.provider ?? "local/GLM"}</span>
          </div>
          {improvement ? (
            <>
              <pre className="prompt-text revised">{improvement.revised_prompt}</pre>
              <div className="advice">
                {improvement.rationale.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              {improvement.warnings.length ? (
                <div className="warning-list">
                  {improvement.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty">Select a prompt and run improvement.</div>
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FrequencyColumn({
  title,
  items,
}: {
  title: string;
  items: { text: string; count: number }[];
}) {
  return (
    <div className="frequency-column">
      <h3>{title}</h3>
      {items.length ? (
        items.slice(0, 12).map((item) => (
          <div className="frequency-item" key={`${title}-${item.text}`}>
            <span>{item.text}</span>
            <strong>{item.count}</strong>
          </div>
        ))
      ) : (
        <p className="empty compact">No data</p>
      )}
    </div>
  );
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export default App;
