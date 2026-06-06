import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  StopCircle,
} from "lucide-react";
import "./App.css";
import {
  claimExclusiveAction,
  importActionLocked,
  releaseExclusiveAction,
  topLevelActionLocked,
} from "./actionLocks";
import { frequencyEmptyText, sourceSummariesEmptyText } from "./analysisEmptyState";
import { BROWSER_BRIDGE_NOTICE } from "./browserBridge";
import { importEventBatchSummary, importEventStatusLabel } from "./importEvents";
import {
  activeImprovementForSelection,
  improvementRequestStarted,
} from "./improvementSelection";
import {
  importProgressPercent,
  importStatusLabel,
  type ImportRunMode,
  type ImportRunState,
} from "./importProgress";
import { importRefreshFailureText, importRefreshUnavailableText } from "./importRefreshState";
import { selectedQueueSourceIds, toggleSourceSelection } from "./importQueue";
import { effectivePromptListMode, previewSortForMode, type PreviewMode } from "./previewMode";
import {
  promptListEmptyText,
  recommendationEmptyText,
  selectedPromptEmptyText,
} from "./promptEmptyState";
import {
  cancelScan,
  importBatch,
  improvePrompt,
  isBrowserQaMode,
  listImportEvents,
  listImportStates,
  listStoredPromptFacets,
  loadStoredPrompts,
  planScan,
  scanProgress,
  scanPrompts,
} from "./promptVaultApi";
import { MAX_SCAN_LIMIT, parseRequiredScanLimit } from "./scanLimit";
import { selectedPromptForView } from "./selection";
import {
  activeStoredPromptFilterCount,
  storedPromptLoadOptions,
  type StoredPromptFilters,
} from "./storedFilters";
import type {
  ImportBatchResult,
  ImportEventsResult,
  ImportState,
  ImportStatesResult,
  ImproveResult,
  PromptRecord,
  ScanPlan,
  ScanProgress,
  ScanResult,
  StoredPromptFacetsResult,
} from "./types";

type ScanState = "idle" | "scanning" | "canceling" | "ready" | "failed";
type PlanState = "idle" | "planning" | "ready" | "failed";
type StoredLoadState = "idle" | "loading" | "ready" | "failed";
type ImportStatesState = "idle" | "loading" | "ready" | "failed";
type ImportEventsState = "idle" | "loading" | "ready" | "failed";
type StoredFacetsState = "idle" | "loading" | "ready" | "failed";
const PREVIEW_LIMIT = 1000;
const IMPORT_BATCH_FILES = 5;
const CONTINUOUS_IMPORT_PAUSE_MS = 200;
const SCAN_PROGRESS_POLL_MS = 300;

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function waitForNextImportBatch(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, CONTINUOUS_IMPORT_PAUSE_MS);
  });
}

function createScanRunId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `scan-${crypto.randomUUID()}`;
  }
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function scanProgressLabel(progress: ScanProgress | null): string {
  if (!progress) return "Preparing scan progress.";
  const source = progress.source_label ?? "Preparing source";
  const fileTotal = progress.source_file_count === null
    ? progress.source_files_discovered
      ? `discovering files · ${progress.source_files_discovered.toLocaleString()} found`
      : "discovering files"
    : `${progress.source_files_seen.toLocaleString()} / ${progress.source_file_count.toLocaleString()} files`;
  const sourcePosition = progress.source_count
    ? `source ${progress.source_index.toLocaleString()} / ${progress.source_count.toLocaleString()}`
    : "source pending";
  const limit = progress.limit === null ? "" : ` · limit ${progress.limit.toLocaleString()}`;
  return `${source}: ${fileTotal} · ${progress.prompts_found.toLocaleString()} prompts · ${sourcePosition}${limit}`;
}

function importStateProgressPercent(state: ImportState): number {
  if (state.total_files === 0) return state.completed ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((state.processed_files / state.total_files) * 100)));
}

function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return unit === 0 ? `${bytes} ${units[unit]}` : `${value.toFixed(1)} ${units[unit]}`;
}

