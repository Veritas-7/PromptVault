import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
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
import {
  importEventBatchSummary,
  importEventStatusLabel,
  importEventTimestampText,
  importEventWarningSummary,
} from "./importEvents";
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
  importRunTimestampText,
  importStateUpdatedAtText,
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
import { planFailureText, planPanelTimestampText, planUnavailableText, type PlanRunState } from "./planStatus";
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
  loadProjectWorkLogCandidates,
  loadProjectWorkLogCoverage,
  loadProjectWorkLogExtractionProposals,
  listProjectWorkLogExtractionItems,
  loadProjectWorkSummary,
  listProjectWorkSummarySnapshots,
  listImportEvents,
  listImportStates,
  listStoredPromptFacets,
  loadStoredPrompts,
  planScan,
  scanProgress,
  scanPrompts,
  type ProjectWorkLogExtractionItemsOptions,
  type ProjectWorkSummarySnapshotsOptions,
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
  scanResultTimestampText,
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
  activeWorkLogPreviewFilterCount,
  emptyWorkLogPreviewFilters,
  filterWorkLogExtractionCandidates,
  filterWorkLogExtractionProposals,
  workLogPreviewProjectSuggestions,
  workLogProposalDateSuggestions,
  type WorkLogPreviewFilters,
} from "./workLogPreviewFilters";
import { groupWorkLogExtractionItemsByProjectDate } from "./workLogExtractionItemGroups";
import {
  buildWorkManagementOverview,
  workManagementOverviewMetaText,
  workManagementOverviewSourceText,
} from "./workManagementOverview";
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
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  PromptRecord,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshotsResult,
  ScanPlan,
  ScanProgress,
  ScanResult,
  StoredPromptFacetsResult,
} from "./types";
import {
  workLogCandidatesActionLabel,
  workLogCandidatesFailureText,
  workLogCandidatesMetaText,
  workLogCandidateReviewLabel,
  workLogExtractionActionLabel,
  workLogExtractionApprovalText,
  workLogExtractionFailureText,
  workLogExtractionItemsActionLabel,
  workLogExtractionItemsFailureText,
  workLogExtractionItemsMetaText,
  workLogExtractionMetaText,
  workLogExtractionPersistenceText,
  workLogExtractionProviderNoticeText,
  workLogExtractionRejectionSummaryText,
  workLogExtractionReviewLabel,
  workLogExtractionSavedCandidateIds,
  workLogExtractionUnsavedAcceptedIds,
  workManagementRefreshActionLabel,
  workLogCoverageActionLabel,
  workLogCoverageFailureText,
  workLogCoverageMetaText,
  workLogProposalSaveStateText,
  workSummaryActionLabel,
  workSummaryFailureText,
  workSummaryIndexStatusText,
  workSummaryMetaText,
  workSummaryPersistenceText,
  workSummarySnapshotsActionLabel,
  workSummarySnapshotsFailureText,
  workSummarySnapshotsMetaText,
  workSummarySnapshotDetailToggleText,
  workSummarySnapshotDisplaySummaries,
  workSummarySnapshotExtractionMergeText,
  workSummarySnapshotSummaryOverflowText,
  type WorkLogCandidatesState,
  type WorkLogCoverageState,
  type WorkLogExtractionRunMode,
  type WorkLogExtractionState,
  type WorkLogExtractionItemsState,
  type WorkManagementRefreshState,
  type WorkSummarySnapshotsState,
  type WorkSummaryState,
} from "./workSummaryStatus";

type ScanState = ScanRunState;
type ImportStatesState = "idle" | "loading" | "ready" | "failed";
type ImportEventsState = "idle" | "loading" | "ready" | "failed";
const PREVIEW_LIMIT = 1000;
const WORK_SUMMARY_LIMIT = 80;
const WORK_SUMMARY_SESSION_LIMIT = 20;
const WORK_SUMMARY_DISPLAY_LIMIT = 5;
const WORK_SUMMARY_HISTORY_LIMIT = 5;
const WORK_LOG_COVERAGE_DISPLAY_LIMIT = 8;
const WORK_LOG_CANDIDATE_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT = 5;
const WORK_MANAGEMENT_OVERVIEW_DISPLAY_LIMIT = 6;
const IMPORT_BATCH_FILES = 5;
const IMPORT_STATES_DISPLAY_LIMIT = 8;
const CONTINUOUS_IMPORT_PAUSE_MS = 200;
const SCAN_PROGRESS_POLL_MS = 300;

