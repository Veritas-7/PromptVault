import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  History,
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
  freezeProjectWorkLogManagementRows,
  loadProjectWorkAiProviderHealth,
  loadProjectWorkAiProviderStatus,
  loadProjectWorkLogCandidates,
  loadProjectWorkLogCoverage,
  loadProjectWorkLogExtractionProposals,
  loadProjectWorkLogNormalizationCandidates,
  loadProjectWorkLogNormalizationProposals,
  loadProjectWorkLogNormalizationReviewQueue,
  applyProjectWorkLogNormalizationQueue,
  listProjectWorkLogNormalizedItems,
  loadProjectWorkLogReviewQueue,
  loadProjectWorkSessionEvidenceProposals,
  loadProjectWorkSessionEvidenceNearby,
  loadProjectWorkSessionEvidenceSourceProposals,
  searchProjectWorkSessionEvidenceSource,
  loadProjectWorkSessionEvidenceReviewQueue,
  applyProjectWorkSessionEvidenceReviewRows,
  listProjectWorkLogExtractionItems,
  listProjectWorkLogExtractionRuns,
  loadProjectWorkSummary,
  loadProjectWorkStatusExport,
  PROJECT_WORK_SESSION_INDEX_MAX_BATCH_FILES,
  runProjectWorkSessionIndex,
  listProjectWorkSummarySnapshots,
  listProjectWorkSessionEvidenceReviewedItems,
  listImportEvents,
  listImportStates,
  listStoredPromptFacets,
  loadStoredPrompts,
  planScan,
  scanProgress,
  scanPrompts,
  type ProjectWorkLogExtractionItemsOptions,
  type ProjectWorkLogNormalizedItemsOptions,
  type ProjectWorkSessionEvidenceReviewedItemsOptions,
  type ProjectWorkSummarySnapshotsOptions,
  updateProjectWorkLogNormalizationReviewQueueItem,
  updateProjectWorkLogReviewQueueItem,
  updateProjectWorkSessionEvidenceReviewQueue,
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
  parseWorkSummarySessionLimit,
  WORK_SUMMARY_DEFAULT_SESSION_LIMIT,
  WORK_SUMMARY_MAX_SESSION_LIMIT,
  workSummarySessionLimitStatusText,
} from "./workSummarySessionLimit";
import {
  parseWorkStatusExportLimit,
  WORK_STATUS_EXPORT_DEFAULT_LIMIT,
  WORK_STATUS_EXPORT_MAX_LIMIT,
  workStatusExportLimitStatusText,
} from "./workStatusExportLimit";
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
import {
  activeWorkLogCoverageFilterCount,
  emptyWorkLogCoverageFilters,
  filterWorkLogCoverageFiles,
  workLogCoverageFilterMetaText,
  workLogCoverageProjectSuggestions,
  type WorkLogCoverageFilters,
  type WorkLogCoverageStatusFilter,
} from "./workLogCoverageFilters";
import {
  activeWorkReviewQueueFilterCount,
  emptyWorkReviewQueueFilters,
  filterWorkLogNormalizationReviewQueueItems,
  filterWorkLogReviewQueueItems,
  filterWorkSessionEvidenceReviewQueueItems,
  workReviewQueueDateSuggestions,
  workReviewQueueFilterMetaText,
  workReviewQueueProjectSuggestions,
  workReviewQueueReasonSuggestions,
  type WorkReviewQueueFilters,
  type WorkReviewQueueStateFilter,
} from "./reviewQueueFilters";
import { groupWorkLogExtractionItemsByProjectDate } from "./workLogExtractionItemGroups";
import {
  activeWorkManagementOverviewFilterCount,
  buildWorkManagementOverview,
  emptyWorkManagementOverviewFilters,
  filterWorkManagementOverviewRows,
  sortWorkManagementOverviewRows,
  workManagementOverviewConfidenceText,
  workManagementOverviewDateSuggestions,
  workManagementOverviewDurabilityWarningText,
  workManagementOverviewFilterMetaText,
  workManagementOverviewMetaText,
  workManagementOverviewNextActionText,
  workManagementOverviewPersistenceText,
  workManagementOverviewProjectSuggestions,
  workManagementOverviewSessionText,
  workManagementOverviewSourceText,
  type WorkManagementOverviewFilters,
  type WorkManagementOverviewPersistenceState,
  type WorkManagementOverviewSort,
  type WorkManagementOverviewSource,
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
  ProjectWorkAiProviderHealthResult,
  ProjectWorkAiProviderStatusResult,
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogExtractionRunsResult,
  ProjectWorkLogNormalizationCandidatesResult,
  ProjectWorkLogNormalizationApplyResult,
  ProjectWorkLogNormalizedItemsResult,
  ProjectWorkLogNormalizationProposalsResult,
  ProjectWorkLogNormalizationReviewQueueResult,
  ProjectWorkLogReviewQueueResult,
  ProjectWorkSessionEvidenceProposalsResult,
  ProjectWorkSessionEvidenceNearbyResult,
  ProjectWorkSessionEvidenceSourceProposal,
  ProjectWorkSessionEvidenceSourceProposalsResult,
  ProjectWorkSessionEvidenceSourceSearchResult,
  ProjectWorkSessionEvidenceReviewApplyResult,
  ProjectWorkSessionEvidenceReviewedItemsResult,
  ProjectWorkSessionEvidenceReviewQueueItem,
  ProjectWorkSessionEvidenceReviewQueueResult,
  PromptRecord,
  ProjectWorkSessionIndexResult,
  ProjectWorkStatusExportRow,
  ProjectWorkStatusExportResult,
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
  workAiProviderHealthActionLabel,
  workAiProviderHealthFailureText,
  workAiProviderHealthMetaText,
  workAiProviderHealthProviderText,
  workAiProviderStatusActionLabel,
  workAiProviderStatusFailureText,
  workAiProviderStatusMetaText,
  workAiProviderStatusProviderText,
  workLogReviewQueueActionLabel,
  workLogReviewQueueFailureText,
  workLogReviewQueueItemStateText,
  workLogReviewQueueMetaText,
  workLogExtractionActionLabel,
  workLogExtractionApprovalText,
  workLogExtractionFailureText,
  workLogExtractionItemsActionLabel,
  workLogExtractionItemsFailureText,
  workLogExtractionItemsMetaText,
  workLogExtractionRunsActionLabel,
  workLogExtractionRunsFailureText,
  workLogExtractionRunsMetaText,
  workLogNormalizationCandidatesActionLabel,
  workLogNormalizationCandidatesFailureText,
  workLogNormalizationCandidatesMetaText,
  workLogNormalizationProposalsActionLabel,
  workLogNormalizationProposalsFailureText,
  workLogNormalizationProposalsMetaText,
  workLogNormalizationProposalWarningNoticeText,
  workLogNormalizationProposalReviewLabel,
  workLogNormalizationApplyActionLabel,
  workLogNormalizationApplyFailureText,
  workLogNormalizationApplyMetaText,
  workLogNormalizedItemsActionLabel,
  workLogNormalizedItemsFailureText,
  workLogNormalizedItemsForDisplay,
  workLogNormalizedItemsMetaText,
  workLogNormalizedItemsTotalCount,
  workLogNormalizationReviewQueueActionLabel,
  workLogNormalizationReviewQueueFailureText,
  workLogNormalizationReviewQueueItemStateText,
  workLogNormalizationReviewQueueMetaText,
  canApproveWorkLogNormalizationReviewQueueItem,
  canRejectWorkLogNormalizationReviewQueueItem,
  workSessionEvidenceCandidateReasonDiagnosticText,
  workSessionEvidenceProposalStateText,
  workSessionEvidenceProposalWarningNoticeText,
  workSessionEvidenceProposalsActionLabel,
  workSessionEvidenceProposalsFailureText,
  workSessionEvidenceProposalsMetaText,
  workSessionEvidenceReviewQueueActionLabel,
  workSessionEvidenceReviewApplyActionLabel,
  workSessionEvidenceReviewApplyFailureText,
  workSessionEvidenceReviewApplyMetaText,
  workSessionEvidenceReviewedItemsActionLabel,
  workSessionEvidenceReviewedItemsFailureText,
  workSessionEvidenceReviewedItemsMetaText,
  workSessionEvidenceReviewQueueFailureText,
  workSessionEvidenceReviewQueueItemStateText,
  workSessionEvidenceReviewQueueMetaText,
  workSessionEvidenceReviewQueueSourceRolesText,
  canApproveWorkSessionEvidenceReviewQueueItem,
  canRejectWorkSessionEvidenceReviewQueueItem,
  workLogExtractionMetaText,
  workLogExtractionPersistenceText,
  workLogExtractionProviderNoticeText,
  workLogExtractionRejectionSummaryText,
  workLogExtractionReviewLabel,
  workLogExtractionSavedCandidateIds,
  workLogExtractionUnsavedAcceptedIds,
  workManagementFreezeActionLabel,
  workManagementRefreshActionLabel,
  workManagementNextActionText,
  workManagementReadinessText,
  workManagementReviewBlockerText,
  workManagementReviewDecisionText,
  workManagementReviewResolutionText,
  filterWorkStatusExportRows,
  workLogCoverageActionLabel,
  workLogCoverageFailureText,
  workLogCoverageMetaText,
  workLogProposalSaveStateText,
  workSummaryActionLabel,
  workSummaryFailureText,
  workSummaryIndexStatusText,
  workSessionIndexCheckpointGuidanceText,
  workSessionIndexNextRunImpactText,
  workSessionIndexPartialBackfillWarningText,
  workSessionIndexPlannedRemainingText,
  workSummaryMetaText,
  workSummaryPersistenceText,
  workStatusExportActionLabel,
  workStatusExportFilterMetaText,
  workStatusExportFailureText,
  workStatusExportIndexStatusText,
  workStatusExportMetaText,
  workStatusExportPageStatusText,
  workStatusExportRowAuditToggleText,
  workStatusExportRowFilterLabel,
  workStatusExportRowSessionSourcesText,
  workStatusExportRowSourceFilesText,
  workStatusExportRowSourceRolesText,
  workStatusExportRowSourceStatusesText,
  workStatusExportRowStatusText,
  workSummarySnapshotsActionLabel,
  workSummarySnapshotsFailureText,
  workSummarySnapshotsMetaText,
  workSummarySnapshotDetailToggleText,
  workSummarySnapshotDisplaySummaries,
  workSummarySnapshotExtractionMergeText,
  workSummarySnapshotSummaryOverflowText,
  type WorkAiProviderHealthState,
  type WorkAiProviderStatusState,
  type WorkLogCandidatesState,
  type WorkLogCoverageState,
  type WorkLogReviewQueueState,
  type WorkLogExtractionRunMode,
  type WorkLogExtractionState,
  type WorkLogExtractionItemsState,
  type WorkLogExtractionRunsState,
  type WorkLogNormalizationCandidatesState,
  type WorkLogNormalizationApplyState,
  type WorkLogNormalizedItemsState,
  type WorkLogNormalizationProposalsState,
  type WorkLogNormalizationReviewQueueState,
  type WorkSessionEvidenceProposalsState,
  type WorkSessionEvidenceReviewApplyState,
  type WorkSessionEvidenceReviewedItemsState,
  type WorkSessionEvidenceReviewQueueState,
  type WorkManagementFreezeState,
  type WorkManagementRefreshState,
  type WorkStatusExportRowFilter,
  type WorkStatusExportState,
  type WorkSummarySnapshotsState,
  type WorkSummaryState,
} from "./workSummaryStatus";

type ScanState = ScanRunState;
type ImportStatesState = "idle" | "loading" | "ready" | "failed";
type ImportEventsState = "idle" | "loading" | "ready" | "failed";
type WorkSessionIndexState = "idle" | "loading" | "ready" | "failed";
type WorkSessionEvidenceNearbyState = "idle" | "loading" | "ready" | "failed";
type WorkSessionEvidenceSourceSearchState = "idle" | "loading" | "ready" | "failed";
type WorkSessionEvidenceSourceProposalsState = "idle" | "loading" | "ready" | "failed";
type WorkSessionIndexBackfillMode = "reset" | "continue" | "long-continue";
const PREVIEW_LIMIT = 1000;
const WORK_SUMMARY_LIMIT = 80;
const WORK_SUMMARY_DISPLAY_LIMIT = 5;
const WORK_STATUS_EXPORT_DISPLAY_LIMIT = 6;
const WORK_STATUS_EXPORT_ROW_FILTER_OPTIONS: WorkStatusExportRowFilter[] = [
  "all",
  "needs-session-evidence",
  "bounded-session-limit",
  "unresolved-session-evidence",
  "needs-title-normalization",
  "active",
  "session-supported",
  "progress-log-only",
];
const WORK_SUMMARY_HISTORY_LIMIT = 5;
const WORK_SESSION_INDEX_MAX_BATCHES = 2;
const WORK_SESSION_INDEX_LONG_MAX_BATCHES = 10;
const WORK_SESSION_INDEX_MAX_LONG_BATCHES = 1_000;
const WORK_SESSION_INDEX_LONG_CONFIRM_TEXT = "긴 백필";
const WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES = Math.min(
  500,
  PROJECT_WORK_SESSION_INDEX_MAX_BATCH_FILES,
);
const WORK_LOG_COVERAGE_DISPLAY_LIMIT = 8;
const WORK_LOG_CANDIDATE_DISPLAY_LIMIT = 5;
const WORK_LOG_REVIEW_QUEUE_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_ITEM_MANAGEMENT_LIMIT = 1_000;
const WORK_LOG_EXTRACTION_RUN_DISPLAY_LIMIT = 5;
const WORK_LOG_EXTRACTION_RUN_MANAGEMENT_LIMIT = 100;
const WORK_LOG_NORMALIZATION_CANDIDATE_DISPLAY_LIMIT = 5;
const WORK_LOG_NORMALIZATION_CANDIDATE_MANAGEMENT_LIMIT = 100;
const WORK_LOG_NORMALIZATION_PROPOSAL_DISPLAY_LIMIT = 5;
const WORK_LOG_NORMALIZATION_PROPOSAL_MANAGEMENT_LIMIT = 40;
const WORK_LOG_NORMALIZATION_REVIEW_QUEUE_DISPLAY_LIMIT = 5;
const WORK_LOG_NORMALIZATION_REVIEW_QUEUE_MANAGEMENT_LIMIT = 40;
const WORK_SESSION_EVIDENCE_PROPOSAL_DISPLAY_LIMIT = 5;
const WORK_SESSION_EVIDENCE_PROPOSAL_MANAGEMENT_LIMIT = 40;
const WORK_SESSION_EVIDENCE_REVIEW_QUEUE_DISPLAY_LIMIT = 5;
const WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT = 40;
const WORK_LOG_NORMALIZATION_APPLY_DISPLAY_LIMIT = 5;
const WORK_LOG_NORMALIZATION_APPLY_MANAGEMENT_LIMIT = 40;
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

function workSessionIndexBatchFiles(sessionLimit: number): number {
  return Math.max(1, Math.ceil(sessionLimit / WORK_SESSION_INDEX_MAX_BATCHES));
}

function parseWorkSessionIndexBatchFiles(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > PROJECT_WORK_SESSION_INDEX_MAX_BATCH_FILES) {
    return null;
  }
  return parsed;
}

function parseWorkSessionIndexLongMaxBatches(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > WORK_SESSION_INDEX_MAX_LONG_BATCHES) {
    return null;
  }
  return parsed;
}

function workSessionIndexBatchFilesStatusText(
  input: string,
  effectiveBatchFiles: number | null,
): string {
  if (input.trim() !== "" && parseWorkSessionIndexBatchFiles(input) === null) {
    return `백필 배치 파일은 1-${PROJECT_WORK_SESSION_INDEX_MAX_BATCH_FILES.toLocaleString()} 사이 숫자 또는 빈 값`;
  }
  if (effectiveBatchFiles === null) {
    return "세션 백필 배치 계산 대기";
  }
  const mode = input.trim() === "" ? "기본값" : "수동값";
  return [
    `세션 백필 source당 ${effectiveBatchFiles.toLocaleString()}개`,
    mode,
    `클릭당 최대 ${(effectiveBatchFiles * WORK_SESSION_INDEX_MAX_BATCHES).toLocaleString()}개`,
  ].join(" · ");
}

function workSessionIndexLongRunConfirmed(input: string): boolean {
  return input.trim() === WORK_SESSION_INDEX_LONG_CONFIRM_TEXT;
}

function workSessionIndexLongRunStatusText(
  input: string,
  effectiveBatchFiles: number | null,
  longMaxBatches: number | null,
): string {
  if (effectiveBatchFiles === null) return "긴 백필 계산 대기";
  if (longMaxBatches === null) {
    return `긴 백필 반복은 1-${WORK_SESSION_INDEX_MAX_LONG_BATCHES.toLocaleString()} 사이 숫자`;
  }
  const filesPerSourceRun = effectiveBatchFiles * longMaxBatches;
  if (workSessionIndexLongRunConfirmed(input)) {
    return `긴 백필 확인됨 · 반복 ${longMaxBatches.toLocaleString()}배치 · source당 최대 ${filesPerSourceRun.toLocaleString()}개`;
  }
  return `긴 백필 잠김 · ${WORK_SESSION_INDEX_LONG_CONFIRM_TEXT} 입력 필요 · source당 최대 ${
    filesPerSourceRun.toLocaleString()
  }개`;
}

function calculateWorkSessionIndexCompletionMaxBatches(
  result: ProjectWorkSessionIndexResult | null,
  batchFiles: number,
): number | null {
  if (!result?.source_states.length || result.all_sources_completed) return null;
  const maxRemainingFiles = Math.max(
    ...result.source_states.map((source) => Math.max(0, source.total_files - source.processed_files)),
  );
  if (maxRemainingFiles <= 0) return null;
  const requiredBatches = Math.ceil(maxRemainingFiles / batchFiles);
  return Math.min(WORK_SESSION_INDEX_MAX_LONG_BATCHES, Math.max(1, requiredBatches));
}

function workSessionIndexMetaText(
  state: WorkSessionIndexState,
  result: ProjectWorkSessionIndexResult | null,
  mode: WorkSessionIndexBackfillMode | null = null,
): string | null {
  if (state === "loading") {
    const modeText = mode === "long-continue"
      ? "긴 이어가기"
      : mode === "continue"
        ? "이어가기"
        : "처음부터";
    return `세션 백필 ${modeText} 실행 중`;
  }
  if (state === "failed") return "세션 백필 실패";
  if (!result) return null;
  const processedFiles = result.source_states.reduce((sum, source) => sum + source.processed_files, 0);
  const totalFiles = result.source_states.reduce((sum, source) => sum + source.total_files, 0);
  const matchedPrompts = result.source_states.reduce((sum, source) => sum + source.matched_prompt_count, 0);
  const maxBatches = result.max_batches === null ? "제한 없음" : `${result.max_batches.toLocaleString()}배치`;
  const completion = result.all_sources_completed ? "완료" : "진행 중";
  return [
    result.until_complete ? "until-complete" : "bounded",
    result.reset ? "처음부터" : "이어가기",
    `배치 ${result.batches_run.toLocaleString()} / ${maxBatches}`,
    `파일 ${processedFiles.toLocaleString()} / ${totalFiles.toLocaleString()}`,
    `근거 ${matchedPrompts.toLocaleString()}개`,
    `보관 ${result.stored_prompt_count.toLocaleString()}개`,
    completion,
  ].join(" · ");
}

function workSessionIndexWarningText(result: ProjectWorkSessionIndexResult | null): string | null {
  if (!result || result.warnings.length === 0) return null;
  return result.warnings.join(" · ");
}

function workSessionIndexRemainingText(result: ProjectWorkSessionIndexResult | null): string | null {
  if (!result?.source_states.length) return null;
  const remainingBySource = result.source_states.map((source) =>
    Math.max(0, source.total_files - source.processed_files)
  );
  const remainingFiles = remainingBySource.reduce((sum, remaining) => sum + remaining, 0);
  if (remainingFiles === 0) {
    return "모든 세션 source 완료 · 이어 백필 필요 없음";
  }
  const activeSources = remainingBySource.filter((remaining) => remaining > 0).length;
  const filesPerSourceRun = result.batch_files && result.max_batches
    ? result.batch_files * result.max_batches
    : null;
  const estimatedContinueRuns = filesPerSourceRun
    ? Math.max(...remainingBySource.map((remaining) => Math.ceil(remaining / filesPerSourceRun)))
    : null;
  return [
    `남은 파일 ${remainingFiles.toLocaleString()}개`,
    `활성 소스 ${activeSources.toLocaleString()}개`,
    filesPerSourceRun
      ? `클릭당 소스별 최대 ${filesPerSourceRun.toLocaleString()}개`
      : "클릭당 처리량 알 수 없음",
    estimatedContinueRuns
      ? `이어 백필 예상 ${estimatedContinueRuns.toLocaleString()}회`
      : "이어 백필 예상 불가",
  ].join(" · ");
}