function App() {
  const browserQaMode = isBrowserQaMode();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [planState, setPlanState] = useState<PlanState>("idle");
  const [storedLoadState, setStoredLoadState] = useState<StoredLoadState>("idle");
  const [importState, setImportState] = useState<ImportRunState>("idle");
  const [importStatesState, setImportStatesState] = useState<ImportStatesState>("idle");
  const [importEventsState, setImportEventsState] = useState<ImportEventsState>("idle");
  const [storedFacetsState, setStoredFacetsState] = useState<StoredFacetsState>("idle");
  const [importMode, setImportMode] = useState<ImportRunMode | null>(null);
  const [activeImportSourceId, setActiveImportSourceId] = useState<string | null>(null);
  const [selectedImportSourceIds, setSelectedImportSourceIds] = useState<string[]>([]);
  const [importQueueSourceIds, setImportQueueSourceIds] = useState<string[]>([]);
  const [completedQueueSourceCount, setCompletedQueueSourceCount] = useState(0);
  const [stopRequested, setStopRequested] = useState(false);
  const [plan, setPlan] = useState<ScanPlan | null>(null);
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(null);
  const [importStatesResult, setImportStatesResult] = useState<ImportStatesResult | null>(null);
  const [importEventsResult, setImportEventsResult] = useState<ImportEventsResult | null>(null);
  const [storedFacetsResult, setStoredFacetsResult] = useState<StoredPromptFacetsResult | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanProgressInfo, setScanProgressInfo] = useState<ScanProgress | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [storedFilters, setStoredFilters] = useState<StoredPromptFilters>({
    date: "",
    query: "",
    source: "",
    workspace: "",
  });
  const [limit, setLimit] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("latest");
  const [error, setError] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [improvement, setImprovement] = useState<ImproveResult | null>(null);
  const [improvementPromptId, setImprovementPromptId] = useState<string | null>(null);
  const importStopRequestedRef = useRef(false);
  const scanRunIdRef = useRef<string | null>(null);
  const topLevelActionClaimRef = useRef(false);
  const storedFacetsRefreshClaimRef = useRef(false);
  const importStatesRefreshClaimRef = useRef(false);
  const importEventsRefreshClaimRef = useRef(false);
  const isImportRunning = importState === "importing";
  const isScanRunning = scanState === "scanning" || scanState === "canceling";
  const isStoredLoadRunning = storedLoadState === "loading";
  const actionLockState = {
    importRunning: isImportRunning,
    improvementRunning: improving,
    scanRunning: isScanRunning,
    storedLoadRunning: isStoredLoadRunning,
  };
  const isTopLevelActionLocked = topLevelActionLocked(actionLockState);
  const isImportActionLocked = importActionLocked(actionLockState);
  const canStopScan = scanRunIdRef.current !== null && isScanRunning;
  const scanProgressText = scanProgressLabel(scanProgressInfo);
  const importStatesFailureMessage = importRefreshFailureText(
    importStatesState,
    "saved import progress",
  );
  const importEventsFailureMessage = importRefreshFailureText(
    importEventsState,
    "import activity",
  );

  const prompts = result?.prompts ?? [];
  const promptListMode = effectivePromptListMode(result?.preview_sort, previewMode);
  const filteredPrompts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? prompts.filter((prompt) => {
          return (
            prompt.text.toLowerCase().includes(needle) ||
            prompt.source.toLowerCase().includes(needle) ||
            (prompt.cwd ?? "").toLowerCase().includes(needle)
          );
        })
      : prompts;

    if (promptListMode === "weakest") return matches.slice(0, 200);
    return matches.slice(-200).reverse();
  }, [promptListMode, prompts, query]);

  const selectedPrompt = useMemo(() => {
    return selectedPromptForView(filteredPrompts, selectedId);
  }, [filteredPrompts, selectedId]);
  const hasPromptResult = result !== null;
  const sourceSummaries = result?.stats.source_summaries ?? [];
  const sourceSummariesEmptyMessage = sourceSummariesEmptyText(hasPromptResult);
  const promptListEmptyMessage = promptListEmptyText(hasPromptResult, query);
  const selectedPromptEmptyMessage = selectedPromptEmptyText(hasPromptResult, query);
  const activeImportSource = useMemo(() => {
    return plan?.sources.find((source) => source.id === activeImportSourceId) ?? null;
  }, [activeImportSourceId, plan]);
  const selectedImportQueueSourceIds = useMemo(() => {
    return selectedQueueSourceIds(selectedImportSourceIds, plan?.sources ?? []);
  }, [plan?.sources, selectedImportSourceIds]);
  const activeImprovement = activeImprovementForSelection(
    improvement,
    improvementPromptId,
    selectedPrompt?.id ?? null,
  );
  const recommendationEmptyMessage = recommendationEmptyText(
    selectedPrompt !== null,
    hasPromptResult,
    query,
  );
  const storedFilterCount = activeStoredPromptFilterCount(storedFilters);
  const storedSourceSuggestions = useMemo(() => {
    const sourceLabels = storedFacetsResult?.sources.map((source) => source.text)
      ?? (result?.stats.source_summaries ?? []).map((source) => source.label);
    return [...new Set(sourceLabels)]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [result?.stats.source_summaries, storedFacetsResult?.sources]);
  const storedDateSuggestions = useMemo(() => {
    return storedFacetsResult?.dates.map((date) => date.text)
      ?? (result?.stats.prompts_by_date ?? []).map((date) => date.text);
  }, [result?.stats.prompts_by_date, storedFacetsResult?.dates]);
  const storedWorkspaceSuggestions = useMemo(() => {
    return storedFacetsResult?.workspaces.map((workspace) => workspace.text) ?? [];
  }, [storedFacetsResult?.workspaces]);
  const storedFacetSummary = storedFacetsResult
    ? `${storedFacetsResult.total_prompts.toLocaleString()} stored, ${storedFacetsResult.sources.length.toLocaleString()} sources, ${storedFacetsResult.dates.length.toLocaleString()} dates, ${storedFacetsResult.workspaces.length.toLocaleString()} workspaces`
    : storedFacetsState === "loading"
      ? "loading stored facets"
      : storedFilterCount
        ? `${storedFilterCount} filters active`
        : "all stored prompts";
  const displayDatabasePath =
    result?.persistence?.database_path ?? storedFacetsResult?.database_path ?? "database not updated";
  const displayStoredPromptCount =
    result?.persistence?.stored_prompt_count ?? storedFacetsResult?.total_prompts ?? 0;
  const displayStoredDateCount =
    result?.persistence?.date_count ?? storedFacetsResult?.dates.length ?? 0;

  useEffect(() => {
    void refreshStoredFacets();
    void refreshImportStates();
    void refreshImportEvents();
  }, []);

  useEffect(() => {
    const runId = scanRunIdRef.current;
    if (!isScanRunning || !runId) return;
    const activeRunId = runId;
    let stopped = false;
    let timer: number | undefined;

    async function pollScanProgress() {
      try {
        const progress = await scanProgress(activeRunId);
        if (stopped) return;
        setScanProgressInfo(progress);
        timer = window.setTimeout(
          pollScanProgress,
          progress.active ? SCAN_PROGRESS_POLL_MS : SCAN_PROGRESS_POLL_MS * 2,
        );
      } catch {
        if (!stopped) {
          timer = window.setTimeout(pollScanProgress, SCAN_PROGRESS_POLL_MS * 2);
        }
      }
    }

    void pollScanProgress();
    return () => {
      stopped = true;
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [isScanRunning, scanState]);

  async function refreshStoredFacets({ quiet = false }: { quiet?: boolean } = {}) {
    if (!claimExclusiveAction(storedFacetsRefreshClaimRef)) return;
    if (!quiet) setStoredFacetsState("loading");
    try {
      const next = await listStoredPromptFacets();
      setStoredFacetsResult(next);
      setStoredFacetsState("ready");
    } catch (err) {
      setStoredFacetsState("failed");
      if (!quiet) setError(errorText(err));
    } finally {
      releaseExclusiveAction(storedFacetsRefreshClaimRef);
    }
  }

  async function refreshImportStates({ quiet = false }: { quiet?: boolean } = {}) {
    if (!claimExclusiveAction(importStatesRefreshClaimRef)) return;
    if (!quiet) setImportStatesState("loading");
    try {
      const next = await listImportStates();
      setImportStatesResult(next);
      setImportStatesState("ready");
    } catch (err) {
      setImportStatesState("failed");
      if (!quiet) setError(errorText(err));
    } finally {
      releaseExclusiveAction(importStatesRefreshClaimRef);
    }
  }

  async function refreshImportEvents({ quiet = false }: { quiet?: boolean } = {}) {
    if (!claimExclusiveAction(importEventsRefreshClaimRef)) return;
    if (!quiet) setImportEventsState("loading");
    try {
      const next = await listImportEvents({ limit: 20 });
      setImportEventsResult(next);
      setImportEventsState("ready");
    } catch (err) {
      setImportEventsState("failed");
      if (!quiet) setError(errorText(err));
    } finally {
      releaseExclusiveAction(importEventsRefreshClaimRef);
    }
  }

  async function runPlan() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setPlanState("planning");
    try {
      const next = await planScan();
      setPlan(next);
      setSelectedImportSourceIds((current) => selectedQueueSourceIds(current, next.sources));
      setPlanState("ready");
    } catch (err) {
      setError(errorText(err));
      setPlanState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function runImportSource(sourceId: string, mode: ImportRunMode): Promise<ImportBatchResult | null> {
    let next: ImportBatchResult | null = null;
    do {
      next = await importBatch({
        source_id: sourceId,
        file_batch_size: IMPORT_BATCH_FILES,
        preview_limit: 25,
      });
      setImportResult(next);
      if (mode === "single" || next.state.completed || importStopRequestedRef.current) {
        break;
      }
      await waitForNextImportBatch();
    } while (!importStopRequestedRef.current);
    return next;
  }

  async function runImportBatch(sourceId: string, mode: ImportRunMode) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setActiveImportSourceId(sourceId);
    setImportMode(mode);
    setImportQueueSourceIds([]);
    setCompletedQueueSourceCount(0);
    setStopRequested(false);
    setImportResult(null);
    importStopRequestedRef.current = false;
    setImportState("importing");
    try {
      const next = await runImportSource(sourceId, mode);

      setImportState(
        importStopRequestedRef.current && !next?.state.completed ? "stopped" : "ready",
      );
    } catch (err) {
      setError(errorText(err));
      setImportState("failed");
    } finally {
      setStopRequested(false);
      importStopRequestedRef.current = false;
      try {
        await refreshImportStates({ quiet: true });
        await refreshImportEvents({ quiet: true });
        await refreshStoredFacets({ quiet: true });
      } finally {
        releaseExclusiveAction(topLevelActionClaimRef);
      }
    }
  }

  async function runSelectedImportQueue() {
    const queue = selectedImportQueueSourceIds;
    if (!queue.length) return;
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setImportMode("queue");
    setImportQueueSourceIds(queue);
    setCompletedQueueSourceCount(0);
    setStopRequested(false);
    setImportResult(null);
    importStopRequestedRef.current = false;
    setImportState("importing");
    try {
      let lastResult: ImportBatchResult | null = null;
      for (const [index, sourceId] of queue.entries()) {
        if (importStopRequestedRef.current) break;
        setCompletedQueueSourceCount(index);
        setActiveImportSourceId(sourceId);
        lastResult = await runImportSource(sourceId, "queue");
        if (importStopRequestedRef.current && !lastResult?.state.completed) break;
      }
      setCompletedQueueSourceCount((count) => {
        if (importStopRequestedRef.current) return count;
        return queue.length;
      });
      setImportState(importStopRequestedRef.current ? "stopped" : "ready");
    } catch (err) {
      setError(errorText(err));
      setImportState("failed");
    } finally {
      setStopRequested(false);
      importStopRequestedRef.current = false;
      try {
        await refreshImportStates({ quiet: true });
        await refreshImportEvents({ quiet: true });
        await refreshStoredFacets({ quiet: true });
      } finally {
        releaseExclusiveAction(topLevelActionClaimRef);
      }
    }
  }

  function requestStopImport() {
    importStopRequestedRef.current = true;
    setStopRequested(true);
  }

  async function runScan() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setImprovement(null);
    setImprovementPromptId(null);
    try {
      const parsedLimit = parseRequiredScanLimit(limit);
      const runId = createScanRunId();
      scanRunIdRef.current = runId;
      setScanProgressInfo(null);
      setScanState("scanning");
      const next = await scanPrompts({
        limit: parsedLimit,
        preview_limit: PREVIEW_LIMIT,
        preview_sort: previewSortForMode(previewMode),
        include_markdown: false,
        persist_on_cancel: false,
        run_id: runId,
      });
      const loadedMode = effectivePromptListMode(next.preview_sort, previewMode);
      setResult(next);
      setSelectedId(
        (loadedMode === "weakest"
          ? next.prompts[0]
          : next.prompts[next.prompts.length - 1]
        )?.id ?? null,
      );
      setScanState("ready");
      await refreshStoredFacets({ quiet: true });
    } catch (err) {
      setError(errorText(err));
      setScanState("failed");
    } finally {
      scanRunIdRef.current = null;
      setScanProgressInfo(null);
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function requestStopScan() {
    const runId = scanRunIdRef.current;
    if (!runId) return;
    setScanState("canceling");
    try {
      const result = await cancelScan(runId);
      if (!result.canceled) {
        setError("No active scan was found to stop.");
      }
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function runLoadStored() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setImprovement(null);
    setImprovementPromptId(null);
    setStoredLoadState("loading");
    try {
      const next = await loadStoredPrompts({
        ...storedPromptLoadOptions(storedFilters, previewMode, PREVIEW_LIMIT),
      });
      const loadedMode = effectivePromptListMode(next.preview_sort, previewMode);
      setResult(next);
      setSelectedId(
        (loadedMode === "weakest"
          ? next.prompts[0]
          : next.prompts[next.prompts.length - 1]
        )?.id ?? null,
      );
      setStoredLoadState("ready");
    } catch (err) {
      setError(errorText(err));
      setStoredLoadState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  function updateStoredFilter(key: keyof StoredPromptFilters, value: string) {
    setStoredFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetStoredFilters() {
    setStoredFilters({
      date: "",
      query: "",
      source: "",
      workspace: "",
    });
  }

  async function runImprove(prompt: PromptRecord | null) {
    if (!prompt) return;
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setImproving(true);
    setError(null);
    const started = improvementRequestStarted<ImproveResult>(prompt.id);
    setImprovement(started.improvement);
    setImprovementPromptId(started.improvementPromptId);
    try {
      const next = await improvePrompt({
        prompt: prompt.text,
        context: `${prompt.source} · ${prompt.cwd ?? "unknown workspace"}`,
      });
      setImprovement(next);
      setImprovementPromptId(prompt.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setImproving(false);
      releaseExclusiveAction(topLevelActionClaimRef);
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
          <div className="segmented" aria-label="Preview mode" role="group">
            <button
              className={previewMode === "latest" ? "active" : ""}
              disabled={isTopLevelActionLocked}
              onClick={() => setPreviewMode("latest")}
              type="button"
            >
              Latest
            </button>
            <button
              className={previewMode === "weakest" ? "active" : ""}
              disabled={isTopLevelActionLocked}
              onClick={() => setPreviewMode("weakest")}
              type="button"
            >
              Weakest
            </button>
          </div>
          <label className="limit-control">
            <span>Limit</span>
            <input
              data-scan-limit="true"
              disabled={isTopLevelActionLocked}
              min={1}
              max={MAX_SCAN_LIMIT}
              step={100}
              type="number"
              placeholder="Required"
              value={limit}
              onChange={(event) => setLimit(event.currentTarget.value)}
            />
          </label>
          <button
            className="primary"
            data-run-scan="true"
            disabled={isTopLevelActionLocked}
            onClick={runScan}
            type="button"
          >
            <RefreshCw size={18} />
            {scanState === "canceling" ? "Stopping" : scanState === "scanning" ? "Scanning" : "Scan"}
          </button>
          {canStopScan ? (
            <button
              className="secondary-action stop-action"
              data-stop-scan="true"
              disabled={scanState === "canceling"}
              onClick={requestStopScan}
              type="button"
            >
              <StopCircle size={18} />
              {scanState === "canceling" ? "Stopping" : "Stop"}
            </button>
          ) : null}
          <button
            className="secondary-action"
            data-load-stored-prompts="true"
            disabled={isTopLevelActionLocked}
            onClick={runLoadStored}
            type="button"
          >
            <Database size={18} />
            {isStoredLoadRunning ? "Loading Stored" : "Load Stored"}
          </button>
          <button
            className="secondary-action"
            data-run-plan="true"
            disabled={planState === "planning" || isTopLevelActionLocked}
            onClick={runPlan}
            type="button"
          >
            <ClipboardList size={18} />
            {planState === "planning" ? "Planning" : "Plan"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="notice error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </section>
      ) : null}

      {browserQaMode ? (
        <section className="notice browser-mode">
          <ShieldCheck size={18} />
          <span>{BROWSER_BRIDGE_NOTICE}</span>
        </section>
      ) : null}

      {isScanRunning ? (
        <section className="notice scan-progress" data-scan-progress="true">
          <RefreshCw size={18} />
          <span>{scanProgressText}</span>
        </section>
      ) : null}

      <section className="panel stored-filter-panel">
        <div className="panel-heading">
          <h2>Stored Vault</h2>
          <span>{storedFacetSummary}</span>
        </div>
        <form
          className="stored-filter-grid"
          data-stored-filter-form="true"
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
              event.preventDefault();
              void runLoadStored();
            }
          }}
          onSubmit={(event) => {
            event.preventDefault();
            void runLoadStored();
          }}
        >
          <label className="stored-filter-control">
            <span>Text</span>
            <input
              data-stored-filter-query="true"
              disabled={isTopLevelActionLocked}
              value={storedFilters.query}
              placeholder="cmux, source, workspace"
              onChange={(event) => updateStoredFilter("query", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>Source</span>
            <input
              data-stored-filter-source="true"
              disabled={isTopLevelActionLocked}
              list="stored-source-options"
              value={storedFilters.source}
              placeholder="Any source"
              onChange={(event) => updateStoredFilter("source", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>Date</span>
            <input
              data-stored-filter-date="true"
              disabled={isTopLevelActionLocked}
              list="stored-date-options"
              value={storedFilters.date}
              placeholder="YYYY-MM-DD"
              onChange={(event) => updateStoredFilter("date", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>Workspace</span>
            <input
              data-stored-filter-workspace="true"
              disabled={isTopLevelActionLocked}
              list="stored-workspace-options"
              value={storedFilters.workspace}
              placeholder="PromptVault"
              onChange={(event) => updateStoredFilter("workspace", event.currentTarget.value)}
            />
          </label>
          <button
            className="inline-action"
            data-apply-stored-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Database size={15} />
            Apply
          </button>
          <button
            className="inline-action"
            data-reset-stored-filters="true"
            disabled={!storedFilterCount || isTopLevelActionLocked}
            onClick={resetStoredFilters}
            type="button"
          >
            Reset
          </button>
        </form>
        <datalist id="stored-source-options">
          {storedSourceSuggestions.map((source) => (
            <option key={source} value={source} />
          ))}
        </datalist>
        <datalist id="stored-date-options">
          {storedDateSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="stored-workspace-options">
          {storedWorkspaceSuggestions.map((workspace) => (
            <option key={workspace} value={workspace} />
          ))}
        </datalist>
      </section>

      {importStatesResult || importStatesState === "loading" || importStatesFailureMessage ? (
        <section className="panel saved-import-panel">
          <div className="panel-heading">
            <h2>Saved Import Progress</h2>
            <button
              className="inline-action"
              data-refresh-import-states="true"
              disabled={importStatesState === "loading" || isTopLevelActionLocked}
              onClick={() => refreshImportStates()}
              type="button"
            >
              <RefreshCw size={15} />
              {importStatesState === "loading" ? "Loading" : "Refresh"}
            </button>
          </div>
          {importStatesFailureMessage ? (
            <div className="notice warning panel-notice" data-import-states-refresh-error="true">
              <AlertTriangle size={18} />
              <span>{importStatesFailureMessage}</span>
            </div>
          ) : null}
          {importStatesResult ? (
            <>
              <div className="saved-import-summary">
                <div>
                  <span>Sources</span>
                  <strong>
                    {importStatesResult.completed_sources.toLocaleString()} /{" "}
                    {importStatesResult.total_sources.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>Files</span>
                  <strong>
                    {importStatesResult.processed_files.toLocaleString()} /{" "}
                    {importStatesResult.total_files.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>Imported Prompts</span>
                  <strong>{importStatesResult.imported_prompt_count.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Database</span>
                  <strong>{importStatesResult.database_path}</strong>
                </div>
              </div>
              {importStatesResult.states.length ? (
                <div className="saved-import-list">
                  {importStatesResult.states.slice(0, 8).map((state) => (
                    <div className="saved-import-row" key={state.source_id}>
                      <div>
                        <strong>{state.source_label}</strong>
                        <span>{state.updated_at}</span>
                      </div>
                      <progress value={importStateProgressPercent(state)} max={100} />
                      <span>
                        {state.processed_files.toLocaleString()} / {state.total_files.toLocaleString()}
                        {state.completed ? " · complete" : " · resumable"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty compact">No saved import cursors yet.</div>
              )}
            </>
          ) : (
            <div className="empty compact" data-empty-import-states="true">
              {importRefreshUnavailableText(importStatesState, "saved import progress")}
            </div>
          )}
        </section>
      ) : null}

      {result ? (
        <section className="notice">
          <FileText size={18} />
          <span>
            {displayDatabasePath} · stored {displayStoredPromptCount.toLocaleString()} · new{" "}
            {(result.persistence?.inserted_prompt_count ?? 0).toLocaleString()} · updated{" "}
            {(result.persistence?.updated_prompt_count ?? 0).toLocaleString()}
          </span>
        </section>
      ) : null}

      {result?.output_path ? (
        <section className="notice secondary">
          <FileText size={18} />
          <span>
            Export {result.output_path} · preview {result.returned_prompt_count.toLocaleString()} /{" "}
            {result.stats.total_prompts.toLocaleString()}
          </span>
        </section>
      ) : null}

      {result?.warnings.length ? (
        <section className="notice warning">
          <AlertTriangle size={18} />
          <span>{result.warnings.join(" ")}</span>
        </section>
      ) : null}

      {plan?.warnings.length ? (
        <section className="notice warning">
          <AlertTriangle size={18} />
          <span>{plan.warnings.join(" ")}</span>
        </section>
      ) : null}

      {importEventsResult || importEventsState === "loading" || importEventsFailureMessage ? (
        <section className="panel import-activity-panel">
          <div className="panel-heading">
            <h2>Recent Import Activity</h2>
            <button
              className="inline-action"
              data-refresh-import-events="true"
              disabled={importEventsState === "loading" || isTopLevelActionLocked}
              onClick={() => refreshImportEvents()}
              type="button"
            >
              <RefreshCw size={15} />
              {importEventsState === "loading" ? "Loading" : "Refresh"}
            </button>
          </div>
          {importEventsFailureMessage ? (
            <div className="notice warning panel-notice" data-import-events-refresh-error="true">
              <AlertTriangle size={18} />
              <span>{importEventsFailureMessage}</span>
            </div>
          ) : null}
          {importEventsResult ? (
            <>
              <div className="import-activity-summary">
                <div>
                  <span>Total Events</span>
                  <strong>{importEventsResult.total_events.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Database</span>
                  <strong>{importEventsResult.database_path}</strong>
                </div>
              </div>
              {importEventsResult.events.length ? (
                <div className="import-activity-list">
                  {importEventsResult.events.map((event) => (
                    <div className="import-activity-row" key={event.id}>
                      <div>
                        <strong>{event.source_label}</strong>
                        <span>{new Date(event.generated_at).toLocaleString()}</span>
                      </div>
                      <span>{importEventBatchSummary(event)}</span>
                      <span>
                        {event.processed_files.toLocaleString()} / {event.total_files.toLocaleString()} ·{" "}
                        {importEventStatusLabel(event)}
                      </span>
                      <span>
                        {event.warnings.length
                          ? `${event.warnings.length.toLocaleString()} warnings`
                          : "no warnings"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty compact">No import activity recorded yet.</div>
              )}
            </>
          ) : (
            <div className="empty compact" data-empty-import-events="true">
              {importRefreshUnavailableText(importEventsState, "import activity")}
            </div>
          )}
        </section>
      ) : null}

      {plan ? (
        <section className="panel plan-panel">
          <div className="panel-heading">
            <h2>Import Plan</h2>
            <span>{new Date(plan.generated_at).toLocaleString()}</span>
          </div>
          <div className="plan-summary">
            <div>
              <span>Sources</span>
              <strong>
                {plan.available_sources} / {plan.total_sources}
              </strong>
            </div>
            <div>
              <span>Files</span>
              <strong>{plan.total_files.toLocaleString()}</strong>
            </div>
            <div>
              <span>Size</span>
              <strong>{formatBytes(plan.total_bytes)}</strong>
            </div>
            <div>
              <span>Large Files</span>
              <strong>{plan.large_file_count.toLocaleString()}</strong>
            </div>
          </div>
          <div className="plan-toolbar">
            <span>{selectedImportQueueSourceIds.length.toLocaleString()} selected</span>
            <button
              className="inline-action"
              data-import-selected="true"
              disabled={isImportActionLocked || selectedImportQueueSourceIds.length === 0}
              onClick={runSelectedImportQueue}
              type="button"
            >
              <Play size={15} />
              {isImportRunning && importMode === "queue" ? "Running Queue" : "Run Selected"}
            </button>
          </div>
          <div className="plan-sources">
            {plan.sources.map((source) => (
              <div className="plan-source-row" key={source.id}>
                <div className="plan-source-main">
                  <label className="source-select">
                    <input
                      checked={selectedImportSourceIds.includes(source.id)}
                      data-select-source-id={source.id}
                      disabled={isImportActionLocked || source.file_count === 0}
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setSelectedImportSourceIds((current) =>
                          toggleSourceSelection(current, source.id, checked),
                        );
                      }}
                      type="checkbox"
                    />
                    <strong>{source.label}</strong>
                  </label>
                  <span>{source.root_path}</span>
                  {source.notes.length ? <span className="source-meta">{source.notes.join(" ")}</span> : null}
                </div>
                <div className={`status ${source.status}`}>
                  {source.status === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  {source.file_count.toLocaleString()} · {formatBytes(source.byte_count)}
                </div>
                <div className="plan-source-actions">
                  <button
                    className="inline-action"
                    data-import-source-id={source.id}
                    disabled={isImportActionLocked || source.file_count === 0}
                    onClick={() => runImportBatch(source.id, "single")}
                    type="button"
                  >
                    <RefreshCw size={15} />
                    {isImportRunning && activeImportSourceId === source.id && importMode === "single"
                      ? "Importing"
                      : "Import Batch"}
                  </button>
                  <button
                    className="inline-action"
                    data-import-continuous-source-id={source.id}
                    disabled={isImportActionLocked || source.file_count === 0}
                    onClick={() => runImportBatch(source.id, "continuous")}
                    type="button"
                  >
                    <Play size={15} />
                    {isImportRunning && activeImportSourceId === source.id && importMode === "continuous"
                      ? "Running"
                      : "Run Until Done"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {importResult || isImportRunning ? (
        <section className="panel import-panel">
          <div className="panel-heading">
            <h2>Incremental Import</h2>
            <span>{importResult ? new Date(importResult.generated_at).toLocaleString() : "starting"}</span>
            {isImportRunning && (importMode === "continuous" || importMode === "queue") ? (
              <button
                className="inline-action stop-action"
                data-stop-import="true"
                disabled={stopRequested}
                onClick={requestStopImport}
                type="button"
              >
                <StopCircle size={15} />
                {stopRequested ? "Stopping" : "Stop"}
              </button>
            ) : null}
          </div>
          <div className="import-progress" aria-live="polite">
            <progress value={importProgressPercent(importResult)} max={100} />
            <span>{importProgressPercent(importResult)}%</span>
          </div>
          <div className="import-summary">
            <div>
              <span>Source</span>
              <strong>{importResult?.state.source_label ?? activeImportSource?.label ?? "Selected source"}</strong>
            </div>
            <div>
              <span>Processed</span>
              <strong>
                {(importResult?.state.processed_files ?? 0).toLocaleString()} /{" "}
                {(importResult?.state.total_files ?? activeImportSource?.file_count ?? 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span>Batch</span>
              <strong>
                {importResult
                  ? `${importResult.batch_file_count.toLocaleString()} files · ${importResult.batch_prompt_count.toLocaleString()} prompts`
                  : `${IMPORT_BATCH_FILES.toLocaleString()} files per batch`}
              </strong>
            </div>
            {importQueueSourceIds.length ? (
              <div>
                <span>Queue</span>
                <strong>
                  {Math.min(
                    completedQueueSourceCount + (isImportRunning ? 1 : 0),
                    importQueueSourceIds.length,
                  ).toLocaleString()}{" "}
                  / {importQueueSourceIds.length.toLocaleString()}
                </strong>
              </div>
            ) : null}
            <div>
              <span>Status</span>
              <strong>{importStatusLabel(importResult, importState, importMode, stopRequested)}</strong>
            </div>
          </div>
          {importResult ? (
            <div className="notice secondary">
              <FileText size={18} />
              <span>
                {importResult.persistence.database_path} · stored{" "}
                {importResult.persistence.stored_prompt_count.toLocaleString()} · new{" "}
                {importResult.persistence.inserted_prompt_count.toLocaleString()} · updated{" "}
                {importResult.persistence.updated_prompt_count.toLocaleString()}
              </span>
            </div>
          ) : null}
          {importResult?.warnings.length ? (
            <div className="warning-list">
              {importResult.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="metrics">
        <Metric icon={<ClipboardList size={18} />} label="Prompts" value={result?.stats.total_prompts ?? 0} />
        <Metric icon={<Search size={18} />} label="Preview" value={result?.returned_prompt_count ?? 0} />
        <Metric icon={<FileText size={18} />} label="Files" value={result?.stats.total_files ?? 0} />
        <Metric icon={<Brain size={18} />} label="Words" value={result?.stats.total_words ?? 0} />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="Quality"
          value={(result?.stats.average_quality ?? 0).toFixed(1)}
        />
        <Metric
          icon={<AlertTriangle size={18} />}
          label="Weak"
          value={result?.stats.weak_prompt_count ?? 0}
        />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="DB Stored"
          value={displayStoredPromptCount}
        />
        <Metric icon={<FileText size={18} />} label="Dates" value={displayStoredDateCount} />
      </section>

      <section className="workspace">
        <aside className="panel sources-panel">
          <div className="panel-heading">
            <h2>Sources</h2>
            <span>{result?.generated_at ? new Date(result.generated_at).toLocaleString() : "not scanned"}</span>
          </div>
          <div className="sources">
            {sourceSummaries.length ? (
              sourceSummaries.map((source) => (
                <div className="source-row" key={source.id}>
                  <div>
                    <strong>{source.label}</strong>
                    <span>{source.root_path}</span>
                    <span className="source-meta">
                      Q {source.average_quality.toFixed(1)} · Weak {source.weak_prompt_count}
                    </span>
                  </div>
                  <div className={`status ${source.status}`}>
                    {source.status === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {source.prompts_found}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty compact" data-empty-sources="true">
                {sourceSummariesEmptyMessage}
              </div>
            )}
          </div>
        </aside>

        <section className="panel analysis-panel">
          <div className="panel-heading">
            <h2>Frequency</h2>
            <span>words and prompt starts</span>
          </div>
          <div className="frequency-grid">
            <FrequencyColumn
              title="Words"
              items={result?.stats.top_words ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "Words")}
            />
            <FrequencyColumn
              title="Phrases"
              items={result?.stats.top_phrases ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "Phrases")}
            />
            <FrequencyColumn
              title="Repeats"
              items={result?.stats.repeated_prompts ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "Repeats")}
            />
            <FrequencyColumn
              title="Dates"
              items={result?.stats.prompts_by_date ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "Dates")}
            />
            <FrequencyColumn
              title="Quality gaps"
              items={result?.stats.top_quality_gaps ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "Quality gaps")}
            />
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
                    result.prompts_truncated
                      ? result.preview_sort === "quality_asc"
                        ? " · weakest preview"
                        : " · latest preview"
                      : ""
                  }`
                : "not loaded"}
            </span>
            <div className="searchbox">
              <Search size={16} />
              <input
                aria-label="Filter prompts"
                data-prompt-filter="true"
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
                type="button"
              >
                <span className="prompt-meta">
                  {prompt.source} · {prompt.word_count} words
                </span>
                <span className={`quality-pill ${prompt.quality.band}`}>
                  {prompt.quality.score} · {prompt.quality.band}
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
            {filteredPrompts.length === 0 && promptListEmptyMessage ? (
              <div className="empty compact" data-empty-prompts="true">
                {promptListEmptyMessage}
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h2>Selected</h2>
            <button
              data-run-improve="true"
              disabled={!selectedPrompt || improving || isTopLevelActionLocked}
              onClick={() => runImprove(selectedPrompt)}
              type="button"
            >
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
                <span>
                  {selectedPrompt.quality.score} · {selectedPrompt.quality.band}
                </span>
              </div>
              {selectedPrompt.quality.suggestions.length ? (
                <div className="quality-box">
                  {selectedPrompt.quality.suggestions.map((suggestion) => (
                    <p key={suggestion}>{suggestion}</p>
                  ))}
                </div>
              ) : null}
              <pre className="prompt-text">{selectedPrompt.text}</pre>
            </>
          ) : (
            <div className="empty" data-empty-selected-prompt="true">
              {selectedPromptEmptyMessage}
            </div>
          )}
        </section>

        <section className="panel improve-panel">
          <div className="panel-heading">
            <h2>Recommendation</h2>
            <span>{activeImprovement?.provider ?? "local/GLM"}</span>
          </div>
          {activeImprovement ? (
            <>
              <div className="quality-delta">
                <strong>
                  {activeImprovement.quality_delta.before.score}
                  {" -> "}
                  {activeImprovement.quality_delta.after.score}
                  <span>
                    {activeImprovement.quality_delta.score_delta >= 0 ? "+" : ""}
                    {activeImprovement.quality_delta.score_delta}
                  </span>
                </strong>
                {activeImprovement.quality_delta.resolved_gaps.length ? (
                  <p>
                    Resolved:{" "}
                    {activeImprovement.quality_delta.resolved_gaps
                      .slice(0, 4)
                      .join(", ")}
                  </p>
                ) : (
                  <p>
                    Remaining:{" "}
                    {activeImprovement.quality_delta.remaining_gaps
                      .slice(0, 4)
                      .join(", ") || "none"}
                  </p>
                )}
              </div>
              <pre className="prompt-text revised">{activeImprovement.revised_prompt}</pre>
              <div className="advice">
                {activeImprovement.rationale.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              {activeImprovement.warnings.length ? (
                <div className="warning-list">
                  {activeImprovement.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="empty" data-empty-recommendation="true">
              {recommendationEmptyMessage}
            </div>
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
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
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
        <p className="empty compact" data-empty-frequency={title}>
          {emptyText}
        </p>
      )}
    </div>
  );
}

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}

export default App;