function acceptedWorkLogExtractionIds(result: ProjectWorkLogExtractionProposalsResult): string[] {
  return result.proposals
    .filter((proposal) => proposal.accepted && proposal.date?.trim())
    .map((proposal) => proposal.candidate_id);
}
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
  const [workSummaryState, setWorkSummaryState] = useState<WorkSummaryState>("idle");
  const [workSummarySnapshotsState, setWorkSummarySnapshotsState] = useState<WorkSummarySnapshotsState>("idle");
  const [workLogCoverageState, setWorkLogCoverageState] = useState<WorkLogCoverageState>("idle");
  const [workLogCandidatesState, setWorkLogCandidatesState] = useState<WorkLogCandidatesState>("idle");
  const [workLogExtractionState, setWorkLogExtractionState] = useState<WorkLogExtractionState>("idle");
  const [workLogExtractionRunMode, setWorkLogExtractionRunMode] =
    useState<WorkLogExtractionRunMode>("ai");
  const [workLogExtractionItemsState, setWorkLogExtractionItemsState] =
    useState<WorkLogExtractionItemsState>("idle");
  const [workManagementRefreshState, setWorkManagementRefreshState] =
    useState<WorkManagementRefreshState>("idle");
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
  const [workSummaryResult, setWorkSummaryResult] = useState<ProjectWorkSummaryResult | null>(null);
  const [workLogCoverageResult, setWorkLogCoverageResult] = useState<ProjectWorkLogCoverageResult | null>(null);
  const [workLogCandidatesResult, setWorkLogCandidatesResult] =
    useState<ProjectWorkLogExtractionCandidatesResult | null>(null);
  const [workLogExtractionResult, setWorkLogExtractionResult] =
    useState<ProjectWorkLogExtractionProposalsResult | null>(null);
  const [workLogExtractionItemsResult, setWorkLogExtractionItemsResult] =
    useState<ProjectWorkLogExtractionItemsResult | null>(null);
  const [approvedWorkLogExtractionCandidateIds, setApprovedWorkLogExtractionCandidateIds] =
    useState<Set<string>>(() => new Set());
  const [workSummarySnapshotsResult, setWorkSummarySnapshotsResult] =
    useState<ProjectWorkSummarySnapshotsResult | null>(null);
  const [workSummarySnapshotDateFilter, setWorkSummarySnapshotDateFilter] = useState("");
  const [workSummarySnapshotProjectFilter, setWorkSummarySnapshotProjectFilter] = useState("");
  const [workLogExtractionItemDateFilter, setWorkLogExtractionItemDateFilter] = useState("");
  const [workLogExtractionItemProjectFilter, setWorkLogExtractionItemProjectFilter] = useState("");
  const [workLogPreviewFilters, setWorkLogPreviewFilters] = useState<WorkLogPreviewFilters>(() =>
    emptyWorkLogPreviewFilters(),
  );
  const [expandedWorkSummarySnapshotIds, setExpandedWorkSummarySnapshotIds] = useState<Set<number>>(
    () => new Set(),
  );
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
  const isWorkSummaryRunning =
    workSummaryState === "loading"
    || workSummarySnapshotsState === "loading"
    || workLogCoverageState === "loading"
    || workLogCandidatesState === "loading"
    || workLogExtractionState === "loading"
    || workLogExtractionItemsState === "loading"
    || workManagementRefreshState === "loading";
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
    workSummaryRunning: isWorkSummaryRunning,
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
  const workSummaryFailureMessage = workSummaryFailureText(workSummaryState);
  const workSummaryMeta = workSummaryMetaText(workSummaryState, workSummaryResult);
  const workSummaryIndexStatus = workSummaryResult ? workSummaryIndexStatusText(workSummaryResult) : null;
  const workSummaryPersistenceStatus = workSummaryResult ? workSummaryPersistenceText(workSummaryResult) : null;
  const workLogCoverageFailureMessage = workLogCoverageFailureText(workLogCoverageState);
  const workLogCoverageMeta = workLogCoverageMetaText(workLogCoverageState, workLogCoverageResult);
  const workLogCandidatesFailureMessage = workLogCandidatesFailureText(workLogCandidatesState);
  const workLogCandidatesMeta = workLogCandidatesMetaText(workLogCandidatesState, workLogCandidatesResult);
  const workLogExtractionFailureMessage = workLogExtractionFailureText(workLogExtractionState);
  const workLogExtractionMeta = workLogExtractionMetaText(
    workLogExtractionState,
    workLogExtractionResult,
    workLogExtractionRunMode,
  );
  const workLogExtractionProviderNotice =
    workLogExtractionProviderNoticeText(workLogExtractionResult, workLogExtractionRunMode);
  const workLogExtractionRejectionSummary =
    workLogExtractionRejectionSummaryText(workLogExtractionResult);
  const workLogExtractionPersistenceStatus = workLogExtractionResult
    ? workLogExtractionPersistenceText(workLogExtractionResult)
    : null;
  const workLogExtractionItemsFailureMessage = workLogExtractionItemsFailureText(workLogExtractionItemsState);
  const workLogExtractionItemsMeta = workLogExtractionItemsMetaText(
    workLogExtractionItemsState,
    workLogExtractionItemsResult,
  );
  const workSummarySnapshotsFailureMessage = workSummarySnapshotsFailureText(workSummarySnapshotsState);
  const workSummarySnapshotsMeta = workSummarySnapshotsMetaText(
    workSummarySnapshotsState,
    workSummarySnapshotsResult,
  );
  const hasWorkSummarySnapshotFilters =
    workSummarySnapshotDateFilter.trim() !== "" || workSummarySnapshotProjectFilter.trim() !== "";
  const hasWorkLogExtractionItemFilters =
    workLogExtractionItemDateFilter.trim() !== "" || workLogExtractionItemProjectFilter.trim() !== "";
  const workLogPreviewFilterCount = activeWorkLogPreviewFilterCount(workLogPreviewFilters);
  const hasWorkLogPreviewFilters = workLogPreviewFilterCount > 0;
  const workSummarySnapshotDateSuggestions = workSummarySnapshotsResult?.available_dates ?? [];
  const workSummarySnapshotProjectSuggestions = workSummarySnapshotsResult?.available_projects ?? [];
  const workLogExtractionItemDateSuggestions = workLogExtractionItemsResult?.available_dates ?? [];
  const workLogExtractionItemProjectSuggestions = workLogExtractionItemsResult?.available_projects ?? [];
  const filteredWorkLogCandidates = filterWorkLogExtractionCandidates(
    workLogCandidatesResult?.candidates ?? [],
    workLogPreviewFilters,
  );
  const filteredWorkLogExtractionProposals = filterWorkLogExtractionProposals(
    workLogExtractionResult?.proposals ?? [],
    workLogPreviewFilters,
  );
  const workLogPreviewProjectFilterSuggestions = workLogPreviewProjectSuggestions(
    workLogCandidatesResult?.candidates ?? [],
    workLogExtractionResult?.proposals ?? [],
  );
  const workLogPreviewDateFilterSuggestions = workLogProposalDateSuggestions(
    workLogExtractionResult?.proposals ?? [],
  );
  const visibleWorkSummaries = workSummaryResult?.summaries.slice(0, WORK_SUMMARY_DISPLAY_LIMIT) ?? [];
  const hiddenWorkSummaryCount = Math.max(
    0,
    (workSummaryResult?.summaries.length ?? 0) - WORK_SUMMARY_DISPLAY_LIMIT,
  );
  const visibleWorkSummarySnapshots =
    workSummarySnapshotsResult?.snapshots.slice(0, WORK_SUMMARY_HISTORY_LIMIT) ?? [];
  const visibleWorkLogCoverageFiles =
    workLogCoverageResult?.files.slice(0, WORK_LOG_COVERAGE_DISPLAY_LIMIT) ?? [];
  const hiddenWorkLogCoverageFileCount = Math.max(
    0,
    (workLogCoverageResult?.files.length ?? 0) - WORK_LOG_COVERAGE_DISPLAY_LIMIT,
  );
  const visibleWorkLogCandidates =
    filteredWorkLogCandidates.slice(0, WORK_LOG_CANDIDATE_DISPLAY_LIMIT);
  const hiddenWorkLogCandidateCount = Math.max(
    0,
    filteredWorkLogCandidates.length - WORK_LOG_CANDIDATE_DISPLAY_LIMIT,
  );
  const visibleWorkLogExtractionProposals =
    filteredWorkLogExtractionProposals.slice(0, WORK_LOG_EXTRACTION_DISPLAY_LIMIT);
  const savedWorkLogExtractionCandidateIds = useMemo(
    () => workLogExtractionSavedCandidateIds(workLogExtractionItemsResult),
    [workLogExtractionItemsResult],
  );
  const unsavedAcceptedWorkLogExtractionCandidateIds = workLogExtractionUnsavedAcceptedIds(
    workLogExtractionResult,
    savedWorkLogExtractionCandidateIds,
  );
  const selectedApprovedWorkLogExtractionCandidateIds = unsavedAcceptedWorkLogExtractionCandidateIds
    .filter((candidateId) => approvedWorkLogExtractionCandidateIds.has(candidateId));
  const selectedApprovedWorkLogExtractionCount = selectedApprovedWorkLogExtractionCandidateIds.length;
  const workLogExtractionApprovalStatus = workLogExtractionApprovalText(
    workLogExtractionResult,
    selectedApprovedWorkLogExtractionCount,
  );
  const hiddenWorkLogExtractionProposalCount = Math.max(
    0,
    filteredWorkLogExtractionProposals.length - WORK_LOG_EXTRACTION_DISPLAY_LIMIT,
  );
  const visibleWorkLogExtractionItems =
    workLogExtractionItemsResult?.items.slice(0, WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT) ?? [];
  const visibleWorkLogExtractionItemGroups =
    groupWorkLogExtractionItemsByProjectDate(visibleWorkLogExtractionItems);
  const hiddenWorkLogExtractionItemCount = Math.max(
    0,
    (workLogExtractionItemsResult?.items.length ?? 0) - WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT,
  );
  const workManagementOverviewLoaded =
    workSummaryResult !== null
    || workSummarySnapshotsResult !== null
    || workLogExtractionResult !== null
    || workLogExtractionItemsResult !== null
    || workLogCoverageResult !== null;
  const workManagementOverview = useMemo(() => buildWorkManagementOverview({
    coverage: workLogCoverageResult,
    extractionItems: workLogExtractionItemsResult,
    extractionProposals: workLogExtractionResult,
    snapshots: workSummarySnapshotsResult,
    summary: workSummaryResult,
  }), [
    workLogCoverageResult,
    workLogExtractionResult,
    workLogExtractionItemsResult,
    workSummaryResult,
    workSummarySnapshotsResult,
  ]);
  const visibleWorkManagementOverviewRows =
    workManagementOverview.rows.slice(0, WORK_MANAGEMENT_OVERVIEW_DISPLAY_LIMIT);
  const hiddenWorkManagementOverviewRowCount = Math.max(
    0,
    workManagementOverview.rows.length - WORK_MANAGEMENT_OVERVIEW_DISPLAY_LIMIT,
  );
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

  function workSummarySnapshotOptions({
    date = workSummarySnapshotDateFilter,
    project = workSummarySnapshotProjectFilter,
  }: { date?: string; project?: string } = {}): ProjectWorkSummarySnapshotsOptions {
    const trimmedDate = date.trim();
    const trimmedProject = project.trim();
    return {
      limit: WORK_SUMMARY_HISTORY_LIMIT,
      ...(trimmedDate ? { date: trimmedDate } : {}),
      ...(trimmedProject ? { project: trimmedProject } : {}),
    };
  }

  function workLogExtractionItemOptions({
    date = workLogExtractionItemDateFilter,
    project = workLogExtractionItemProjectFilter,
  }: { date?: string; project?: string } = {}): ProjectWorkLogExtractionItemsOptions {
    const trimmedDate = date.trim();
    const trimmedProject = project.trim();
    return {
      limit: WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT,
      ...(trimmedDate ? { date: trimmedDate } : {}),
      ...(trimmedProject ? { project: trimmedProject } : {}),
    };
  }

  async function refreshWorkSummarySnapshots(options = workSummarySnapshotOptions()) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSummarySnapshotsState("loading");
    try {
      const next = await listProjectWorkSummarySnapshots(options);
      setWorkSummarySnapshotsResult(next);
      setWorkSummarySnapshotsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSummarySnapshotsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkLogExtractionItems(options = workLogExtractionItemOptions()) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogExtractionItemsState("loading");
    try {
      const next = await listProjectWorkLogExtractionItems(options);
      setWorkLogExtractionItemsResult(next);
      setWorkLogExtractionItemsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogExtractionItemsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkSummarySnapshotsAfterSave() {
    setWorkSummarySnapshotsState("loading");
    try {
      const next = await listProjectWorkSummarySnapshots(workSummarySnapshotOptions());
      setWorkSummarySnapshotsResult(next);
      setWorkSummarySnapshotsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSummarySnapshotsState("failed");
    }
  }

  function toggleWorkSummarySnapshotDetails(snapshotId: number) {
    setExpandedWorkSummarySnapshotIds((current) => {
      const next = new Set(current);
      if (next.has(snapshotId)) {
        next.delete(snapshotId);
      } else {
        next.add(snapshotId);
      }
      return next;
    });
  }

  async function refreshWorkLogCoverage() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogCoverageState("loading");
    try {
      const next = await loadProjectWorkLogCoverage();
      setWorkLogCoverageResult(next);
      setWorkLogCoverageState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogCoverageState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkLogCandidates() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogCandidatesState("loading");
    try {
      const next = await loadProjectWorkLogCandidates();
      setWorkLogCandidatesResult(next);
      setWorkLogCandidatesState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogCandidatesState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  function toggleApprovedWorkLogExtractionCandidate(candidateId: string, checked: boolean) {
    setApprovedWorkLogExtractionCandidateIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(candidateId);
      } else {
        next.delete(candidateId);
      }
      return next;
    });
  }

  async function refreshWorkLogExtraction({
    save = false,
    approvedCandidateIds,
    ai,
  }: { save?: boolean; approvedCandidateIds?: string[]; ai?: boolean } = {}) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const useAi = ai ?? (save ? (workLogExtractionResult?.used_ai ?? true) : true);
    setError(null);
    setWorkLogExtractionRunMode(useAi ? "ai" : "local");
    setWorkLogExtractionState("loading");
    try {
      const next = await loadProjectWorkLogExtractionProposals({
        ai: useAi,
        save,
        approved_candidate_ids: save ? approvedCandidateIds : undefined,
      });
      const nextAcceptedIds = new Set(acceptedWorkLogExtractionIds(next));
      setWorkLogExtractionResult(next);
      setApprovedWorkLogExtractionCandidateIds((current) => {
        if (!save) return new Set(workLogExtractionUnsavedAcceptedIds(next, savedWorkLogExtractionCandidateIds));
        return new Set([...current].filter((candidateId) => nextAcceptedIds.has(candidateId)));
      });
      setWorkLogExtractionState("ready");
      if (save) {
        setWorkLogExtractionItemsState("loading");
        const savedItems = await listProjectWorkLogExtractionItems(workLogExtractionItemOptions());
        setWorkLogExtractionItemsResult(savedItems);
        const nextSavedIds = workLogExtractionSavedCandidateIds(savedItems);
        setApprovedWorkLogExtractionCandidateIds((current) =>
          new Set([...current].filter((candidateId) =>
            nextAcceptedIds.has(candidateId) && !nextSavedIds.has(candidateId)
          )),
        );
        setWorkLogExtractionItemsState("ready");
      }
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogExtractionState("failed");
      if (save) {
        setWorkLogExtractionItemsState("failed");
      }
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkSummary({
    refreshSessionIndex = false,
    saveSnapshot = false,
    includeExtractions = false,
    includeSavedExtractions = false,
  }: {
    refreshSessionIndex?: boolean;
    saveSnapshot?: boolean;
    includeExtractions?: boolean;
    includeSavedExtractions?: boolean;
  } = {}) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSummaryState("loading");
    try {
      const next = await loadProjectWorkSummary({
        limit: WORK_SUMMARY_LIMIT,
        session_limit: WORK_SUMMARY_SESSION_LIMIT,
        summary_limit: WORK_SUMMARY_DISPLAY_LIMIT,
        refresh_session_index: refreshSessionIndex,
        save_snapshot: saveSnapshot,
        include_extractions: includeExtractions,
        include_saved_extractions: includeSavedExtractions,
        extraction_ai: includeExtractions,
      });
      setWorkSummaryResult(next);
      setWorkSummaryState("ready");
      if (saveSnapshot) {
        await refreshWorkSummarySnapshotsAfterSave();
      }
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSummaryState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkManagementOverview() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkManagementRefreshState("loading");
    setWorkSummaryState("loading");
    setWorkSummarySnapshotsState("loading");
    setWorkLogCoverageState("loading");
    setWorkLogCandidatesState("loading");
    setWorkLogExtractionRunMode("ai");
    setWorkLogExtractionState("loading");
    setWorkLogExtractionItemsState("loading");
    try {
      const nextSummary = await loadProjectWorkSummary({
        limit: WORK_SUMMARY_LIMIT,
        session_limit: WORK_SUMMARY_SESSION_LIMIT,
        summary_limit: WORK_SUMMARY_DISPLAY_LIMIT,
        include_saved_extractions: true,
      });
      setWorkSummaryResult(nextSummary);
      setWorkSummaryState("ready");

      const nextSnapshots = await listProjectWorkSummarySnapshots(workSummarySnapshotOptions());
      setWorkSummarySnapshotsResult(nextSnapshots);
      setWorkSummarySnapshotsState("ready");

      const nextCoverage = await loadProjectWorkLogCoverage();
      setWorkLogCoverageResult(nextCoverage);
      setWorkLogCoverageState("ready");

      const nextCandidates = await loadProjectWorkLogCandidates();
      setWorkLogCandidatesResult(nextCandidates);
      setWorkLogCandidatesState("ready");

      const nextExtraction = await loadProjectWorkLogExtractionProposals({
        ai: true,
      });
      const nextAcceptedIds = new Set(acceptedWorkLogExtractionIds(nextExtraction));
      setWorkLogExtractionResult(nextExtraction);
      setApprovedWorkLogExtractionCandidateIds(nextAcceptedIds);
      setWorkLogExtractionState("ready");

      const nextItems = await listProjectWorkLogExtractionItems(workLogExtractionItemOptions());
      setWorkLogExtractionItemsResult(nextItems);
      setWorkLogExtractionItemsState("ready");

      setWorkManagementRefreshState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkManagementRefreshState("failed");
      setWorkSummaryState((current) => (current === "loading" ? "failed" : current));
      setWorkSummarySnapshotsState((current) => (current === "loading" ? "failed" : current));
      setWorkLogCoverageState((current) => (current === "loading" ? "failed" : current));
      setWorkLogCandidatesState((current) => (current === "loading" ? "failed" : current));
      setWorkLogExtractionState((current) => (current === "loading" ? "failed" : current));
      setWorkLogExtractionItemsState((current) => (current === "loading" ? "failed" : current));
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
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

      <section className="panel work-summary-panel">
        <div className="panel-heading">
          <div>
            <h2>프로젝트 작업 요약</h2>
            <span data-work-summary-meta="true">{workSummaryMeta}</span>
          </div>
          <div className="panel-heading-actions">
            <button
              aria-label={workManagementRefreshActionLabel(
                workManagementRefreshState,
                workManagementOverviewLoaded,
                actionLockState,
              )}
              className="inline-action"
              data-refresh-work-management-overview="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkManagementOverview()}
              type="button"
            >
              <RefreshCw size={15} />
              {workManagementRefreshState === "loading"
                ? "관리 로딩"
                : workManagementOverviewLoaded
                  ? "전체 새로고침"
                  : "전체 관리"}
            </button>
            <button
              aria-label={workSummaryActionLabel(
                workSummaryState,
                workSummaryResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-summary="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary()}
              type="button"
            >
              <ClipboardList size={15} />
              {workSummaryState === "loading"
                ? "생성 중"
                : workSummaryResult
                  ? "새로고침"
                  : "요약 생성"}
            </button>
            <button
              aria-label="실제 Codex 세션을 다시 파싱해 작업 요약 세션 인덱스 갱신"
              className="inline-action"
              data-refresh-work-summary-session-index="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({ refreshSessionIndex: true })}
              type="button"
            >
              <RefreshCw size={15} />
              세션 재스캔
            </button>
            <button
              aria-label="현재 프로젝트 작업 요약을 SQLite 스냅샷으로 저장"
              className="inline-action"
              data-save-work-summary-snapshot="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({ saveSnapshot: true })}
              type="button"
            >
              <Database size={15} />
              스냅샷 저장
            </button>
            <button
              aria-label="accepted AI 진행로그 제안을 프로젝트별 일별 작업 요약 preview에 병합"
              className="inline-action"
              data-load-work-summary-with-extractions="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({ includeExtractions: true })}
              type="button"
            >
              <Sparkles size={15} />
              AI 병합 요약
            </button>
            <button
              aria-label="accepted AI 진행로그 제안을 병합한 프로젝트 작업 요약을 SQLite 스냅샷으로 저장"
              className="inline-action"
              data-save-work-summary-with-extractions-snapshot="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({ includeExtractions: true, saveSnapshot: true })}
              type="button"
            >
              <Database size={15} />
              AI 병합 저장
            </button>
            <button
              aria-label="저장된 accepted AI 추출 작업을 프로젝트별 일별 작업 요약 preview에 병합"
              className="inline-action"
              data-load-work-summary-with-saved-extractions="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({ includeSavedExtractions: true })}
              type="button"
            >
              <FileText size={15} />
              저장 병합 요약
            </button>
            <button
              aria-label="저장된 accepted AI 추출 작업을 병합한 프로젝트 작업 요약을 SQLite 스냅샷으로 저장"
              className="inline-action"
              data-save-work-summary-with-saved-extractions-snapshot="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummary({
                includeSavedExtractions: true,
                saveSnapshot: true,
              })}
              type="button"
            >
              <Database size={15} />
              저장 병합 저장
            </button>
            <button
              aria-label={workSummarySnapshotsActionLabel(
                workSummarySnapshotsState,
                workSummarySnapshotsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-summary-snapshots="true"
              disabled={isTopLevelActionLocked}
              onClick={() => refreshWorkSummarySnapshots()}
              type="button"
            >
              <FileText size={15} />
              {workSummarySnapshotsState === "loading"
                ? "기록 로딩"
                : workSummarySnapshotsResult
                  ? "기록 새로고침"
                  : "기록 보기"}
            </button>
            <button
              aria-label={workLogCoverageActionLabel(
                workLogCoverageState,
                workLogCoverageResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-coverage="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogCoverage()}
              type="button"
            >
              <FileText size={15} />
              {workLogCoverageState === "loading"
                ? "확인 중"
                : workLogCoverageResult
                  ? "로그 새로고침"
                  : "로그 범위"}
            </button>
            <button
              aria-label={workLogCandidatesActionLabel(
                workLogCandidatesState,
                workLogCandidatesResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-candidates="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogCandidates()}
              type="button"
            >
              <Brain size={15} />
              {workLogCandidatesState === "loading"
                ? "확인 중"
                : workLogCandidatesResult
                  ? "후보 새로고침"
                  : "추출 후보"}
            </button>
            <button
              aria-label={workLogExtractionActionLabel(
                workLogExtractionState,
                workLogExtractionResult !== null,
                actionLockState,
                "ai",
              )}
              className="inline-action"
              data-load-work-log-extraction="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogExtraction({ ai: true })}
              type="button"
            >
              <Sparkles size={15} />
              {workLogExtractionState === "loading" && workLogExtractionRunMode === "ai"
                ? "생성 중"
                : workLogExtractionResult
                  ? "제안 새로고침"
                  : "AI 제안"}
            </button>
            <button
              aria-label={workLogExtractionActionLabel(
                workLogExtractionState,
                workLogExtractionResult !== null,
                actionLockState,
                "local",
              )}
              className="inline-action"
              data-load-work-log-extraction-local="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogExtraction({ ai: false })}
              type="button"
            >
              <FileText size={15} />
              {workLogExtractionState === "loading" && workLogExtractionRunMode === "local"
                ? "로컬 생성 중"
                : workLogExtractionResult
                  ? "로컬 새로고침"
                  : "로컬 제안"}
            </button>
            <button
              aria-label={
                workLogExtractionResult
                  ? selectedApprovedWorkLogExtractionCount
                    ? `승인한 AI 작업 추출 제안 ${selectedApprovedWorkLogExtractionCount.toLocaleString()}개를 SQLite 관리 데이터로 저장`
                    : "선택한 accepted AI 작업 추출 제안이 없어 저장할 수 없습니다"
                  : "AI 작업 추출 제안을 먼저 생성한 뒤 선택 저장할 수 있습니다"
              }
              className="inline-action"
              data-save-work-log-extraction="true"
              disabled={isTopLevelActionLocked || selectedApprovedWorkLogExtractionCount === 0}
              onClick={() =>
                void refreshWorkLogExtraction({
                  save: true,
                  approvedCandidateIds: selectedApprovedWorkLogExtractionCandidateIds,
                })}
              type="button"
            >
              <Database size={15} />
              {workLogExtractionState === "loading" ? "처리 중" : "선택 저장"}
            </button>
            <button
              aria-label={workLogExtractionItemsActionLabel(
                workLogExtractionItemsState,
                workLogExtractionItemsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-items="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogExtractionItems()}
              type="button"
            >
              <FileText size={15} />
              {workLogExtractionItemsState === "loading"
                ? "불러오는 중"
                : workLogExtractionItemsResult
                  ? "저장 목록 새로고침"
                  : "저장 목록"}
            </button>
          </div>
        </div>
        {workSummaryFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-summary-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSummaryFailureMessage}</span>
          </div>
        ) : null}
        {workSummarySnapshotsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-summary-snapshots-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSummarySnapshotsFailureMessage}</span>
          </div>
        ) : null}
        {workLogCoverageFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-coverage-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogCoverageFailureMessage}</span>
          </div>
        ) : null}
        {workLogCandidatesFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-candidates-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogCandidatesFailureMessage}</span>
          </div>
        ) : null}
        {workLogExtractionFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-extraction-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogExtractionFailureMessage}</span>
          </div>
        ) : null}
        {workLogExtractionProviderNotice && workLogExtractionResult?.warnings.length ? (
          <section
            className="notice warning panel-notice provider-warning-notice"
            data-work-log-extraction-provider-warning="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <div>
              <span>{workLogExtractionProviderNotice}</span>
              <div className="warning-list">
                {workLogExtractionResult.warnings.map((warning, index) => (
                  <p key={textListItemKey(warning, index)}>
                    {redactSensitiveDisplayText(warning)}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {workLogExtractionItemsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-items-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogExtractionItemsFailureMessage}</span>
          </div>
        ) : null}
        <form
          className="work-summary-filter-row"
          data-work-summary-snapshots-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
            void refreshWorkSummarySnapshots();
          }}
        >
          <label>
            <span>기록 날짜</span>
            <input
              aria-label="저장된 작업 요약 스냅샷 날짜 필터"
              data-work-summary-snapshots-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-summary-snapshot-date-options"
              onChange={(event) => setWorkSummarySnapshotDateFilter(event.target.value)}
              placeholder="2026-06-09"
              type="text"
              value={workSummarySnapshotDateFilter}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="저장된 작업 요약 스냅샷 프로젝트 필터"
              data-work-summary-snapshots-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-summary-snapshot-project-options"
              onChange={(event) => setWorkSummarySnapshotProjectFilter(event.target.value)}
              placeholder="PromptVault"
              type="text"
              value={workSummarySnapshotProjectFilter}
            />
          </label>
          <button
            aria-label="저장된 작업 요약 스냅샷 필터 적용"
            className="inline-action"
            data-apply-work-summary-snapshot-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="저장된 작업 요약 스냅샷 필터 초기화"
            className="inline-action"
            data-clear-work-summary-snapshot-filters="true"
            disabled={isTopLevelActionLocked || !hasWorkSummarySnapshotFilters}
            onClick={() => {
              setWorkSummarySnapshotDateFilter("");
              setWorkSummarySnapshotProjectFilter("");
              void refreshWorkSummarySnapshots({ limit: WORK_SUMMARY_HISTORY_LIMIT });
            }}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-summary-snapshot-date-options">
          {workSummarySnapshotDateSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-summary-snapshot-project-options">
          {workSummarySnapshotProjectSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <form
          className="work-summary-filter-row"
          data-work-log-preview-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>제안 날짜</span>
            <input
              aria-label="AI 작업 추출 제안 날짜 필터"
              data-work-log-preview-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-preview-date-options"
              onChange={(event) =>
                setWorkLogPreviewFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))}
              placeholder="2026-06-09"
              type="text"
              value={workLogPreviewFilters.date}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="AI 작업 추출 후보와 제안 프로젝트 필터"
              data-work-log-preview-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-preview-project-options"
              onChange={(event) =>
                setWorkLogPreviewFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="CareVault"
              type="text"
              value={workLogPreviewFilters.project}
            />
          </label>
          <button
            aria-label={
              hasWorkLogPreviewFilters
                ? `AI 작업 추출 미리보기 필터 ${workLogPreviewFilterCount.toLocaleString()}개 적용`
                : "필터 없이 AI 작업 추출 미리보기 보기"
            }
            className="inline-action"
            data-apply-work-log-preview-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="AI 작업 추출 미리보기 필터 초기화"
            className="inline-action"
            data-clear-work-log-preview-filters="true"
            disabled={isTopLevelActionLocked || !hasWorkLogPreviewFilters}
            onClick={() => setWorkLogPreviewFilters(emptyWorkLogPreviewFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-log-preview-date-options">
          {workLogPreviewDateFilterSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-log-preview-project-options">
          {workLogPreviewProjectFilterSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <form
          className="work-summary-filter-row"
          data-work-log-items-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
            void refreshWorkLogExtractionItems();
          }}
        >
          <label>
            <span>추출 날짜</span>
            <input
              aria-label="저장된 AI 작업 추출 항목 날짜 필터"
              data-work-log-items-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-item-date-options"
              onChange={(event) => setWorkLogExtractionItemDateFilter(event.target.value)}
              placeholder="2026-06-04"
              type="text"
              value={workLogExtractionItemDateFilter}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="저장된 AI 작업 추출 항목 프로젝트 필터"
              data-work-log-items-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-item-project-options"
              onChange={(event) => setWorkLogExtractionItemProjectFilter(event.target.value)}
              placeholder="CareVault"
              type="text"
              value={workLogExtractionItemProjectFilter}
            />
          </label>
          <button
            aria-label="저장된 AI 작업 추출 항목 필터 적용"
            className="inline-action"
            data-apply-work-log-items-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="저장된 AI 작업 추출 항목 필터 초기화"
            className="inline-action"
            data-clear-work-log-items-filters="true"
            disabled={isTopLevelActionLocked || !hasWorkLogExtractionItemFilters}
            onClick={() => {
              setWorkLogExtractionItemDateFilter("");
              setWorkLogExtractionItemProjectFilter("");
              void refreshWorkLogExtractionItems({ limit: WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT });
            }}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-log-item-date-options">
          {workLogExtractionItemDateSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-log-item-project-options">
          {workLogExtractionItemProjectSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        {workSummaryIndexStatus ? (
          <div className="work-summary-index" data-work-summary-index="true">
            <ShieldCheck size={15} />
            <span>{workSummaryIndexStatus}</span>
          </div>
        ) : null}
        {workSummaryPersistenceStatus ? (
          <div className="work-summary-index" data-work-summary-persistence="true">
            <Database size={15} />
            <span>{workSummaryPersistenceStatus}</span>
          </div>
        ) : null}
        {workSummarySnapshotsResult || workSummarySnapshotsState !== "idle" ? (
          <div className="work-summary-index" data-work-summary-snapshots-meta="true">
            <FileText size={15} />
            <span>{workSummarySnapshotsMeta}</span>
          </div>
        ) : null}
        {workLogCoverageResult || workLogCoverageState !== "idle" ? (
          <div className="work-summary-index" data-work-log-coverage-meta="true">
            <FileText size={15} />
            <span>{workLogCoverageMeta}</span>
          </div>
        ) : null}
        {workLogCandidatesResult || workLogCandidatesState !== "idle" ? (
          <div className="work-summary-index" data-work-log-candidates-meta="true">
            <Brain size={15} />
            <span>{workLogCandidatesMeta}</span>
          </div>
        ) : null}
        {workLogExtractionResult || workLogExtractionState !== "idle" ? (
          <div className="work-summary-index" data-work-log-extraction-meta="true">
            <Sparkles size={15} />
            <span>{workLogExtractionMeta}</span>
          </div>
        ) : null}
        {workLogExtractionRejectionSummary ? (
          <div className="work-summary-index" data-work-log-extraction-rejection-summary="true">
            <AlertTriangle size={15} />
            <span>{workLogExtractionRejectionSummary}</span>
          </div>
        ) : null}
        {workLogCandidatesResult || workLogExtractionResult ? (
          <div className="work-summary-index" data-work-log-preview-filter-meta="true">
            <Search size={15} />
            <span>
              미리보기 필터 {workLogPreviewFilterCount.toLocaleString()}개 · 후보{" "}
              {filteredWorkLogCandidates.length.toLocaleString()} /{" "}
              {(workLogCandidatesResult?.candidates.length ?? 0).toLocaleString()}개 · 제안{" "}
              {filteredWorkLogExtractionProposals.length.toLocaleString()} /{" "}
              {(workLogExtractionResult?.proposals.length ?? 0).toLocaleString()}개
            </span>
          </div>
        ) : null}
        {workLogExtractionResult ? (
          <div className="work-summary-index" data-work-log-extraction-approval-meta="true">
            <CheckCircle2 size={15} />
            <span>{workLogExtractionApprovalStatus}</span>
          </div>
        ) : null}
        {workLogExtractionPersistenceStatus ? (
          <div className="work-summary-index" data-work-log-extraction-persistence="true">
            <Database size={15} />
            <span>{workLogExtractionPersistenceStatus}</span>
          </div>
        ) : null}
        {workLogExtractionItemsResult || workLogExtractionItemsState !== "idle" ? (
          <div className="work-summary-index" data-work-log-items-meta="true">
            <FileText size={15} />
            <span>{workLogExtractionItemsMeta}</span>
          </div>
        ) : null}
        {workManagementOverviewLoaded ? (
          <div className="work-summary-index" data-work-management-overview-meta="true">
            <ClipboardList size={15} />
            <span>{workManagementOverviewMetaText(workManagementOverview)}</span>
          </div>
        ) : null}
        {workManagementOverviewLoaded ? (
          visibleWorkManagementOverviewRows.length ? (
            <div className="work-summary-list" data-work-management-overview="true">
              {visibleWorkManagementOverviewRows.map((row) => (
                <article className="work-summary-row work-management-overview-row" key={row.key}>
                  <div>
                    <strong>{row.project}</strong>
                    <span>{row.date}</span>
                  </div>
                  <p>{row.latest_title ?? "제목 없는 작업 관리 row"}</p>
                  <span>
                    {workManagementOverviewSourceText(row)} · 작업 {row.work_item_count.toLocaleString()}개 ·
                    세션 근거 {row.session_evidence_count.toLocaleString()}건 · 추출제안{" "}
                    {row.extraction_proposal_count.toLocaleString()}개 · 저장추출{" "}
                    {row.saved_extraction_count.toLocaleString()}개
                  </span>
                </article>
              ))}
              {hiddenWorkManagementOverviewRowCount ? (
                <div className="work-summary-overflow">
                  그 외 관리 row {hiddenWorkManagementOverviewRowCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-management-overview="true">
              로드된 프로젝트/일자 관리 근거 없음
            </div>
          )
        ) : null}
        {workSummaryResult ? (
          <div className="work-summary-content">
            <pre data-work-summary-narrative="true">{workSummaryResult.narrative_markdown}</pre>
            <div className="work-summary-list">
              {visibleWorkSummaries.map((summary) => (
                <article className="work-summary-row" key={`${summary.date}-${summary.project}`}>
                  <div>
                    <strong>{summary.project}</strong>
                    <span>{summary.date}</span>
                  </div>
                  <p>{summary.headline}</p>
                  <span>
                    작업 {summary.work_item_count.toLocaleString()}개 · 세션 근거{" "}
                    {summary.session_evidence_count.toLocaleString()}건 · citations{" "}
                    {summary.citations.length.toLocaleString()}개
                  </span>
                </article>
              ))}
              {hiddenWorkSummaryCount ? (
                <div className="work-summary-overflow">
                  그 외 요약 {hiddenWorkSummaryCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="empty compact" data-empty-work-summary="true">
            프로젝트 진행 로그와 세션 근거 요약 대기 중
          </div>
        )}
        {workLogCoverageResult ? (
          visibleWorkLogCoverageFiles.length ? (
            <div className="work-summary-list" data-work-log-coverage="true">
              {visibleWorkLogCoverageFiles.map((file) => (
                <article className="work-summary-row work-log-coverage-row" key={file.source_path}>
                  <div>
                    <strong>{file.project}</strong>
                    <span>{file.source_file}</span>
                  </div>
                  <p>
                    {file.status === "parsed"
                      ? `${file.latest_date ?? "날짜 없음"} · ${file.latest_title ?? "Untitled work"}`
                      : file.status === "unreadable"
                        ? "파일을 읽지 못한 진행 로그"
                        : "날짜 heading을 찾지 못한 진행 로그"}
                  </p>
                  <span>
                    {file.status} · 작업 {file.work_item_count.toLocaleString()}개 · {file.source_path}
                  </span>
                </article>
              ))}
              {hiddenWorkLogCoverageFileCount ? (
                <div className="work-summary-overflow">
                  그 외 작업 로그 {hiddenWorkLogCoverageFileCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-coverage="true">
              감지된 프로젝트 작업 로그 없음
            </div>
          )
        ) : null}
        {workLogCandidatesResult ? (
          visibleWorkLogCandidates.length ? (
            <div className="work-summary-list" data-work-log-candidates="true">
              {visibleWorkLogCandidates.map((candidate) => (
                <article className="work-summary-row work-log-candidate-row" key={candidate.candidate_id}>
                  <div>
                    <strong>{candidate.project}</strong>
                    <span>{candidate.source_file}</span>
                  </div>
                  <p className="work-log-candidate-excerpt">{candidate.excerpt}</p>
                  <span>
                    {candidate.reason} · {candidate.line_count.toLocaleString()}줄 ·{" "}
                    {candidate.char_count.toLocaleString()}자 · {candidate.candidate_id}
                  </span>
                  <span data-work-log-candidate-review={candidate.candidate_id}>
                    {workLogCandidateReviewLabel(candidate)}
                  </span>
                  <span>
                    risk{" "}
                    {candidate.risk_flags.length
                      ? candidate.risk_flags.map(riskFlagLabel).join(", ")
                      : "없음"}{" "}
                    · {candidate.source_path}
                  </span>
                </article>
              ))}
              {hiddenWorkLogCandidateCount ? (
                <div className="work-summary-overflow">
                  그 외 AI 추출 후보 {hiddenWorkLogCandidateCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-candidates="true">
              {hasWorkLogPreviewFilters && workLogCandidatesResult.candidates.length
                ? "필터에 맞는 AI 추출 후보 없음"
                : "AI 추출 후보로 보낼 unparsed 진행 로그 없음"}
            </div>
          )
        ) : null}
        {workLogExtractionResult ? (
          visibleWorkLogExtractionProposals.length ? (
            <div className="work-summary-list" data-work-log-extraction="true">
              {visibleWorkLogExtractionProposals.map((proposal) => {
                const saveStateText = workLogProposalSaveStateText(
                  proposal,
                  savedWorkLogExtractionCandidateIds,
                );
                return (
                  <article
                    className="work-summary-row work-log-proposal-row"
                    key={proposal.candidate_id}
                  >
                    <div>
                      <strong>{proposal.project}</strong>
                      <span>{proposal.date ?? "날짜 미확정"}</span>
                      {saveStateText === "저장됨" ? (
                        <span
                          className="work-log-proposal-approval is-saved"
                          data-work-log-proposal-saved={proposal.candidate_id}
                        >
                          <CheckCircle2 size={14} />
                          {saveStateText}
                        </span>
                      ) : saveStateText ? (
                        <label className="work-log-proposal-approval">
                          <input
                            checked={approvedWorkLogExtractionCandidateIds.has(proposal.candidate_id)}
                            data-work-log-proposal-approval={proposal.candidate_id}
                            onChange={(event) =>
                              toggleApprovedWorkLogExtractionCandidate(
                                proposal.candidate_id,
                                event.currentTarget.checked,
                              )}
                            type="checkbox"
                          />
                          <span>{saveStateText}</span>
                        </label>
                      ) : null}
                    </div>
                    <p>{proposal.title}</p>
                    <p className="work-log-proposal-evidence">{proposal.evidence}</p>
                    <span>
                      {proposal.accepted ? "accepted" : "rejected"} · {proposal.status} · confidence{" "}
                      {proposal.confidence.toFixed(2)} · {proposal.candidate_id}
                    </span>
                    <span data-work-log-proposal-review={proposal.candidate_id}>
                      {workLogExtractionReviewLabel(proposal, workLogExtractionResult)}
                    </span>
                    <span>
                      {proposal.rejection_reason
                        ? `reason ${proposal.rejection_reason} · `
                        : ""}
                      {proposal.source_path}
                    </span>
                  </article>
                );
              })}
              {hiddenWorkLogExtractionProposalCount ? (
                <div className="work-summary-overflow">
                  그 외 AI 작업 추출 제안 {hiddenWorkLogExtractionProposalCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-extraction="true">
              {hasWorkLogPreviewFilters && workLogExtractionResult.proposals.length
                ? "필터에 맞는 AI 작업 추출 제안 없음"
                : "검증된 AI 작업 추출 제안 없음"}
            </div>
          )
        ) : null}
        {workLogExtractionItemsResult ? (
          visibleWorkLogExtractionItems.length ? (
            <div className="work-summary-list" data-work-log-items="true">
              {visibleWorkLogExtractionItemGroups.map((group) => (
                <section
                  className="work-log-item-group"
                  data-work-log-item-group={group.group_id}
                  key={group.group_id}
                >
                  <div className="work-log-item-group-heading">
                    <strong>{group.project}</strong>
                    <span>{group.date} · 저장 {group.item_count.toLocaleString()}개</span>
                  </div>
                  {group.items.map((item) => (
                    <article
                      className="work-summary-row work-log-proposal-row"
                      key={item.id}
                    >
                      <div>
                        <strong>{item.project}</strong>
                        <span>{item.date}</span>
                      </div>
                      <p>{item.title}</p>
                      <p className="work-log-proposal-evidence">{item.evidence}</p>
                      <span>
                        #{item.id.toLocaleString()} · {item.provider}
                        {item.used_ai ? " · AI" : " · local"} · {item.status} · confidence{" "}
                        {item.confidence.toFixed(2)}
                      </span>
                      <span>
                        {item.source_file} · saved {item.saved_at} · {item.source_path}
                      </span>
                      {item.warnings.length ? (
                        <span>warnings {item.warnings.join("; ")}</span>
                      ) : null}
                    </article>
                  ))}
                </section>
              ))}
              {hiddenWorkLogExtractionItemCount ? (
                <div className="work-summary-overflow">
                  그 외 저장 추출 작업 {hiddenWorkLogExtractionItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-items="true">
              저장된 AI 작업 추출 항목 없음
            </div>
          )
        ) : null}
        {workSummarySnapshotsResult ? (
          visibleWorkSummarySnapshots.length ? (
            <div className="work-summary-list" data-work-summary-snapshots="true">
              {visibleWorkSummarySnapshots.map((snapshot) => {
                const detailsExpanded = expandedWorkSummarySnapshotIds.has(snapshot.id);
                const visibleSummaries = workSummarySnapshotDisplaySummaries(snapshot, detailsExpanded);
                const summaryOverflowText = workSummarySnapshotSummaryOverflowText(
                  snapshot,
                  visibleSummaries.length,
                );
                const detailToggleText = workSummarySnapshotDetailToggleText(snapshot, detailsExpanded);
                const extractionMergeText = workSummarySnapshotExtractionMergeText(snapshot);
                return (
                  <article className="work-summary-row" key={snapshot.id}>
                    <div>
                      <strong>스냅샷 #{snapshot.id.toLocaleString()}</strong>
                      <span>{snapshot.created_at}</span>
                    </div>
                    <p>{snapshot.narrative_markdown.split("\n")[0]}</p>
                    <span>
                      {snapshot.provider}
                      {snapshot.used_ai ? " · AI" : " · local"} · 프로젝트{" "}
                      {snapshot.project_count.toLocaleString()}개 · {snapshot.date_count.toLocaleString()}일 · 작업{" "}
                      {snapshot.total_items.toLocaleString()}개 · 세션 근거{" "}
                      {snapshot.session_evidence_count.toLocaleString()}건
                      {extractionMergeText ? ` · ${extractionMergeText}` : ""}
                    </span>
                    {visibleSummaries.length ? (
                      <ul className="work-summary-snapshot-details">
                        {visibleSummaries.map((summary) => (
                          <li key={`${snapshot.id}-${summary.date}-${summary.project}`}>
                            <strong>
                              {summary.project} · {summary.date}
                            </strong>
                            <span>
                              작업 {summary.work_item_count.toLocaleString()}개 · 세션 근거{" "}
                              {summary.session_evidence_count.toLocaleString()}건
                            </span>
                            <p>{summary.headline}</p>
                          </li>
                        ))}
                        {summaryOverflowText ? <li className="snapshot-detail-overflow">{summaryOverflowText}</li> : null}
                      </ul>
                    ) : null}
                    {detailToggleText ? (
                      <button
                        aria-expanded={detailsExpanded}
                        aria-label={`스냅샷 #${snapshot.id.toLocaleString()} ${detailToggleText}`}
                        className="inline-action work-summary-snapshot-toggle"
                        data-work-summary-snapshot-toggle={snapshot.id}
                        onClick={() => toggleWorkSummarySnapshotDetails(snapshot.id)}
                        type="button"
                      >
                        {detailsExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        {detailToggleText}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-summary-snapshots="true">
              저장된 프로젝트 작업 요약 스냅샷 없음
            </div>
          )
        ) : null}
      </section>

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
                        <span>{importStateUpdatedAtText(state.updated_at)}</span>
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
                        <span>{importEventTimestampText(event)}</span>
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
                {planPanelTimestampText(plan?.generated_at, planState)}
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
                              source.notes,
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
                          source.notes,
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
                            source.notes,
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
                            source.notes,
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
            <span>{importRunTimestampText(importResult?.generated_at, importState)}</span>
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
            <span>{scanResultTimestampText(result?.generated_at)}</span>
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
