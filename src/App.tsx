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
  XCircle,
} from "lucide-react";
import "./App.css";
import {
  claimExclusiveAction,
  importActionLocked,
  releaseExclusiveAction,
  topLevelActionLocked,
} from "./actionLocks";
import { frequencyEmptyText, sourceSummariesEmptyText } from "./analysisEmptyState";
import {
  type BrowserBridgeStatus,
  browserBridgeUnavailableMessage,
  browserBridgeStatusText,
  checkBrowserBridgeHealth,
} from "./browserBridge";
import { displayErrorText } from "./errorDisplay";
import { importEventBatchSummary, importEventStatusLabel, importEventWarningSummary } from "./importEvents";
import {
  activeImprovementForSelection,
  buildImprovePromptRequest,
  improvementActionLabel,
  improvementFailureText,
  improvementRequestStarted,
  improvementSelectionChanged,
  shouldClearImprovementOnPromptSelect,
} from "./improvementSelection";
import {
  importProgressDisplay,
  importProgressLabel,
  importStateProgressPercent,
  importProgressValueText,
  importRunFailureText,
  importStopActionLabel,
  importStopNoticeText,
  importStatusLabel,
  type ImportRunMode,
  type ImportRunState,
} from "./importProgress";
import { importRefreshFailureText, importRefreshUnavailableText } from "./importRefreshState";
import {
  availableQueueSourceIds,
  importQueueActionLabel,
  importQueueClearSelectionLabel,
  importQueueFinalState,
  importQueueSelectionSummaryLabel,
  importQueueSelectAllLabel,
  plannedQueueSourceIds,
  selectedQueueSourceIds,
  toggleSourceSelection,
} from "./importQueue";
import { ALERT_NOTICE_PROPS, STATUS_NOTICE_PROPS } from "./noticeA11y";
import { panelRefreshActionLabel, refreshGlobalErrorAfterSuccess } from "./panelRefresh";
import { planFailureText, planUnavailableText, type PlanRunState } from "./planStatus";
import {
  effectivePromptListMode,
  pendingPreviewModeNotice,
  previewSortForMode,
  shouldReloadStoredPreview,
  type PreviewMode,
  type PromptResultOrigin,
} from "./previewMode";
import {
  promptListEmptyText,
  recommendationEmptyText,
  selectedPromptEmptyText,
} from "./promptEmptyState";
import {
  pathDisplayText,
  promptProviderDisplayText,
  promptQualitySuggestionText,
  promptRowAriaLabel,
  promptMetadataDisplayText,
  promptRowPreviewText,
  promptTimestampDisplayText,
  redactSensitiveDisplayText,
  selectedPromptDisplayText,
  selectedPromptMetaLabel,
  sourceLabelDisplayText,
} from "./promptRowA11y";
import { qualityGapLabel, qualityGapSummary } from "./qualityGaps";
import { qualityBandClass, qualityBandLabel } from "./qualityLabels";
import { riskFlagLabel } from "./riskLabels";
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
import {
  MAX_SCAN_LIMIT,
  RECOMMENDED_SCAN_LIMIT,
  parseRequiredScanLimit,
  recommendedInitialScanLimit,
} from "./scanLimit";
import { QUICK_SCAN_SOURCE_LIMIT, quickScanSourceIds } from "./scanScope";
import {
  scanLimitChangedAfterFailure,
  scanProgressLabel,
  scanRunFailureText,
  scanStopFailureText,
  type ScanRunState,
  type ScanStopFailure,
} from "./scanStatus";
import { selectedPromptForView } from "./selection";
import {
  isSourceStatusOk,
  planSourceActionLabel,
  planSourceSelectionLabel,
  sourceStatusClass,
  planSourceStatusLabel,
  sourceSummaryStatusLabel,
} from "./sourceStatusA11y";
import {
  storedFilterChangedAfterFailure,
  storedLoadFailureText,
  type StoredLoadState,
} from "./storedLoadStatus";
import {
  activeStoredPromptFilterCount,
  emptyStoredPromptFilters,
  storedFilterApplyLabel,
  storedFilterInputLabel,
  storedFilterResetCount,
  storedFilterResetLabel,
  storedFilterSuggestionValues,
  storedPromptFiltersSnapshot,
  storedPromptLoadOptions,
  storedResultFilterCount,
  type StoredPromptFilters,
} from "./storedFilters";
import {
  storedFacetSummaryText,
  storedFacetsFailureText,
  type StoredFacetsState,
} from "./storedFacetStatus";
import {
  browserBridgeCheckActionDisabled,
  browserBridgeCheckActionLabel,
  planActionLabel,
  planPanelActionLabel,
  previewModeActionLabel,
  promptFilterInputLabel,
  scanActionLabel,
  scanLimitInputLabel,
  scanStopActionLabel,
  storedLoadActionLabel,
} from "./topActionLabels";
import { textListItemKey } from "./textListKey";
import type {
  ImportBatchResult,
  ImportEventsResult,
  ImportStatesResult,
  ImproveResult,
  PromptRecord,
  ScanPlan,
  ScanProgress,
  ScanResult,
  StoredPromptFacetsResult,
} from "./types";