function workSessionIndexSourceStateText(source: ProjectWorkSessionIndexResult["source_states"][number]): string {
  return [
    source.source_label,
    `파일 ${source.processed_files.toLocaleString()} / ${source.total_files.toLocaleString()}`,
    `근거 ${source.matched_prompt_count.toLocaleString()}개`,
    `next ${source.next_file_index.toLocaleString()}`,
    source.completed ? "완료" : "진행 중",
  ].join(" · ");
}
const FREQUENCY_DISPLAY_LIMIT = 12;
const PROMPT_LIST_DISPLAY_LIMIT = 200;

const WORK_MANAGEMENT_SOURCE_OPTIONS: Array<{
  label: string;
  value: "" | WorkManagementOverviewSource;
}> = [
  { label: "전체 소스", value: "" },
  { label: "현재요약", value: "current_summary" },
  { label: "스냅샷", value: "snapshot" },
  { label: "추출제안", value: "extraction_proposal" },
  { label: "저장추출", value: "saved_extraction" },
  { label: "정규화", value: "normalized_row" },
  { label: "상태Export", value: "status_export" },
  { label: "진행로그", value: "progress_log" },
];

const WORK_MANAGEMENT_PERSISTENCE_OPTIONS: Array<{
  label: string;
  value: "" | WorkManagementOverviewPersistenceState;
}> = [
  { label: "전체 상태", value: "" },
  { label: "저장관리", value: "persisted" },
  { label: "라이브만", value: "live_only" },
];

const WORK_MANAGEMENT_SORT_OPTIONS: Array<{
  label: string;
  value: WorkManagementOverviewSort;
}> = [
  { label: "최신 날짜순", value: "date_desc" },
  { label: "검토 조치 우선", value: "review_action_first" },
  { label: "라이브만 우선", value: "live_only_first" },
  { label: "confidence 없음 우선", value: "missing_confidence_first" },
  { label: "낮은 confidence 우선", value: "low_confidence_first" },
  { label: "작업 많은 순", value: "work_items_desc" },
];

const WORK_LOG_COVERAGE_STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: WorkLogCoverageStatusFilter;
}> = [
  { label: "전체 상태", value: "" },
  { label: "문제 로그", value: "needs_review" },
  { label: "parsed", value: "parsed" },
  { label: "pointer", value: "pointer" },
  { label: "unparsed", value: "unparsed" },
  { label: "unreadable", value: "unreadable" },
];

const WORK_REVIEW_QUEUE_STATE_FILTER_OPTIONS: Array<{
  label: string;
  value: WorkReviewQueueStateFilter;
}> = [
  { label: "전체 상태", value: "" },
  { label: "검토 대기", value: "pending_review" },
  { label: "stale", value: "stale" },
  { label: "승인/완료", value: "approved" },
  { label: "거절", value: "rejected" },
];

const WORK_LOG_REVIEW_QUEUE_STATE_FILTER_OPTIONS: Array<{
  label: string;
  value: WorkReviewQueueStateFilter;
}> = [
  { label: "전체 상태", value: "" },
  { label: "AI 검토 대기", value: "pending_ai_review" },
  { label: "위험 차단", value: "risk_blocked" },
  { label: "stale", value: "stale" },
  { label: "승인", value: "approved" },
  { label: "거절", value: "rejected" },
];

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