type ScanState = ScanRunState;
type ImportStatesState = "idle" | "loading" | "ready" | "failed";
type ImportEventsState = "idle" | "loading" | "ready" | "failed";
const PREVIEW_LIMIT = 1000;
const IMPORT_BATCH_FILES = 5;
const IMPORT_STATES_DISPLAY_LIMIT = 8;
const CONTINUOUS_IMPORT_PAUSE_MS = 200;
const SCAN_PROGRESS_POLL_MS = 300;
const FREQUENCY_DISPLAY_LIMIT = 12;
const PROMPT_LIST_DISPLAY_LIMIT = 200;

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
  const [planState, setPlanState] = useState<PlanRunState>("idle");
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
  const [resultOrigin, setResultOrigin] = useState<PromptResultOrigin | null>(null);
  const [scanProgressInfo, setScanProgressInfo] = useState<ScanProgress | null>(null);
  const [scanStopFailure, setScanStopFailure] = useState<ScanStopFailure | null>(null);
  const [scanFailureErrorText, setScanFailureErrorText] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [storedFilters, setStoredFilters] = useState<StoredPromptFilters>(() =>
    emptyStoredPromptFilters(),
  );
  const [loadedStoredFilters, setLoadedStoredFilters] = useState<StoredPromptFilters>(() =>
    emptyStoredPromptFilters(),
  );
  const [limit, setLimit] = useState(() => recommendedInitialScanLimit());
  const [previewMode, setPreviewMode] = useState<PreviewMode>("latest");
  const [error, setError] = useState<string | null>(null);
  const [browserBridgeStatus, setBrowserBridgeStatus] = useState<BrowserBridgeStatus>(() =>
    browserQaMode ? "checking" : "native",
  );
  const [browserBridgeDatabasePath, setBrowserBridgeDatabasePath] = useState<string | null>(null);
  const [browserBridgeFailureText, setBrowserBridgeFailureText] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [forceLocalImprove, setForceLocalImprove] = useState(false);
  const [improvement, setImprovement] = useState<ImproveResult | null>(null);
  const [improvementPromptId, setImprovementPromptId] = useState<string | null>(null);
  const [improvementFailurePromptId, setImprovementFailurePromptId] = useState<string | null>(null);
  const [improvementFailureErrorText, setImprovementFailureErrorText] = useState<string | null>(null);
  const [storedLoadFailureErrorText, setStoredLoadFailureErrorText] = useState<string | null>(null);
  const importStopRequestedRef = useRef(false);
  const scanRunIdRef = useRef<string | null>(null);
  const topLevelActionClaimRef = useRef(false);
  const storedFacetsRefreshClaimRef = useRef(false);
  const importStatesRefreshClaimRef = useRef(false);
  const importEventsRefreshClaimRef = useRef(false);
  const isImportRunning = importState === "importing";
  const isPlanRunning = planState === "planning";
  const isScanRunning = scanState === "scanning" || scanState === "canceling";
  const isStoredLoadRunning = storedLoadState === "loading";
  const isBrowserBridgeChecking = browserQaMode && browserBridgeStatus === "checking";
  const isBrowserBridgeDisconnected = browserQaMode && browserBridgeStatus === "disconnected";
  const actionLockState = {
    browserBridgeChecking: isBrowserBridgeChecking,
    browserBridgeDisconnected: isBrowserBridgeDisconnected,
    importRunning: isImportRunning,
    improvementRunning: improving,
    planRunning: isPlanRunning,
    scanRunning: isScanRunning,
    storedLoadRunning: isStoredLoadRunning,
  };
  const isTopLevelActionLocked = topLevelActionLocked(actionLockState);
  const isImportActionLocked = importActionLocked(actionLockState);
  const canStopScan = scanRunIdRef.current !== null && isScanRunning;
  const scanProgressText = scanProgressLabel(scanProgressInfo);
  const scanRunFailureMessage = scanRunFailureText(scanState, result !== null);
  const scanStopFailureMessage = scanStopFailureText(scanStopFailure);
  const importStatesFailureMessage = importRefreshFailureText(
    importStatesState,
    "저장된 가져오기 진행",
  );
  const importEventsFailureMessage = importRefreshFailureText(
    importEventsState,
    "가져오기 기록",
  );
  const planFailureMessage = planFailureText(planState, plan !== null);

  const prompts = result?.prompts ?? [];
  const promptListMode = effectivePromptListMode(result?.preview_sort, previewMode);
  const promptMatches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? prompts.filter((prompt) => {
          return (
            prompt.text.toLowerCase().includes(needle) ||
            prompt.source.toLowerCase().includes(needle) ||
            (prompt.cwd ?? "").toLowerCase().includes(needle)
          );
        })
      : prompts;
  }, [prompts, query]);

  const filteredPrompts = useMemo(() => {
    if (promptListMode === "weakest") return promptMatches.slice(0, PROMPT_LIST_DISPLAY_LIMIT);
    return promptMatches.slice(-PROMPT_LIST_DISPLAY_LIMIT).reverse();
  }, [promptListMode, promptMatches]);
  const hiddenPromptListCount = Math.max(0, promptMatches.length - filteredPrompts.length);

  const selectedPrompt = useMemo(() => {
    return selectedPromptForView(filteredPrompts, selectedId);
  }, [filteredPrompts, selectedId]);
  const hasPromptResult = result !== null;
  const previewModePendingMessage = pendingPreviewModeNotice(
    result?.preview_sort,
    previewMode,
    hasPromptResult,
  );
  const showPreviewModePendingMessage =
    previewModePendingMessage !== null && !(resultOrigin === "stored" && isStoredLoadRunning);
  const sourceSummaries = result?.stats.source_summaries ?? [];
  const sourceSummariesEmptyMessage = sourceSummariesEmptyText(hasPromptResult);
  const storedFilterCount = activeStoredPromptFilterCount(storedFilters);
  const activeResultStoredFilterCount = storedResultFilterCount(
    resultOrigin,
    loadedStoredFilters,
  );
  const storedFilterResettableCount = storedFilterResetCount(
    storedFilterCount,
    activeResultStoredFilterCount,
  );
  const promptListEmptyMessage = promptListEmptyText(
    hasPromptResult,
    query,
    activeResultStoredFilterCount,
    isStoredLoadRunning,
  );
  const selectedPromptEmptyMessage = selectedPromptEmptyText(
    hasPromptResult,
    query,
    activeResultStoredFilterCount,
    isStoredLoadRunning,
  );
  const activeImportSource = useMemo(() => {
    return plan?.sources.find((source) => source.id === activeImportSourceId) ?? null;
  }, [activeImportSourceId, plan]);
  const activeImportSavedState = useMemo(() => {
    if (!activeImportSourceId) return null;
    return importStatesResult?.states.find((state) => state.source_id === activeImportSourceId) ?? null;
  }, [activeImportSourceId, importStatesResult?.states]);
  const currentImportProgress = importProgressDisplay(
    importResult,
    activeImportSavedState,
    activeImportSource?.label ?? null,
    activeImportSource?.file_count ?? 0,
    IMPORT_BATCH_FILES,
  );
  const importRunFailureMessage = importRunFailureText(
    importState,
    currentImportProgress.sourceLabel,
  );
  const importStopNoticeMessage = importStopNoticeText(
    importState,
    importMode,
    currentImportProgress.sourceLabel,
    completedQueueSourceCount,
    importQueueSourceIds.length,
  );
  const availableImportQueueSourceIds = useMemo(() => {
    return availableQueueSourceIds(plan?.sources ?? []);
  }, [plan?.sources]);
  const selectedImportQueueSourceIds = useMemo(() => {
    return selectedQueueSourceIds(selectedImportSourceIds, plan?.sources ?? []);
  }, [plan?.sources, selectedImportSourceIds]);
  const allImportQueueSourcesSelected =
    availableImportQueueSourceIds.length > 0
    && selectedImportQueueSourceIds.length >= availableImportQueueSourceIds.length;
  const activeImprovement = activeImprovementForSelection(
    improvement,
    improvementPromptId,
    selectedPrompt?.id ?? null,
  );
  const visibleImportStates = importStatesResult?.states.slice(0, IMPORT_STATES_DISPLAY_LIMIT) ?? [];
  const hiddenImportStateCount = Math.max(
    0,
    (importStatesResult?.states.length ?? 0) - IMPORT_STATES_DISPLAY_LIMIT,
  );
  const improvementFailureMessage = improvementFailureText(
    improvementFailurePromptId,
    selectedPrompt?.id ?? null,
  );
  const recommendationEmptyMessage = recommendationEmptyText(
    selectedPrompt !== null,
    hasPromptResult,
    query,
    activeResultStoredFilterCount,
    isStoredLoadRunning,
    improving,
    improvementFailureMessage !== null,
  );
  const qualityGapItems = useMemo(() => {
    return (result?.stats.top_quality_gaps ?? []).map((item) => ({
      ...item,
      text: qualityGapLabel(item.text),
    }));
  }, [result?.stats.top_quality_gaps]);
  const storedLoadFailureMessage = storedLoadFailureText(storedLoadState, storedFilterCount);
  const storedSourceSuggestions = useMemo(() => {
    const sourceLabels = storedFacetsResult?.sources.map((source) => source.text)
      ?? (result?.stats.source_summaries ?? []).map((source) => source.label);
    return storedFilterSuggestionValues(sourceLabels, sourceLabelDisplayText);
  }, [result?.stats.source_summaries, storedFacetsResult?.sources]);
  const storedDateSuggestions = useMemo(() => {
    const dates = storedFacetsResult?.dates.map((date) => date.text)
      ?? (result?.stats.prompts_by_date ?? []).map((date) => date.text);
    return storedFilterSuggestionValues(dates);
  }, [result?.stats.prompts_by_date, storedFacetsResult?.dates]);
  const storedWorkspaceSuggestions = useMemo(() => {
    return storedFilterSuggestionValues(
      storedFacetsResult?.workspaces.map((workspace) => workspace.text) ?? [],
      pathDisplayText,
    );
  }, [storedFacetsResult?.workspaces]);
  const storedFacetsFailureMessage = storedFacetsFailureText(storedFacetsState);
  const storedFacetSummary = storedFacetSummaryText(
    storedFacetsState,
    storedFilterCount,
    storedFacetsResult,
  );
  const displayDatabasePath = pathDisplayText(
    result?.persistence?.database_path ?? storedFacetsResult?.database_path ?? "데이터베이스 미갱신",
  );
  const displayStoredPromptCount =
    result?.persistence?.stored_prompt_count ?? storedFacetsResult?.total_prompts ?? 0;
  const displayStoredDateCount =
    result?.persistence?.date_count ?? storedFacetsResult?.dates.length ?? 0;
  const browserBridgeNoticeText = browserBridgeStatusText(
    browserBridgeStatus,
    browserBridgeDatabasePath ? pathDisplayText(browserBridgeDatabasePath) : null,
    browserBridgeFailureText,
  );
  const hiddenImportEventCount = Math.max(
    0,
    (importEventsResult?.total_events ?? 0) - (importEventsResult?.events.length ?? 0),
  );

  useEffect(() => {
    if (browserQaMode) {
      void verifyBrowserBridge({ refresh: true });
      return;
    }
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

  async function verifyBrowserBridge({ refresh = false }: { refresh?: boolean } = {}) {
    if (!browserQaMode) return true;

    setBrowserBridgeStatus("checking");
    try {
      const health = await checkBrowserBridgeHealth();
      setBrowserBridgeDatabasePath(health.database_path);
      setBrowserBridgeFailureText(null);
      setBrowserBridgeStatus("connected");
      setError((current) => (current === browserBridgeUnavailableMessage() ? null : current));
      if (refresh) {
        await Promise.all([
          refreshStoredFacets({ quiet: true }),
          refreshImportStates({ quiet: true }),
          refreshImportEvents({ quiet: true }),
        ]);
      }
      return true;
    } catch (err) {
      const message = displayErrorText(err);
      setBrowserBridgeDatabasePath(null);
      setBrowserBridgeFailureText(message);
      setBrowserBridgeStatus("disconnected");
      setError((current) => (current === browserBridgeUnavailableMessage() ? null : current));
      return false;
    }
  }

  function syncBrowserBridgeFailure(message: string) {
    if (browserQaMode && message === browserBridgeUnavailableMessage()) {
      setBrowserBridgeDatabasePath(null);
      setBrowserBridgeFailureText(message);
      setBrowserBridgeStatus("disconnected");
    }
  }

  async function refreshStoredFacets({ quiet = false }: { quiet?: boolean } = {}) {
    if (!claimExclusiveAction(storedFacetsRefreshClaimRef)) return;
    if (!quiet) setStoredFacetsState("loading");
    try {
      const next = await listStoredPromptFacets();
      setStoredFacetsResult(next);
      setStoredFacetsState("ready");
      setError((current) => refreshGlobalErrorAfterSuccess(quiet, current));
    } catch (err) {
      syncBrowserBridgeFailure(displayErrorText(err));
      setStoredFacetsState("failed");
      if (!quiet) setError(displayErrorText(err));
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
      setError((current) => refreshGlobalErrorAfterSuccess(quiet, current));
    } catch (err) {
      syncBrowserBridgeFailure(displayErrorText(err));
      setImportStatesState("failed");
      if (!quiet) setError(displayErrorText(err));
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
      setError((current) => refreshGlobalErrorAfterSuccess(quiet, current));
    } catch (err) {
      syncBrowserBridgeFailure(displayErrorText(err));
      setImportEventsState("failed");
      if (!quiet) setError(displayErrorText(err));
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
      setSelectedImportSourceIds((current) => plannedQueueSourceIds(current, next.sources));
      setPlanState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
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
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setImportState("failed");
    } finally {
      setStopRequested(false);
      importStopRequestedRef.current = false;
      releaseExclusiveAction(topLevelActionClaimRef);
      void Promise.all([
        refreshImportStates({ quiet: true }),
        refreshImportEvents({ quiet: true }),
        refreshStoredFacets({ quiet: true }),
      ]);
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
      let completedSourceCount = 0;
      for (const [index, sourceId] of queue.entries()) {
        if (importStopRequestedRef.current) break;
        setCompletedQueueSourceCount(index);
        setActiveImportSourceId(sourceId);
        setImportResult(null);
        lastResult = await runImportSource(sourceId, "queue");
        if (lastResult?.state.completed) {
          completedSourceCount = index + 1;
        }
        if (importStopRequestedRef.current) break;
      }
      const finalState = importQueueFinalState(
        queue.length,
        importStopRequestedRef.current ? completedSourceCount : queue.length,
        importStopRequestedRef.current,
      );
      setCompletedQueueSourceCount(finalState.completedSourceCount);
      setImportState(finalState.state);
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setImportState("failed");
    } finally {
      setStopRequested(false);
      importStopRequestedRef.current = false;
      releaseExclusiveAction(topLevelActionClaimRef);
      void Promise.all([
        refreshImportStates({ quiet: true }),
        refreshImportEvents({ quiet: true }),
        refreshStoredFacets({ quiet: true }),
      ]);
    }
  }

  function requestStopImport() {
    importStopRequestedRef.current = true;
    setStopRequested(true);
  }

  async function runScan() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setScanFailureErrorText(null);
    setScanStopFailure(null);
    setImprovement(null);
    setImprovementPromptId(null);
    setImprovementFailurePromptId(null);
    setImprovementFailureErrorText(null);
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
        write_markdown: false,
        source_ids: quickScanSourceIds(),
        source_limit: QUICK_SCAN_SOURCE_LIMIT,
        persist_on_cancel: false,
        run_id: runId,
      });
      const loadedMode = effectivePromptListMode(next.preview_sort, previewMode);
      setError(null);
      setResult(next);
      setResultOrigin("scan");
      setLoadedStoredFilters(emptyStoredPromptFilters());
      setSelectedId(
        (loadedMode === "weakest"
          ? next.prompts[0]
          : next.prompts[next.prompts.length - 1]
        )?.id ?? null,
      );
      setScanState("ready");
      setScanFailureErrorText(null);
      setScanStopFailure(null);
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setScanFailureErrorText(message);
      setScanState("failed");
      setScanStopFailure(null);
    } finally {
      scanRunIdRef.current = null;
      setScanProgressInfo(null);
      releaseExclusiveAction(topLevelActionClaimRef);
    }
    void refreshStoredFacets({ quiet: true });
  }

  async function requestStopScan() {
    const runId = scanRunIdRef.current;
    if (!runId) return;
    setScanStopFailure(null);
    setScanState("canceling");
    try {
      const result = await cancelScan(runId);
      if (!result.canceled) {
        setError("중지할 실행 중 스캔을 찾지 못했습니다.");
        setScanStopFailure("not_active");
        setScanState("scanning");
      }
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setScanStopFailure("request_failed");
      setScanState("scanning");
    }
  }

  async function runLoadStored(
    filters: StoredPromptFilters = storedFilters,
    requestedPreviewMode: PreviewMode = previewMode,
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setImprovement(null);
    setImprovementPromptId(null);
    setImprovementFailurePromptId(null);
    setImprovementFailureErrorText(null);
    setStoredLoadFailureErrorText(null);
    setScanStopFailure(null);
    setScanState("idle");
    setStoredLoadState("loading");
    try {
      const nextStoredFilters = storedPromptFiltersSnapshot(filters);
      const next = await loadStoredPrompts({
        ...storedPromptLoadOptions(filters, requestedPreviewMode, PREVIEW_LIMIT),
      });
      const loadedMode = effectivePromptListMode(next.preview_sort, requestedPreviewMode);
      setResult(next);
      setResultOrigin("stored");
      setLoadedStoredFilters(nextStoredFilters);
      setSelectedId(
        (loadedMode === "weakest"
          ? next.prompts[0]
          : next.prompts[next.prompts.length - 1]
        )?.id ?? null,
      );
      setStoredLoadState("ready");
      setStoredLoadFailureErrorText(null);
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setStoredLoadFailureErrorText(message);
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
    if (storedLoadState === "failed") {
      const next = storedFilterChangedAfterFailure(
        storedLoadState,
        error,
        storedLoadFailureErrorText,
        result !== null,
      );
      setError(next.error);
      setStoredLoadFailureErrorText(next.failureErrorText);
      setStoredLoadState(next.state);
    }
  }

  function resetStoredFilters() {
    const nextFilters = emptyStoredPromptFilters();
    setStoredFilters(nextFilters);
    void runLoadStored(nextFilters);
  }

  function updateScanLimit(value: string) {
    setLimit(value);
    if (scanState === "failed") {
      const next = scanLimitChangedAfterFailure(
        scanState,
        error,
        scanFailureErrorText,
        result !== null,
      );
      setError(next.error);
      setScanFailureErrorText(next.failureErrorText);
      setScanState(next.state);
    }
  }

  function clearImprovementPromptContext() {
    const next = improvementSelectionChanged<ImproveResult>(
      error,
      improvementFailureErrorText,
    );
    setError(next.error);
    setImprovement(next.improvement);
    setImprovementPromptId(next.improvementPromptId);
    setImprovementFailurePromptId(next.improvementFailurePromptId);
    setImprovementFailureErrorText(next.improvementFailureErrorText);
  }

  function changePreviewMode(nextPreviewMode: PreviewMode) {
    if (nextPreviewMode === previewMode) return;
    const reloadStoredPreview = shouldReloadStoredPreview(
      resultOrigin,
      result !== null,
      previewMode,
      nextPreviewMode,
    );
    setPreviewMode(nextPreviewMode);
    clearImprovementPromptContext();
    if (reloadStoredPreview) {
      void runLoadStored(loadedStoredFilters, nextPreviewMode);
    }
  }

  function updatePromptFilter(value: string) {
    setQuery(value);
    clearImprovementPromptContext();
  }

  async function runImprove(prompt: PromptRecord | null) {
    if (!prompt) return;
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setImproving(true);
    setError(null);
    setImprovementFailurePromptId(null);
    setImprovementFailureErrorText(null);
    const started = improvementRequestStarted<ImproveResult>(prompt.id);
    setImprovement(started.improvement);
    setImprovementPromptId(started.improvementPromptId);
    try {
      const databasePath =
        browserBridgeDatabasePath ?? storedFacetsResult?.database_path ?? result?.persistence?.database_path;
      const request = buildImprovePromptRequest(prompt, databasePath, forceLocalImprove);
      const next = await improvePrompt(request);
      setImprovement(next);
      setImprovementPromptId(prompt.id);
      setImprovementFailurePromptId(null);
      setImprovementFailureErrorText(null);
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setImprovementFailurePromptId(prompt.id);
      setImprovementFailureErrorText(message);
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
          <h1>에이전트 프롬프트 인텔리전스</h1>
        </div>
        <div className="actions">
          <div className="segmented" aria-label="미리보기 모드" role="group">
            <button
              aria-label={previewModeActionLabel("latest", previewMode, actionLockState)}
              aria-pressed={previewMode === "latest"}
              className={previewMode === "latest" ? "active" : ""}
              disabled={isTopLevelActionLocked}
              onClick={() => changePreviewMode("latest")}
              type="button"
            >
              최신순
            </button>
            <button
              aria-label={previewModeActionLabel("weakest", previewMode, actionLockState)}
              aria-pressed={previewMode === "weakest"}
              className={previewMode === "weakest" ? "active" : ""}
              disabled={isTopLevelActionLocked}
              onClick={() => changePreviewMode("weakest")}
              type="button"
            >
              개선 우선
            </button>
          </div>
          <label className="limit-control">
            <span>제한</span>
            <input
              aria-label={scanLimitInputLabel(actionLockState)}
              data-scan-limit="true"
              disabled={isTopLevelActionLocked}
              min={1}
              max={MAX_SCAN_LIMIT}
              step={100}
              type="number"
              placeholder={`추천 ${RECOMMENDED_SCAN_LIMIT.toLocaleString()}`}
              value={limit}
              onChange={(event) => updateScanLimit(event.currentTarget.value)}
            />
          </label>
          <button
            aria-label={scanActionLabel(scanState, actionLockState)}
            className="primary"
            data-run-scan="true"
            disabled={isTopLevelActionLocked}
            onClick={runScan}
            type="button"
          >
            <RefreshCw size={18} />
            {scanState === "canceling" ? "중지 중" : scanState === "scanning" ? "스캔 중" : "빠른 스캔"}
          </button>
          {canStopScan ? (
            <button
              aria-label={scanStopActionLabel(scanState)}
              className="secondary-action stop-action"
              data-stop-scan="true"
              disabled={scanState === "canceling"}
              onClick={requestStopScan}
              type="button"
            >
              <StopCircle size={18} />
              {scanState === "canceling" ? "중지 중" : "중지"}
            </button>
          ) : null}
          <button
            aria-label={storedLoadActionLabel(storedLoadState, actionLockState)}
            className="secondary-action"
            data-load-stored-prompts="true"
            disabled={isTopLevelActionLocked}
            onClick={() => runLoadStored()}
            type="button"
          >
            <Database size={18} />
            {isStoredLoadRunning ? "저장소 불러오는 중" : "저장소 불러오기"}
          </button>
          <button
            aria-label={planActionLabel(planState, actionLockState)}
            className="secondary-action"
            data-run-plan="true"
            disabled={planState === "planning" || isTopLevelActionLocked}
            onClick={runPlan}
            type="button"
          >
            <ClipboardList size={18} />
            {planState === "planning" ? "계획 중" : "계획"}
          </button>
        </div>
      </section>

      {error ? (
        <section className="notice error" {...ALERT_NOTICE_PROPS}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </section>
      ) : null}

      {browserQaMode && browserBridgeNoticeText ? (
        <section
          className={`notice ${
            browserBridgeStatus === "disconnected" ? "warning" : "browser-mode"
          }`}
          data-browser-bridge-status={browserBridgeStatus}
          {...(browserBridgeStatus === "disconnected" ? ALERT_NOTICE_PROPS : STATUS_NOTICE_PROPS)}
        >
          {browserBridgeStatus === "disconnected" ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
          <span>{browserBridgeNoticeText}</span>
          <button
            aria-label={browserBridgeCheckActionLabel(browserBridgeStatus, actionLockState)}
            className="notice-action"
            data-check-browser-bridge="true"
            disabled={browserBridgeCheckActionDisabled(browserBridgeStatus, actionLockState)}
            onClick={() => void verifyBrowserBridge({ refresh: true })}
            type="button"
          >
            {browserBridgeStatus === "checking" ? "확인 중" : "브리지 다시 확인"}
          </button>
        </section>
      ) : null}

      {showPreviewModePendingMessage ? (
        <section className="notice secondary" data-preview-mode-pending="true" {...STATUS_NOTICE_PROPS}>
          <Search size={18} />
          <span>{previewModePendingMessage}</span>
        </section>
      ) : null}

      {isScanRunning ? (
        <section className="notice scan-progress" data-scan-progress="true" {...STATUS_NOTICE_PROPS}>
          <RefreshCw size={18} />
          <span>{scanProgressText}</span>
        </section>
      ) : null}

      {scanRunFailureMessage ? (
        <section className="notice warning" data-scan-run-error="true" {...ALERT_NOTICE_PROPS}>
          <AlertTriangle size={18} />
          <span>{scanRunFailureMessage}</span>
        </section>
      ) : null}

      {scanStopFailureMessage ? (
        <section className="notice warning" data-scan-stop-error="true" {...ALERT_NOTICE_PROPS}>
          <AlertTriangle size={18} />
          <span>{scanStopFailureMessage}</span>
        </section>
      ) : null}

      <section className="panel stored-filter-panel">
        <div className="panel-heading">
          <h2>저장소</h2>
          <div className="panel-heading-actions">
            <span data-stored-facet-summary="true">{storedFacetSummary}</span>
            <button
              aria-label={panelRefreshActionLabel(
                "저장소 필터 후보",
                storedFacetsState,
                actionLockState,
              )}
              className="inline-action"
              data-refresh-stored-facets="true"
              disabled={storedFacetsState === "loading" || isTopLevelActionLocked}
              onClick={() => refreshStoredFacets()}
              type="button"
            >
              <RefreshCw size={15} />
              {storedFacetsState === "loading" ? "불러오는 중" : "필터 후보 새로고침"}
            </button>
          </div>
        </div>
        {storedFacetsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-stored-facets-refresh-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{storedFacetsFailureMessage}</span>
          </div>
        ) : null}
        {storedLoadFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-stored-load-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{storedLoadFailureMessage}</span>
          </div>
        ) : null}
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
            <span>텍스트</span>
            <input
              aria-label={storedFilterInputLabel("text", actionLockState)}
              data-stored-filter-query="true"
              disabled={isTopLevelActionLocked}
              value={storedFilters.query}
              placeholder="cmux, 소스, 작업공간"
              onChange={(event) => updateStoredFilter("query", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>소스</span>
            <input
              aria-label={storedFilterInputLabel("source", actionLockState)}
              data-stored-filter-source="true"
              disabled={isTopLevelActionLocked}
              list="stored-source-options"
              value={storedFilters.source}
              placeholder="전체 소스"
              onChange={(event) => updateStoredFilter("source", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>날짜</span>
            <input
              aria-label={storedFilterInputLabel("date", actionLockState)}
              data-stored-filter-date="true"
              disabled={isTopLevelActionLocked}
              list="stored-date-options"
              value={storedFilters.date}
              placeholder="YYYY-MM-DD"
              onChange={(event) => updateStoredFilter("date", event.currentTarget.value)}
            />
          </label>
          <label className="stored-filter-control">
            <span>작업공간</span>
            <input
              aria-label={storedFilterInputLabel("workspace", actionLockState)}
              data-stored-filter-workspace="true"
              disabled={isTopLevelActionLocked}
              list="stored-workspace-options"
              value={storedFilters.workspace}
              placeholder="PromptVault"
              onChange={(event) => updateStoredFilter("workspace", event.currentTarget.value)}
            />
          </label>
          <button
            aria-label={storedFilterApplyLabel(storedFilterCount, actionLockState)}
            className="inline-action"
            data-apply-stored-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Database size={15} />
            적용
          </button>
          <button
            aria-label={storedFilterResetLabel(storedFilterResettableCount, actionLockState)}
            className="inline-action"
            data-reset-stored-filters="true"
            disabled={!storedFilterResettableCount || isTopLevelActionLocked}
            onClick={resetStoredFilters}
            type="button"
          >
            초기화
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
            <h2>저장된 가져오기 진행</h2>
            <button
              aria-label={panelRefreshActionLabel(
                "저장된 가져오기 진행",
                importStatesState,
                actionLockState,
              )}
              className="inline-action"
              data-refresh-import-states="true"
              disabled={importStatesState === "loading" || isTopLevelActionLocked}
              onClick={() => refreshImportStates()}
              type="button"
            >
              <RefreshCw size={15} />
              {importStatesState === "loading" ? "불러오는 중" : "새로고침"}
            </button>
          </div>
          {importStatesFailureMessage ? (
            <div
              className="notice warning panel-notice"
              data-import-states-refresh-error="true"
              {...ALERT_NOTICE_PROPS}
            >
              <AlertTriangle size={18} />
              <span>{importStatesFailureMessage}</span>
            </div>
          ) : null}
          {importStatesResult ? (
            <>
              <div className="saved-import-summary">
                <div>
                  <span>소스</span>
                  <strong>
                    {importStatesResult.completed_sources.toLocaleString()} /{" "}
                    {importStatesResult.total_sources.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>파일</span>
                  <strong>
                    {importStatesResult.processed_files.toLocaleString()} /{" "}
                    {importStatesResult.total_files.toLocaleString()}
                  </strong>
                </div>
                <div>
                  <span>가져온 프롬프트</span>
                  <strong>{importStatesResult.imported_prompt_count.toLocaleString()}</strong>
                </div>
                <div className="summary-path-card">
                  <span>데이터베이스</span>
                  <strong>{pathDisplayText(importStatesResult.database_path)}</strong>
                </div>
              </div>
              {importStatesResult.states.length ? (
                <div className="saved-import-list">
                  {visibleImportStates.map((state) => (
                    <div className="saved-import-row" key={state.source_id}>
                      <div>
                        <strong>{sourceLabelDisplayText(state.source_label)}</strong>
                        <span>{state.updated_at}</span>
                      </div>
                      <progress
                        aria-label={importProgressLabel(state.source_label)}
                        aria-valuetext={importProgressValueText(state.processed_files, state.total_files)}
                        value={importStateProgressPercent(state)}
                        max={100}
                      />
                      <span>
                        {state.processed_files.toLocaleString()} / {state.total_files.toLocaleString()}
                        {state.completed ? " · 완료" : " · 재개 가능"}
                      </span>
                    </div>
                  ))}
                  {hiddenImportStateCount > 0 ? (
                    <div
                      className="saved-import-overflow"
                      data-import-states-overflow="true"
                      {...STATUS_NOTICE_PROPS}
                    >
                      저장된 가져오기 진행 외 {hiddenImportStateCount.toLocaleString()}개 소스가 더 있습니다.
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="empty compact">저장된 가져오기 커서가 아직 없습니다.</div>
              )}
            </>
          ) : (
            <div className="empty compact" data-empty-import-states="true">
              {importRefreshUnavailableText(importStatesState, "저장된 가져오기 진행")}
            </div>
          )}
        </section>
      ) : null}

      {result ? (
        <section className="notice" {...STATUS_NOTICE_PROPS}>
          <FileText size={18} />
          <span>
            {displayDatabasePath} · 저장 {displayStoredPromptCount.toLocaleString()} · 신규{" "}
            {(result.persistence?.inserted_prompt_count ?? 0).toLocaleString()} · 갱신{" "}
            {(result.persistence?.updated_prompt_count ?? 0).toLocaleString()}
          </span>
        </section>
      ) : null}

      {result?.output_path ? (
        <section className="notice secondary" {...STATUS_NOTICE_PROPS}>
          <FileText size={18} />
          <span>
            내보내기 {pathDisplayText(result.output_path)} · 미리보기 {result.returned_prompt_count.toLocaleString()} /{" "}
            {result.stats.total_prompts.toLocaleString()}
          </span>
        </section>
      ) : null}

      {result?.warnings.length ? (
        <section className="notice warning" {...STATUS_NOTICE_PROPS}>
          <AlertTriangle size={18} />
          <span>{result.warnings.map(redactSensitiveDisplayText).join(" ")}</span>
        </section>
      ) : null}

      {plan?.warnings.length ? (
        <section className="notice warning" {...STATUS_NOTICE_PROPS}>
          <AlertTriangle size={18} />
          <span>{plan.warnings.map(redactSensitiveDisplayText).join(" ")}</span>
        </section>
      ) : null}

      {importEventsResult || importEventsState === "loading" || importEventsFailureMessage ? (
        <section className="panel import-activity-panel">
          <div className="panel-heading">
            <h2>최근 가져오기 기록</h2>
            <button
              aria-label={panelRefreshActionLabel(
                "최근 가져오기 기록",
                importEventsState,
                actionLockState,
              )}
              className="inline-action"
              data-refresh-import-events="true"
              disabled={importEventsState === "loading" || isTopLevelActionLocked}
              onClick={() => refreshImportEvents()}
              type="button"
            >
              <RefreshCw size={15} />
              {importEventsState === "loading" ? "불러오는 중" : "새로고침"}
            </button>
          </div>
          {importEventsFailureMessage ? (
            <div
              className="notice warning panel-notice"
              data-import-events-refresh-error="true"
              {...ALERT_NOTICE_PROPS}
            >
              <AlertTriangle size={18} />
              <span>{importEventsFailureMessage}</span>
            </div>
          ) : null}
          {importEventsResult ? (
            <>
              <div className="import-activity-summary">
                <div>
                  <span>전체 이벤트</span>
                  <strong>{importEventsResult.total_events.toLocaleString()}</strong>
                </div>
                <div className="summary-path-card">
                  <span>데이터베이스</span>
                  <strong>{pathDisplayText(importEventsResult.database_path)}</strong>
                </div>
              </div>
              {importEventsResult.events.length ? (
                <div className="import-activity-list">
                  {importEventsResult.events.map((event) => (
                    <div className="import-activity-row" key={event.id}>
                      <div>
                        <strong>{sourceLabelDisplayText(event.source_label)}</strong>
                        <span>{new Date(event.generated_at).toLocaleString()}</span>
                      </div>
                      <span>{importEventBatchSummary(event)}</span>
                      <span>
                        {event.processed_files.toLocaleString()} / {event.total_files.toLocaleString()} ·{" "}
                        {importEventStatusLabel(event)}
                      </span>
                      <span>{importEventWarningSummary(event)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty compact">기록된 가져오기 활동이 아직 없습니다.</div>
              )}
              {hiddenImportEventCount > 0 ? (
                <p className="import-activity-overflow" data-import-events-overflow="true">
                  가져오기 기록 외 {hiddenImportEventCount.toLocaleString()}개 항목이 더 있습니다.
                </p>
              ) : null}
            </>
          ) : (
            <div className="empty compact" data-empty-import-events="true">
              {importRefreshUnavailableText(importEventsState, "가져오기 기록")}
            </div>
          )}
        </section>
      ) : null}

      {plan || planState === "planning" || planFailureMessage ? (
        <section className="panel plan-panel">
          <div className="panel-heading">
            <h2>가져오기 계획</h2>
            <div className="panel-heading-actions">
              <span data-plan-status="true">
                {plan
                  ? new Date(plan.generated_at).toLocaleString()
                  : planState === "planning"
                    ? "계획 중"
                    : "실패"}
              </span>
              <button
                className="inline-action"
                aria-label={planPanelActionLabel(planState, Boolean(plan), actionLockState)}
                data-refresh-plan="true"
                disabled={planState === "planning" || isTopLevelActionLocked}
                onClick={runPlan}
                type="button"
              >
                <ClipboardList size={15} />
                {planState === "planning" ? "계획 중" : plan ? "계획 새로고침" : "계획 다시 시도"}
              </button>
            </div>
          </div>
          {planFailureMessage ? (
            <div className="notice warning panel-notice" data-plan-run-error="true" {...ALERT_NOTICE_PROPS}>
              <AlertTriangle size={18} />
              <span>{planFailureMessage}</span>
            </div>
          ) : null}
          {plan ? (
            <>
              <div className="plan-summary">
                <div>
                  <span>소스</span>
                  <strong>
                    {plan.available_sources} / {plan.total_sources}
                  </strong>
                </div>
                <div>
                  <span>파일</span>
                  <strong>{plan.total_files.toLocaleString()}</strong>
                </div>
                <div>
                  <span>크기</span>
                  <strong>{formatBytes(plan.total_bytes)}</strong>
                </div>
                <div>
                  <span>대용량 파일</span>
                  <strong>{plan.large_file_count.toLocaleString()}</strong>
                </div>
              </div>
              <div className="plan-toolbar">
                <span data-import-selection-summary="true">
                  {importQueueSelectionSummaryLabel(
                    selectedImportQueueSourceIds.length,
                    availableImportQueueSourceIds.length,
                  )}
                </span>
                <div className="plan-toolbar-actions">
                  <button
                    aria-label={importQueueSelectAllLabel(
                      availableImportQueueSourceIds.length,
                      selectedImportQueueSourceIds.length,
                      actionLockState,
                    )}
                    className="inline-action"
                    data-select-all-import-sources="true"
                    disabled={
                      isImportActionLocked
                      || availableImportQueueSourceIds.length === 0
                      || allImportQueueSourcesSelected
                    }
                    onClick={() => setSelectedImportSourceIds(availableImportQueueSourceIds)}
                    type="button"
                  >
                    <CheckCircle2 size={15} />
                    전체 선택
                  </button>
                  <button
                    aria-label={importQueueClearSelectionLabel(
                      selectedImportQueueSourceIds.length,
                      actionLockState,
                    )}
                    className="inline-action"
                    data-clear-import-selection="true"
                    disabled={isImportActionLocked || selectedImportQueueSourceIds.length === 0}
                    onClick={() => setSelectedImportSourceIds([])}
                    type="button"
                  >
                    <XCircle size={15} />
                    선택 해제
                  </button>
                  <button
                    aria-label={importQueueActionLabel(
                      selectedImportQueueSourceIds.length,
                      isImportRunning && importMode === "queue",
                      actionLockState,
                    )}
                    className="inline-action"
                    data-import-selected="true"
                    disabled={isImportActionLocked || selectedImportQueueSourceIds.length === 0}
                    onClick={runSelectedImportQueue}
                    type="button"
                  >
                    <Play size={15} />
                    {isImportRunning && importMode === "queue" ? "대기열 실행 중" : "선택 실행"}
                  </button>
                </div>
              </div>
              <div className="plan-sources">
                {plan.sources.map((source) => {
                  const displayNotes = source.notes.map(redactSensitiveDisplayText);
                  return (
                    <div className="plan-source-row" key={source.id}>
                      <div className="plan-source-main">
                        <label className="source-select">
                          <input
                            aria-label={planSourceSelectionLabel(
                              source.label,
                              source.status,
                              source.file_count,
                              formatBytes(source.byte_count),
                              displayNotes,
                              actionLockState,
                            )}
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
                          <strong>{sourceLabelDisplayText(source.label)}</strong>
                        </label>
                        <span>{pathDisplayText(source.root_path)}</span>
                        {displayNotes.length ? <span className="source-meta">{displayNotes.join(" ")}</span> : null}
                      </div>
                      <div
                        aria-label={planSourceStatusLabel(
                          source.label,
                          source.status,
                          source.file_count,
                          formatBytes(source.byte_count),
                          displayNotes,
                        )}
                        className={`status ${sourceStatusClass(source.status)}`}
                      >
                        {isSourceStatusOk(source.status) ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {source.file_count.toLocaleString()} · {formatBytes(source.byte_count)}
                      </div>
                      <div className="plan-source-actions">
                        <button
                          aria-label={planSourceActionLabel(
                            "batch",
                            source.label,
                            source.status,
                            source.file_count,
                            formatBytes(source.byte_count),
                            displayNotes,
                            actionLockState,
                          )}
                          className="inline-action"
                          data-import-source-id={source.id}
                          disabled={isImportActionLocked || source.file_count === 0}
                          onClick={() => runImportBatch(source.id, "single")}
                          type="button"
                        >
                          <RefreshCw size={15} />
                          {isImportRunning && activeImportSourceId === source.id && importMode === "single"
                            ? "가져오는 중"
                            : "배치 가져오기"}
                        </button>
                        <button
                          aria-label={planSourceActionLabel(
                            "continuous",
                            source.label,
                            source.status,
                            source.file_count,
                            formatBytes(source.byte_count),
                            displayNotes,
                            actionLockState,
                          )}
                          className="inline-action"
                          data-import-continuous-source-id={source.id}
                          disabled={isImportActionLocked || source.file_count === 0}
                          onClick={() => runImportBatch(source.id, "continuous")}
                          type="button"
                        >
                          <Play size={15} />
                          {isImportRunning && activeImportSourceId === source.id && importMode === "continuous"
                            ? "실행 중"
                            : "끝까지 실행"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="empty compact" data-empty-plan="true">
              {planUnavailableText(planState)}
            </div>
          )}
        </section>
      ) : null}

      {importResult || isImportRunning || importRunFailureMessage ? (
        <section className="panel import-panel">
          <div className="panel-heading">
            <h2>증분 가져오기</h2>
            <span>
              {importResult
                ? new Date(importResult.generated_at).toLocaleString()
                : importRunFailureMessage
                  ? "실패"
                  : "시작 중"}
            </span>
            {isImportRunning && (importMode === "continuous" || importMode === "queue") ? (
              <button
                aria-label={importStopActionLabel(importMode, stopRequested)}
                className="inline-action stop-action"
                data-stop-import="true"
                disabled={stopRequested}
                onClick={requestStopImport}
                type="button"
              >
                <StopCircle size={15} />
                {stopRequested ? "중지 중" : "중지"}
              </button>
            ) : null}
          </div>
          {importRunFailureMessage ? (
            <div className="notice warning panel-notice" data-import-run-error="true" {...ALERT_NOTICE_PROPS}>
              <AlertTriangle size={18} />
              <span>{importRunFailureMessage}</span>
            </div>
          ) : null}
          {importStopNoticeMessage ? (
            <div className="notice warning panel-notice" data-import-stop-warning="true" {...STATUS_NOTICE_PROPS}>
              <AlertTriangle size={18} />
              <span>{importStopNoticeMessage}</span>
            </div>
          ) : null}
          <div className="import-progress" aria-live="polite">
            <progress
              aria-label={importProgressLabel(currentImportProgress.sourceLabel)}
              aria-valuetext={importProgressValueText(
                currentImportProgress.processedFiles,
                currentImportProgress.totalFiles,
              )}
              value={currentImportProgress.percent}
              max={100}
            />
            <span>{currentImportProgress.percent}%</span>
          </div>
          <div className="import-summary">
            <div>
              <span>소스</span>
              <strong>{sourceLabelDisplayText(currentImportProgress.sourceLabel)}</strong>
            </div>
            <div>
              <span>처리됨</span>
              <strong>
                {currentImportProgress.processedFiles.toLocaleString()} /{" "}
                {currentImportProgress.totalFiles.toLocaleString()}
              </strong>
            </div>
            <div>
              <span>배치</span>
              <strong>{currentImportProgress.batchSummary}</strong>
            </div>
            {importQueueSourceIds.length ? (
              <div>
                <span>대기열</span>
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
              <span>상태</span>
              <strong>{importStatusLabel(importResult, importState, importMode, stopRequested)}</strong>
            </div>
          </div>
          {importResult ? (
            <div className="notice secondary" {...STATUS_NOTICE_PROPS}>
              <FileText size={18} />
              <span>
                {pathDisplayText(importResult.persistence.database_path)} · 저장{" "}
                {importResult.persistence.stored_prompt_count.toLocaleString()} · 신규{" "}
                {importResult.persistence.inserted_prompt_count.toLocaleString()} · 갱신{" "}
                {importResult.persistence.updated_prompt_count.toLocaleString()}
              </span>
            </div>
          ) : null}
          {importResult?.warnings.length ? (
            <div className="warning-list">
              {importResult.warnings.map((warning, index) => (
                <p key={textListItemKey(warning, index)}>{redactSensitiveDisplayText(warning)}</p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="metrics">
        <Metric icon={<ClipboardList size={18} />} label="프롬프트" value={result?.stats.total_prompts ?? 0} />
        <Metric icon={<Search size={18} />} label="미리보기" value={result?.returned_prompt_count ?? 0} />
        <Metric icon={<FileText size={18} />} label="파일" value={result?.stats.total_files ?? 0} />
        <Metric icon={<Brain size={18} />} label="단어" value={result?.stats.total_words ?? 0} />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="품질"
          value={(result?.stats.average_quality ?? 0).toFixed(1)}
        />
        <Metric
          icon={<AlertTriangle size={18} />}
          label="약함"
          value={result?.stats.weak_prompt_count ?? 0}
        />
        <Metric
          icon={<ShieldCheck size={18} />}
          label="DB 저장"
          value={displayStoredPromptCount}
        />
        <Metric icon={<FileText size={18} />} label="날짜" value={displayStoredDateCount} />
      </section>

      <section className="workspace">
        <aside className="panel sources-panel">
          <div className="panel-heading">
            <h2>소스</h2>
            <span>{result?.generated_at ? new Date(result.generated_at).toLocaleString() : "아직 스캔 안 함"}</span>
          </div>
          <div className="sources">
            {sourceSummaries.length ? (
              sourceSummaries.map((source) => (
                <div className="source-row" key={source.id}>
                  <div>
                    <strong>{sourceLabelDisplayText(source.label)}</strong>
                    <span>{pathDisplayText(source.root_path)}</span>
                    <span className="source-meta">
                      품질 {source.average_quality.toFixed(1)} · 약함 {source.weak_prompt_count}
                    </span>
                  </div>
                  <div
                    aria-label={sourceSummaryStatusLabel(
                      source.label,
                      source.status,
                      source.prompts_found,
                    )}
                    className={`status ${sourceStatusClass(source.status)}`}
                  >
                    {isSourceStatusOk(source.status) ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
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
            <h2>통계</h2>
            <span>단어와 프롬프트 시작 구문</span>
          </div>
          <div className="frequency-grid">
            <FrequencyColumn
              title="단어"
              items={result?.stats.top_words ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "단어")}
            />
            <FrequencyColumn
              title="시작 구문"
              items={result?.stats.top_phrases ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "시작 구문")}
            />
            <FrequencyColumn
              title="반복"
              items={result?.stats.repeated_prompts ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "반복")}
            />
            <FrequencyColumn
              title="날짜"
              items={result?.stats.prompts_by_date ?? []}
              emptyText={frequencyEmptyText(hasPromptResult, "날짜")}
            />
            <FrequencyColumn
              title="품질 보완점"
              items={qualityGapItems}
              emptyText={frequencyEmptyText(hasPromptResult, "품질 보완점")}
            />
          </div>
        </section>
      </section>

      <section className="prompt-grid">
        <section className="panel prompt-list-panel">
          <div className="panel-heading">
            <h2>프롬프트</h2>
            <span>
              {result
                ? `${result.returned_prompt_count.toLocaleString()}개 로드됨${
                    result.prompts_truncated
                      ? result.preview_sort === "quality_asc"
                        ? " · 개선 우선 미리보기"
                        : " · 최신순 미리보기"
                      : ""
                  }`
                : "아직 로드 안 됨"}
            </span>
            <div className="searchbox">
              <Search size={16} />
              <input
                aria-label={promptFilterInputLabel(actionLockState)}
                data-prompt-filter="true"
                disabled={isTopLevelActionLocked}
                value={query}
                placeholder="필터"
                onChange={(event) => updatePromptFilter(event.currentTarget.value)}
              />
            </div>
          </div>
          <div className="prompt-list">
            {filteredPrompts.map((prompt, index) => {
              const displaySource = promptMetadataDisplayText(prompt.source);
              return (
                <button
                  aria-label={promptRowAriaLabel(prompt, index, filteredPrompts.length, actionLockState)}
                  aria-pressed={prompt.id === selectedPrompt?.id}
                  className={`prompt-row ${prompt.id === selectedPrompt?.id ? "active" : ""}`}
                  data-prompt-index={index + 1}
                  data-prompt-row="true"
                  disabled={isTopLevelActionLocked}
                  key={prompt.id}
                  onClick={() => {
                    if (shouldClearImprovementOnPromptSelect(prompt.id, selectedPrompt?.id ?? null)) {
                      clearImprovementPromptContext();
                    }
                    setSelectedId(prompt.id);
                  }}
                  type="button"
                >
                  <span className="prompt-meta">
                    {displaySource} · {prompt.word_count.toLocaleString()}개 단어
                  </span>
                  <span className={`quality-pill ${qualityBandClass(prompt.quality.band)}`}>
                    {prompt.quality.score} · {qualityBandLabel(prompt.quality.band)}
                  </span>
                  <strong>{promptRowPreviewText(prompt.text)}</strong>
                  {prompt.risk_flags.length ? (
                    <span className="risk">
                      <AlertTriangle size={13} />
                      {prompt.risk_flags.map(riskFlagLabel).join(", ")}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {filteredPrompts.length === 0 && promptListEmptyMessage ? (
              <div className="empty compact" data-empty-prompts="true">
                {promptListEmptyMessage}
              </div>
            ) : null}
            {hiddenPromptListCount > 0 ? (
              <div className="prompt-list-overflow" data-prompt-list-overflow="true">
                프롬프트 외 {hiddenPromptListCount.toLocaleString()}개 항목이 더 있습니다.
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <h2>선택 항목</h2>
            <div className="detail-panel-actions">
              <label className="local-recommendation-toggle">
                <input
                  aria-label="로컬 규칙 추천만 사용"
                  checked={forceLocalImprove}
                  disabled={improving || isTopLevelActionLocked}
                  onChange={(event) => setForceLocalImprove(event.currentTarget.checked)}
                  type="checkbox"
                />
                <span>로컬 추천</span>
              </label>
              <button
                aria-label={improvementActionLabel(selectedPrompt !== null, improving, actionLockState)}
                data-run-improve="true"
                disabled={!selectedPrompt || improving || isTopLevelActionLocked}
                onClick={() => runImprove(selectedPrompt)}
                type="button"
              >
                <Sparkles size={17} />
                {improving ? "추천 생성 중" : "추천 생성"}
              </button>
            </div>
          </div>
          {selectedPrompt ? (
            <>
              <div
                aria-label={selectedPromptMetaLabel(selectedPrompt)}
                className="selected-meta"
                role="group"
              >
                <span>{promptMetadataDisplayText(selectedPrompt.source)}</span>
                <span>{promptTimestampDisplayText(selectedPrompt.timestamp)}</span>
                <span>
                  {selectedPrompt.cwd
                    ? promptMetadataDisplayText(selectedPrompt.cwd)
                    : "작업공간 없음"}
                </span>
                <span>
                  {selectedPrompt.quality.score} · {qualityBandLabel(selectedPrompt.quality.band)}
                </span>
              </div>
              {selectedPrompt.risk_flags.length ? (
                <div
                  className="notice warning panel-notice"
                  data-selected-risk-warning="true"
                  {...STATUS_NOTICE_PROPS}
                >
                  <AlertTriangle size={18} />
                  <span>
                    위험 패턴 감지: {selectedPrompt.risk_flags.map(riskFlagLabel).join(", ")}.
                    표시된 프롬프트는 민감 문자열이 마스킹되었습니다.
                  </span>
                </div>
              ) : null}
              {selectedPrompt.quality.suggestions.length ? (
                <div className="quality-box">
                  {selectedPrompt.quality.suggestions.map((suggestion, index) => (
                    <p key={textListItemKey(suggestion, index)}>{promptQualitySuggestionText(suggestion)}</p>
                  ))}
                </div>
              ) : null}
              <pre className="prompt-text">{selectedPromptDisplayText(selectedPrompt.text)}</pre>
            </>
          ) : (
            <div className="empty" data-empty-selected-prompt="true">
              {selectedPromptEmptyMessage}
            </div>
          )}
        </section>

        <section className="panel improve-panel">
          <div className="panel-heading">
            <h2>추천</h2>
            <span>
              {activeImprovement ? promptProviderDisplayText(activeImprovement.provider) : "local/OpenAI/GLM"}
            </span>
          </div>
          {improvementFailureMessage ? (
            <div
              className="notice warning panel-notice"
              data-improvement-run-error="true"
              {...ALERT_NOTICE_PROPS}
            >
              <AlertTriangle size={18} />
              <span>{improvementFailureMessage}</span>
            </div>
          ) : null}
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
                    해결됨: {qualityGapSummary(activeImprovement.quality_delta.resolved_gaps)}
                  </p>
                ) : null}
                {activeImprovement.quality_delta.remaining_gaps.length ? (
                  <p>
                    남음: {qualityGapSummary(activeImprovement.quality_delta.remaining_gaps)}
                  </p>
                ) : activeImprovement.quality_delta.resolved_gaps.length ? null : (
                  <p>남음: 없음</p>
                )}
              </div>
              <pre className="prompt-text revised">{redactSensitiveDisplayText(activeImprovement.revised_prompt)}</pre>
              {activeImprovement.persistence ? (
                <div className="notice success panel-notice" data-improvement-persistence="true">
                  <Database size={16} />
                  <span>
                    추천 이력 #{activeImprovement.persistence.improvement_event_id.toLocaleString()} 저장됨 ·
                    이 프롬프트 {activeImprovement.persistence.prompt_improvement_count.toLocaleString()}회
                  </span>
                </div>
              ) : null}
              <div className="advice">
                {activeImprovement.rationale.map((item, index) => (
                  <p key={textListItemKey(item, index)}>{redactSensitiveDisplayText(item)}</p>
                ))}
              </div>
              {activeImprovement.checklist.length ? (
                <div className="checklist-list" data-improvement-checklist="true">
                  {activeImprovement.checklist.map((item, index) => (
                    <p key={textListItemKey(item, index)}>{redactSensitiveDisplayText(item)}</p>
                  ))}
                </div>
              ) : null}
              {activeImprovement.warnings.length ? (
                <div className="warning-list">
                  {activeImprovement.warnings.map((warning, index) => (
                    <p key={textListItemKey(warning, index)}>
                      {redactSensitiveDisplayText(warning)}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : recommendationEmptyMessage ? (
            <div className="empty" data-empty-recommendation="true">
              {recommendationEmptyMessage}
            </div>
          ) : null}
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
  const visibleItems = items.slice(0, FREQUENCY_DISPLAY_LIMIT);
  const hiddenItemCount = Math.max(0, items.length - FREQUENCY_DISPLAY_LIMIT);
  return (
    <div className="frequency-column">
      <h3>{title}</h3>
      {items.length ? (
        <>
          {visibleItems.map((item) => (
            <div className="frequency-item" key={`${title}-${item.text}`}>
              <span>{redactSensitiveDisplayText(item.text)}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
          {hiddenItemCount > 0 ? (
            <p className="frequency-overflow" data-frequency-overflow={title}>
              {title} 외 {hiddenItemCount.toLocaleString()}개 항목이 더 있습니다.
            </p>
          ) : null}
        </>
      ) : (
        <p className="empty compact" data-empty-frequency={title}>
          {emptyText}
        </p>
      )}
    </div>
  );
}

export default App;