function workStatusExportRowKey(row: ProjectWorkStatusExportRow): string {
  return `${row.date}::${row.project}`;
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
  const [workStatusExportState, setWorkStatusExportState] = useState<WorkStatusExportState>("idle");
  const [workSessionIndexState, setWorkSessionIndexState] = useState<WorkSessionIndexState>("idle");
  const [workSessionIndexRunMode, setWorkSessionIndexRunMode] =
    useState<WorkSessionIndexBackfillMode | null>(null);
  const [workSummarySnapshotsState, setWorkSummarySnapshotsState] = useState<WorkSummarySnapshotsState>("idle");
  const [workLogCoverageState, setWorkLogCoverageState] = useState<WorkLogCoverageState>("idle");
  const [workLogCandidatesState, setWorkLogCandidatesState] = useState<WorkLogCandidatesState>("idle");
  const [workAiProviderStatusState, setWorkAiProviderStatusState] =
    useState<WorkAiProviderStatusState>("idle");
  const [workAiProviderHealthState, setWorkAiProviderHealthState] =
    useState<WorkAiProviderHealthState>("idle");
  const [workLogReviewQueueState, setWorkLogReviewQueueState] = useState<WorkLogReviewQueueState>("idle");
  const [workLogExtractionState, setWorkLogExtractionState] = useState<WorkLogExtractionState>("idle");
  const [workLogExtractionRunMode, setWorkLogExtractionRunMode] =
    useState<WorkLogExtractionRunMode>("ai");
  const [workLogNormalizationNeedsTitleOnly, setWorkLogNormalizationNeedsTitleOnly] = useState(false);
  const [workSessionEvidenceNeedsTitleOnly, setWorkSessionEvidenceNeedsTitleOnly] = useState(false);
  const [workLogExtractionItemsState, setWorkLogExtractionItemsState] =
    useState<WorkLogExtractionItemsState>("idle");
  const [workLogExtractionRunsState, setWorkLogExtractionRunsState] =
    useState<WorkLogExtractionRunsState>("idle");
  const [workLogNormalizationCandidatesState, setWorkLogNormalizationCandidatesState] =
    useState<WorkLogNormalizationCandidatesState>("idle");
  const [workLogNormalizationProposalsState, setWorkLogNormalizationProposalsState] =
    useState<WorkLogNormalizationProposalsState>("idle");
  const [workLogNormalizationReviewQueueState, setWorkLogNormalizationReviewQueueState] =
    useState<WorkLogNormalizationReviewQueueState>("idle");
  const [workLogNormalizationApplyState, setWorkLogNormalizationApplyState] =
    useState<WorkLogNormalizationApplyState>("idle");
  const [workLogNormalizedItemsState, setWorkLogNormalizedItemsState] =
    useState<WorkLogNormalizedItemsState>("idle");
  const [workSessionEvidenceProposalsState, setWorkSessionEvidenceProposalsState] =
    useState<WorkSessionEvidenceProposalsState>("idle");
  const [workSessionEvidenceReviewQueueState, setWorkSessionEvidenceReviewQueueState] =
    useState<WorkSessionEvidenceReviewQueueState>("idle");
  const [workSessionEvidenceReviewApplyState, setWorkSessionEvidenceReviewApplyState] =
    useState<WorkSessionEvidenceReviewApplyState>("idle");
  const [workSessionEvidenceReviewedItemsState, setWorkSessionEvidenceReviewedItemsState] =
    useState<WorkSessionEvidenceReviewedItemsState>("idle");
  const [workSessionEvidenceNearbyState, setWorkSessionEvidenceNearbyState] =
    useState<WorkSessionEvidenceNearbyState>("idle");
  const [workSessionEvidenceSourceSearchState, setWorkSessionEvidenceSourceSearchState] =
    useState<WorkSessionEvidenceSourceSearchState>("idle");
  const [workSessionEvidenceSourceProposalsState, setWorkSessionEvidenceSourceProposalsState] =
    useState<WorkSessionEvidenceSourceProposalsState>("idle");
  const [workManagementRefreshState, setWorkManagementRefreshState] =
    useState<WorkManagementRefreshState>("idle");
  const [workManagementFreezeState, setWorkManagementFreezeState] =
    useState<WorkManagementFreezeState>("idle");
  const [workSummarySessionLimitInput, setWorkSummarySessionLimitInput] = useState(
    String(WORK_SUMMARY_DEFAULT_SESSION_LIMIT),
  );
  const [workStatusExportLimitInput, setWorkStatusExportLimitInput] = useState(
    String(WORK_STATUS_EXPORT_DEFAULT_LIMIT),
  );
  const [workStatusExportOffset, setWorkStatusExportOffset] = useState(0);
  const [workSessionIndexBatchFilesInput, setWorkSessionIndexBatchFilesInput] = useState("");
  const [workSessionIndexLongConfirmInput, setWorkSessionIndexLongConfirmInput] = useState("");
  const [workSessionIndexLongMaxBatchesInput, setWorkSessionIndexLongMaxBatchesInput] = useState(
    String(WORK_SESSION_INDEX_LONG_MAX_BATCHES),
  );
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
  const [workSessionIndexResult, setWorkSessionIndexResult] =
    useState<ProjectWorkSessionIndexResult | null>(null);
  const [workStatusExportResult, setWorkStatusExportResult] =
    useState<ProjectWorkStatusExportResult | null>(null);
  const [workSummaryResult, setWorkSummaryResult] = useState<ProjectWorkSummaryResult | null>(null);
  const [workLogCoverageResult, setWorkLogCoverageResult] = useState<ProjectWorkLogCoverageResult | null>(null);
  const [workLogCandidatesResult, setWorkLogCandidatesResult] =
    useState<ProjectWorkLogExtractionCandidatesResult | null>(null);
  const [workAiProviderStatusResult, setWorkAiProviderStatusResult] =
    useState<ProjectWorkAiProviderStatusResult | null>(null);
  const [workAiProviderHealthResult, setWorkAiProviderHealthResult] =
    useState<ProjectWorkAiProviderHealthResult | null>(null);
  const [workLogReviewQueueResult, setWorkLogReviewQueueResult] =
    useState<ProjectWorkLogReviewQueueResult | null>(null);
  const [workLogReviewQueueUpdatingCandidateId, setWorkLogReviewQueueUpdatingCandidateId] =
    useState<string | null>(null);
  const [workLogExtractionResult, setWorkLogExtractionResult] =
    useState<ProjectWorkLogExtractionProposalsResult | null>(null);
  const [workLogExtractionItemsResult, setWorkLogExtractionItemsResult] =
    useState<ProjectWorkLogExtractionItemsResult | null>(null);
  const [workLogExtractionRunsResult, setWorkLogExtractionRunsResult] =
    useState<ProjectWorkLogExtractionRunsResult | null>(null);
  const [workLogNormalizationCandidatesResult, setWorkLogNormalizationCandidatesResult] =
    useState<ProjectWorkLogNormalizationCandidatesResult | null>(null);
  const [workLogNormalizationProposalsResult, setWorkLogNormalizationProposalsResult] =
    useState<ProjectWorkLogNormalizationProposalsResult | null>(null);
  const [workLogNormalizationReviewQueueResult, setWorkLogNormalizationReviewQueueResult] =
    useState<ProjectWorkLogNormalizationReviewQueueResult | null>(null);
  const [workLogNormalizationApplyResult, setWorkLogNormalizationApplyResult] =
    useState<ProjectWorkLogNormalizationApplyResult | null>(null);
  const [workSessionEvidenceProposalsResult, setWorkSessionEvidenceProposalsResult] =
    useState<ProjectWorkSessionEvidenceProposalsResult | null>(null);
  const [workSessionEvidenceReviewQueueResult, setWorkSessionEvidenceReviewQueueResult] =
    useState<ProjectWorkSessionEvidenceReviewQueueResult | null>(null);
  const [workSessionEvidenceReviewApplyResult, setWorkSessionEvidenceReviewApplyResult] =
    useState<ProjectWorkSessionEvidenceReviewApplyResult | null>(null);
  const [workSessionEvidenceReviewedItemsResult, setWorkSessionEvidenceReviewedItemsResult] =
    useState<ProjectWorkSessionEvidenceReviewedItemsResult | null>(null);
  const [workSessionEvidenceNearbyResult, setWorkSessionEvidenceNearbyResult] =
    useState<ProjectWorkSessionEvidenceNearbyResult | null>(null);
  const [workSessionEvidenceSourceSearchResult, setWorkSessionEvidenceSourceSearchResult] =
    useState<ProjectWorkSessionEvidenceSourceSearchResult | null>(null);
  const [workSessionEvidenceSourceProposalsResult, setWorkSessionEvidenceSourceProposalsResult] =
    useState<ProjectWorkSessionEvidenceSourceProposalsResult | null>(null);
  const [workLogNormalizedItemsResult, setWorkLogNormalizedItemsResult] =
    useState<ProjectWorkLogNormalizedItemsResult | null>(null);
  const [
    workLogNormalizationReviewQueueUpdatingCandidateId,
    setWorkLogNormalizationReviewQueueUpdatingCandidateId,
  ] = useState<string | null>(null);
  const [
    workSessionEvidenceReviewQueueUpdatingCandidateId,
    setWorkSessionEvidenceReviewQueueUpdatingCandidateId,
  ] = useState<string | null>(null);
  const [
    workSessionEvidenceNearbyCandidateId,
    setWorkSessionEvidenceNearbyCandidateId,
  ] = useState<string | null>(null);
  const [
    workSessionEvidenceSourceSearchSessionId,
    setWorkSessionEvidenceSourceSearchSessionId,
  ] = useState<string | null>(null);
  const [
    workSessionEvidenceSourceProposalsSessionId,
    setWorkSessionEvidenceSourceProposalsSessionId,
  ] = useState<string | null>(null);
  const [approvedWorkLogExtractionCandidateIds, setApprovedWorkLogExtractionCandidateIds] =
    useState<Set<string>>(() => new Set());
  const [workSummarySnapshotsResult, setWorkSummarySnapshotsResult] =
    useState<ProjectWorkSummarySnapshotsResult | null>(null);
  const [workSummarySnapshotDateFilter, setWorkSummarySnapshotDateFilter] = useState("");
  const [workSummarySnapshotProjectFilter, setWorkSummarySnapshotProjectFilter] = useState("");
  const [workLogExtractionItemDateFilter, setWorkLogExtractionItemDateFilter] = useState("");
  const [workLogExtractionItemProjectFilter, setWorkLogExtractionItemProjectFilter] = useState("");
  const [workLogCoverageFilters, setWorkLogCoverageFilters] = useState<WorkLogCoverageFilters>(() =>
    emptyWorkLogCoverageFilters(),
  );
  const [workLogPreviewFilters, setWorkLogPreviewFilters] = useState<WorkLogPreviewFilters>(() =>
    emptyWorkLogPreviewFilters(),
  );
  const [workLogReviewQueueFilters, setWorkLogReviewQueueFilters] =
    useState<WorkReviewQueueFilters>(() => emptyWorkReviewQueueFilters());
  const [workLogNormalizationReviewQueueFilters, setWorkLogNormalizationReviewQueueFilters] =
    useState<WorkReviewQueueFilters>(() => emptyWorkReviewQueueFilters());
  const [workSessionEvidenceReviewQueueFilters, setWorkSessionEvidenceReviewQueueFilters] =
    useState<WorkReviewQueueFilters>(() => emptyWorkReviewQueueFilters());
  const [workManagementOverviewFilters, setWorkManagementOverviewFilters] =
    useState<WorkManagementOverviewFilters>(() => emptyWorkManagementOverviewFilters());
  const [workManagementOverviewSort, setWorkManagementOverviewSort] =
    useState<WorkManagementOverviewSort>("date_desc");
  const [expandedWorkSummarySnapshotIds, setExpandedWorkSummarySnapshotIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedWorkStatusExportRowKeys, setExpandedWorkStatusExportRowKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [workStatusExportRowFilter, setWorkStatusExportRowFilter] =
    useState<WorkStatusExportRowFilter>("all");
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
    || workStatusExportState === "loading"
    || workSessionIndexState === "loading"
    || workSummarySnapshotsState === "loading"
    || workLogCoverageState === "loading"
    || workLogCandidatesState === "loading"
    || workAiProviderStatusState === "loading"
    || workLogReviewQueueState === "loading"
    || workLogExtractionState === "loading"
    || workLogExtractionItemsState === "loading"
    || workLogExtractionRunsState === "loading"
    || workLogNormalizationCandidatesState === "loading"
    || workLogNormalizationProposalsState === "loading"
    || workLogNormalizationReviewQueueState === "loading"
    || workLogNormalizationApplyState === "loading"
    || workLogNormalizedItemsState === "loading"
    || workSessionEvidenceProposalsState === "loading"
    || workSessionEvidenceReviewQueueState === "loading"
    || workSessionEvidenceReviewApplyState === "loading"
    || workSessionEvidenceReviewedItemsState === "loading"
    || workSessionEvidenceNearbyState === "loading"
    || workSessionEvidenceSourceSearchState === "loading"
    || workSessionEvidenceSourceProposalsState === "loading"
    || workManagementRefreshState === "loading"
    || workManagementFreezeState === "loading";
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
  const workSummarySessionLimit = parseWorkSummarySessionLimit(workSummarySessionLimitInput);
  const workSummarySessionLimitInvalid = workSummarySessionLimit === null;
  const workSummarySessionLimitStatus = workSummarySessionLimitStatusText(workSummarySessionLimitInput);
  const workStatusExportLimit = parseWorkStatusExportLimit(workStatusExportLimitInput);
  const workStatusExportLimitInvalid = workStatusExportLimit === null;
  const workStatusExportLimitStatus = workStatusExportLimitStatusText(workStatusExportLimitInput);
  const workSessionIndexBatchFilesOverride = workSessionIndexBatchFilesInput.trim() === ""
    ? null
    : parseWorkSessionIndexBatchFiles(workSessionIndexBatchFilesInput);
  const workSessionIndexBatchFilesInvalid =
    workSessionIndexBatchFilesInput.trim() !== "" && workSessionIndexBatchFilesOverride === null;
  const workSessionIndexEffectiveBatchFiles = workSummarySessionLimit === null
    ? null
    : workSessionIndexBatchFilesOverride ?? workSessionIndexBatchFiles(workSummarySessionLimit);
  const workSessionIndexEffectiveLongMaxBatches =
    parseWorkSessionIndexLongMaxBatches(workSessionIndexLongMaxBatchesInput);
  const workSessionIndexLongMaxBatchesInvalid = workSessionIndexEffectiveLongMaxBatches === null;
  const workSessionIndexCompletionMaxBatches = calculateWorkSessionIndexCompletionMaxBatches(
    workSessionIndexResult,
    WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES,
  );
  const workSessionIndexBatchFilesStatus = workSessionIndexBatchFilesStatusText(
    workSessionIndexBatchFilesInput,
    workSessionIndexEffectiveBatchFiles,
  );
  const workSessionIndexLongConfirmed = workSessionIndexLongRunConfirmed(workSessionIndexLongConfirmInput);
  const workSessionIndexLongStatus = workSessionIndexLongRunStatusText(
    workSessionIndexLongConfirmInput,
    workSessionIndexEffectiveBatchFiles,
    workSessionIndexEffectiveLongMaxBatches,
  );
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
  const workStatusExportFailureMessage = workStatusExportFailureText(workStatusExportState);
  const workStatusExportMeta = workStatusExportMetaText(workStatusExportState, workStatusExportResult);
  const workStatusExportPageStatus = workStatusExportPageStatusText(workStatusExportResult);
  const workStatusExportPreviousOffset = workStatusExportResult && workStatusExportLimit !== null
    ? Math.max(0, workStatusExportResult.row_offset - workStatusExportLimit)
    : 0;
  const workStatusExportIndexStatus = workStatusExportResult
    ? workStatusExportIndexStatusText(workStatusExportResult)
    : null;
  const storedSessionIndexLimit =
    workStatusExportResult?.report_session_evidence_index_total_count ?? 0;
  const canUseStoredSessionIndexLimit =
    storedSessionIndexLimit > 0 && storedSessionIndexLimit <= WORK_SUMMARY_MAX_SESSION_LIMIT;
  const workSummaryMeta = workSummaryMetaText(workSummaryState, workSummaryResult);
  const workSessionIndexMeta = workSessionIndexMetaText(
    workSessionIndexState,
    workSessionIndexResult,
    workSessionIndexRunMode,
  );
  const workSessionIndexWarning = workSessionIndexWarningText(workSessionIndexResult);
  const workSessionIndexRemaining = workSessionIndexRemainingText(workSessionIndexResult);
  const workSessionIndexPlannedRemaining = workSessionIndexPlannedRemainingText(
    workSessionIndexResult,
    workSessionIndexEffectiveBatchFiles,
    WORK_SESSION_INDEX_MAX_BATCHES,
    workSessionIndexEffectiveLongMaxBatches ?? 0,
  );
  const workSessionIndexCheckpointGuidance = workSessionIndexCheckpointGuidanceText(
    workSessionIndexResult,
    workSessionIndexEffectiveBatchFiles,
    WORK_SESSION_INDEX_MAX_BATCHES,
    workSessionIndexEffectiveLongMaxBatches ?? 0,
  );
  const workSessionIndexNextRunImpact = workSessionIndexNextRunImpactText(
    workSessionIndexResult,
    workSessionIndexEffectiveBatchFiles,
    WORK_SESSION_INDEX_MAX_BATCHES,
    workSessionIndexEffectiveLongMaxBatches ?? 0,
    workSessionIndexLongConfirmed,
  );
  const workSessionIndexPartialBackfillWarning =
    workSessionIndexPartialBackfillWarningText(workSessionIndexResult);
  const workSummaryIndexStatus = workSummaryResult ? workSummaryIndexStatusText(workSummaryResult) : null;
  const workSummaryPersistenceStatus = workSummaryResult ? workSummaryPersistenceText(workSummaryResult) : null;
  const workLogCoverageFailureMessage = workLogCoverageFailureText(workLogCoverageState);
  const workLogCoverageMeta = workLogCoverageMetaText(workLogCoverageState, workLogCoverageResult);
  const workLogCandidatesFailureMessage = workLogCandidatesFailureText(workLogCandidatesState);
  const workLogCandidatesMeta = workLogCandidatesMetaText(workLogCandidatesState, workLogCandidatesResult);
  const workAiProviderStatusFailureMessage =
    workAiProviderStatusFailureText(workAiProviderStatusState);
  const workAiProviderStatusMeta = workAiProviderStatusMetaText(
    workAiProviderStatusState,
    workAiProviderStatusResult,
  );
  const workAiProviderHealthFailureMessage =
    workAiProviderHealthFailureText(workAiProviderHealthState);
  const workAiProviderHealthMeta = workAiProviderHealthMetaText(
    workAiProviderHealthState,
    workAiProviderHealthResult,
  );
  const workLogReviewQueueFailureMessage = workLogReviewQueueFailureText(workLogReviewQueueState);
  const workLogReviewQueueMeta = workLogReviewQueueMetaText(workLogReviewQueueState, workLogReviewQueueResult);
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
  const workLogExtractionRunsFailureMessage = workLogExtractionRunsFailureText(workLogExtractionRunsState);
  const workLogExtractionRunsMeta = workLogExtractionRunsMetaText(
    workLogExtractionRunsState,
    workLogExtractionRunsResult,
  );
  const workLogNormalizationCandidatesFailureMessage =
    workLogNormalizationCandidatesFailureText(workLogNormalizationCandidatesState);
  const workLogNormalizationCandidatesMeta = workLogNormalizationCandidatesMetaText(
    workLogNormalizationCandidatesState,
    workLogNormalizationCandidatesResult,
  );
  const workLogNormalizationProposalsFailureMessage =
    workLogNormalizationProposalsFailureText(workLogNormalizationProposalsState);
  const workLogNormalizationProposalsMeta = workLogNormalizationProposalsMetaText(
    workLogNormalizationProposalsState,
    workLogNormalizationProposalsResult,
  );
  const workLogNormalizationProposalWarningNotice =
    workLogNormalizationProposalWarningNoticeText(workLogNormalizationProposalsResult);
  const workLogNormalizationReviewQueueFailureMessage =
    workLogNormalizationReviewQueueFailureText(workLogNormalizationReviewQueueState);
  const workLogNormalizationReviewQueueMeta = workLogNormalizationReviewQueueMetaText(
    workLogNormalizationReviewQueueState,
    workLogNormalizationReviewQueueResult,
  );
  const workSessionEvidenceProposalsFailureMessage =
    workSessionEvidenceProposalsFailureText(workSessionEvidenceProposalsState);
  const workSessionEvidenceProposalsMeta = workSessionEvidenceProposalsMetaText(
    workSessionEvidenceProposalsState,
    workSessionEvidenceProposalsResult,
  );
  const workSessionEvidenceProposalWarningNotice =
    workSessionEvidenceProposalWarningNoticeText(workSessionEvidenceProposalsResult);
  const workSessionEvidenceReviewQueueFailureMessage =
    workSessionEvidenceReviewQueueFailureText(workSessionEvidenceReviewQueueState);
  const workSessionEvidenceReviewQueueMeta = workSessionEvidenceReviewQueueMetaText(
    workSessionEvidenceReviewQueueState,
    workSessionEvidenceReviewQueueResult,
  );
  const workManagementReadiness = workManagementReadinessText({
    coverage: workLogCoverageResult,
    sessionIndex: workSessionIndexResult,
    statusExport: workStatusExportResult,
    aiProviderStatus: workAiProviderStatusResult,
    workLogReviewQueue: workLogReviewQueueResult,
    normalizationReviewQueue: workLogNormalizationReviewQueueResult,
    sessionEvidenceReviewQueue: workSessionEvidenceReviewQueueResult,
  });
  const workManagementReviewDecisions = workManagementReviewDecisionText({
    workLogReviewQueue: workLogReviewQueueResult,
    normalizationReviewQueue: workLogNormalizationReviewQueueResult,
    sessionEvidenceReviewQueue: workSessionEvidenceReviewQueueResult,
  });
  const workManagementReviewBlockers = workManagementReviewBlockerText({
    workLogReviewQueue: workLogReviewQueueResult,
    normalizationReviewQueue: workLogNormalizationReviewQueueResult,
    sessionEvidenceReviewQueue: workSessionEvidenceReviewQueueResult,
  });
  const workManagementReviewResolution = workManagementReviewResolutionText({
    aiProviderStatus: workAiProviderStatusResult,
    normalizationReviewQueue: workLogNormalizationReviewQueueResult,
    sessionEvidenceReviewQueue: workSessionEvidenceReviewQueueResult,
  });
  const workManagementNextAction = workManagementNextActionText(
    {
      coverage: workLogCoverageResult,
      sessionIndex: workSessionIndexResult,
      statusExport: workStatusExportResult,
      aiProviderStatus: workAiProviderStatusResult,
      workLogReviewQueue: workLogReviewQueueResult,
      normalizationReviewQueue: workLogNormalizationReviewQueueResult,
      sessionEvidenceReviewQueue: workSessionEvidenceReviewQueueResult,
    },
    workSessionIndexEffectiveBatchFiles,
    WORK_SESSION_INDEX_MAX_BATCHES,
    workSessionIndexEffectiveLongMaxBatches ?? 0,
    WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES,
    workSessionIndexLongConfirmed,
  );
  const hasApprovedWorkLogNormalizationRows =
    (workLogNormalizationReviewQueueResult?.approved_count ?? 0) > 0;
  const hasApprovedWorkSessionEvidenceReviewRows =
    (workSessionEvidenceReviewQueueResult?.approved_count ?? 0) > 0;
  const workLogNormalizationApplyFailureMessage =
    workLogNormalizationApplyFailureText(workLogNormalizationApplyState);
  const workLogNormalizationApplyMeta = workLogNormalizationApplyMetaText(
    workLogNormalizationApplyState,
    workLogNormalizationApplyResult,
  );
  const workLogNormalizedItemsFailureMessage =
    workLogNormalizedItemsFailureText(workLogNormalizedItemsState);
  const workLogNormalizedItemsMeta = workLogNormalizedItemsMetaText(
    workLogNormalizedItemsState,
    workLogNormalizedItemsResult,
  );
  const workSessionEvidenceReviewApplyFailureMessage =
    workSessionEvidenceReviewApplyFailureText(workSessionEvidenceReviewApplyState);
  const workSessionEvidenceReviewApplyMeta = workSessionEvidenceReviewApplyMetaText(
    workSessionEvidenceReviewApplyState,
    workSessionEvidenceReviewApplyResult,
  );
  const workSessionEvidenceReviewedItemsFailureMessage =
    workSessionEvidenceReviewedItemsFailureText(workSessionEvidenceReviewedItemsState);
  const workSessionEvidenceReviewedItemsMeta = workSessionEvidenceReviewedItemsMetaText(
    workSessionEvidenceReviewedItemsState,
    workSessionEvidenceReviewedItemsResult,
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
  const workLogCoverageFilterCount = activeWorkLogCoverageFilterCount(workLogCoverageFilters);
  const filteredWorkLogCoverageFiles = filterWorkLogCoverageFiles(
    workLogCoverageResult?.files ?? [],
    workLogCoverageFilters,
  );
  const workLogCoverageFilterMeta = workLogCoverageResult
    ? workLogCoverageFilterMetaText(
        filteredWorkLogCoverageFiles.length,
        workLogCoverageResult.files.length,
        workLogCoverageFilterCount,
      )
    : null;
  const workLogCoverageProjectFilterSuggestions =
    workLogCoverageProjectSuggestions(workLogCoverageResult?.files ?? []);
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
  const workLogReviewQueueFilterCount = activeWorkReviewQueueFilterCount(workLogReviewQueueFilters);
  const filteredWorkLogReviewQueueItems = filterWorkLogReviewQueueItems(
    workLogReviewQueueResult?.items ?? [],
    workLogReviewQueueFilters,
  );
  const workLogReviewQueueFilterMeta = workLogReviewQueueResult
    ? workReviewQueueFilterMetaText(
        "백필큐",
        filteredWorkLogReviewQueueItems.length,
        workLogReviewQueueResult.items.length,
        workLogReviewQueueFilterCount,
      )
    : null;
  const workLogReviewQueueProjectFilterSuggestions =
    workReviewQueueProjectSuggestions(workLogReviewQueueResult?.items ?? []);
  const workLogReviewQueueReasonFilterSuggestions =
    workReviewQueueReasonSuggestions(workLogReviewQueueResult?.items ?? []);
  const workLogNormalizationReviewQueueFilterCount = activeWorkReviewQueueFilterCount(
    workLogNormalizationReviewQueueFilters,
  );
  const filteredWorkLogNormalizationReviewQueueItems = filterWorkLogNormalizationReviewQueueItems(
    workLogNormalizationReviewQueueResult?.items ?? [],
    workLogNormalizationReviewQueueFilters,
  );
  const workLogNormalizationReviewQueueFilterMeta = workLogNormalizationReviewQueueResult
    ? workReviewQueueFilterMetaText(
        "정규화 큐",
        filteredWorkLogNormalizationReviewQueueItems.length,
        workLogNormalizationReviewQueueResult.items.length,
        workLogNormalizationReviewQueueFilterCount,
      )
    : null;
  const workLogNormalizationReviewQueueDateFilterSuggestions =
    workReviewQueueDateSuggestions(workLogNormalizationReviewQueueResult?.items ?? []);
  const workLogNormalizationReviewQueueProjectFilterSuggestions =
    workReviewQueueProjectSuggestions(workLogNormalizationReviewQueueResult?.items ?? []);
  const workLogNormalizationReviewQueueReasonFilterSuggestions =
    workReviewQueueReasonSuggestions(workLogNormalizationReviewQueueResult?.items ?? []);
  const workSessionEvidenceReviewQueueFilterCount = activeWorkReviewQueueFilterCount(
    workSessionEvidenceReviewQueueFilters,
  );
  const filteredWorkSessionEvidenceReviewQueueItems = filterWorkSessionEvidenceReviewQueueItems(
    workSessionEvidenceReviewQueueResult?.items ?? [],
    workSessionEvidenceReviewQueueFilters,
  );
  const workSessionEvidenceReviewQueueFilterMeta = workSessionEvidenceReviewQueueResult
    ? workReviewQueueFilterMetaText(
        "세션근거 큐",
        filteredWorkSessionEvidenceReviewQueueItems.length,
        workSessionEvidenceReviewQueueResult.items.length,
        workSessionEvidenceReviewQueueFilterCount,
      )
    : null;
  const workSessionEvidenceReviewQueueDateFilterSuggestions =
    workReviewQueueDateSuggestions(workSessionEvidenceReviewQueueResult?.items ?? []);
  const workSessionEvidenceReviewQueueProjectFilterSuggestions =
    workReviewQueueProjectSuggestions(workSessionEvidenceReviewQueueResult?.items ?? []);
  const workSessionEvidenceReviewQueueReasonFilterSuggestions =
    workReviewQueueReasonSuggestions(workSessionEvidenceReviewQueueResult?.items ?? []);
  const visibleWorkSummaries = workSummaryResult?.summaries.slice(0, WORK_SUMMARY_DISPLAY_LIMIT) ?? [];
  const filteredWorkStatusExportRows = useMemo(() => {
    return filterWorkStatusExportRows(workStatusExportResult?.rows ?? [], workStatusExportRowFilter);
  }, [workStatusExportResult?.rows, workStatusExportRowFilter]);
  const workStatusExportFilterMeta = workStatusExportResult
    ? workStatusExportFilterMetaText(
        workStatusExportRowFilter,
        workStatusExportResult.rows,
        filteredWorkStatusExportRows,
      )
    : null;
  const visibleWorkStatusExportRows =
    filteredWorkStatusExportRows.slice(0, WORK_STATUS_EXPORT_DISPLAY_LIMIT);
  const hiddenWorkStatusExportRowCount = Math.max(
    0,
    filteredWorkStatusExportRows.length - WORK_STATUS_EXPORT_DISPLAY_LIMIT,
  );
  const hiddenWorkSummaryCount = Math.max(
    0,
    (workSummaryResult?.summaries.length ?? 0) - WORK_SUMMARY_DISPLAY_LIMIT,
  );
  const visibleWorkSummarySnapshots =
    workSummarySnapshotsResult?.snapshots.slice(0, WORK_SUMMARY_HISTORY_LIMIT) ?? [];
  const visibleWorkLogCoverageFiles =
    filteredWorkLogCoverageFiles.slice(0, WORK_LOG_COVERAGE_DISPLAY_LIMIT);
  const hiddenWorkLogCoverageFileCount = Math.max(
    0,
    filteredWorkLogCoverageFiles.length - WORK_LOG_COVERAGE_DISPLAY_LIMIT,
  );
  const visibleWorkLogCandidates =
    filteredWorkLogCandidates.slice(0, WORK_LOG_CANDIDATE_DISPLAY_LIMIT);
  const hiddenWorkLogCandidateCount = Math.max(
    0,
    filteredWorkLogCandidates.length - WORK_LOG_CANDIDATE_DISPLAY_LIMIT,
  );
  const visibleWorkLogReviewQueueItems =
    filteredWorkLogReviewQueueItems.slice(0, WORK_LOG_REVIEW_QUEUE_DISPLAY_LIMIT);
  const approvedWorkLogReviewQueueCount = workLogReviewQueueResult?.approved_count ?? 0;
  const hiddenWorkLogReviewQueueItemCount = Math.max(
    0,
    filteredWorkLogReviewQueueItems.length - WORK_LOG_REVIEW_QUEUE_DISPLAY_LIMIT,
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
  const visibleWorkLogExtractionRuns =
    workLogExtractionRunsResult?.runs.slice(0, WORK_LOG_EXTRACTION_RUN_DISPLAY_LIMIT) ?? [];
  const visibleWorkAiProviderStatusProviders = workAiProviderStatusResult?.providers ?? [];
  const visibleWorkAiProviderHealthProviders = workAiProviderHealthResult?.providers ?? [];
  const visibleWorkLogNormalizationCandidates =
    workLogNormalizationCandidatesResult?.candidates.slice(
      0,
      WORK_LOG_NORMALIZATION_CANDIDATE_DISPLAY_LIMIT,
    ) ?? [];
  const visibleWorkLogNormalizationProposals =
    workLogNormalizationProposalsResult?.proposals.slice(
      0,
      WORK_LOG_NORMALIZATION_PROPOSAL_DISPLAY_LIMIT,
    ) ?? [];
  const visibleWorkLogNormalizationReviewQueueItems =
    filteredWorkLogNormalizationReviewQueueItems.slice(
      0,
      WORK_LOG_NORMALIZATION_REVIEW_QUEUE_DISPLAY_LIMIT,
    );
  const visibleWorkSessionEvidenceProposals =
    workSessionEvidenceProposalsResult?.proposals.slice(
      0,
      WORK_SESSION_EVIDENCE_PROPOSAL_DISPLAY_LIMIT,
    ) ?? [];
  const visibleWorkSessionEvidenceReviewQueueItems =
    filteredWorkSessionEvidenceReviewQueueItems.slice(
      0,
      WORK_SESSION_EVIDENCE_REVIEW_QUEUE_DISPLAY_LIMIT,
    );
  const workSessionEvidenceReviewedItems =
    workSessionEvidenceReviewedItemsResult?.items ?? workSessionEvidenceReviewApplyResult?.items ?? [];
  const visibleWorkSessionEvidenceReviewedItems = workSessionEvidenceReviewedItems.slice(
    0,
    WORK_SESSION_EVIDENCE_REVIEW_QUEUE_DISPLAY_LIMIT,
  );
  const workLogNormalizedItems = workLogNormalizedItemsForDisplay(
    workLogNormalizationApplyResult,
    workLogNormalizedItemsResult,
  );
  const visibleWorkLogNormalizedItems = workLogNormalizedItems.slice(
    0,
    WORK_LOG_NORMALIZATION_APPLY_DISPLAY_LIMIT,
  );
  const visibleWorkLogExtractionItemGroups =
    groupWorkLogExtractionItemsByProjectDate(visibleWorkLogExtractionItems);
  const hiddenWorkLogExtractionItemCount = Math.max(
    0,
    (workLogExtractionItemsResult?.items.length ?? 0) - WORK_LOG_EXTRACTION_ITEM_DISPLAY_LIMIT,
  );
  const hiddenWorkLogExtractionRunCount = Math.max(
    0,
    (workLogExtractionRunsResult?.runs.length ?? 0) - WORK_LOG_EXTRACTION_RUN_DISPLAY_LIMIT,
  );
  const hiddenWorkLogNormalizationCandidateCount = Math.max(
    0,
    (workLogNormalizationCandidatesResult?.candidates.length ?? 0)
      - WORK_LOG_NORMALIZATION_CANDIDATE_DISPLAY_LIMIT,
  );
  const hiddenWorkLogNormalizationProposalCount = Math.max(
    0,
    (workLogNormalizationProposalsResult?.proposals.length ?? 0)
      - WORK_LOG_NORMALIZATION_PROPOSAL_DISPLAY_LIMIT,
  );
  const hiddenWorkLogNormalizationReviewQueueItemCount = Math.max(
    0,
    filteredWorkLogNormalizationReviewQueueItems.length
      - WORK_LOG_NORMALIZATION_REVIEW_QUEUE_DISPLAY_LIMIT,
  );
  const hiddenWorkSessionEvidenceProposalCount = Math.max(
    0,
    (workSessionEvidenceProposalsResult?.proposals.length ?? 0)
      - WORK_SESSION_EVIDENCE_PROPOSAL_DISPLAY_LIMIT,
  );
  const hiddenWorkSessionEvidenceReviewQueueItemCount = Math.max(
    0,
    filteredWorkSessionEvidenceReviewQueueItems.length
      - WORK_SESSION_EVIDENCE_REVIEW_QUEUE_DISPLAY_LIMIT,
  );
  const workSessionEvidenceReviewedTotalCount =
    workSessionEvidenceReviewedItemsResult?.total_items
    ?? workSessionEvidenceReviewApplyResult?.total_reviewed_item_count
    ?? workSessionEvidenceReviewedItems.length;
  const hiddenWorkSessionEvidenceReviewedItemCount = Math.max(
    0,
    workSessionEvidenceReviewedTotalCount - visibleWorkSessionEvidenceReviewedItems.length,
  );
  const workLogNormalizedTotalCount = workLogNormalizedItemsTotalCount(
    workLogNormalizationApplyResult,
    workLogNormalizedItemsResult,
  );
  const hiddenWorkLogNormalizedItemCount = Math.max(
    0,
    workLogNormalizedTotalCount - visibleWorkLogNormalizedItems.length,
  );
  const workManagementOverviewLoaded =
    workStatusExportResult !== null
    || workSummaryResult !== null
    || workSummarySnapshotsResult !== null
    || workLogExtractionResult !== null
    || workLogExtractionItemsResult !== null
    || workLogExtractionRunsResult !== null
    || workLogNormalizationCandidatesResult !== null
    || workLogNormalizationProposalsResult !== null
    || workLogNormalizationReviewQueueResult !== null
    || workLogNormalizationApplyResult !== null
    || workSessionEvidenceProposalsResult !== null
    || workSessionEvidenceReviewQueueResult !== null
    || workSessionEvidenceReviewApplyResult !== null
    || workSessionEvidenceReviewedItemsResult !== null
    || workLogNormalizedItemsResult !== null
    || workLogCoverageResult !== null;
  const workManagementOverview = useMemo(() => buildWorkManagementOverview({
    coverage: workLogCoverageResult,
    extractionItems: workLogExtractionItemsResult,
    extractionProposals: workLogExtractionResult,
    normalizedItems: workLogNormalizedItemsResult ?? workLogNormalizationApplyResult,
    snapshots: workSummarySnapshotsResult,
    statusExport: workStatusExportResult,
    summary: workSummaryResult,
  }), [
    workLogCoverageResult,
    workLogExtractionResult,
    workLogExtractionItemsResult,
    workLogNormalizationApplyResult,
    workLogNormalizedItemsResult,
    workStatusExportResult,
    workSummaryResult,
    workSummarySnapshotsResult,
  ]);
  const workManagementOverviewFilterCount = activeWorkManagementOverviewFilterCount(
    workManagementOverviewFilters,
  );
  const filteredWorkManagementOverviewRows = filterWorkManagementOverviewRows(
    workManagementOverview.rows,
    workManagementOverviewFilters,
  );
  const sortedWorkManagementOverviewRows = sortWorkManagementOverviewRows(
    filteredWorkManagementOverviewRows,
    workManagementOverviewSort,
  );
  const visibleWorkManagementOverviewRows =
    sortedWorkManagementOverviewRows.slice(0, WORK_MANAGEMENT_OVERVIEW_DISPLAY_LIMIT);
  const hiddenWorkManagementOverviewRowCount = Math.max(
    0,
    filteredWorkManagementOverviewRows.length - WORK_MANAGEMENT_OVERVIEW_DISPLAY_LIMIT,
  );
  const workManagementOverviewFilterMeta = workManagementOverviewFilterMetaText(
    filteredWorkManagementOverviewRows.length,
    workManagementOverview.rows.length,
    workManagementOverviewFilterCount,
  );
  const workManagementOverviewDateFilterSuggestions =
    workManagementOverviewDateSuggestions(workManagementOverview.rows);
  const workManagementOverviewProjectFilterSuggestions =
    workManagementOverviewProjectSuggestions(workManagementOverview.rows);
  const workManagementDurabilityWarning = workManagementOverviewLoaded
    ? workManagementOverviewDurabilityWarningText(workManagementOverview)
    : null;
  const workManagementLiveOnlyRowCount = workManagementOverviewLoaded
    ? workManagementOverview.live_only_row_count
    : 0;
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
    limit = WORK_LOG_EXTRACTION_ITEM_MANAGEMENT_LIMIT,
  }: { date?: string; project?: string; limit?: number } = {}): ProjectWorkLogExtractionItemsOptions {
    const trimmedDate = date.trim();
    const trimmedProject = project.trim();
    return {
      limit,
      ...(trimmedDate ? { date: trimmedDate } : {}),
      ...(trimmedProject ? { project: trimmedProject } : {}),
    };
  }

  function workLogNormalizedItemOptions({
    limit = WORK_LOG_NORMALIZATION_APPLY_MANAGEMENT_LIMIT,
  }: { limit?: number } = {}): ProjectWorkLogNormalizedItemsOptions {
    return { limit };
  }

  function workSessionEvidenceReviewedItemOptions({
    limit = WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT,
  }: { limit?: number } = {}): ProjectWorkSessionEvidenceReviewedItemsOptions {
    return { limit };
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

  async function refreshWorkLogExtractionRuns() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    try {
      await refreshWorkLogExtractionRunsAfterSave();
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkSessionEvidenceReviewedItems(
    options = workSessionEvidenceReviewedItemOptions(),
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceReviewedItemsState("loading");
    try {
      const next = await listProjectWorkSessionEvidenceReviewedItems(options);
      setWorkSessionEvidenceReviewedItemsResult(next);
      setWorkSessionEvidenceReviewedItemsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceReviewedItemsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkLogExtractionRunsAfterSave() {
    setError(null);
    setWorkLogExtractionRunsState("loading");
    try {
      const next = await listProjectWorkLogExtractionRuns({
        limit: WORK_LOG_EXTRACTION_RUN_MANAGEMENT_LIMIT,
      });
      setWorkLogExtractionRunsResult(next);
      setWorkLogExtractionRunsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogExtractionRunsState("failed");
    }
  }

  async function refreshWorkLogNormalizationCandidates() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const sessionLimit = workSummarySessionLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkLogNormalizationCandidatesState("failed");
      releaseExclusiveAction(topLevelActionClaimRef);
      return;
    }
    setError(null);
    setWorkLogNormalizationCandidatesState("loading");
    try {
      const next = await loadProjectWorkLogNormalizationCandidates({
        limit: WORK_LOG_NORMALIZATION_CANDIDATE_MANAGEMENT_LIMIT,
        needs_title_normalization: workLogNormalizationNeedsTitleOnly ? true : undefined,
        session_limit: sessionLimit,
      });
      setWorkLogNormalizationCandidatesResult(next);
      setWorkLogNormalizationCandidatesState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizationCandidatesState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkLogNormalizationProposals() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const sessionLimit = workSummarySessionLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkLogNormalizationProposalsState("failed");
      releaseExclusiveAction(topLevelActionClaimRef);
      return;
    }
    setError(null);
    setWorkLogNormalizationProposalsState("loading");
    try {
      const next = await loadProjectWorkLogNormalizationProposals({
        ai: true,
        limit: WORK_LOG_NORMALIZATION_PROPOSAL_MANAGEMENT_LIMIT,
        needs_title_normalization: workLogNormalizationNeedsTitleOnly ? true : undefined,
        session_limit: sessionLimit,
      });
      setWorkLogNormalizationProposalsResult(next);
      setWorkLogNormalizationProposalsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizationProposalsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function syncWorkLogNormalizationReviewQueue() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const sessionLimit = workSummarySessionLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkLogNormalizationReviewQueueState("failed");
      releaseExclusiveAction(topLevelActionClaimRef);
      return;
    }
    setError(null);
    setWorkLogNormalizationReviewQueueState("loading");
    try {
      const nextQueue = await loadProjectWorkLogNormalizationReviewQueue({
        ai: true,
        limit: WORK_LOG_NORMALIZATION_REVIEW_QUEUE_MANAGEMENT_LIMIT,
        session_limit: sessionLimit,
        sync_proposals: true,
      });
      setWorkLogNormalizationReviewQueueResult(nextQueue);
      setWorkLogNormalizationReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizationReviewQueueState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function updateWorkLogNormalizationReviewQueueItem(
    candidateId: string,
    reviewState: "approved" | "rejected",
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const reviewReason = reviewState === "approved"
      ? "operator_approved_normalization"
      : "operator_rejected_normalization";
    setError(null);
    setWorkLogNormalizationReviewQueueState("loading");
    setWorkLogNormalizationReviewQueueUpdatingCandidateId(candidateId);
    try {
      const nextQueue = await updateProjectWorkLogNormalizationReviewQueueItem({
        candidate_id: candidateId,
        limit: WORK_LOG_NORMALIZATION_REVIEW_QUEUE_MANAGEMENT_LIMIT,
        review_state: reviewState,
        review_reason: reviewReason,
      });
      setWorkLogNormalizationReviewQueueResult(nextQueue);
      setWorkLogNormalizationReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizationReviewQueueState("failed");
    } finally {
      setWorkLogNormalizationReviewQueueUpdatingCandidateId(null);
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function loadWorkSessionEvidenceProposals() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceProposalsState("loading");
    try {
      const next = await loadProjectWorkSessionEvidenceProposals({
        ai: true,
        limit: WORK_SESSION_EVIDENCE_PROPOSAL_MANAGEMENT_LIMIT,
        needs_title_normalization: workSessionEvidenceNeedsTitleOnly ? true : undefined,
      });
      setWorkSessionEvidenceProposalsResult(next);
      setWorkSessionEvidenceProposalsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceProposalsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function syncWorkSessionEvidenceReviewQueue() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceReviewQueueState("loading");
    try {
      const nextQueue = await loadProjectWorkSessionEvidenceReviewQueue({
        limit: WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT,
        sync_candidates: true,
      });
      setWorkSessionEvidenceReviewQueueResult(nextQueue);
      setWorkSessionEvidenceReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceReviewQueueState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function updateWorkSessionEvidenceReviewQueueItem(
    candidateId: string,
    reviewState: "approved" | "rejected",
    reviewReasonOverride?: string,
    sourceReview?: ProjectWorkSessionEvidenceSourceProposal,
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const reviewReason = reviewReasonOverride
      ?? (reviewState === "approved"
        ? "operator_approved_session_evidence"
        : "operator_rejected_session_evidence");
    setError(null);
    setWorkSessionEvidenceReviewQueueState("loading");
    setWorkSessionEvidenceReviewQueueUpdatingCandidateId(candidateId);
    try {
      const nextQueue = await updateProjectWorkSessionEvidenceReviewQueue({
        candidate_id: candidateId,
        limit: WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT,
        review_state: reviewState,
        review_reason: reviewReason,
        ...(sourceReview ? { source_review: sourceReview } : {}),
      });
      setWorkSessionEvidenceReviewQueueResult(nextQueue);
      setWorkSessionEvidenceReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceReviewQueueState("failed");
    } finally {
      setWorkSessionEvidenceReviewQueueUpdatingCandidateId(null);
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function loadNearbyWorkSessionEvidence(
    item: ProjectWorkSessionEvidenceReviewQueueItem,
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceNearbyState("loading");
    setWorkSessionEvidenceNearbyCandidateId(item.candidate_id);
    setWorkSessionEvidenceSourceSearchResult(null);
    setWorkSessionEvidenceSourceSearchSessionId(null);
    setWorkSessionEvidenceSourceSearchState("idle");
    setWorkSessionEvidenceSourceProposalsResult(null);
    setWorkSessionEvidenceSourceProposalsSessionId(null);
    setWorkSessionEvidenceSourceProposalsState("idle");
    try {
      const query = [item.project, item.date, ...item.top_titles, item.sample_evidence]
        .map((part) => part.trim())
        .filter(Boolean)
        .join("\n");
      const next = await loadProjectWorkSessionEvidenceNearby({
        project: item.project,
        date: item.date,
        limit: 6,
        ...(query ? { query } : {}),
      });
      setWorkSessionEvidenceNearbyResult(next);
      setWorkSessionEvidenceNearbyState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceNearbyResult(null);
      setWorkSessionEvidenceSourceSearchResult(null);
      setWorkSessionEvidenceSourceSearchSessionId(null);
      setWorkSessionEvidenceSourceProposalsResult(null);
      setWorkSessionEvidenceSourceProposalsSessionId(null);
      setWorkSessionEvidenceNearbyState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function loadWorkSessionEvidenceSourceSearch(
    session: ProjectWorkSessionEvidenceNearbyResult["items"][number],
    nearbyResult: ProjectWorkSessionEvidenceNearbyResult,
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceSourceSearchState("loading");
    setWorkSessionEvidenceSourceSearchSessionId(session.id);
    setWorkSessionEvidenceSourceProposalsResult(null);
    setWorkSessionEvidenceSourceProposalsSessionId(null);
    setWorkSessionEvidenceSourceProposalsState("idle");
    try {
      const query = [
        nearbyResult.project,
        nearbyResult.date,
        nearbyResult.query ?? "",
        session.matched_terms.join(" "),
        session.excerpt,
      ]
        .map((part) => part.trim())
        .filter(Boolean)
        .join("\n");
      const next = await searchProjectWorkSessionEvidenceSource({
        source_path: session.source_path,
        query,
        limit: 5,
        max_lines: 100000,
      });
      setWorkSessionEvidenceSourceSearchResult(next);
      setWorkSessionEvidenceSourceSearchState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceSourceSearchResult(null);
      setWorkSessionEvidenceSourceProposalsResult(null);
      setWorkSessionEvidenceSourceSearchState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function loadWorkSessionEvidenceSourceProposals(
    item: ProjectWorkSessionEvidenceReviewQueueItem,
    session: ProjectWorkSessionEvidenceNearbyResult["items"][number],
    sourceSearchResult: ProjectWorkSessionEvidenceSourceSearchResult,
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceSourceProposalsState("loading");
    setWorkSessionEvidenceSourceProposalsSessionId(session.id);
    try {
      const next = await loadProjectWorkSessionEvidenceSourceProposals({
        candidate_id: item.candidate_id,
        source_path: session.source_path,
        query: sourceSearchResult.query,
        limit: 5,
        max_lines: sourceSearchResult.requested_max_lines,
      });
      setWorkSessionEvidenceSourceProposalsResult(next);
      setWorkSessionEvidenceSourceProposalsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceSourceProposalsResult(null);
      setWorkSessionEvidenceSourceProposalsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkLogNormalizedItems() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogNormalizedItemsState("loading");
    try {
      const next = await listProjectWorkLogNormalizedItems(workLogNormalizedItemOptions());
      setWorkLogNormalizedItemsResult(next);
      setWorkLogNormalizedItemsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizedItemsState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function applyApprovedWorkLogNormalizationRows() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogNormalizationApplyState("loading");
    try {
      const next = await applyProjectWorkLogNormalizationQueue({
        limit: WORK_LOG_NORMALIZATION_APPLY_MANAGEMENT_LIMIT,
      });
      setWorkLogNormalizationApplyResult(next);
      setWorkLogNormalizedItemsState("loading");
      const normalizedItems = await listProjectWorkLogNormalizedItems(workLogNormalizedItemOptions());
      setWorkLogNormalizedItemsResult(normalizedItems);
      setWorkLogNormalizedItemsState("ready");
      setWorkLogNormalizationApplyState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogNormalizationApplyState("failed");
      setWorkLogNormalizedItemsState((current) => (current === "loading" ? "failed" : current));
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function applyApprovedWorkSessionEvidenceReviewRows() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionEvidenceReviewApplyState("loading");
    try {
      const next = await applyProjectWorkSessionEvidenceReviewRows({
        limit: WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT,
      });
      setWorkSessionEvidenceReviewApplyResult(next);
      const nextQueue = await loadProjectWorkSessionEvidenceReviewQueue({
        limit: WORK_SESSION_EVIDENCE_REVIEW_QUEUE_MANAGEMENT_LIMIT,
      });
      setWorkSessionEvidenceReviewQueueResult(nextQueue);
      setWorkSessionEvidenceReviewedItemsState("loading");
      const reviewedItems = await listProjectWorkSessionEvidenceReviewedItems(
        workSessionEvidenceReviewedItemOptions(),
      );
      setWorkSessionEvidenceReviewedItemsResult(reviewedItems);
      setWorkSessionEvidenceReviewedItemsState("ready");
      setWorkSessionEvidenceReviewApplyState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionEvidenceReviewApplyState("failed");
      setWorkSessionEvidenceReviewedItemsState((current) => (current === "loading" ? "failed" : current));
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

  function toggleWorkStatusExportRowDetails(rowKey: string) {
    setExpandedWorkStatusExportRowKeys((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
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

  async function refreshWorkAiProviderStatus() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkAiProviderStatusState("loading");
    try {
      const next = await loadProjectWorkAiProviderStatus();
      setWorkAiProviderStatusResult(next);
      setWorkAiProviderStatusState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkAiProviderStatusState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkAiProviderHealth() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkAiProviderHealthState("loading");
    try {
      const next = await loadProjectWorkAiProviderHealth();
      setWorkAiProviderHealthResult(next);
      setWorkAiProviderHealthState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkAiProviderHealthState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function syncWorkLogReviewQueue() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkLogCandidatesState("loading");
    setWorkLogReviewQueueState("loading");
    try {
      const nextCandidates = await loadProjectWorkLogCandidates();
      setWorkLogCandidatesResult(nextCandidates);
      setWorkLogCandidatesState("ready");
      const nextQueue = await loadProjectWorkLogReviewQueue({ sync_candidates: true });
      setWorkLogReviewQueueResult(nextQueue);
      setWorkLogReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogCandidatesState((current) => (current === "loading" ? "failed" : current));
      setWorkLogReviewQueueState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function updateWorkLogReviewQueueItem(
    candidateId: string,
    reviewState: "approved" | "rejected",
  ) {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    const reviewReason = reviewState === "approved"
      ? "operator_approved_for_backfill"
      : "operator_rejected_from_backfill";
    setError(null);
    setWorkLogReviewQueueState("loading");
    setWorkLogReviewQueueUpdatingCandidateId(candidateId);
    try {
      const nextQueue = await updateProjectWorkLogReviewQueueItem({
        candidate_id: candidateId,
        review_state: reviewState,
        review_reason: reviewReason,
      });
      setWorkLogReviewQueueResult(nextQueue);
      setWorkLogReviewQueueState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkLogReviewQueueState("failed");
    } finally {
      setWorkLogReviewQueueUpdatingCandidateId(null);
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
    approvedReviewQueueOnly = false,
    ai,
  }: {
    save?: boolean;
    approvedCandidateIds?: string[];
    approvedReviewQueueOnly?: boolean;
    ai?: boolean;
  } = {}) {
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
        approved_review_queue_only: approvedReviewQueueOnly || undefined,
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
        await refreshWorkLogExtractionRunsAfterSave();
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

  async function runWorkSessionIndexBackfill(mode: WorkSessionIndexBackfillMode) {
    const sessionLimit = workSummarySessionLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkSessionIndexState("failed");
      return;
    }
    if (workSessionIndexEffectiveBatchFiles === null || workSessionIndexBatchFilesInvalid) {
      setError(workSessionIndexBatchFilesStatus);
      setWorkSessionIndexState("failed");
      return;
    }
    const isLongContinue = mode === "long-continue";
    if (isLongContinue && !workSessionIndexLongConfirmed) {
      setError(workSessionIndexLongStatus);
      setWorkSessionIndexState("failed");
      return;
    }
    if (isLongContinue && workSessionIndexEffectiveLongMaxBatches === null) {
      setError(workSessionIndexLongStatus);
      setWorkSessionIndexState("failed");
      return;
    }
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSessionIndexRunMode(mode);
    setWorkSessionIndexState("loading");
    try {
      const maxBatches = isLongContinue
        ? workSessionIndexEffectiveLongMaxBatches ?? WORK_SESSION_INDEX_LONG_MAX_BATCHES
        : WORK_SESSION_INDEX_MAX_BATCHES;
      const next = await runProjectWorkSessionIndex({
        batch_files: workSessionIndexEffectiveBatchFiles,
        max_batches: maxBatches,
        until_complete: true,
        confirm_long_run: isLongContinue ? true : undefined,
        reset: mode === "reset",
      });
      setWorkSessionIndexResult(next);
      setWorkSessionIndexState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkSessionIndexState("failed");
    } finally {
      setWorkSessionIndexRunMode(null);
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
    const sessionLimit = workSummarySessionLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkSummaryState("failed");
      return;
    }
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkSummaryState("loading");
    try {
      const next = await loadProjectWorkSummary({
        limit: WORK_SUMMARY_LIMIT,
        session_limit: sessionLimit,
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

  async function refreshWorkStatusExport({
    refreshSessionIndex = false,
    offset = workStatusExportOffset,
  }: { refreshSessionIndex?: boolean; offset?: number } = {}) {
    const sessionLimit = workSummarySessionLimit;
    const statusExportLimit = workStatusExportLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkStatusExportState("failed");
      return;
    }
    if (statusExportLimit === null) {
      const message = workStatusExportLimitStatus;
      setError(message);
      setWorkStatusExportState("failed");
      return;
    }
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkStatusExportState("loading");
    try {
      const next = await loadProjectWorkStatusExport({
        limit: statusExportLimit,
        offset,
        session_limit: sessionLimit,
        refresh_session_index: refreshSessionIndex,
      });
      setWorkStatusExportResult(next);
      setWorkStatusExportOffset(next.row_offset);
      setExpandedWorkStatusExportRowKeys(new Set());
      setWorkStatusExportState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkStatusExportState("failed");
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function refreshWorkManagementOverview() {
    const sessionLimit = workSummarySessionLimit;
    const statusExportLimit = workStatusExportLimit;
    if (sessionLimit === null) {
      const message = workSummarySessionLimitStatus;
      setError(message);
      setWorkManagementRefreshState("failed");
      setWorkStatusExportState("failed");
      setWorkSummaryState("failed");
      return;
    }
    if (statusExportLimit === null) {
      const message = workStatusExportLimitStatus;
      setError(message);
      setWorkManagementRefreshState("failed");
      setWorkStatusExportState("failed");
      return;
    }
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkManagementRefreshState("loading");
    setWorkStatusExportState("loading");
    setWorkSummaryState("loading");
    setWorkSummarySnapshotsState("loading");
    setWorkLogCoverageState("loading");
    setWorkLogCandidatesState("loading");
    setWorkAiProviderStatusState("loading");
    setWorkLogExtractionRunMode("ai");
    setWorkLogExtractionState("loading");
    setWorkLogExtractionItemsState("loading");
    setWorkLogNormalizedItemsState("loading");
    setWorkSessionEvidenceReviewedItemsState("loading");
    try {
      const nextStatusExport = await loadProjectWorkStatusExport({
        limit: statusExportLimit,
        offset: 0,
        session_limit: sessionLimit,
      });
      setWorkStatusExportResult(nextStatusExport);
      setWorkStatusExportOffset(nextStatusExport.row_offset);
      setExpandedWorkStatusExportRowKeys(new Set());
      setWorkStatusExportState("ready");

      const nextSummary = await loadProjectWorkSummary({
        limit: WORK_SUMMARY_LIMIT,
        session_limit: sessionLimit,
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

      const nextProviderStatus = await loadProjectWorkAiProviderStatus();
      setWorkAiProviderStatusResult(nextProviderStatus);
      setWorkAiProviderStatusState("ready");

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

      const nextNormalizedItems = await listProjectWorkLogNormalizedItems(
        workLogNormalizedItemOptions(),
      );
      setWorkLogNormalizedItemsResult(nextNormalizedItems);
      setWorkLogNormalizedItemsState("ready");

      const nextReviewedItems = await listProjectWorkSessionEvidenceReviewedItems(
        workSessionEvidenceReviewedItemOptions(),
      );
      setWorkSessionEvidenceReviewedItemsResult(nextReviewedItems);
      setWorkSessionEvidenceReviewedItemsState("ready");

      setWorkManagementRefreshState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkManagementRefreshState("failed");
      setWorkStatusExportState((current) => (current === "loading" ? "failed" : current));
      setWorkSummaryState((current) => (current === "loading" ? "failed" : current));
      setWorkSummarySnapshotsState((current) => (current === "loading" ? "failed" : current));
      setWorkLogCoverageState((current) => (current === "loading" ? "failed" : current));
      setWorkLogCandidatesState((current) => (current === "loading" ? "failed" : current));
      setWorkAiProviderStatusState((current) => (current === "loading" ? "failed" : current));
      setWorkLogExtractionState((current) => (current === "loading" ? "failed" : current));
      setWorkLogExtractionItemsState((current) => (current === "loading" ? "failed" : current));
      setWorkLogNormalizedItemsState((current) => (current === "loading" ? "failed" : current));
      setWorkSessionEvidenceReviewedItemsState((current) => (current === "loading" ? "failed" : current));
    } finally {
      releaseExclusiveAction(topLevelActionClaimRef);
    }
  }

  async function freezeWorkManagementLiveRows() {
    if (!claimExclusiveAction(topLevelActionClaimRef)) return;
    setError(null);
    setWorkManagementFreezeState("loading");
    setWorkLogExtractionRunMode("local");
    try {
      const next = await freezeProjectWorkLogManagementRows();
      setWorkLogExtractionResult(next);
      setWorkLogExtractionState("ready");
      setWorkManagementFreezeState("ready");

      setWorkLogExtractionItemsState("loading");
      const nextItems = await listProjectWorkLogExtractionItems(workLogExtractionItemOptions());
      setWorkLogExtractionItemsResult(nextItems);
      setWorkLogExtractionItemsState("ready");
    } catch (err) {
      const message = displayErrorText(err);
      syncBrowserBridgeFailure(message);
      setError(message);
      setWorkManagementFreezeState("failed");
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
            <label className="session-limit-control">
              <span>세션</span>
              <input
                aria-label="작업 요약에 사용할 실제 세션 스캔 개수"
                data-work-summary-session-limit="true"
                disabled={isTopLevelActionLocked}
                min={1}
                max={WORK_SUMMARY_MAX_SESSION_LIMIT}
                step={10}
                type="number"
                value={workSummarySessionLimitInput}
                onChange={(event) => setWorkSummarySessionLimitInput(event.currentTarget.value)}
              />
            </label>
            {storedSessionIndexLimit > 0 ? (
              <button
                aria-label={`보관된 전체 세션 인덱스 ${storedSessionIndexLimit.toLocaleString()}개를 작업관리 세션 범위로 사용`}
                className="inline-action"
                data-use-full-session-index-limit="true"
                disabled={isTopLevelActionLocked || !canUseStoredSessionIndexLimit}
                onClick={() => setWorkSummarySessionLimitInput(String(storedSessionIndexLimit))}
                type="button"
              >
                <ShieldCheck size={14} />
                보관 전체
              </button>
            ) : null}
            <label className="session-limit-control">
              <span>상태행</span>
              <input
                aria-label="프로젝트 일별 상태 export에 표시할 최대 row 수"
                data-work-status-export-limit-input="true"
                disabled={isTopLevelActionLocked}
                min={1}
                max={WORK_STATUS_EXPORT_MAX_LIMIT}
                step={5}
                type="number"
                value={workStatusExportLimitInput}
                onChange={(event) => {
                  setWorkStatusExportLimitInput(event.currentTarget.value);
                  setWorkStatusExportOffset(0);
                  setExpandedWorkStatusExportRowKeys(new Set());
                }}
              />
            </label>
            <label className="session-limit-control">
              <span>백필</span>
              <input
                aria-label="세션 백필 source당 파일 배치 수. 비우면 세션 기준 기본값을 사용합니다"
                data-work-session-index-batch-files="true"
                disabled={isTopLevelActionLocked}
                min={1}
                max={PROJECT_WORK_SESSION_INDEX_MAX_BATCH_FILES}
                step={10}
                type="number"
                placeholder={`기본 ${
                  (workSessionIndexEffectiveBatchFiles
                    ?? workSessionIndexBatchFiles(WORK_SUMMARY_DEFAULT_SESSION_LIMIT)).toLocaleString()
                }`}
                value={workSessionIndexBatchFilesInput}
                onChange={(event) => setWorkSessionIndexBatchFilesInput(event.currentTarget.value)}
              />
            </label>
            <label className="session-limit-control">
              <span>긴 백필</span>
              <input
                aria-label={`긴 이어 백필 확인 문구. ${WORK_SESSION_INDEX_LONG_CONFIRM_TEXT} 입력`}
                data-work-session-index-long-confirm="true"
                disabled={isTopLevelActionLocked}
                placeholder={WORK_SESSION_INDEX_LONG_CONFIRM_TEXT}
                type="text"
                value={workSessionIndexLongConfirmInput}
                onChange={(event) => setWorkSessionIndexLongConfirmInput(event.currentTarget.value)}
              />
            </label>
            <label className="session-limit-control">
              <span>긴 반복</span>
              <input
                aria-label={`긴 이어 백필 반복 배치 수. 1-${WORK_SESSION_INDEX_MAX_LONG_BATCHES.toLocaleString()} 사이 숫자`}
                data-work-session-index-long-max-batches="true"
                disabled={isTopLevelActionLocked}
                min={1}
                max={WORK_SESSION_INDEX_MAX_LONG_BATCHES}
                step={10}
                type="number"
                value={workSessionIndexLongMaxBatchesInput}
                onChange={(event) => setWorkSessionIndexLongMaxBatchesInput(event.currentTarget.value)}
              />
            </label>
            <button
              aria-label={`세션 백필 source당 ${WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES.toLocaleString()}개와 긴 백필 확인 문구 적용`}
              className="inline-action"
              data-apply-work-session-index-large-batch="true"
              disabled={isTopLevelActionLocked}
              onClick={() => {
                setWorkSessionIndexBatchFilesInput(String(WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES));
                setWorkSessionIndexLongConfirmInput(WORK_SESSION_INDEX_LONG_CONFIRM_TEXT);
                setWorkSessionIndexLongMaxBatchesInput(String(WORK_SESSION_INDEX_LONG_MAX_BATCHES));
              }}
              type="button"
            >
              <ShieldCheck size={15} />
              대용량 적용
            </button>
            <button
              aria-label={
                workSessionIndexCompletionMaxBatches
                  ? `세션 백필 완료 계획 적용: source당 ${WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES.toLocaleString()}개, 긴 반복 ${workSessionIndexCompletionMaxBatches.toLocaleString()}배치`
                  : "세션 백필 완료 계획은 백필 상태를 먼저 확인한 뒤 사용할 수 있습니다"
              }
              className="inline-action"
              data-apply-work-session-index-completion-plan="true"
              disabled={isTopLevelActionLocked || workSessionIndexCompletionMaxBatches === null}
              onClick={() => {
                if (workSessionIndexCompletionMaxBatches === null) return;
                setWorkSessionIndexBatchFilesInput(String(WORK_SESSION_INDEX_RECOMMENDED_LARGE_BATCH_FILES));
                setWorkSessionIndexLongConfirmInput(WORK_SESSION_INDEX_LONG_CONFIRM_TEXT);
                setWorkSessionIndexLongMaxBatchesInput(String(workSessionIndexCompletionMaxBatches));
              }}
              type="button"
            >
              <CheckCircle2 size={15} />
              완료 계획
            </button>
            <button
              aria-label={workManagementRefreshActionLabel(
                workManagementRefreshState,
                workManagementOverviewLoaded,
                actionLockState,
              )}
              className="inline-action"
              data-refresh-work-management-overview="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid || workStatusExportLimitInvalid}
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
              aria-label={workStatusExportActionLabel(
                workStatusExportState,
                workStatusExportResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-status-export="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid || workStatusExportLimitInvalid}
              onClick={() => void refreshWorkStatusExport()}
              type="button"
            >
              <FileText size={15} />
              {workStatusExportState === "loading"
                ? "Export 중"
                : workStatusExportResult
                  ? "상태 새로고침"
                  : "상태 Export"}
            </button>
            <button
              aria-label={workSummaryActionLabel(
                workSummaryState,
                workSummaryResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-summary="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
              onClick={() => refreshWorkSummary({ refreshSessionIndex: true })}
              type="button"
            >
              <RefreshCw size={15} />
              세션 재스캔
            </button>
            <button
              aria-label="실제 Codex 세션 인덱스를 처음부터 초기화해 제한된 배치만큼 백필"
              className="inline-action"
              data-run-work-session-index-backfill="true"
              data-run-work-session-index-reset-backfill="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid || workSessionIndexBatchFilesInvalid}
              onClick={() => void runWorkSessionIndexBackfill("reset")}
              type="button"
            >
              <Database size={15} />
              {workSessionIndexState === "loading" && workSessionIndexRunMode === "reset"
                ? "초기화 중"
                : "처음부터 백필"}
            </button>
            <button
              aria-label="저장된 세션 인덱스 커서부터 제한된 배치만큼 이어서 백필"
              className="inline-action"
              data-run-work-session-index-continue-backfill="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid || workSessionIndexBatchFilesInvalid}
              onClick={() => void runWorkSessionIndexBackfill("continue")}
              type="button"
            >
              <RefreshCw size={15} />
              {workSessionIndexState === "loading" && workSessionIndexRunMode === "continue"
                ? "이어가는 중"
                : "이어 백필"}
            </button>
            <button
              aria-label={`확인 문구 입력 후 저장된 세션 인덱스 커서부터 최대 ${
                (workSessionIndexEffectiveLongMaxBatches ?? WORK_SESSION_INDEX_LONG_MAX_BATCHES).toLocaleString()
              }배치 긴 이어 백필`}
              className="inline-action"
              data-run-work-session-index-long-continue-backfill="true"
              disabled={
                isTopLevelActionLocked
                || workSummarySessionLimitInvalid
                || workSessionIndexBatchFilesInvalid
                || workSessionIndexLongMaxBatchesInvalid
                || !workSessionIndexLongConfirmed
              }
              onClick={() => void runWorkSessionIndexBackfill("long-continue")}
              type="button"
            >
              <History size={15} />
              {workSessionIndexState === "loading" && workSessionIndexRunMode === "long-continue"
                ? "긴 백필 중"
                : "긴 이어 백필"}
            </button>
            <button
              aria-label="현재 프로젝트 작업 요약을 SQLite 스냅샷으로 저장"
              className="inline-action"
              data-save-work-summary-snapshot="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
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
              aria-label={workAiProviderStatusActionLabel(
                workAiProviderStatusState,
                workAiProviderStatusResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-ai-provider-status="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkAiProviderStatus()}
              type="button"
            >
              <Sparkles size={15} />
              {workAiProviderStatusState === "loading"
                ? "provider 확인 중"
                : workAiProviderStatusResult
                  ? "provider 상태 새로고침"
                  : "provider 상태"}
            </button>
            <button
              aria-label={workAiProviderHealthActionLabel(
                workAiProviderHealthState,
                workAiProviderHealthResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-ai-provider-health="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkAiProviderHealth()}
              type="button"
            >
              <Sparkles size={15} />
              {workAiProviderHealthState === "loading"
                ? "live probe 중"
                : workAiProviderHealthResult
                  ? "live probe 재실행"
                  : "provider live probe"}
            </button>
            <button
              aria-label={workLogNormalizationCandidatesActionLabel(
                workLogNormalizationCandidatesState,
                workLogNormalizationCandidatesResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-normalization-candidates="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
              onClick={() => void refreshWorkLogNormalizationCandidates()}
              type="button"
            >
              <Sparkles size={15} />
              {workLogNormalizationCandidatesState === "loading"
                ? "정규화 확인 중"
                : workLogNormalizationCandidatesResult
                  ? "정규화 후보 새로고침"
                  : "정규화 후보"}
            </button>
            <button
              aria-label={workLogNormalizationProposalsActionLabel(
                workLogNormalizationProposalsState,
                workLogNormalizationProposalsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-normalization-proposals="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
              onClick={() => void refreshWorkLogNormalizationProposals()}
              type="button"
            >
              <Sparkles size={15} />
              {workLogNormalizationProposalsState === "loading"
                ? "제안 생성 중"
                : workLogNormalizationProposalsResult
                  ? "정규화 제안 새로고침"
                  : "정규화 제안"}
            </button>
            <label className="local-recommendation-toggle">
              <input
                aria-label="작업 로그 정규화 제목 정규화 후보만 사용"
                checked={workLogNormalizationNeedsTitleOnly}
                data-work-log-normalization-needs-title-only="true"
                disabled={isTopLevelActionLocked}
                onChange={(event) => {
                  setWorkLogNormalizationNeedsTitleOnly(event.currentTarget.checked);
                  setWorkLogNormalizationCandidatesResult(null);
                  setWorkLogNormalizationCandidatesState("idle");
                  setWorkLogNormalizationProposalsResult(null);
                  setWorkLogNormalizationProposalsState("idle");
                }}
                type="checkbox"
              />
              <span>정규화 제목만</span>
            </label>
            <button
              aria-label={workLogNormalizationReviewQueueActionLabel(
                workLogNormalizationReviewQueueState,
                workLogNormalizationReviewQueueResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-sync-work-log-normalization-review-queue="true"
              disabled={isTopLevelActionLocked || workSummarySessionLimitInvalid}
              onClick={() => void syncWorkLogNormalizationReviewQueue()}
              type="button"
            >
              <Database size={15} />
              {workLogNormalizationReviewQueueState === "loading"
                ? "정규화 큐 동기화 중"
                : workLogNormalizationReviewQueueResult
                  ? "정규화 큐 새로고침"
                : "정규화 큐"}
            </button>
            <button
              aria-label={workSessionEvidenceProposalsActionLabel(
                workSessionEvidenceProposalsState,
                workSessionEvidenceProposalsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-session-evidence-proposals="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void loadWorkSessionEvidenceProposals()}
              type="button"
            >
              <Sparkles size={15} />
              {workSessionEvidenceProposalsState === "loading"
                ? "세션근거 제안 중"
                : workSessionEvidenceProposalsResult
                  ? "세션근거 제안 새로고침"
                  : "세션근거 제안"}
            </button>
            <label className="local-recommendation-toggle">
              <input
                checked={workSessionEvidenceNeedsTitleOnly}
                data-work-session-evidence-needs-title-only="true"
                disabled={isTopLevelActionLocked}
                onChange={(event) => {
                  setWorkSessionEvidenceNeedsTitleOnly(event.currentTarget.checked);
                  setWorkSessionEvidenceProposalsResult(null);
                  setWorkSessionEvidenceProposalsState("idle");
                }}
                type="checkbox"
              />
              <span>제목정규화만</span>
            </label>
            <button
              aria-label={workSessionEvidenceReviewQueueActionLabel(
                workSessionEvidenceReviewQueueState,
                workSessionEvidenceReviewQueueResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-sync-work-session-evidence-review-queue="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void syncWorkSessionEvidenceReviewQueue()}
              type="button"
            >
              <ShieldCheck size={15} />
              {workSessionEvidenceReviewQueueState === "loading"
                ? "세션근거 큐 동기화 중"
                : workSessionEvidenceReviewQueueResult
                  ? "세션근거 큐 새로고침"
                  : "세션근거 큐"}
            </button>
            <button
              aria-label={workSessionEvidenceReviewApplyActionLabel(
                workSessionEvidenceReviewApplyState,
                hasApprovedWorkSessionEvidenceReviewRows,
                actionLockState,
              )}
              className="inline-action"
              data-apply-work-session-evidence-review-queue="true"
              disabled={isTopLevelActionLocked || !hasApprovedWorkSessionEvidenceReviewRows}
              onClick={() => void applyApprovedWorkSessionEvidenceReviewRows()}
              type="button"
            >
              <CheckCircle2 size={15} />
              {workSessionEvidenceReviewApplyState === "loading"
                ? "검토결과 저장 중"
                : workSessionEvidenceReviewApplyResult
                  ? "검토결과 다시 저장"
                  : "검토결과 저장"}
            </button>
            <button
              aria-label={workSessionEvidenceReviewedItemsActionLabel(
                workSessionEvidenceReviewedItemsState,
                workSessionEvidenceReviewedItemsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-session-evidence-reviewed-items="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkSessionEvidenceReviewedItems()}
              type="button"
            >
              <ShieldCheck size={15} />
              {workSessionEvidenceReviewedItemsState === "loading"
                ? "검토결과 불러오는 중"
                : workSessionEvidenceReviewedItemsResult
                  ? "검토결과 다시 보기"
                  : "검토결과 불러오기"}
            </button>
            <button
              aria-label={workLogNormalizationApplyActionLabel(
                workLogNormalizationApplyState,
                hasApprovedWorkLogNormalizationRows,
                actionLockState,
              )}
              className="inline-action"
              data-apply-work-log-normalization-review-queue="true"
              disabled={isTopLevelActionLocked || !hasApprovedWorkLogNormalizationRows}
              onClick={() => void applyApprovedWorkLogNormalizationRows()}
              type="button"
            >
              <CheckCircle2 size={15} />
              {workLogNormalizationApplyState === "loading"
                ? "적용 중"
                : workLogNormalizationApplyResult
                  ? "승인 적용 다시"
                  : "승인 적용"}
            </button>
            <button
              aria-label={workLogNormalizedItemsActionLabel(
                workLogNormalizedItemsState,
                workLogNormalizedItemsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-normalized-items="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogNormalizedItems()}
              type="button"
            >
              <ClipboardList size={15} />
              {workLogNormalizedItemsState === "loading"
                ? "정규화 row 불러오는 중"
                : workLogNormalizedItemsResult
                  ? "정규화 row 다시 보기"
                  : "정규화 row 불러오기"}
            </button>
            <button
              aria-label={workLogReviewQueueActionLabel(
                workLogReviewQueueState,
                workLogReviewQueueResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-sync-work-log-review-queue="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void syncWorkLogReviewQueue()}
              type="button"
            >
              <Database size={15} />
              {workLogReviewQueueState === "loading"
                ? "큐 동기화 중"
                : workLogReviewQueueResult
                  ? "큐 새로고침"
                  : "백필큐 동기화"}
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
              aria-label={
                approvedWorkLogReviewQueueCount
                  ? `승인된 백필큐 후보 ${approvedWorkLogReviewQueueCount.toLocaleString()}개를 AI 추출 후 SQLite 관리 데이터로 저장`
                  : "승인된 백필큐 후보가 없어 AI 저장을 실행할 수 없습니다"
              }
              className="inline-action"
              data-save-approved-work-log-review-queue="true"
              disabled={isTopLevelActionLocked || approvedWorkLogReviewQueueCount === 0}
              onClick={() =>
                void refreshWorkLogExtraction({
                  save: true,
                  ai: true,
                  approvedReviewQueueOnly: true,
                })}
              type="button"
            >
              <ShieldCheck size={15} />
              {workLogExtractionState === "loading" ? "승인 큐 처리 중" : "승인 큐 저장"}
            </button>
            <button
              aria-label={workManagementFreezeActionLabel(
                workManagementFreezeState,
                workManagementLiveOnlyRowCount,
                actionLockState,
              )}
              className="inline-action"
              data-freeze-work-management-live-rows="true"
              disabled={isTopLevelActionLocked || workManagementLiveOnlyRowCount === 0}
              onClick={() => void freezeWorkManagementLiveRows()}
              type="button"
            >
              <Database size={15} />
              {workManagementFreezeState === "loading" ? "고정 저장 중" : "라이브 고정 저장"}
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
            <button
              aria-label={workLogExtractionRunsActionLabel(
                workLogExtractionRunsState,
                workLogExtractionRunsResult !== null,
                actionLockState,
              )}
              className="inline-action"
              data-load-work-log-runs="true"
              disabled={isTopLevelActionLocked}
              onClick={() => void refreshWorkLogExtractionRuns()}
              type="button"
            >
              <History size={15} />
              {workLogExtractionRunsState === "loading"
                ? "이력 불러오는 중"
                : workLogExtractionRunsResult
                  ? "이력 새로고침"
                  : "실행 이력"}
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
        {workStatusExportFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-status-export-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workStatusExportFailureMessage}</span>
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
        {workLogReviewQueueFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-review-queue-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={16} />
            <span>{workLogReviewQueueFailureMessage}</span>
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
        {workLogExtractionRunsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-runs-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogExtractionRunsFailureMessage}</span>
          </div>
        ) : null}
        {workLogNormalizationCandidatesFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-normalization-candidates-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogNormalizationCandidatesFailureMessage}</span>
          </div>
        ) : null}
        {workAiProviderStatusFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-ai-provider-status-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workAiProviderStatusFailureMessage}</span>
          </div>
        ) : null}
        {workAiProviderHealthFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-ai-provider-health-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workAiProviderHealthFailureMessage}</span>
          </div>
        ) : null}
        {workLogNormalizationProposalsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-normalization-proposals-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogNormalizationProposalsFailureMessage}</span>
          </div>
        ) : null}
        {workLogNormalizationProposalWarningNotice && workLogNormalizationProposalsResult?.warnings.length ? (
          <section
            className="notice warning panel-notice provider-warning-notice"
            data-work-log-normalization-proposals-warning="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <div>
              <span>{workLogNormalizationProposalWarningNotice}</span>
              <div className="warning-list">
                {workLogNormalizationProposalsResult.warnings.map((warning, index) => (
                  <p key={textListItemKey(warning, index)}>
                    {redactSensitiveDisplayText(warning)}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {workLogNormalizationReviewQueueFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-normalization-review-queue-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogNormalizationReviewQueueFailureMessage}</span>
          </div>
        ) : null}
        {workSessionEvidenceProposalsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-session-evidence-proposals-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSessionEvidenceProposalsFailureMessage}</span>
          </div>
        ) : null}
        {workSessionEvidenceProposalWarningNotice && workSessionEvidenceProposalsResult?.warnings.length ? (
          <section
            className="notice warning panel-notice provider-warning-notice"
            data-work-session-evidence-proposals-warning="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <div>
              <span>{workSessionEvidenceProposalWarningNotice}</span>
              <div className="warning-list">
                {workSessionEvidenceProposalsResult.warnings.map((warning, index) => (
                  <p key={textListItemKey(warning, index)}>
                    {redactSensitiveDisplayText(warning)}
                  </p>
                ))}
              </div>
            </div>
          </section>
        ) : null}
        {workSessionEvidenceReviewQueueFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-session-evidence-review-queue-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSessionEvidenceReviewQueueFailureMessage}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewApplyFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-session-evidence-review-apply-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSessionEvidenceReviewApplyFailureMessage}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewedItemsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-session-evidence-reviewed-items-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workSessionEvidenceReviewedItemsFailureMessage}</span>
          </div>
        ) : null}
        {workLogNormalizationApplyFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-normalization-apply-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogNormalizationApplyFailureMessage}</span>
          </div>
        ) : null}
        {workLogNormalizedItemsFailureMessage ? (
          <div
            className="notice warning panel-notice"
            data-work-log-normalized-items-error="true"
            {...ALERT_NOTICE_PROPS}
          >
            <AlertTriangle size={18} />
            <span>{workLogNormalizedItemsFailureMessage}</span>
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
          className="work-summary-filter-row work-log-coverage-filter-row"
          data-work-log-coverage-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>로그 프로젝트</span>
            <input
              aria-label="프로젝트 작업 로그 범위 프로젝트 필터"
              data-work-log-coverage-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-coverage-project-options"
              onChange={(event) =>
                setWorkLogCoverageFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="PromptVault"
              type="text"
              value={workLogCoverageFilters.project}
            />
          </label>
          <label>
            <span>상태</span>
            <select
              aria-label="프로젝트 작업 로그 범위 상태 필터"
              data-work-log-coverage-status-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkLogCoverageFilters((current) => ({
                  ...current,
                  status: event.target.value as WorkLogCoverageStatusFilter,
                }))}
              value={workLogCoverageFilters.status}
            >
              {WORK_LOG_COVERAGE_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label={
              workLogCoverageFilterCount
                ? `프로젝트 작업 로그 범위 필터 ${workLogCoverageFilterCount.toLocaleString()}개 적용`
                : "필터 없이 프로젝트 작업 로그 범위 보기"
            }
            className="inline-action"
            data-apply-work-log-coverage-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="프로젝트 작업 로그 범위 필터 초기화"
            className="inline-action"
            data-clear-work-log-coverage-filters="true"
            disabled={isTopLevelActionLocked || workLogCoverageFilterCount === 0}
            onClick={() => setWorkLogCoverageFilters(emptyWorkLogCoverageFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-log-coverage-project-options">
          {workLogCoverageProjectFilterSuggestions.map((project) => (
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
              void refreshWorkLogExtractionItems({ limit: WORK_LOG_EXTRACTION_ITEM_MANAGEMENT_LIMIT });
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
        <form
          className="work-summary-filter-row work-management-filter-row"
          data-work-management-overview-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>관리 날짜</span>
            <input
              aria-label="프로젝트 일자 관리 감사 날짜 필터"
              data-work-management-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-management-date-options"
              onChange={(event) =>
                setWorkManagementOverviewFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))}
              placeholder="2026-06-09"
              type="text"
              value={workManagementOverviewFilters.date}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="프로젝트 일자 관리 감사 프로젝트 필터"
              data-work-management-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-management-project-options"
              onChange={(event) =>
                setWorkManagementOverviewFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="PromptVault"
              type="text"
              value={workManagementOverviewFilters.project}
            />
          </label>
          <label>
            <span>근거 소스</span>
            <select
              aria-label="프로젝트 일자 관리 감사 근거 소스 필터"
              data-work-management-source-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkManagementOverviewFilters((current) => ({
                  ...current,
                  source: event.target.value as WorkManagementOverviewFilters["source"],
                }))}
              value={workManagementOverviewFilters.source}
            >
              {WORK_MANAGEMENT_SOURCE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>저장 상태</span>
            <select
              aria-label="프로젝트 일자 관리 감사 저장 상태 필터"
              data-work-management-state-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkManagementOverviewFilters((current) => ({
                  ...current,
                  persistence: event.target.value as WorkManagementOverviewFilters["persistence"],
                }))}
              value={workManagementOverviewFilters.persistence}
            >
              {WORK_MANAGEMENT_PERSISTENCE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>최소 신뢰도</span>
            <input
              aria-label="프로젝트 일자 관리 감사 최소 confidence 필터"
              data-work-management-min-confidence-filter="true"
              disabled={isTopLevelActionLocked}
              inputMode="decimal"
              max="1"
              min="0"
              onChange={(event) =>
                setWorkManagementOverviewFilters((current) => ({
                  ...current,
                  minConfidence: event.target.value,
                }))}
              placeholder="0.80"
              step="0.01"
              type="number"
              value={workManagementOverviewFilters.minConfidence}
            />
          </label>
          <label>
            <span>정렬</span>
            <select
              aria-label="프로젝트 일자 관리 감사 정렬"
              data-work-management-sort="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkManagementOverviewSort(event.target.value as WorkManagementOverviewSort)}
              value={workManagementOverviewSort}
            >
              {WORK_MANAGEMENT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            aria-label={
              workManagementOverviewFilterCount
                ? `프로젝트 일자 관리 감사 필터 ${workManagementOverviewFilterCount.toLocaleString()}개 적용`
                : "필터 없이 프로젝트 일자 관리 감사 보기"
            }
            className="inline-action"
            data-apply-work-management-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="프로젝트 일자 관리 감사 필터 초기화"
            className="inline-action"
            data-clear-work-management-filters="true"
            disabled={isTopLevelActionLocked || workManagementOverviewFilterCount === 0}
            onClick={() => setWorkManagementOverviewFilters(emptyWorkManagementOverviewFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-management-date-options">
          {workManagementOverviewDateFilterSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-management-project-options">
          {workManagementOverviewProjectFilterSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <form
          className="work-summary-filter-row work-backfill-queue-filter-row"
          data-work-log-review-queue-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>백필 프로젝트</span>
            <input
              aria-label="백필큐 프로젝트 필터"
              data-work-log-review-queue-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-review-queue-project-options"
              onChange={(event) =>
                setWorkLogReviewQueueFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="PromptVault"
              type="text"
              value={workLogReviewQueueFilters.project}
            />
          </label>
          <label>
            <span>상태</span>
            <select
              aria-label="백필큐 상태 필터"
              data-work-log-review-queue-state-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkLogReviewQueueFilters((current) => ({
                  ...current,
                  state: event.target.value as WorkReviewQueueStateFilter,
                }))}
              value={workLogReviewQueueFilters.state}
            >
              {WORK_LOG_REVIEW_QUEUE_STATE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>사유</span>
            <input
              aria-label="백필큐 사유 필터"
              data-work-log-review-queue-reason-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-review-queue-reason-options"
              onChange={(event) =>
                setWorkLogReviewQueueFilters((current) => ({
                  ...current,
                  reason: event.target.value,
                }))}
              placeholder="safe_ai"
              type="text"
              value={workLogReviewQueueFilters.reason}
            />
          </label>
          <button
            aria-label={
              workLogReviewQueueFilterCount
                ? `백필큐 필터 ${workLogReviewQueueFilterCount.toLocaleString()}개 적용`
                : "필터 없이 백필큐 보기"
            }
            className="inline-action"
            data-apply-work-log-review-queue-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="백필큐 필터 초기화"
            className="inline-action"
            data-clear-work-log-review-queue-filters="true"
            disabled={isTopLevelActionLocked || workLogReviewQueueFilterCount === 0}
            onClick={() => setWorkLogReviewQueueFilters(emptyWorkReviewQueueFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-log-review-queue-project-options">
          {workLogReviewQueueProjectFilterSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <datalist id="work-log-review-queue-reason-options">
          {workLogReviewQueueReasonFilterSuggestions.map((reason) => (
            <option key={reason} value={reason} />
          ))}
        </datalist>
        <form
          className="work-summary-filter-row work-review-queue-filter-row"
          data-work-log-normalization-review-queue-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>정규화 날짜</span>
            <input
              aria-label="정규화 검토 큐 날짜 필터"
              data-work-log-normalization-review-queue-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-normalization-review-queue-date-options"
              onChange={(event) =>
                setWorkLogNormalizationReviewQueueFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))}
              placeholder="2026-06-09"
              type="text"
              value={workLogNormalizationReviewQueueFilters.date}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="정규화 검토 큐 프로젝트 필터"
              data-work-log-normalization-review-queue-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-normalization-review-queue-project-options"
              onChange={(event) =>
                setWorkLogNormalizationReviewQueueFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="PromptVault"
              type="text"
              value={workLogNormalizationReviewQueueFilters.project}
            />
          </label>
          <label>
            <span>상태</span>
            <select
              aria-label="정규화 검토 큐 상태 필터"
              data-work-log-normalization-review-queue-state-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkLogNormalizationReviewQueueFilters((current) => ({
                  ...current,
                  state: event.target.value as WorkReviewQueueStateFilter,
                }))}
              value={workLogNormalizationReviewQueueFilters.state}
            >
              {WORK_REVIEW_QUEUE_STATE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>사유</span>
            <input
              aria-label="정규화 검토 큐 사유 필터"
              data-work-log-normalization-review-queue-reason-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-log-normalization-review-queue-reason-options"
              onChange={(event) =>
                setWorkLogNormalizationReviewQueueFilters((current) => ({
                  ...current,
                  reason: event.target.value,
                }))}
              placeholder="generic_title"
              type="text"
              value={workLogNormalizationReviewQueueFilters.reason}
            />
          </label>
          <button
            aria-label={
              workLogNormalizationReviewQueueFilterCount
                ? `정규화 검토 큐 필터 ${workLogNormalizationReviewQueueFilterCount.toLocaleString()}개 적용`
                : "필터 없이 정규화 검토 큐 보기"
            }
            className="inline-action"
            data-apply-work-log-normalization-review-queue-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="정규화 검토 큐 필터 초기화"
            className="inline-action"
            data-clear-work-log-normalization-review-queue-filters="true"
            disabled={isTopLevelActionLocked || workLogNormalizationReviewQueueFilterCount === 0}
            onClick={() => setWorkLogNormalizationReviewQueueFilters(emptyWorkReviewQueueFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-log-normalization-review-queue-date-options">
          {workLogNormalizationReviewQueueDateFilterSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-log-normalization-review-queue-project-options">
          {workLogNormalizationReviewQueueProjectFilterSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <datalist id="work-log-normalization-review-queue-reason-options">
          {workLogNormalizationReviewQueueReasonFilterSuggestions.map((reason) => (
            <option key={reason} value={reason} />
          ))}
        </datalist>
        <form
          className="work-summary-filter-row work-review-queue-filter-row"
          data-work-session-evidence-review-queue-filters="true"
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <label>
            <span>세션 날짜</span>
            <input
              aria-label="세션 근거 검토 큐 날짜 필터"
              data-work-session-evidence-review-queue-date-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-session-evidence-review-queue-date-options"
              onChange={(event) =>
                setWorkSessionEvidenceReviewQueueFilters((current) => ({
                  ...current,
                  date: event.target.value,
                }))}
              placeholder="2026-06-09"
              type="text"
              value={workSessionEvidenceReviewQueueFilters.date}
            />
          </label>
          <label>
            <span>프로젝트</span>
            <input
              aria-label="세션 근거 검토 큐 프로젝트 필터"
              data-work-session-evidence-review-queue-project-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-session-evidence-review-queue-project-options"
              onChange={(event) =>
                setWorkSessionEvidenceReviewQueueFilters((current) => ({
                  ...current,
                  project: event.target.value,
                }))}
              placeholder="PromptVault"
              type="text"
              value={workSessionEvidenceReviewQueueFilters.project}
            />
          </label>
          <label>
            <span>상태</span>
            <select
              aria-label="세션 근거 검토 큐 상태 필터"
              data-work-session-evidence-review-queue-state-filter="true"
              disabled={isTopLevelActionLocked}
              onChange={(event) =>
                setWorkSessionEvidenceReviewQueueFilters((current) => ({
                  ...current,
                  state: event.target.value as WorkReviewQueueStateFilter,
                }))}
              value={workSessionEvidenceReviewQueueFilters.state}
            >
              {WORK_REVIEW_QUEUE_STATE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>사유</span>
            <input
              aria-label="세션 근거 검토 큐 사유 필터"
              data-work-session-evidence-review-queue-reason-filter="true"
              disabled={isTopLevelActionLocked}
              list="work-session-evidence-review-queue-reason-options"
              onChange={(event) =>
                setWorkSessionEvidenceReviewQueueFilters((current) => ({
                  ...current,
                  reason: event.target.value,
                }))}
              placeholder="full-index"
              type="text"
              value={workSessionEvidenceReviewQueueFilters.reason}
            />
          </label>
          <button
            aria-label={
              workSessionEvidenceReviewQueueFilterCount
                ? `세션 근거 검토 큐 필터 ${workSessionEvidenceReviewQueueFilterCount.toLocaleString()}개 적용`
                : "필터 없이 세션 근거 검토 큐 보기"
            }
            className="inline-action"
            data-apply-work-session-evidence-review-queue-filters="true"
            disabled={isTopLevelActionLocked}
            type="submit"
          >
            <Search size={15} />
            필터 적용
          </button>
          <button
            aria-label="세션 근거 검토 큐 필터 초기화"
            className="inline-action"
            data-clear-work-session-evidence-review-queue-filters="true"
            disabled={isTopLevelActionLocked || workSessionEvidenceReviewQueueFilterCount === 0}
            onClick={() => setWorkSessionEvidenceReviewQueueFilters(emptyWorkReviewQueueFilters())}
            type="button"
          >
            <XCircle size={15} />
            초기화
          </button>
        </form>
        <datalist id="work-session-evidence-review-queue-date-options">
          {workSessionEvidenceReviewQueueDateFilterSuggestions.map((date) => (
            <option key={date} value={date} />
          ))}
        </datalist>
        <datalist id="work-session-evidence-review-queue-project-options">
          {workSessionEvidenceReviewQueueProjectFilterSuggestions.map((project) => (
            <option key={project} value={project} />
          ))}
        </datalist>
        <datalist id="work-session-evidence-review-queue-reason-options">
          {workSessionEvidenceReviewQueueReasonFilterSuggestions.map((reason) => (
            <option key={reason} value={reason} />
          ))}
        </datalist>
        <div
          className={`work-summary-index ${workSummarySessionLimitInvalid ? "warning" : ""}`}
          data-work-summary-session-limit-meta="true"
        >
          <Brain size={15} />
          <span>{workSummarySessionLimitStatus}</span>
        </div>
        <div
          className={`work-summary-index ${workStatusExportLimitInvalid ? "warning" : ""}`}
          data-work-status-export-limit-meta="true"
        >
          <FileText size={15} />
          <span>{workStatusExportLimitStatus}</span>
        </div>
        <div
          className={`work-summary-index ${workSessionIndexBatchFilesInvalid ? "warning" : ""}`}
          data-work-session-index-batch-files-meta="true"
        >
          <Database size={15} />
          <span>{workSessionIndexBatchFilesStatus}</span>
        </div>
        <div
          className={`work-summary-index ${workSessionIndexLongConfirmed ? "" : "warning"}`}
          data-work-session-index-long-confirm-meta="true"
        >
          <History size={15} />
          <span>{workSessionIndexLongStatus}</span>
        </div>
        {workSessionIndexMeta ? (
          <div className="work-summary-index" data-work-session-index-meta="true">
            <Database size={15} />
            <span>{workSessionIndexMeta}</span>
          </div>
        ) : null}
        {workSessionIndexWarning ? (
          <div className="work-summary-index warning" data-work-session-index-warning="true">
            <AlertTriangle size={15} />
            <span>{workSessionIndexWarning}</span>
          </div>
        ) : null}
        {workSessionIndexRemaining ? (
          <div className="work-summary-index" data-work-session-index-remaining="true">
            <History size={15} />
            <span>{workSessionIndexRemaining}</span>
          </div>
        ) : null}
        {workSessionIndexPlannedRemaining ? (
          <div className="work-summary-index" data-work-session-index-planned-remaining="true">
            <History size={15} />
            <span>{workSessionIndexPlannedRemaining}</span>
          </div>
        ) : null}
        {workSessionIndexCheckpointGuidance ? (
          <div className="work-summary-index" data-work-session-index-checkpoint-guidance="true">
            <CheckCircle2 size={15} />
            <span>{workSessionIndexCheckpointGuidance}</span>
          </div>
        ) : null}
        {workSessionIndexNextRunImpact ? (
          <div className="work-summary-index" data-work-session-index-next-run-impact="true">
            <Play size={15} />
            <span>{workSessionIndexNextRunImpact}</span>
          </div>
        ) : null}
        {workSessionIndexResult?.source_states.length ? (
          <div className="work-summary-list compact" data-work-session-index-source-states="true">
            {workSessionIndexResult.source_states.map((source) => (
              <article
                className="work-summary-row work-management-overview-row"
                data-work-session-index-source-state="true"
                key={source.source_id}
              >
                <div>
                  <strong>{source.source_label}</strong>
                  <span>{source.completed ? "완료" : "진행 중"}</span>
                </div>
                <p>{workSessionIndexSourceStateText(source)}</p>
                <span>{pathDisplayText(source.root_path)}</span>
              </article>
            ))}
          </div>
        ) : null}
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
        {workStatusExportResult || workStatusExportState !== "idle" ? (
          <div className="work-summary-index" data-work-status-export-meta="true">
            <ClipboardList size={15} />
            <span>{workStatusExportMeta}</span>
          </div>
        ) : null}
        {workStatusExportPageStatus ? (
          <div className="work-summary-index work-status-export-page-controls" data-work-status-export-page-meta="true">
            <FileText size={15} />
            <span>{workStatusExportPageStatus}</span>
            <button
              aria-label="이전 상태 export 페이지"
              className="inline-action"
              data-work-status-export-page-prev="true"
              disabled={
                isTopLevelActionLocked
                || workStatusExportLimitInvalid
                || workStatusExportState === "loading"
                || workStatusExportResult?.row_offset === 0
              }
              onClick={() => void refreshWorkStatusExport({ offset: workStatusExportPreviousOffset })}
              type="button"
            >
              <ChevronUp size={14} />
              이전
            </button>
            <button
              aria-label="다음 상태 export 페이지"
              className="inline-action"
              data-work-status-export-page-next="true"
              disabled={
                isTopLevelActionLocked
                || workStatusExportLimitInvalid
                || workStatusExportState === "loading"
                || workStatusExportResult?.next_row_offset === null
              }
              onClick={() => void refreshWorkStatusExport({ offset: workStatusExportResult?.next_row_offset ?? 0 })}
              type="button"
            >
              <ChevronDown size={14} />
              다음
            </button>
          </div>
        ) : null}
        {workStatusExportIndexStatus ? (
          <div className="work-summary-index" data-work-status-export-index="true">
            <ShieldCheck size={15} />
            <span>{workStatusExportIndexStatus}</span>
          </div>
        ) : null}
        {workStatusExportResult?.warnings.length ? (
          <div className="work-summary-index warning" data-work-status-export-warning="true">
            <AlertTriangle size={15} />
            <span>{workStatusExportResult.warnings.join(" · ")}</span>
          </div>
        ) : null}
        {workStatusExportResult ? (
          <div
            className="work-summary-filter-row work-status-export-filter-row"
            data-work-status-export-filters="true"
          >
            <label>
              <span>상태 row</span>
              <select
                aria-label="프로젝트 일별 상태 export row 필터"
                data-work-status-export-filter="true"
                disabled={isTopLevelActionLocked}
                onChange={(event) => {
                  setWorkStatusExportRowFilter(event.target.value as WorkStatusExportRowFilter);
                  setExpandedWorkStatusExportRowKeys(new Set());
                }}
                value={workStatusExportRowFilter}
              >
                {WORK_STATUS_EXPORT_ROW_FILTER_OPTIONS.map((filter) => (
                  <option key={filter} value={filter}>
                    {workStatusExportRowFilterLabel(filter)}
                  </option>
                ))}
              </select>
            </label>
            {workStatusExportFilterMeta ? (
              <div className="work-summary-index" data-work-status-export-filter-meta="true">
                <Search size={15} />
                <span>{workStatusExportFilterMeta}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        {workLogCoverageResult || workLogCoverageState !== "idle" ? (
          <div className="work-summary-index" data-work-log-coverage-meta="true">
            <FileText size={15} />
            <span>{workLogCoverageMeta}</span>
          </div>
        ) : null}
        {workLogCoverageFilterMeta ? (
          <div className="work-summary-index" data-work-log-coverage-filter-meta="true">
            <Search size={15} />
            <span>{workLogCoverageFilterMeta}</span>
          </div>
        ) : null}
        {workLogCandidatesResult || workLogCandidatesState !== "idle" ? (
          <div className="work-summary-index" data-work-log-candidates-meta="true">
            <Brain size={15} />
            <span>{workLogCandidatesMeta}</span>
          </div>
        ) : null}
        {workAiProviderStatusResult || workAiProviderStatusState !== "idle" ? (
          <div className="work-summary-index" data-work-ai-provider-status-meta="true">
            <Sparkles size={15} />
            <span>{workAiProviderStatusMeta}</span>
          </div>
        ) : null}
        {workAiProviderHealthResult || workAiProviderHealthState !== "idle" ? (
          <div className="work-summary-index" data-work-ai-provider-health-meta="true">
            <Sparkles size={15} />
            <span>{workAiProviderHealthMeta}</span>
          </div>
        ) : null}
        {workLogReviewQueueResult || workLogReviewQueueState !== "idle" ? (
          <div className="work-summary-index" data-work-log-review-queue-meta="true">
            <Database size={15} />
            <span>{workLogReviewQueueMeta}</span>
          </div>
        ) : null}
        {workLogReviewQueueFilterMeta ? (
          <div
            className="work-summary-index"
            data-work-log-review-queue-filter-meta="true"
          >
            <Search size={15} />
            <span>{workLogReviewQueueFilterMeta}</span>
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
        {workLogExtractionRunsResult || workLogExtractionRunsState !== "idle" ? (
          <div className="work-summary-index" data-work-log-runs-meta="true">
            <History size={15} />
            <span>{workLogExtractionRunsMeta}</span>
          </div>
        ) : null}
        {workLogNormalizationCandidatesResult || workLogNormalizationCandidatesState !== "idle" ? (
          <div className="work-summary-index" data-work-log-normalization-candidates-meta="true">
            <Sparkles size={15} />
            <span>{workLogNormalizationCandidatesMeta}</span>
          </div>
        ) : null}
        {workLogNormalizationProposalsResult || workLogNormalizationProposalsState !== "idle" ? (
          <div className="work-summary-index" data-work-log-normalization-proposals-meta="true">
            <Sparkles size={15} />
            <span>{workLogNormalizationProposalsMeta}</span>
          </div>
        ) : null}
        {workLogNormalizationReviewQueueResult || workLogNormalizationReviewQueueState !== "idle" ? (
          <div className="work-summary-index" data-work-log-normalization-review-queue-meta="true">
            <Database size={15} />
            <span>{workLogNormalizationReviewQueueMeta}</span>
          </div>
        ) : null}
        {workLogNormalizationReviewQueueFilterMeta ? (
          <div
            className="work-summary-index"
            data-work-log-normalization-review-queue-filter-meta="true"
          >
            <Search size={15} />
            <span>{workLogNormalizationReviewQueueFilterMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceProposalsResult || workSessionEvidenceProposalsState !== "idle" ? (
          <div className="work-summary-index" data-work-session-evidence-proposals-meta="true">
            <Sparkles size={15} />
            <span>{workSessionEvidenceProposalsMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewQueueResult || workSessionEvidenceReviewQueueState !== "idle" ? (
          <div className="work-summary-index" data-work-session-evidence-review-queue-meta="true">
            <ShieldCheck size={15} />
            <span>{workSessionEvidenceReviewQueueMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewApplyResult || workSessionEvidenceReviewApplyState !== "idle" ? (
          <div className="work-summary-index" data-work-session-evidence-review-apply-meta="true">
            <CheckCircle2 size={15} />
            <span>{workSessionEvidenceReviewApplyMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewedItemsResult || workSessionEvidenceReviewedItemsState !== "idle" ? (
          <div className="work-summary-index" data-work-session-evidence-reviewed-items-meta="true">
            <ShieldCheck size={15} />
            <span>{workSessionEvidenceReviewedItemsMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewQueueFilterMeta ? (
          <div
            className="work-summary-index"
            data-work-session-evidence-review-queue-filter-meta="true"
          >
            <Search size={15} />
            <span>{workSessionEvidenceReviewQueueFilterMeta}</span>
          </div>
        ) : null}
        {workManagementReviewDecisions ? (
          <div className="work-summary-index" data-work-management-review-decisions="true">
            <ShieldCheck size={15} />
            <span>{workManagementReviewDecisions}</span>
          </div>
        ) : null}
        {workManagementReviewBlockers ? (
          <div className="work-summary-index warning" data-work-management-review-blockers="true">
            <AlertTriangle size={15} />
            <span>{workManagementReviewBlockers}</span>
          </div>
        ) : null}
        {workManagementReviewResolution ? (
          <div className="work-summary-index" data-work-management-review-resolution="true">
            <Sparkles size={15} />
            <span>{workManagementReviewResolution}</span>
          </div>
        ) : null}
        {workManagementOverviewLoaded ? (
          <div className="work-summary-index" data-work-management-overview-meta="true">
            <ClipboardList size={15} />
            <span>{workManagementOverviewMetaText(workManagementOverview)}</span>
          </div>
        ) : null}
        {workManagementReadiness ? (
          <div className="work-summary-index" data-work-management-readiness="true">
            <ShieldCheck size={15} />
            <span>{workManagementReadiness}</span>
          </div>
        ) : null}
        {workManagementNextAction ? (
          <div className="work-summary-index" data-work-management-next-action="true">
            <ClipboardList size={15} />
            <span>{workManagementNextAction}</span>
          </div>
        ) : null}
        {workManagementOverviewLoaded ? (
          <div className="work-summary-index" data-work-management-filter-meta="true">
            <Search size={15} />
            <span>{workManagementOverviewFilterMeta}</span>
          </div>
        ) : null}
        {workManagementOverviewLoaded && workSessionIndexPartialBackfillWarning ? (
          <div className="work-summary-index warning" data-work-management-session-backfill-warning="true">
            <AlertTriangle size={15} />
            <span>{workSessionIndexPartialBackfillWarning}</span>
          </div>
        ) : null}
        {workManagementDurabilityWarning ? (
          <div className="work-summary-index warning" data-work-management-durability-warning="true">
            <AlertTriangle size={15} />
            <span>{workManagementDurabilityWarning}</span>
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
                    추출제안 {row.extraction_proposal_count.toLocaleString()}개 · 저장추출{" "}
                    {row.saved_extraction_count.toLocaleString()}개 · 정규화{" "}
                    {row.normalized_row_count.toLocaleString()}개 · {workManagementOverviewConfidenceText(row)}
                  </span>
                  <span data-work-management-row-session="true">
                    {workManagementOverviewSessionText(row)}
                  </span>
                  <span data-work-management-row-persistence="true">
                    {workManagementOverviewPersistenceText(row)}
                  </span>
                  <span data-work-management-row-action="true">
                    {workManagementOverviewNextActionText(row)}
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
              {workManagementOverviewFilterCount
                ? "필터에 맞는 프로젝트/일자 관리 row 없음"
                : "로드된 프로젝트/일자 관리 근거 없음"}
            </div>
          )
        ) : null}
        {workStatusExportResult ? (
          <div className="work-summary-content work-status-export-content" data-work-status-export="true">
            {visibleWorkStatusExportRows.length ? (
              <div className="work-summary-list compact">
                {visibleWorkStatusExportRows.map((row) => {
                  const rowKey = workStatusExportRowKey(row);
                  const detailsExpanded = expandedWorkStatusExportRowKeys.has(rowKey);
                  return (
                    <article
                      className={`work-summary-row work-status-export-row status-${row.operational_status}`}
                      data-work-status-export-row="true"
                      key={rowKey}
                    >
                      <div className="work-status-export-row-heading">
                        <strong>{row.project}</strong>
                        <span>{row.date}</span>
                        <button
                          aria-expanded={detailsExpanded}
                          aria-label={workStatusExportRowAuditToggleText(row, detailsExpanded)}
                          className="inline-action work-status-export-detail-toggle"
                          data-work-status-export-row-toggle="true"
                          onClick={() => toggleWorkStatusExportRowDetails(rowKey)}
                          type="button"
                        >
                          {detailsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      <p>{(row.top_titles[0] ?? row.sample_evidence) || "제목 없는 프로젝트/일별 상태"}</p>
                      <span>{workStatusExportRowStatusText(row)}</span>
                      <span>{pathDisplayText(row.latest_source_path)}</span>
                      {detailsExpanded ? (
                        <div className="work-status-export-row-detail" data-work-status-export-row-detail="true">
                          <span>{workStatusExportRowSourceFilesText(row)}</span>
                          <span>{workStatusExportRowSourceRolesText(row)}</span>
                          <span>{workStatusExportRowSourceStatusesText(row)}</span>
                          <span>{workStatusExportRowSessionSourcesText(row)}</span>
                          <span>최근 근거 파일 · {pathDisplayText(row.latest_source_path)}</span>
                          <p>{row.sample_evidence || "샘플 근거 없음"}</p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
                {hiddenWorkStatusExportRowCount ? (
                  <div className="work-summary-overflow" data-work-status-export-overflow="true">
                    그 외 상태 row {hiddenWorkStatusExportRowCount.toLocaleString()}개
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty compact" data-empty-work-status-export-filter="true">
                필터에 맞는 프로젝트/일별 상태 row 없음
              </div>
            )}
            <pre data-work-status-export-markdown="true">{workStatusExportResult.markdown}</pre>
          </div>
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
                        : file.status === "pointer"
                          ? "다른 작업 로그를 가리키는 포인터"
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
              {workLogCoverageFilterCount && workLogCoverageResult.files.length
                ? "필터에 맞는 프로젝트 작업 로그 없음"
                : "감지된 프로젝트 작업 로그 없음"}
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
                    queue · {candidate.risk_flags.length ? "로컬/수동 검토 전용" : "AI provider 전송 가능"}
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
        {workAiProviderStatusResult ? (
          <div className="work-summary-list" data-work-ai-provider-status="true">
            {visibleWorkAiProviderStatusProviders.map((provider) => (
              <article className="work-summary-row" key={provider.provider_runtime}>
                <div>
                  <strong>{provider.provider}</strong>
                  <span>{provider.provider_runtime}</span>
                </div>
                <p>{workAiProviderStatusProviderText(provider)}</p>
                {provider.notes.map((note, index) => (
                  <span key={textListItemKey(note, index)}>{note}</span>
                ))}
              </article>
            ))}
          </div>
        ) : null}
        {workAiProviderHealthResult ? (
          <div className="work-summary-list" data-work-ai-provider-health="true">
            {visibleWorkAiProviderHealthProviders.map((provider) => (
              <article className="work-summary-row" key={provider.provider_runtime}>
                <div>
                  <strong>{provider.provider}</strong>
                  <span>{provider.health_status}</span>
                </div>
                <p>{workAiProviderHealthProviderText(provider)}</p>
                {provider.notes.map((note, index) => (
                  <span key={textListItemKey(note, index)}>{note}</span>
                ))}
              </article>
            ))}
          </div>
        ) : null}
        {workLogReviewQueueResult ? (
          visibleWorkLogReviewQueueItems.length ? (
            <div className="work-summary-list" data-work-log-review-queue="true">
              {visibleWorkLogReviewQueueItems.map((item) => (
                <article className="work-summary-row work-log-candidate-row" key={item.candidate_id}>
                  <div>
                    <strong>{item.project}</strong>
                    <span>{item.source_file}</span>
                    {item.review_state === "approved" || item.review_state === "rejected" ? null : (
                      <>
                        <button
                          aria-label={`${item.project} 백필큐 후보 승인`}
                          className="inline-action compact-action"
                          data-approve-work-log-review-queue={item.candidate_id}
                          disabled={isTopLevelActionLocked}
                          onClick={() => void updateWorkLogReviewQueueItem(item.candidate_id, "approved")}
                          type="button"
                        >
                          <CheckCircle2 size={14} />
                          {workLogReviewQueueUpdatingCandidateId === item.candidate_id
                            ? "처리 중"
                            : "승인"}
                        </button>
                        <button
                          aria-label={`${item.project} 백필큐 후보 거절`}
                          className="inline-action compact-action"
                          data-reject-work-log-review-queue={item.candidate_id}
                          disabled={isTopLevelActionLocked}
                          onClick={() => void updateWorkLogReviewQueueItem(item.candidate_id, "rejected")}
                          type="button"
                        >
                          <XCircle size={14} />
                          거절
                        </button>
                      </>
                    )}
                  </div>
                  <p className="work-log-candidate-excerpt">{item.excerpt}</p>
                  <span data-work-log-review-queue-state={item.candidate_id}>
                    {workLogReviewQueueItemStateText(item)}
                  </span>
                  <span>
                    {item.provider_route} · {item.candidate_id} · seen {item.first_seen_at} / {item.last_seen_at}
                  </span>
                  <span>
                    risk{" "}
                    {item.risk_flags.length
                      ? item.risk_flags.map(riskFlagLabel).join(", ")
                      : "없음"}{" "}
                    · {item.source_path}
                  </span>
                </article>
              ))}
              {hiddenWorkLogReviewQueueItemCount ? (
                <div className="work-summary-overflow">
                  그 외 백필큐 row {hiddenWorkLogReviewQueueItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-review-queue="true">
              {workLogReviewQueueFilterCount && workLogReviewQueueResult.items.length
                ? "필터에 맞는 백필큐 후보 없음"
                : "저장된 백필큐 후보 없음"}
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
                        {" · "}
                        {item.provider_runtime}
                        {item.provider_model ? ` · model ${item.provider_model}` : ""}
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
        {workLogExtractionRunsResult ? (
          visibleWorkLogExtractionRuns.length ? (
            <div className="work-summary-list" data-work-log-runs="true">
              {visibleWorkLogExtractionRuns.map((run) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={run.id}
                >
                  <div>
                    <strong>{run.trigger}</strong>
                    <span>{run.finished_at}</span>
                  </div>
                  <p>
                    {run.status} · {run.provider}
                    {" · "}
                    {run.provider_runtime}
                    {run.provider_model ? ` · model ${run.provider_model}` : ""}
                    {run.used_ai ? " · AI" : " · local"}
                  </p>
                  <span>
                    후보 {run.candidate_count.toLocaleString()}개 · accepted{" "}
                    {run.accepted_count.toLocaleString()}개 · rejected{" "}
                    {run.rejected_count.toLocaleString()}개 · saved{" "}
                    {run.saved_item_count.toLocaleString()}개 / total{" "}
                    {run.total_saved_item_count.toLocaleString()}개
                  </span>
                  {run.candidate_ids.length ? (
                    <span>candidate IDs {run.candidate_ids.join(", ")}</span>
                  ) : null}
                  {run.warnings.length ? (
                    <span>warnings {run.warnings.map(redactSensitiveDisplayText).join("; ")}</span>
                  ) : null}
                  {run.error_message ? (
                    <span>error {redactSensitiveDisplayText(run.error_message)}</span>
                  ) : null}
                </article>
              ))}
              {hiddenWorkLogExtractionRunCount ? (
                <div className="work-summary-overflow">
                  그 외 실행 이력 {hiddenWorkLogExtractionRunCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-runs="true">
              저장된 작업 추출 실행 이력 없음
            </div>
          )
        ) : null}
        {workLogNormalizationCandidatesResult ? (
          visibleWorkLogNormalizationCandidates.length ? (
            <div className="work-summary-list" data-work-log-normalization-candidates="true">
              {visibleWorkLogNormalizationCandidates.map((candidate) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={candidate.candidate_id}
                >
                  <div>
                    <strong>{candidate.project}</strong>
                    <span>{candidate.date}</span>
                  </div>
                  <p>{candidate.title}</p>
                  <p className="work-log-proposal-evidence">{candidate.evidence}</p>
                  <span>
                    {candidate.reason} · 작업 {candidate.work_item_count.toLocaleString()}개 · 세션근거{" "}
                    {candidate.session_evidence_count.toLocaleString()}건
                  </span>
                  <span>
                    저장추출 {candidate.saved_extraction_count.toLocaleString()}개 · AI 저장{" "}
                    {candidate.ai_saved_extraction_count.toLocaleString()}개
                    {candidate.best_ai_confidence === null
                      ? " · AI confidence 없음"
                      : ` · best AI confidence ${candidate.best_ai_confidence.toFixed(2)}`}
                  </span>
                  {candidate.risk_flags.length ? (
                    <span>
                      위험표시 {candidate.risk_flags.map(riskFlagLabel).join(", ")}
                    </span>
                  ) : null}
                  <span>{candidate.source_file} · {candidate.source_path}</span>
                </article>
              ))}
              {hiddenWorkLogNormalizationCandidateCount ? (
                <div className="work-summary-overflow">
                  그 외 AI 정규화 후보 {hiddenWorkLogNormalizationCandidateCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-normalization-candidates="true">
              AI 정규화가 필요한 프로젝트/일자 후보 없음
            </div>
          )
        ) : null}
        {workLogNormalizationProposalsResult ? (
          visibleWorkLogNormalizationProposals.length ? (
            <div className="work-summary-list" data-work-log-normalization-proposals="true">
              {visibleWorkLogNormalizationProposals.map((proposal) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={proposal.candidate_id}
                >
                  <div>
                    <strong>{proposal.project}</strong>
                    <span>{proposal.date}</span>
                  </div>
                  <p>{proposal.normalized_title}</p>
                  <p className="work-log-proposal-evidence">{proposal.normalized_evidence}</p>
                  <span>
                    {workLogNormalizationProposalReviewLabel(proposal)} · confidence{" "}
                    {proposal.confidence.toFixed(2)}
                  </span>
                  <span>
                    provider {workLogNormalizationProposalsResult.provider_runtime} · 원본{" "}
                    {proposal.original_title} · status {proposal.original_status} →{" "}
                    {proposal.normalized_status}
                  </span>
                  <span>
                    작업 {proposal.work_item_count.toLocaleString()}개 · 세션근거{" "}
                    {proposal.session_evidence_count.toLocaleString()}건 · 저장추출{" "}
                    {proposal.saved_extraction_count.toLocaleString()}개 · AI 저장{" "}
                    {proposal.ai_saved_extraction_count.toLocaleString()}개
                  </span>
                  <span>{proposal.reason}</span>
                  {proposal.risk_flags.length ? (
                    <span>위험표시 {proposal.risk_flags.map(riskFlagLabel).join(", ")}</span>
                  ) : null}
                  <span>{proposal.source_file} · {proposal.source_path}</span>
                </article>
              ))}
              {hiddenWorkLogNormalizationProposalCount ? (
                <div className="work-summary-overflow">
                  그 외 AI 정규화 제안 {hiddenWorkLogNormalizationProposalCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-normalization-proposals="true">
              생성된 AI 정규화 제안 없음
            </div>
          )
        ) : null}
        {workLogNormalizationReviewQueueResult ? (
          visibleWorkLogNormalizationReviewQueueItems.length ? (
            <div className="work-summary-list" data-work-log-normalization-review-queue="true">
              {visibleWorkLogNormalizationReviewQueueItems.map((item) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={item.candidate_id}
                >
                  <div>
                    <strong>{item.project}</strong>
                    <span>{item.date}</span>
                    {canApproveWorkLogNormalizationReviewQueueItem(item) ? (
                      <button
                        aria-label={`${item.project} ${item.date} 정규화 제안 승인`}
                        className="inline-action compact-action"
                        data-approve-work-log-normalization-review-queue={item.candidate_id}
                        disabled={isTopLevelActionLocked}
                        onClick={() =>
                          void updateWorkLogNormalizationReviewQueueItem(
                            item.candidate_id,
                            "approved",
                          )}
                        type="button"
                      >
                        <CheckCircle2 size={14} />
                        {workLogNormalizationReviewQueueUpdatingCandidateId === item.candidate_id
                          ? "처리 중"
                          : "승인"}
                      </button>
                    ) : null}
                    {canRejectWorkLogNormalizationReviewQueueItem(item) ? (
                      <button
                        aria-label={`${item.project} ${item.date} 정규화 제안 거절`}
                        className="inline-action compact-action"
                        data-reject-work-log-normalization-review-queue={item.candidate_id}
                        disabled={isTopLevelActionLocked}
                        onClick={() =>
                          void updateWorkLogNormalizationReviewQueueItem(
                            item.candidate_id,
                            "rejected",
                          )}
                        type="button"
                      >
                        <XCircle size={14} />
                        거절
                      </button>
                    ) : null}
                  </div>
                  <p>{item.normalized_title}</p>
                  <p className="work-log-proposal-evidence">{item.normalized_evidence}</p>
                  <span data-work-log-normalization-review-queue-state={item.candidate_id}>
                    {workLogNormalizationReviewQueueItemStateText(item)}
                  </span>
                  <span>
                    provider {item.provider_runtime}
                    {item.provider_model ? ` · model ${item.provider_model}` : ""}
                    {item.used_ai ? " · AI" : " · local"} · 원본 {item.original_title} · status{" "}
                    {item.original_status} → {item.normalized_status}
                  </span>
                  <span>
                    작업 {item.work_item_count.toLocaleString()}개 · 세션근거{" "}
                    {item.session_evidence_count.toLocaleString()}건 · 저장추출{" "}
                    {item.saved_extraction_count.toLocaleString()}개 · AI 저장{" "}
                    {item.ai_saved_extraction_count.toLocaleString()}개
                  </span>
                  {item.risk_flags.length ? (
                    <span>위험표시 {item.risk_flags.map(riskFlagLabel).join(", ")}</span>
                  ) : null}
                  <span>{item.source_file} · seen {item.first_seen_at} / {item.last_seen_at}</span>
                  <span>{item.source_path}</span>
                </article>
              ))}
              {hiddenWorkLogNormalizationReviewQueueItemCount ? (
                <div className="work-summary-overflow">
                  그 외 정규화 큐 row {hiddenWorkLogNormalizationReviewQueueItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-normalization-review-queue="true">
              저장된 정규화 검토 큐 없음
            </div>
          )
        ) : null}
        {workSessionEvidenceProposalsResult ? (
          visibleWorkSessionEvidenceProposals.length ? (
            <div className="work-summary-list" data-work-session-evidence-proposals="true">
              {visibleWorkSessionEvidenceProposals.map((proposal) => {
                const diagnosticText = workSessionEvidenceCandidateReasonDiagnosticText(
                  proposal.candidate_reason,
                );
                return (
                  <article
                    className="work-summary-row work-log-proposal-row"
                    key={proposal.candidate_id}
                  >
                    <div>
                      <strong>{proposal.project}</strong>
                      <span>{proposal.date}</span>
                    </div>
                    <p>{proposal.proposed_action}</p>
                    <p className="work-log-proposal-evidence">{proposal.source_trace}</p>
                    <span data-work-session-evidence-proposal-state={proposal.candidate_id}>
                      {workSessionEvidenceProposalStateText(proposal)}
                    </span>
                    <span>
                      provider {workSessionEvidenceProposalsResult.provider_runtime}
                      {workSessionEvidenceProposalsResult.provider_model
                        ? ` · model ${workSessionEvidenceProposalsResult.provider_model}`
                        : ""}
                      {workSessionEvidenceProposalsResult.used_ai ? " · AI" : " · local"}
                    </span>
                    <span>
                      작업 {proposal.work_item_count.toLocaleString()}개 ·{" "}
                      {proposal.source_file} · {proposal.source_role} ·{" "}
                      {proposal.candidate_reason}
                    </span>
                    {diagnosticText ? (
                      <span data-work-session-evidence-proposal-diagnostic={proposal.candidate_id}>
                        {diagnosticText}
                      </span>
                    ) : null}
                    {proposal.risk_flags.length ? (
                      <span>위험표시 {proposal.risk_flags.map(riskFlagLabel).join(", ")}</span>
                    ) : null}
                    <span>{proposal.source_path}</span>
                  </article>
                );
              })}
              {hiddenWorkSessionEvidenceProposalCount ? (
                <div className="work-summary-overflow">
                  그 외 세션근거 제안 {hiddenWorkSessionEvidenceProposalCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-session-evidence-proposals="true">
              생성된 세션근거 제안 없음
            </div>
          )
        ) : null}
        {workSessionEvidenceReviewQueueResult ? (
          visibleWorkSessionEvidenceReviewQueueItems.length ? (
            <div className="work-summary-list" data-work-session-evidence-review-queue="true">
              {visibleWorkSessionEvidenceReviewQueueItems.map((item) => {
                const diagnosticText = workSessionEvidenceCandidateReasonDiagnosticText(
                  item.candidate_reason,
                );
                const nearbyActive = workSessionEvidenceNearbyCandidateId === item.candidate_id;
                const nearbyResult = nearbyActive ? workSessionEvidenceNearbyResult : null;
                return (
                  <article
                    className="work-summary-row work-log-proposal-row"
                    key={item.candidate_id}
                  >
                    <div>
                      <strong>{item.project}</strong>
                      <span>{item.date}</span>
                      {canApproveWorkSessionEvidenceReviewQueueItem(item) ? (
                        <button
                          aria-label={`${item.project} ${item.date} 세션 근거 미해결 후보 검토 완료`}
                          className="inline-action compact-action"
                          data-approve-work-session-evidence-review-queue={item.candidate_id}
                          disabled={isTopLevelActionLocked}
                          onClick={() =>
                            void updateWorkSessionEvidenceReviewQueueItem(
                              item.candidate_id,
                              "approved",
                            )}
                          type="button"
                        >
                          <CheckCircle2 size={14} />
                          {workSessionEvidenceReviewQueueUpdatingCandidateId === item.candidate_id
                            ? "처리 중"
                            : "검토 완료"}
                        </button>
                      ) : null}
                      {canRejectWorkSessionEvidenceReviewQueueItem(item) ? (
                        <button
                          aria-label={`${item.project} ${item.date} 세션 근거 후보 거절`}
                          className="inline-action compact-action"
                          data-reject-work-session-evidence-review-queue={item.candidate_id}
                          disabled={isTopLevelActionLocked}
                          onClick={() =>
                            void updateWorkSessionEvidenceReviewQueueItem(
                              item.candidate_id,
                              "rejected",
                            )}
                          type="button"
                        >
                          <XCircle size={14} />
                          거절
                        </button>
                      ) : null}
                      <button
                        aria-label={`${item.project} ${item.date} 근처 같은 프로젝트 세션 보기`}
                        className="inline-action compact-action"
                        data-work-session-evidence-nearby-action={item.candidate_id}
                        disabled={isTopLevelActionLocked}
                        onClick={() => void loadNearbyWorkSessionEvidence(item)}
                        type="button"
                      >
                        <Search size={14} />
                        {nearbyActive && workSessionEvidenceNearbyState === "loading"
                          ? "조회 중"
                          : "근처 세션"}
                      </button>
                    </div>
                    <p>{item.top_titles[0] ?? "제목 없는 세션 근거 후보"}</p>
                    <p className="work-log-proposal-evidence">{item.sample_evidence}</p>
                    <span data-work-session-evidence-review-queue-state={item.candidate_id}>
                      {workSessionEvidenceReviewQueueItemStateText(item)}
                    </span>
                    <span>
                      작업 {item.work_item_count.toLocaleString()}개 · source{" "}
                      {item.source_file_count.toLocaleString()}개 · {item.candidate_reason}
                    </span>
                    {diagnosticText ? (
                      <span data-work-session-evidence-review-queue-diagnostic={item.candidate_id}>
                        {diagnosticText}
                      </span>
                    ) : null}
                    <span>{workSessionEvidenceReviewQueueSourceRolesText(item)}</span>
                    {item.source_review ? (
                      <>
                        <span data-work-session-evidence-source-review={item.candidate_id}>
                          source trace line {item.source_review.source_line_number.toLocaleString()} ·{" "}
                          hit {item.source_review.source_search_hit_id}
                        </span>
                        <p className="work-log-proposal-evidence">
                          {item.source_review.source_trace}
                        </p>
                      </>
                    ) : null}
                    <span>
                      {item.latest_source_file} · seen {item.first_seen_at} / {item.last_seen_at}
                    </span>
                    <span>{item.latest_source_path}</span>
                    {nearbyActive ? (
                      <div
                        className="work-session-nearby-panel"
                        data-work-session-evidence-nearby={item.candidate_id}
                      >
                        {workSessionEvidenceNearbyState === "loading" ? (
                          <span>근처 같은 프로젝트 세션 조회 중</span>
                        ) : null}
                        {workSessionEvidenceNearbyState === "failed" ? (
                          <span>근처 세션 조회 실패</span>
                        ) : null}
                        {nearbyResult ? (
                          <>
                            <span>
                              근처 세션 {nearbyResult.returned_item_count.toLocaleString()} /{" "}
                              {nearbyResult.total_match_count.toLocaleString()} · 자동 proof 아님
                              {nearbyResult.query_term_count
                                ? ` · 검색어 ${nearbyResult.query_term_count.toLocaleString()}개`
                                : ""}
                            </span>
                            {nearbyResult.warnings.map((warning, index) => (
                              <span key={textListItemKey(warning, index)}>
                                {warning}
                              </span>
                            ))}
                            {nearbyResult.items.length ? (
                              nearbyResult.items.map((session) => (
                                <div
                                  className="work-session-nearby-item"
                                  key={session.id}
                                >
                                  <strong>
                                    {session.prompt_date} ·{" "}
                                    {session.date_distance_days === null
                                      ? "거리 미상"
                                      : `${session.date_distance_days.toLocaleString()}일 차이`}
                                  </strong>
                                  <span>
                                    {session.source} · {session.session_id}
                                  </span>
                                  <span>
                                    match score {session.match_score.toLocaleString()}
                                    {session.matched_terms.length
                                      ? ` · ${session.matched_terms.join(", ")}`
                                      : " · 일치어 없음"}
                                  </span>
                                  <p>{session.excerpt}</p>
                                  <span>{session.cwd ?? "cwd 없음"}</span>
                                  <span>{session.source_path}</span>
                                  <button
                                    aria-label={`${session.prompt_date} 원본 세션 파일에서 검색`}
                                    className="inline-action compact-action"
                                    data-work-session-evidence-source-search-action={session.id}
                                    disabled={isTopLevelActionLocked}
                                    onClick={() =>
                                      void loadWorkSessionEvidenceSourceSearch(session, nearbyResult)}
                                    type="button"
                                  >
                                    <Search size={14} />
                                    {workSessionEvidenceSourceSearchSessionId === session.id
                                      && workSessionEvidenceSourceSearchState === "loading"
                                      ? "검색 중"
                                      : "원본 검색"}
                                  </button>
                                  {workSessionEvidenceSourceSearchSessionId === session.id ? (
                                    <div
                                      className="work-session-nearby-panel"
                                      data-work-session-evidence-source-search={session.id}
                                    >
                                      {workSessionEvidenceSourceSearchState === "loading" ? (
                                        <span>원본 세션 파일 제한 검색 중</span>
                                      ) : null}
                                      {workSessionEvidenceSourceSearchState === "failed" ? (
                                        <span>원본 세션 검색 실패</span>
                                      ) : null}
                                      {workSessionEvidenceSourceSearchResult ? (
                                        <>
                                          <span>
                                            원본 검색{" "}
                                            {workSessionEvidenceSourceSearchResult.returned_item_count
                                              .toLocaleString()} /{" "}
                                            {workSessionEvidenceSourceSearchResult.matched_line_count
                                              .toLocaleString()} · 자동 proof 아님
                                          </span>
                                          <span>
                                            scan{" "}
                                            {workSessionEvidenceSourceSearchResult.scanned_line_count
                                              .toLocaleString()} lines · 검색어{" "}
                                            {workSessionEvidenceSourceSearchResult.query_term_count
                                              .toLocaleString()}개
                                          </span>
                                          {workSessionEvidenceSourceSearchResult.warnings.map(
                                            (warning, index) => (
                                              <span key={textListItemKey(warning, index)}>
                                                {warning}
                                              </span>
                                            ),
                                          )}
                                          <button
                                            aria-label={`${item.project} ${item.date} 원본 검색 결과를 검토 제안으로 변환`}
                                            className="inline-action compact-action"
                                            data-work-session-evidence-source-proposals-action={session.id}
                                            disabled={
                                              isTopLevelActionLocked
                                              || workSessionEvidenceSourceSearchResult.items.length === 0
                                            }
                                            onClick={() =>
                                              void loadWorkSessionEvidenceSourceProposals(
                                                item,
                                                session,
                                                workSessionEvidenceSourceSearchResult,
                                              )}
                                            type="button"
                                          >
                                            <ClipboardCheck size={14} />
                                            {workSessionEvidenceSourceProposalsSessionId === session.id
                                              && workSessionEvidenceSourceProposalsState === "loading"
                                              ? "제안 생성 중"
                                              : "검토 제안"}
                                          </button>
                                          {workSessionEvidenceSourceProposalsSessionId === session.id ? (
                                            <div
                                              className="work-session-nearby-panel"
                                              data-work-session-evidence-source-proposals={session.id}
                                            >
                                              {workSessionEvidenceSourceProposalsState === "loading" ? (
                                                <span>복사 trace 검증 중</span>
                                              ) : null}
                                              {workSessionEvidenceSourceProposalsState === "failed" ? (
                                                <span>검토 제안 생성 실패</span>
                                              ) : null}
                                              {workSessionEvidenceSourceProposalsResult ? (
                                                <>
                                                  <span>
                                                    검토 준비{" "}
                                                    {workSessionEvidenceSourceProposalsResult.review_ready_count
                                                      .toLocaleString()} /{" "}
                                                    {workSessionEvidenceSourceProposalsResult.returned_proposal_count
                                                      .toLocaleString()} · durable 승인 아님
                                                  </span>
                                                  <span>
                                                    blocked{" "}
                                                    {workSessionEvidenceSourceProposalsResult.blocked_count
                                                      .toLocaleString()} · matched lines{" "}
                                                    {workSessionEvidenceSourceProposalsResult.matched_line_count
                                                      .toLocaleString()}
                                                  </span>
                                                  {workSessionEvidenceSourceProposalsResult.warnings.map(
                                                    (warning, index) => (
                                                      <span key={textListItemKey(warning, index)}>
                                                        {warning}
                                                      </span>
                                                    ),
                                                  )}
                                                  {workSessionEvidenceSourceProposalsResult.proposals.length ? (
                                                    workSessionEvidenceSourceProposalsResult.proposals.map(
                                                      (proposal) => (
                                                        <div
                                                          className="work-session-nearby-item"
                                                          key={proposal.source_search_hit_id}
                                                        >
                                                          <strong>
                                                            line{" "}
                                                            {proposal.source_line_number
                                                              .toLocaleString()} ·{" "}
                                                            {proposal.review_ready
                                                              ? "review-ready"
                                                              : "blocked"}
                                                          </strong>
                                                          <span>
                                                            {proposal.proposal_kind} · confidence{" "}
                                                            {proposal.confidence.toFixed(2)}
                                                          </span>
                                                          <p>{proposal.source_trace}</p>
                                                          {proposal.blocker_reason ? (
                                                            <span>{proposal.blocker_reason}</span>
                                                          ) : null}
                                                          {proposal.review_ready
                                                            && canApproveWorkSessionEvidenceReviewQueueItem(item)
                                                            ? (
                                                              <button
                                                                aria-label={`${proposal.project} ${proposal.date} source proposal line ${proposal.source_line_number} 검토 완료 반영`}
                                                                className="inline-action compact-action"
                                                                data-approve-work-session-evidence-source-proposal={proposal.source_search_hit_id}
                                                                disabled={isTopLevelActionLocked}
                                                                onClick={() =>
                                                                  void updateWorkSessionEvidenceReviewQueueItem(
                                                                    proposal.candidate_id,
                                                                    "approved",
                                                                    `source_proposal_review_ready:${proposal.source_search_hit_id}`,
                                                                    proposal,
                                                                  )}
                                                                type="button"
                                                              >
                                                                <CheckCircle2 size={14} />
                                                                {workSessionEvidenceReviewQueueUpdatingCandidateId
                                                                  === proposal.candidate_id
                                                                  ? "처리 중"
                                                                  : "검토 완료 반영"}
                                                              </button>
                                                            ) : null}
                                                        </div>
                                                      ),
                                                    )
                                                  ) : (
                                                    <span>검토 제안으로 변환할 source hit 없음</span>
                                                  )}
                                                </>
                                              ) : null}
                                            </div>
                                          ) : null}
                                          {workSessionEvidenceSourceSearchResult.items.length ? (
                                            workSessionEvidenceSourceSearchResult.items.map((hit) => (
                                              <div
                                                className="work-session-nearby-item"
                                                key={hit.id}
                                              >
                                                <strong>
                                                  line {hit.line_number.toLocaleString()} · score{" "}
                                                  {hit.match_score.toLocaleString()}
                                                </strong>
                                                <span>
                                                  {hit.matched_terms.length
                                                    ? hit.matched_terms.join(", ")
                                                    : "일치어 없음"}
                                                </span>
                                                <p>{hit.excerpt}</p>
                                                <span>{hit.cwd ?? "cwd 없음"}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <span>제한 범위 안에서 일치하는 user prompt 없음</span>
                                          )}
                                        </>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              ))
                            ) : (
                              <span>현재 세션 인덱스에서 같은 프로젝트 세션이 없습니다.</span>
                            )}
                          </>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {hiddenWorkSessionEvidenceReviewQueueItemCount ? (
                <div className="work-summary-overflow">
                  그 외 세션근거 큐 row {hiddenWorkSessionEvidenceReviewQueueItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-session-evidence-review-queue="true">
              저장된 세션 근거 검토 큐 없음
            </div>
          )
        ) : null}
        {workLogNormalizationApplyResult || workLogNormalizationApplyState !== "idle" ? (
          <div className="work-summary-index" data-work-log-normalization-apply-meta="true">
            <span>{workLogNormalizationApplyMeta}</span>
          </div>
        ) : null}
        {workLogNormalizedItemsResult || workLogNormalizedItemsState !== "idle" ? (
          <div className="work-summary-index" data-work-log-normalized-items-meta="true">
            <span>{workLogNormalizedItemsMeta}</span>
          </div>
        ) : null}
        {workSessionEvidenceReviewApplyResult || workSessionEvidenceReviewedItemsResult ? (
          visibleWorkSessionEvidenceReviewedItems.length ? (
            <div className="work-summary-list" data-work-session-evidence-reviewed-items="true">
              {visibleWorkSessionEvidenceReviewedItems.map((item) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={item.candidate_id}
                >
                  <div>
                    <strong>{item.project}</strong>
                    <span>{item.date}</span>
                    <span>stored {item.applied_at}</span>
                  </div>
                  <p>{item.top_titles.join(" · ")}</p>
                  <p className="work-log-proposal-evidence">{item.sample_evidence}</p>
                  <span>
                    {item.review_reason} · {item.operational_status} · {item.candidate_id}
                  </span>
                  {item.source_review ? (
                    <>
                      <span data-work-session-evidence-reviewed-source-review={item.candidate_id}>
                        source trace line {item.source_review.source_line_number.toLocaleString()} ·{" "}
                        hit {item.source_review.source_search_hit_id}
                      </span>
                      <p className="work-log-proposal-evidence">
                        {item.source_review.source_trace}
                      </p>
                    </>
                  ) : null}
                  <span>
                    작업 {item.work_item_count.toLocaleString()}개 · 파일{" "}
                    {item.source_file_count.toLocaleString()}개 · {item.session_evidence_audit}
                  </span>
                  <span>{workSessionEvidenceReviewQueueSourceRolesText(item)}</span>
                  <span>
                    {item.latest_source_file} · {item.latest_source_path}
                  </span>
                </article>
              ))}
              {hiddenWorkSessionEvidenceReviewedItemCount ? (
                <div className="work-summary-overflow">
                  그 외 저장된 세션근거 검토결과{" "}
                  {hiddenWorkSessionEvidenceReviewedItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-session-evidence-reviewed-items="true">
              저장된 세션근거 검토결과 없음
            </div>
          )
        ) : null}
        {workLogNormalizationApplyResult || workLogNormalizedItemsResult ? (
          visibleWorkLogNormalizedItems.length ? (
            <div className="work-summary-list" data-work-log-normalized-items="true">
              {visibleWorkLogNormalizedItems.map((item) => (
                <article
                  className="work-summary-row work-log-proposal-row"
                  key={item.candidate_id}
                >
                  <div>
                    <strong>{item.project}</strong>
                    <span>{item.date}</span>
                    <span>applied {item.applied_at}</span>
                  </div>
                  <p>{item.normalized_title}</p>
                  <p className="work-log-proposal-evidence">{item.normalized_evidence}</p>
                  <span>
                    {item.review_reason} · {item.normalized_status} · confidence{" "}
                    {item.confidence.toFixed(2)} · {item.candidate_id}
                  </span>
                  <span>
                    provider {item.provider_runtime}
                    {item.provider_model ? ` · model ${item.provider_model}` : ""}
                    {item.used_ai ? " · AI" : " · local"} · 원본 {item.original_title}
                  </span>
                  <span>
                    작업 {item.work_item_count.toLocaleString()}개 · 세션근거{" "}
                    {item.session_evidence_count.toLocaleString()}건 · 저장추출{" "}
                    {item.saved_extraction_count.toLocaleString()}개 · AI 저장{" "}
                    {item.ai_saved_extraction_count.toLocaleString()}개
                  </span>
                  {item.risk_flags.length ? (
                    <span>위험표시 {item.risk_flags.map(riskFlagLabel).join(", ")}</span>
                  ) : null}
                  <span>{item.source_file} · {item.source_path}</span>
                </article>
              ))}
              {hiddenWorkLogNormalizedItemCount ? (
                <div className="work-summary-overflow">
                  그 외 적용된 정규화 row {hiddenWorkLogNormalizedItemCount.toLocaleString()}개
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty compact" data-empty-work-log-normalized-items="true">
              적용된 정규화 row 없음
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
                    {pathDisplayText(activeImprovement.persistence.database_path)} · 추천 이력 #
                    {activeImprovement.persistence.improvement_event_id.toLocaleString()} 저장됨 ·
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
