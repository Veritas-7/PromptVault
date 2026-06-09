import { invoke } from "@tauri-apps/api/core";
import {
  bridgeEndpoint,
  browserBridgeHttpErrorMessage,
  browserBridgeUnavailableMessage,
  hasTauriInvoke,
} from "./browserBridge.ts";
import type {
  CancelScanResult,
  ImportBatchResult,
  ImportEventsResult,
  ImportStatesResult,
  ImproveResult,
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionCandidatesResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkReport,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshotsResult,
  PromptQuality,
  ScanPlan,
  ScanProgress,
  ScanResult,
  StoredPromptFacetsResult,
} from "./types";

export interface ScanPromptOptions {
  limit?: number;
  preview_limit?: number;
  preview_sort?: string;
  include_markdown?: boolean;
  write_markdown?: boolean;
  source_ids?: string[];
  source_limit?: number;
  persist?: boolean;
  persist_on_cancel?: boolean;
  run_id?: string;
}

export interface CancelScanOptions {
  run_id: string;
}

export interface ScanProgressOptions {
  run_id: string;
}

export interface ScanPlanOptions {
  source_ids?: string[];
}

export interface ImportBatchOptions {
  source_id: string;
  file_batch_size?: number;
  reset?: boolean;
  preview_limit?: number;
}

export interface ImportStatesOptions {
  database_path?: string;
}

export interface ImportEventsOptions {
  database_path?: string;
  limit?: number;
}

export interface StoredPromptsOptions {
  database_path?: string;
  limit?: number;
  query?: string;
  source?: string;
  date?: string;
  workspace?: string;
  preview_sort?: string;
}

export interface StoredPromptFacetsOptions {
  database_path?: string;
  limit?: number;
}

export interface ProjectWorkSummaryOptions {
  database_path?: string;
  limit?: number;
  session_limit?: number;
  summary_limit?: number;
  refresh_session_index?: boolean;
  save_snapshot?: boolean;
  include_extractions?: boolean;
  include_saved_extractions?: boolean;
  extraction_limit?: number;
  extraction_ai?: boolean;
  ai?: boolean;
}

export interface ProjectWorkSummarySnapshotsOptions {
  database_path?: string;
  limit?: number;
  date?: string;
  project?: string;
}

export interface ProjectWorkLogCandidatesOptions {
  limit?: number;
}

export interface ProjectWorkLogExtractionOptions {
  limit?: number;
  ai?: boolean;
  database_path?: string;
  save?: boolean;
  approved_candidate_ids?: string[];
}

export interface ProjectWorkLogFreezeOptions {
  limit?: number;
  database_path?: string;
}

export interface ProjectWorkLogExtractionItemsOptions {
  database_path?: string;
  limit?: number;
  date?: string;
  project?: string;
}

export interface ImprovePromptRequest {
  prompt: string;
  context?: string | null;
  prompt_id?: string;
  source?: string;
  database_path?: string;
  persist?: boolean;
  force_local?: boolean;
}

export async function planScan(options: ScanPlanOptions = {}): Promise<ScanPlan> {
  if (hasTauriInvoke()) {
    return invoke<ScanPlan>("plan_scan", { options });
  }
  return postBridge<ScanPlan>("/api/plan", { options }, parseScanPlan);
}

export async function importBatch(options: ImportBatchOptions): Promise<ImportBatchResult> {
  if (hasTauriInvoke()) {
    return invoke<ImportBatchResult>("import_batch", { options });
  }
  return postBridge<ImportBatchResult>("/api/import-batch", { options }, parseImportBatchResult);
}

export async function listImportStates(options: ImportStatesOptions = {}): Promise<ImportStatesResult> {
  if (hasTauriInvoke()) {
    return invoke<ImportStatesResult>("list_import_states", { options });
  }
  return postBridge<ImportStatesResult>("/api/import-states", { options }, parseImportStatesResult);
}

export async function listImportEvents(options: ImportEventsOptions = {}): Promise<ImportEventsResult> {
  if (hasTauriInvoke()) {
    return invoke<ImportEventsResult>("list_import_events", { options });
  }
  return postBridge<ImportEventsResult>("/api/import-events", { options }, parseImportEventsResult);
}

export async function listStoredPromptFacets(
  options: StoredPromptFacetsOptions = {},
): Promise<StoredPromptFacetsResult> {
  if (hasTauriInvoke()) {
    return invoke<StoredPromptFacetsResult>("list_stored_prompt_facets", { options });
  }
  return postBridge<StoredPromptFacetsResult>("/api/prompt-facets", { options }, parseStoredPromptFacetsResult);
}

export async function loadStoredPrompts(options: StoredPromptsOptions = {}): Promise<ScanResult> {
  if (hasTauriInvoke()) {
    return invoke<ScanResult>("load_stored_prompts", { options });
  }
  return postBridge<ScanResult>("/api/prompts", { options }, parseStoredPromptsResult);
}

export async function scanPrompts(options: ScanPromptOptions): Promise<ScanResult> {
  if (hasTauriInvoke()) {
    return invoke<ScanResult>("scan_prompts", { options });
  }
  return postBridge<ScanResult>("/api/scan", { options }, parseScanResult);
}

export async function cancelScan(run_id: string): Promise<CancelScanResult> {
  const options: CancelScanOptions = { run_id };
  if (hasTauriInvoke()) {
    return invoke<CancelScanResult>("cancel_scan", { options });
  }
  return postBridge<CancelScanResult>("/api/scan/cancel", { options }, (value) => {
    const result = parseCancelScanResult(value);
    if (!matchesRequestedRunId(result, run_id)) {
      throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
    }
    return result;
  });
}

export async function scanProgress(run_id: string): Promise<ScanProgress> {
  const options: ScanProgressOptions = { run_id };
  if (hasTauriInvoke()) {
    return invoke<ScanProgress>("scan_progress", { options });
  }
  return postBridge<ScanProgress>("/api/scan/progress", { options }, (value) => {
    const result = parseScanProgressResult(value);
    if (!matchesRequestedRunId(result, run_id)) {
      throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
    }
    return result;
  });
}

export async function improvePrompt(request: ImprovePromptRequest): Promise<ImproveResult> {
  if (hasTauriInvoke()) {
    return invoke<ImproveResult>("improve_prompt", { request });
  }
  return postBridge<ImproveResult>("/api/improve", { request }, parseImproveResult);
}

export async function loadProjectWorkSummary(
  options: ProjectWorkSummaryOptions = {},
): Promise<ProjectWorkSummaryResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkSummaryResult>("project_work_summary", {
      options: nativeProjectWorkSummaryOptions(options),
    });
  }
  return postBridge<ProjectWorkSummaryResult>("/api/work-summary", { options }, parseProjectWorkSummaryResult);
}

export async function loadProjectWorkLogCoverage(): Promise<ProjectWorkLogCoverageResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkLogCoverageResult>("project_work_log_coverage");
  }
  return postBridge<ProjectWorkLogCoverageResult>("/api/work-log-coverage", {}, parseProjectWorkLogCoverageResult);
}

export async function loadProjectWorkLogCandidates(
  options: ProjectWorkLogCandidatesOptions = {},
): Promise<ProjectWorkLogExtractionCandidatesResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkLogExtractionCandidatesResult>("project_work_log_candidates", { options });
  }
  return postBridge<ProjectWorkLogExtractionCandidatesResult>(
    "/api/work-log-candidates",
    { options },
    parseProjectWorkLogExtractionCandidatesResult,
  );
}

export async function loadProjectWorkLogExtractionProposals(
  options: ProjectWorkLogExtractionOptions = {},
): Promise<ProjectWorkLogExtractionProposalsResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkLogExtractionProposalsResult>("project_work_log_extract", { options });
  }
  return postBridge<ProjectWorkLogExtractionProposalsResult>(
    "/api/work-log-extract",
    { options },
    parseProjectWorkLogExtractionProposalsResult,
  );
}

export async function freezeProjectWorkLogManagementRows(
  options: ProjectWorkLogFreezeOptions = {},
): Promise<ProjectWorkLogExtractionProposalsResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkLogExtractionProposalsResult>("project_work_log_freeze", { options });
  }
  return postBridge<ProjectWorkLogExtractionProposalsResult>(
    "/api/work-log-freeze",
    { options },
    parseProjectWorkLogExtractionProposalsResult,
  );
}

export async function listProjectWorkLogExtractionItems(
  options: ProjectWorkLogExtractionItemsOptions = {},
): Promise<ProjectWorkLogExtractionItemsResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkLogExtractionItemsResult>("project_work_log_items", { options });
  }
  return postBridge<ProjectWorkLogExtractionItemsResult>(
    "/api/work-log-items",
    { options },
    parseProjectWorkLogExtractionItemsResult,
  );
}

export async function listProjectWorkSummarySnapshots(
  options: ProjectWorkSummarySnapshotsOptions = {},
): Promise<ProjectWorkSummarySnapshotsResult> {
  if (hasTauriInvoke()) {
    return invoke<ProjectWorkSummarySnapshotsResult>("project_work_summary_snapshots", { options });
  }
  return postBridge<ProjectWorkSummarySnapshotsResult>(
    "/api/work-summary-snapshots",
    { options },
    parseProjectWorkSummarySnapshotsResult,
  );
}

export function isBrowserQaMode(): boolean {
  return !hasTauriInvoke();
}

const MALFORMED_BRIDGE_RESPONSE_MESSAGE = "PromptVault 브라우저 브리지 응답 형식이 올바르지 않습니다.";
const MAX_QUALITY_SCORE = 100;
const PROMPT_WORD_REGEX = /[A-Za-z가-힣0-9][A-Za-z가-힣0-9_\-']*/g;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFrequencyItem(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.text)
    && isNonNegativeSafeInteger(value.count);
}

function isFrequencyItemsWithinTotal(value: unknown, total: unknown): boolean {
  if (!Array.isArray(value) || !isNonNegativeSafeInteger(total)) return false;
  let countSum = 0;
  for (const item of value) {
    if (!isFrequencyItem(item)) return false;
    if (item.count > total) return false;
    countSum += item.count;
    if (!Number.isSafeInteger(countSum) || countSum > total) return false;
  }
  return true;
}

function isFrequencyItemsEachWithinTotal(value: unknown, total: unknown): boolean {
  return Array.isArray(value)
    && isNonNegativeSafeInteger(total)
    && value.every((item) => isFrequencyItem(item) && item.count <= total);
}

function frequencyItemCountsSumTo(value: unknown, total: unknown): boolean {
  if (!Array.isArray(value) || !isNonNegativeSafeInteger(total)) return false;
  let countSum = 0;
  for (const item of value) {
    if (!isFrequencyItem(item)) return false;
    countSum += item.count;
    if (!Number.isSafeInteger(countSum) || countSum > total) return false;
  }
  return countSum === total;
}

function isNonBlankStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonBlankString);
}

function isUniqueNonBlankStringArray(value: unknown): boolean {
  return isNonBlankStringArray(value)
    && new Set(value).size === value.length;
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableNonBlankString(value: unknown): boolean {
  return value === null || isNonBlankString(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return isSafeInteger(value) && value >= 0;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeIntegerAtMost(value: unknown, max: unknown): boolean {
  return isNonNegativeSafeInteger(value) && isNonNegativeSafeInteger(max) && value <= max;
}

function isQualityScore(value: unknown): boolean {
  return isNonNegativeSafeInteger(value) && value <= MAX_QUALITY_SCORE;
}

function isQualityAverage(value: unknown): value is number {
  return isNonNegativeFiniteNumber(value) && value <= MAX_QUALITY_SCORE;
}

function isNonNegativeSafeIntegerRangeAtMost(start: unknown, count: unknown, max: unknown): boolean {
  return isNonNegativeSafeInteger(start)
    && isNonNegativeSafeInteger(count)
    && isNonNegativeSafeInteger(max)
    && start <= max
    && count <= max - start;
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function isNullableNonNegativeSafeInteger(value: unknown): boolean {
  return value === null || isNonNegativeSafeInteger(value);
}

function isTimestampString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Date.parse(value));
}

function isNullableTimestampString(value: unknown): boolean {
  return value === null || isTimestampString(value);
}

function isPreviewSortString(value: unknown): value is string {
  return value === "latest" || value === "quality_asc";
}

function isPromptQuality(value: unknown): value is PromptQuality {
  return isRecord(value)
    && isQualityScore(value.score)
    && isNonBlankString(value.band)
    && isUniqueNonBlankStringArray(value.missing)
    && isUniqueNonBlankStringArray(value.suggestions);
}

function isPromptCharCount(text: unknown, charCount: unknown): boolean {
  return typeof text === "string"
    && isNonNegativeSafeInteger(charCount)
    && Array.from(text).length === charCount;
}

function isPromptWordCount(text: unknown, wordCount: unknown): boolean {
  return typeof text === "string"
    && isNonNegativeSafeInteger(wordCount)
    && (text.match(PROMPT_WORD_REGEX)?.length ?? 0) === wordCount;
}

function isPromptRecord(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.id)
    && isNonBlankString(value.source)
    && isNonBlankString(value.session_id)
    && isNonBlankString(value.path)
    && isNullableTimestampString(value.timestamp)
    && isNullableNonBlankString(value.cwd)
    && isNonBlankString(value.text)
    && isPromptWordCount(value.text, value.word_count)
    && isPromptCharCount(value.text, value.char_count)
    && isNonBlankString(value.hash)
    && isUniqueNonBlankStringArray(value.risk_flags)
    && isPromptQuality(value.quality);
}

function isSourceSummary(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.id)
    && isNonBlankString(value.label)
    && isNonBlankString(value.root_path)
    && isNonNegativeSafeInteger(value.files_seen)
    && isNonNegativeSafeInteger(value.prompts_found)
    && isQualityAverage(value.average_quality)
    && isNonNegativeSafeIntegerAtMost(value.weak_prompt_count, value.prompts_found)
    && isNonBlankString(value.status)
    && isNonBlankStringArray(value.notes)
    && isMissingSourceSummaryMetadataConsistent(value);
}

function isMissingSourceSummaryMetadataConsistent(value: Record<string, unknown>): boolean {
  return value.status !== "missing"
    || (
      value.files_seen === 0
      && value.prompts_found === 0
      && value.average_quality === 0
      && value.weak_prompt_count === 0
    );
}

function recordStringFieldValuesAreUnique(values: unknown, fieldName: string): boolean {
  if (!Array.isArray(values)) return false;
  const seenValues = new Set<string>();
  for (const value of values) {
    if (!isRecord(value) || !isNonBlankString(value[fieldName])) return false;
    if (seenValues.has(value[fieldName])) return false;
    seenValues.add(value[fieldName]);
  }
  return true;
}

function recordNumberFieldValuesAreUnique(values: unknown, fieldName: string): boolean {
  if (!Array.isArray(values)) return false;
  const seenValues = new Set<number>();
  for (const value of values) {
    if (!isRecord(value)) return false;
    const fieldValue = value[fieldName];
    if (!isNonNegativeSafeInteger(fieldValue)) return false;
    if (seenValues.has(fieldValue)) return false;
    seenValues.add(fieldValue);
  }
  return true;
}

function sourceSummaryIdsAreUnique(sourceSummaries: unknown): boolean {
  return recordStringFieldValuesAreUnique(sourceSummaries, "id");
}

function sourcePlanIdsAreUnique(sources: unknown): boolean {
  return recordStringFieldValuesAreUnique(sources, "id");
}

function promptRecordIdsAreUnique(prompts: unknown): boolean {
  return recordStringFieldValuesAreUnique(prompts, "id");
}

function importStateSourceIdsAreUnique(states: unknown): boolean {
  return recordStringFieldValuesAreUnique(states, "source_id");
}

function importEventIdsAreUnique(events: unknown): boolean {
  return recordNumberFieldValuesAreUnique(events, "id");
}

function importEventIdsAreDescending(events: unknown): boolean {
  if (!Array.isArray(events)) return false;
  let previousId: number | null = null;
  for (const event of events) {
    if (!isRecord(event) || !isNonNegativeSafeInteger(event.id)) return false;
    if (previousId !== null && event.id >= previousId) return false;
    previousId = event.id;
  }
  return true;
}

function frequencyTextsAreUnique(items: unknown): boolean {
  return recordStringFieldValuesAreUnique(items, "text");
}

function sourceFilesSeenTotalMatches(sourceSummaries: unknown, totalFiles: unknown): boolean {
  if (!Array.isArray(sourceSummaries) || !isNonNegativeSafeInteger(totalFiles)) return false;
  let filesSeenTotal = 0;
  for (const source of sourceSummaries) {
    if (!isRecord(source) || !isNonNegativeSafeInteger(source.files_seen)) return false;
    filesSeenTotal += source.files_seen;
    if (!Number.isSafeInteger(filesSeenTotal)) return false;
  }
  return filesSeenTotal === totalFiles;
}

function sourcePromptTotalsMatch(
  sourceSummaries: unknown,
  totalPrompts: unknown,
  weakPromptCount: unknown,
): boolean {
  if (!Array.isArray(sourceSummaries)
    || !isNonNegativeSafeInteger(totalPrompts)
    || !isNonNegativeSafeInteger(weakPromptCount)) {
    return false;
  }
  let promptsFoundTotal = 0;
  let weakPromptTotal = 0;
  for (const source of sourceSummaries) {
    if (!isRecord(source)
      || !isNonNegativeSafeInteger(source.prompts_found)
      || !isNonNegativeSafeInteger(source.weak_prompt_count)) {
      return false;
    }
    promptsFoundTotal += source.prompts_found;
    weakPromptTotal += source.weak_prompt_count;
    if (!Number.isSafeInteger(promptsFoundTotal) || !Number.isSafeInteger(weakPromptTotal)) {
      return false;
    }
  }
  return promptsFoundTotal === totalPrompts && weakPromptTotal === weakPromptCount;
}

function isSourcePlan(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonBlankString(value.id)
    || !isNonBlankString(value.label)
    || !isNonBlankString(value.root_path)
    || !isNonBlankString(value.status)
    || !isNonNegativeSafeInteger(value.file_count)
    || !isNonNegativeSafeInteger(value.byte_count)
    || !isNonNegativeSafeInteger(value.large_file_count)
    || !isNonNegativeSafeInteger(value.largest_file_bytes)
    || !isNullableTimestampString(value.newest_modified_at)
    || !isNonBlankStringArray(value.notes)) {
    return false;
  }
  return value.large_file_count <= value.file_count
    && value.largest_file_bytes <= value.byte_count
    && (value.file_count > 0 || value.byte_count === 0)
    && isMissingSourcePlanMetadataConsistent(value);
}

function isMissingSourcePlanMetadataConsistent(value: Record<string, unknown>): boolean {
  return value.status !== "missing"
    || (
      value.file_count === 0
      && value.byte_count === 0
      && value.large_file_count === 0
      && value.largest_file_bytes === 0
      && value.newest_modified_at === null
    );
}

function isImportState(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonBlankString(value.source_id)
    || !isNonBlankString(value.source_label)
    || !isNonBlankString(value.root_path)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.total_bytes)
    || !isNonNegativeSafeInteger(value.next_file_index)
    || !isNonNegativeSafeInteger(value.processed_files)
    || value.next_file_index > value.total_files
    || value.processed_files > value.total_files
    || !isNonNegativeSafeInteger(value.imported_prompt_count)
    || typeof value.completed !== "boolean"
    || !isTimestampString(value.updated_at)) {
    return false;
  }
  return value.next_file_index === value.processed_files
    && value.completed === (value.processed_files >= value.total_files);
}

function isImportEvent(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonNegativeSafeInteger(value.id)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.source_id)
    || !isNonBlankString(value.source_label)
    || !isNonBlankString(value.root_path)
    || !isNonNegativeSafeInteger(value.batch_start_index)
    || !isNonNegativeSafeInteger(value.batch_file_count)
    || !isNonNegativeSafeInteger(value.batch_prompt_count)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeIntegerAtMost(value.processed_files, value.total_files)
    || !isNonNegativeSafeIntegerRangeAtMost(value.batch_start_index, value.batch_file_count, value.total_files)
    || typeof value.completed !== "boolean"
    || !isNonBlankStringArray(value.warnings)) {
    return false;
  }
  const batchEndIndex = value.batch_start_index + value.batch_file_count;
  return value.processed_files === batchEndIndex
    && value.completed === (batchEndIndex >= value.total_files);
}

function isImportStatesAggregate(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.states)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeInteger(value.completed_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.processed_files)
    || !isNonNegativeSafeInteger(value.imported_prompt_count)) {
    return false;
  }
  let completedSources = 0;
  let totalFiles = 0;
  let processedFiles = 0;
  let importedPromptCount = 0;
  for (const state of value.states) {
    if (!isImportState(state)) return false;
    if (state.completed) completedSources += 1;
    totalFiles += state.total_files;
    processedFiles += state.processed_files;
    importedPromptCount += state.imported_prompt_count;
    if (!Number.isSafeInteger(totalFiles)
      || !Number.isSafeInteger(processedFiles)
      || !Number.isSafeInteger(importedPromptCount)) {
      return false;
    }
  }
  return value.total_sources === value.states.length
    && value.completed_sources === completedSources
    && value.total_files === totalFiles
    && value.processed_files === processedFiles
    && value.imported_prompt_count === importedPromptCount;
}

function isScanPlanAggregate(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.sources)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeInteger(value.available_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.total_bytes)
    || !isNonNegativeSafeInteger(value.large_file_count)
    || !isNonNegativeSafeInteger(value.largest_file_bytes)) {
    return false;
  }
  let availableSources = 0;
  let totalFiles = 0;
  let totalBytes = 0;
  let largeFileCount = 0;
  let largestFileBytes = 0;
  for (const source of value.sources) {
    if (!isSourcePlan(source)) return false;
    if (source.status !== "missing") availableSources += 1;
    totalFiles += source.file_count;
    totalBytes += source.byte_count;
    largeFileCount += source.large_file_count;
    largestFileBytes = Math.max(largestFileBytes, source.largest_file_bytes);
    if (!Number.isSafeInteger(totalFiles)
      || !Number.isSafeInteger(totalBytes)
      || !Number.isSafeInteger(largeFileCount)) {
      return false;
    }
  }
  return value.total_sources === value.sources.length
    && value.available_sources === availableSources
    && value.total_files === totalFiles
    && value.total_bytes === totalBytes
    && value.large_file_count === largeFileCount
    && value.largest_file_bytes === largestFileBytes;
}

function isPersistStats(value: unknown): boolean {
  if (!isRecord(value) || !isNonBlankString(value.database_path)) return false;
  const storedPromptCount = value.stored_prompt_count;
  const insertedPromptCount = value.inserted_prompt_count;
  const updatedPromptCount = value.updated_prompt_count;
  const dateCount = value.date_count;
  if (!isNonNegativeSafeInteger(storedPromptCount)
    || !isNonNegativeSafeInteger(insertedPromptCount)
    || !isNonNegativeSafeInteger(updatedPromptCount)
    || !isNonNegativeSafeInteger(dateCount)) {
    return false;
  }
  const changedPromptCount = insertedPromptCount + updatedPromptCount;
  return Number.isSafeInteger(changedPromptCount)
    && changedPromptCount <= storedPromptCount
    && dateCount <= storedPromptCount;
}

function isEmptyScanAggregateConsistent(value: Record<string, unknown>): boolean {
  return value.total_prompts !== 0
    || (
      value.total_words === 0
      && value.average_words === 0
      && value.average_quality === 0
      && value.weak_prompt_count === 0
    );
}

function isAverageWordsConsistent(value: Record<string, unknown>): boolean {
  if (!isNonNegativeSafeInteger(value.total_prompts)
    || !isNonNegativeSafeInteger(value.total_words)
    || !isNonNegativeFiniteNumber(value.average_words)) {
    return false;
  }
  if (value.total_prompts === 0) return value.average_words === 0;
  return Math.abs(value.average_words - (value.total_words / value.total_prompts)) <= 1e-9;
}

function isScanStats(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeSafeInteger(value.total_prompts)
    && isNonNegativeSafeInteger(value.total_files)
    && isNonNegativeSafeInteger(value.total_words)
    && isNonNegativeFiniteNumber(value.average_words)
    && isQualityAverage(value.average_quality)
    && isNonNegativeSafeIntegerAtMost(value.weak_prompt_count, value.total_prompts)
    && isEmptyScanAggregateConsistent(value)
    && isAverageWordsConsistent(value)
    && isFrequencyItemsWithinTotal(value.top_words, value.total_words)
    && frequencyTextsAreUnique(value.top_words)
    && isFrequencyItemsWithinTotal(value.top_phrases, value.total_words)
    && frequencyTextsAreUnique(value.top_phrases)
    && isFrequencyItemsWithinTotal(value.repeated_prompts, value.total_prompts)
    && frequencyTextsAreUnique(value.repeated_prompts)
    && isFrequencyItemsEachWithinTotal(value.top_quality_gaps, value.total_prompts)
    && frequencyTextsAreUnique(value.top_quality_gaps)
    && isFrequencyItemsWithinTotal(value.prompts_by_date, value.total_prompts)
    && frequencyTextsAreUnique(value.prompts_by_date)
    && Array.isArray(value.source_summaries)
    && value.source_summaries.every(isSourceSummary)
    && sourceSummaryIdsAreUnique(value.source_summaries)
    && sourceFilesSeenTotalMatches(value.source_summaries, value.total_files)
    && sourcePromptTotalsMatch(value.source_summaries, value.total_prompts, value.weak_prompt_count);
}

function isReturnedPromptCount(value: unknown, prompts: unknown, stats: unknown): boolean {
  return Array.isArray(prompts)
    && isRecord(stats)
    && isNonNegativeSafeIntegerAtMost(value, stats.total_prompts)
    && prompts.length === value;
}

type PromptTruncationValidator = (
  value: unknown,
  returnedPromptCount: unknown,
  stats: unknown,
  persistence: unknown,
) => boolean;

function isPromptTruncationState(
  value: unknown,
  returnedPromptCount: unknown,
  stats: unknown,
  _persistence: unknown,
): boolean {
  return typeof value === "boolean"
    && isRecord(stats)
    && isNonNegativeSafeInteger(returnedPromptCount)
    && isNonNegativeSafeInteger(stats.total_prompts)
    && value === (returnedPromptCount < stats.total_prompts);
}

function isStoredPromptTruncationState(
  value: unknown,
  returnedPromptCount: unknown,
  stats: unknown,
  persistence: unknown,
): boolean {
  if (typeof value !== "boolean"
    || !isRecord(stats)
    || !isNonNegativeSafeInteger(returnedPromptCount)
    || !isNonNegativeSafeInteger(stats.total_prompts)
    || returnedPromptCount !== stats.total_prompts) {
    return false;
  }

  if (!value) return true;

  if (!isPersistStats(persistence)) return false;

  return (persistence as { stored_prompt_count: number }).stored_prompt_count > returnedPromptCount;
}

function isUntruncatedPromptWordTotal(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats)) return false;
  let totalWords = 0;
  for (const prompt of value.prompts) {
    if (!isRecord(prompt) || !isNonNegativeSafeInteger(prompt.word_count)) return false;
    totalWords += prompt.word_count;
    if (!Number.isSafeInteger(totalWords)) return false;
  }
  return totalWords === value.stats.total_words;
}

function isUntruncatedPromptAverageQuality(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats)) return false;
  let totalQuality = 0;
  for (const prompt of value.prompts) {
    if (!isRecord(prompt) || !isPromptQuality(prompt.quality)) return false;
    totalQuality += prompt.quality.score;
    if (!Number.isSafeInteger(totalQuality)) return false;
  }
  const expectedAverageQuality = value.prompts.length === 0 ? 0 : totalQuality / value.prompts.length;
  return isNonNegativeFiniteNumber(value.stats.average_quality)
    && Math.abs(value.stats.average_quality - expectedAverageQuality) <= 1e-9;
}

function isUntruncatedPromptWeakCount(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats)) return false;
  let weakCount = 0;
  for (const prompt of value.prompts) {
    if (!isRecord(prompt) || !isPromptQuality(prompt.quality)) return false;
    if (prompt.quality.band === "weak") weakCount += 1;
  }
  return isNonNegativeSafeInteger(value.stats.weak_prompt_count)
    && weakCount === value.stats.weak_prompt_count;
}

function isUntruncatedSourceAverageQuality(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats) || !Array.isArray(value.stats.source_summaries)) {
    return false;
  }
  for (const source of value.stats.source_summaries) {
    if (!isRecord(source)
      || !isNonBlankString(source.id)
      || !isNonBlankString(source.label)
      || !isQualityAverage(source.average_quality)) {
      return false;
    }
    let sourcePromptCount = 0;
    let totalQuality = 0;
    for (const prompt of value.prompts) {
      if (!isRecord(prompt) || !isNonBlankString(prompt.source) || !isPromptQuality(prompt.quality)) return false;
      if (!promptMatchesSourceSummary(prompt.source, source)) continue;
      sourcePromptCount += 1;
      totalQuality += prompt.quality.score;
      if (!Number.isSafeInteger(sourcePromptCount) || !Number.isSafeInteger(totalQuality)) return false;
    }
    const expectedAverageQuality = sourcePromptCount === 0 ? 0 : totalQuality / sourcePromptCount;
    if (Math.abs(source.average_quality - expectedAverageQuality) > 1e-9) return false;
  }
  return true;
}

function isUntruncatedSourcePromptCounts(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats) || !Array.isArray(value.stats.source_summaries)) {
    return false;
  }
  for (const source of value.stats.source_summaries) {
    if (!isRecord(source)
      || !isNonBlankString(source.id)
      || !isNonBlankString(source.label)
      || !isNonNegativeSafeInteger(source.prompts_found)) {
      return false;
    }
    let sourcePromptCount = 0;
    for (const prompt of value.prompts) {
      if (!isRecord(prompt) || !isNonBlankString(prompt.source)) return false;
      if (!promptMatchesSourceSummary(prompt.source, source)) continue;
      sourcePromptCount += 1;
      if (!Number.isSafeInteger(sourcePromptCount)) return false;
    }
    if (sourcePromptCount !== source.prompts_found) return false;
  }
  return true;
}

function isUntruncatedSourceWeakCounts(value: Record<string, unknown>): boolean {
  if (value.prompts_truncated !== false) return true;
  if (!Array.isArray(value.prompts) || !isRecord(value.stats) || !Array.isArray(value.stats.source_summaries)) {
    return false;
  }
  for (const source of value.stats.source_summaries) {
    if (!isRecord(source)
      || !isNonBlankString(source.id)
      || !isNonBlankString(source.label)
      || !isNonNegativeSafeInteger(source.weak_prompt_count)) {
      return false;
    }
    let sourceWeakCount = 0;
    for (const prompt of value.prompts) {
      if (!isRecord(prompt) || !isNonBlankString(prompt.source) || !isPromptQuality(prompt.quality)) return false;
      if (!promptMatchesSourceSummary(prompt.source, source)) continue;
      if (prompt.quality.band === "weak") sourceWeakCount += 1;
      if (!Number.isSafeInteger(sourceWeakCount)) return false;
    }
    if (sourceWeakCount !== source.weak_prompt_count) return false;
  }
  return true;
}

function promptMatchesSourceSummary(
  promptSource: string,
  source: Record<string, unknown>,
): boolean {
  return promptSource === source.id || promptSource === source.label;
}

function isScanOutputPathState(outputPath: unknown, markdownWritten: unknown): boolean {
  if (markdownWritten !== true && markdownWritten !== false) return false;
  if (outputPath === null) return markdownWritten === false;
  return markdownWritten === true && isNonBlankString(outputPath);
}

function isMarkdownBodyState(markdown: unknown, markdownIncluded: unknown): boolean {
  return typeof markdown === "string"
    && typeof markdownIncluded === "boolean"
    && (markdownIncluded || markdown.length === 0);
}

function isImportBatchPromptCounts(value: unknown): boolean {
  return isRecord(value)
    && Array.isArray(value.prompts)
    && isRecord(value.stats)
    && isNonNegativeSafeInteger(value.batch_prompt_count)
    && value.batch_prompt_count === value.stats.total_prompts
    && isNonNegativeSafeIntegerAtMost(value.returned_prompt_count, value.batch_prompt_count)
    && value.prompts.length === value.returned_prompt_count;
}

function isCompleteImportBatchPromptAggregate(value: Record<string, unknown>): boolean {
  if (value.returned_prompt_count !== value.batch_prompt_count) return true;
  const completePromptResult = { ...value, prompts_truncated: false };
  return isUntruncatedPromptWordTotal(completePromptResult)
    && isUntruncatedPromptAverageQuality(completePromptResult)
    && isUntruncatedPromptWeakCount(completePromptResult)
    && isUntruncatedSourceAverageQuality(completePromptResult)
    && isUntruncatedSourcePromptCounts(completePromptResult)
    && isUntruncatedSourceWeakCounts(completePromptResult);
}

function isImportBatchFileProgress(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.source) || !isRecord(value.state)) return false;
  if (!isNonNegativeSafeInteger(value.batch_start_index)
    || !isNonNegativeSafeInteger(value.batch_file_count)
    || !isNonNegativeSafeInteger(value.state.total_files)
    || !isNonNegativeSafeInteger(value.source.file_count)
    || !isNonNegativeSafeInteger(value.state.next_file_index)
    || !isNonNegativeSafeInteger(value.state.processed_files)
    || typeof value.state.completed !== "boolean") {
    return false;
  }
  if (value.source.file_count !== value.state.total_files) return false;
  if (!isNonNegativeSafeIntegerRangeAtMost(
    value.batch_start_index,
    value.batch_file_count,
    value.state.total_files,
  )) {
    return false;
  }
  const batchEndIndex = value.batch_start_index + value.batch_file_count;
  return value.state.next_file_index === batchEndIndex
    && value.state.processed_files === batchEndIndex
    && value.state.completed === (batchEndIndex >= value.state.total_files);
}

function isImprovePersistence(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.database_path)
    && isPositiveSafeInteger(value.improvement_event_id)
    && isPositiveSafeInteger(value.prompt_improvement_count);
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function resolvedQualityGaps(beforeMissing: string[], afterMissing: string[]): string[] {
  const remaining = new Set(afterMissing);
  return beforeMissing.filter((gap) => !remaining.has(gap));
}

function isQualityDelta(value: unknown): boolean {
  if (!isRecord(value)
    || !isPromptQuality(value.before)
    || !isPromptQuality(value.after)
    || !isSafeInteger(value.score_delta)
    || !isNonBlankStringArray(value.resolved_gaps)
    || !isNonBlankStringArray(value.remaining_gaps)) {
    return false;
  }
  return value.score_delta === value.after.score - value.before.score
    && stringArraysEqual(value.remaining_gaps as string[], value.after.missing)
    && stringArraysEqual(
      value.resolved_gaps as string[],
      resolvedQualityGaps(value.before.missing, value.after.missing),
    );
}

function isInactiveScanProgressSnapshot(value: Record<string, unknown>): boolean {
  return value.active !== false
    || (
      value.canceled === false
      && value.source_id === null
      && value.source_label === null
      && value.source_index === 0
      && value.source_count === 0
      && value.files_seen === 0
      && value.source_files_seen === 0
      && value.source_files_discovered === 0
      && value.source_file_count === null
      && value.prompts_found === 0
      && value.limit === null
    );
}

function isScanProgressSourceIdentityConsistent(value: Record<string, unknown>): boolean {
  return (value.source_id === null) === (value.source_label === null);
}

function isScanProgressSourcePositionConsistent(value: Record<string, unknown>): boolean {
  return (value.source_id === null) === (value.source_index === 0);
}

function isSourceLessScanProgressCounterConsistent(value: Record<string, unknown>): boolean {
  return value.source_id !== null
    || (
      value.files_seen === 0
      && value.source_files_seen === 0
      && value.source_files_discovered === 0
      && value.source_file_count === null
      && value.prompts_found === 0
    );
}

function isFinalizedScanProgressSourceCountConsistent(value: Record<string, unknown>): boolean {
  return value.source_file_count === null
    || value.source_files_discovered === value.source_file_count;
}

function isPendingScanProgressSourceCountConsistent(value: Record<string, unknown>): boolean {
  return value.source_file_count !== null
    || value.source_files_seen === 0;
}

function matchesRequestedRunId(value: { run_id: string }, requestedRunId: string): boolean {
  return value.run_id === requestedRunId.trim();
}

function parseCancelScanResult(value: unknown): CancelScanResult {
  if (!isRecord(value) || !isNonBlankString(value.run_id) || typeof value.canceled !== "boolean") {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as CancelScanResult;
}

function parseImportBatchResult(value: unknown): ImportBatchResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isSourcePlan(value.source)
    || !isImportState(value.state)
    || !isNonNegativeSafeInteger(value.batch_start_index)
    || !isNonNegativeSafeInteger(value.batch_file_count)
    || !Array.isArray(value.prompts)
    || !value.prompts.every(isPromptRecord)
    || !promptRecordIdsAreUnique(value.prompts)
    || !isScanStats(value.stats)
    || !isImportBatchPromptCounts(value)
    || !isCompleteImportBatchPromptAggregate(value)
    || !isImportBatchFileProgress(value)
    || !isPersistStats(value.persistence)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportBatchResult;
}

function parseImproveResult(value: unknown): ImproveResult {
  if (!isRecord(value)
    || !isNonBlankString(value.provider)
    || typeof value.used_ai !== "boolean"
    || !isNonBlankString(value.revised_prompt)
    || !isNonBlankStringArray(value.rationale)
    || !isNonBlankStringArray(value.checklist)
    || !isQualityDelta(value.quality_delta)
    || !isNonBlankStringArray(value.warnings)
    || !(isImprovePersistence(value.persistence) || value.persistence === null)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImproveResult;
}

function nativeProjectWorkSummaryOptions(options: ProjectWorkSummaryOptions) {
  return {
    report: {
      limit: options.limit,
      session_limit: options.session_limit,
      database_path: options.database_path,
      refresh_session_index: options.refresh_session_index,
    },
    summary_limit: options.summary_limit,
    force_local: options.ai === true ? false : undefined,
    save_snapshot: options.save_snapshot,
    include_extractions: options.include_extractions,
    include_saved_extractions: options.include_saved_extractions,
    extraction_limit: options.extraction_limit,
    extraction_ai: options.extraction_ai,
  };
}

function isProjectWorkItem(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.date)
    && isNonBlankString(value.project)
    && isNonBlankString(value.title)
    && isNonBlankString(value.status)
    && isNonBlankString(value.source_path)
    && isNonBlankString(value.source_file)
    && isNonBlankString(value.evidence)
    && isNonNegativeSafeInteger(value.session_evidence_count)
    && isFrequencyItemsWithinTotal(value.session_sources, value.session_evidence_count);
}

function isProjectWorkReport(value: unknown): value is ProjectWorkReport {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonNegativeSafeInteger(value.total_items)
    || !isNonNegativeSafeInteger(value.project_count)
    || !isNonNegativeSafeInteger(value.date_count)
    || !isNonNegativeSafeInteger(value.files_seen)
    || !frequencyItemCountsSumTo(value.items_by_date, value.total_items)
    || !frequencyItemCountsSumTo(value.items_by_project, value.total_items)
    || !isNonNegativeSafeInteger(value.session_scan_prompt_count)
    || !isFrequencyItemsWithinTotal(value.session_scan_sources, value.session_scan_prompt_count)
    || !isNonNegativeSafeInteger(value.session_evidence_count)
    || !isFrequencyItemsWithinTotal(value.session_sources, value.session_evidence_count)
    || !isNonNegativeSafeIntegerAtMost(value.session_evidence_unique_count, value.session_evidence_count)
    || !isFrequencyItemsWithinTotal(value.session_evidence_unique_sources, value.session_evidence_unique_count)
    || typeof value.session_evidence_index_used !== "boolean"
    || typeof value.session_evidence_index_updated !== "boolean"
    || !isNonNegativeSafeInteger(value.session_evidence_index_count)
    || !isNonBlankString(value.session_evidence_mode)
    || !Array.isArray(value.items)
    || !value.items.every(isProjectWorkItem)
    || value.items.length !== value.total_items
    || !isNonBlankStringArray(value.warnings)) {
    return false;
  }
  return value.project_count <= value.total_items
    && value.date_count <= value.total_items;
}

function isProjectWorkLogCoverageFile(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonBlankString(value.project)
    || !isNonBlankString(value.source_path)
    || !isNonBlankString(value.source_file)
    || !isNonBlankString(value.status)
    || !["parsed", "pointer", "unparsed", "unreadable"].includes(value.status)
    || !isNonNegativeSafeInteger(value.work_item_count)
    || !(value.latest_date === null || isNonBlankString(value.latest_date))
    || !(value.latest_title === null || isNonBlankString(value.latest_title))
    || !isNullableTimestampString(value.modified_at)) {
    return false;
  }
  if (value.status === "parsed") {
    return value.work_item_count > 0 && value.latest_date !== null && value.latest_title !== null;
  }
  return value.work_item_count === 0 && value.latest_date === null && value.latest_title === null;
}

function projectWorkLogCoverageFilesWithinResult(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.files)
    || !isNonNegativeSafeInteger(value.files_seen)
    || !isNonNegativeSafeInteger(value.parsed_file_count)
    || !isNonNegativeSafeInteger(value.unparsed_file_count)
    || !isNonNegativeSafeInteger(value.project_count)
    || !isNonNegativeSafeInteger(value.work_item_count)) {
    return false;
  }
  const parsedFileCount = value.files.filter((file) => isRecord(file) && file.status === "parsed").length;
  const unparsedFileCount = value.files.filter((file) =>
    isRecord(file) && ["unparsed", "unreadable"].includes(String(file.status))
  ).length;
  let workItemCount = 0;
  const projects = new Set<string>();
  for (const file of value.files) {
    if (!isRecord(file)
      || !isNonBlankString(file.project)
      || !isNonNegativeSafeInteger(file.work_item_count)) {
      return false;
    }
    projects.add(file.project);
    workItemCount += file.work_item_count;
    if (!Number.isSafeInteger(workItemCount) || workItemCount > value.work_item_count) {
      return false;
    }
  }
  return value.files_seen === value.files.length
    && value.parsed_file_count === parsedFileCount
    && value.unparsed_file_count === unparsedFileCount
    && value.parsed_file_count + value.unparsed_file_count <= value.files_seen
    && value.project_count === projects.size
    && value.work_item_count === workItemCount;
}

function parseProjectWorkLogCoverageResult(value: unknown): ProjectWorkLogCoverageResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.root_path)
    || !Array.isArray(value.files)
    || !value.files.every(isProjectWorkLogCoverageFile)
    || !recordStringFieldValuesAreUnique(value.files, "source_path")
    || !projectWorkLogCoverageFilesWithinResult(value)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkLogCoverageResult;
}

function isProjectWorkLogExtractionCandidate(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.candidate_id)
    && isNonBlankString(value.project)
    && isNonBlankString(value.source_path)
    && isNonBlankString(value.source_file)
    && value.reason === "missing_dated_heading"
    && isNonBlankString(value.excerpt)
    && isPositiveSafeInteger(value.line_count)
    && isPositiveSafeInteger(value.char_count)
    && isNonBlankStringArray(value.risk_flags)
    && isNullableTimestampString(value.modified_at);
}

function projectWorkLogExtractionCandidatesWithinResult(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.candidates)
    || !isNonNegativeSafeInteger(value.files_seen)
    || !isNonNegativeSafeInteger(value.skipped_parsed_file_count)
    || !isNonNegativeSafeInteger(value.skipped_unreadable_file_count)
    || !isNonNegativeSafeInteger(value.skipped_empty_file_count)
    || !isNonNegativeSafeInteger(value.skipped_pointer_file_count)
    || !isNonNegativeSafeInteger(value.candidate_count)) {
    return false;
  }
  const accountedFileCount = value.skipped_parsed_file_count
    + value.skipped_unreadable_file_count
    + value.skipped_empty_file_count
    + value.skipped_pointer_file_count
    + value.candidates.length;
  return Number.isSafeInteger(accountedFileCount)
    && value.candidate_count === value.candidates.length
    && accountedFileCount <= value.files_seen;
}

function parseProjectWorkLogExtractionCandidatesResult(
  value: unknown,
): ProjectWorkLogExtractionCandidatesResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.root_path)
    || !Array.isArray(value.candidates)
    || !value.candidates.every(isProjectWorkLogExtractionCandidate)
    || !recordStringFieldValuesAreUnique(value.candidates, "candidate_id")
    || !recordStringFieldValuesAreUnique(value.candidates, "source_path")
    || !projectWorkLogExtractionCandidatesWithinResult(value)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkLogExtractionCandidatesResult;
}

function isProjectWorkLogExtractionProposal(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.candidate_id)
    && isNonBlankString(value.project)
    && isNonBlankString(value.source_path)
    && isNonBlankString(value.source_file)
    && isNullableNonBlankString(value.date)
    && isNonBlankString(value.title)
    && isNonBlankString(value.status)
    && isNonBlankString(value.evidence)
    && isFiniteNumber(value.confidence)
    && value.confidence >= 0
    && value.confidence <= 1
    && typeof value.accepted === "boolean"
    && isNullableNonBlankString(value.rejection_reason);
}

function projectWorkLogExtractionProposalsWithinResult(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.proposals)
    || !isNonNegativeSafeInteger(value.candidate_count)
    || !isNonNegativeSafeInteger(value.accepted_count)
    || !isNonNegativeSafeInteger(value.rejected_count)) {
    return false;
  }
  const acceptedCount = value.proposals.filter((proposal) => isRecord(proposal) && proposal.accepted === true).length;
  const rejectedCount = value.proposals.filter((proposal) => isRecord(proposal) && proposal.accepted === false).length;
  return value.accepted_count === acceptedCount
    && value.rejected_count === rejectedCount
    && value.proposals.length <= value.candidate_count
    && acceptedCount + rejectedCount === value.proposals.length;
}

function isProjectWorkLogExtractionPersistence(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.database_path)
    && isNonNegativeSafeInteger(value.saved_item_count)
    && isNonNegativeSafeInteger(value.total_saved_item_count)
    && value.saved_item_count <= value.total_saved_item_count;
}

function parseProjectWorkLogExtractionProposalsResult(
  value: unknown,
): ProjectWorkLogExtractionProposalsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.root_path)
    || !isNonBlankString(value.provider)
    || !isNullableNonBlankString(value.provider_model)
    || !isNonBlankString(value.provider_runtime)
    || typeof value.used_ai !== "boolean"
    || !Array.isArray(value.proposals)
    || !value.proposals.every(isProjectWorkLogExtractionProposal)
    || !recordStringFieldValuesAreUnique(value.proposals, "candidate_id")
    || !projectWorkLogExtractionProposalsWithinResult(value)
    || !(value.persistence === null || isProjectWorkLogExtractionPersistence(value.persistence))
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkLogExtractionProposalsResult;
}

function isProjectWorkLogExtractionItem(value: unknown): boolean {
  return isRecord(value)
    && isPositiveSafeInteger(value.id)
    && isTimestampString(value.saved_at)
    && isTimestampString(value.run_generated_at)
    && isNonBlankString(value.provider)
    && isNullableNonBlankString(value.provider_model)
    && isNonBlankString(value.provider_runtime)
    && typeof value.used_ai === "boolean"
    && isNonBlankString(value.candidate_id)
    && isNonBlankString(value.project)
    && isNonBlankString(value.source_path)
    && isNonBlankString(value.source_file)
    && isNonBlankString(value.date)
    && isNonBlankString(value.title)
    && isNonBlankString(value.status)
    && isNonBlankString(value.evidence)
    && isFiniteNumber(value.confidence)
    && value.confidence >= 0
    && value.confidence <= 1
    && isNonBlankStringArray(value.warnings);
}

function parseProjectWorkLogExtractionItemsResult(
  value: unknown,
): ProjectWorkLogExtractionItemsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !isNonNegativeSafeInteger(value.total_items)
    || !isNonNegativeSafeIntegerAtMost(value.returned_item_count, value.total_items)
    || !isUniqueNonBlankStringArray(value.available_dates)
    || !isUniqueNonBlankStringArray(value.available_projects)
    || !Array.isArray(value.items)
    || value.items.length !== value.returned_item_count
    || !value.items.every(isProjectWorkLogExtractionItem)
    || !recordNumberFieldValuesAreUnique(value.items, "id")
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkLogExtractionItemsResult;
}

function isProjectWorkLogExtractionMergeResult(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.provider)
    && typeof value.used_ai === "boolean"
    && isNonNegativeSafeInteger(value.candidate_count)
    && isNonNegativeSafeInteger(value.accepted_count)
    && isNonNegativeSafeInteger(value.rejected_count)
    && isNonNegativeSafeInteger(value.merged_item_count)
    && value.accepted_count + value.rejected_count <= value.candidate_count
    && value.merged_item_count <= value.accepted_count
    && isNonBlankStringArray(value.warnings);
}

function isProjectWorkSummaryCitation(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.id)
    && isNonBlankString(value.date)
    && isNonBlankString(value.project)
    && isNonBlankString(value.title)
    && isNonBlankString(value.status)
    && isNonBlankString(value.source_path)
    && isNonBlankString(value.source_file)
    && isNonBlankString(value.evidence)
    && isNonNegativeSafeInteger(value.session_evidence_count)
    && isFrequencyItemsWithinTotal(value.session_sources, value.session_evidence_count);
}

function summaryCitationIdsAreUnique(citations: unknown): boolean {
  return recordStringFieldValuesAreUnique(citations, "id");
}

function isProjectWorkSummary(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonBlankString(value.date)
    || !isNonBlankString(value.project)
    || !isNonBlankString(value.headline)
    || !isPositiveSafeInteger(value.work_item_count)
    || !isNonNegativeSafeInteger(value.session_evidence_count)
    || !isNonNegativeSafeIntegerAtMost(value.unique_session_evidence_count, value.session_evidence_count)
    || !Array.isArray(value.citations)
    || !value.citations.every(isProjectWorkSummaryCitation)
    || !summaryCitationIdsAreUnique(value.citations)
    || value.citations.length !== value.work_item_count
    || !isNonBlankStringArray(value.next_actions)) {
    return false;
  }
  let sessionEvidenceCount = 0;
  for (const citation of value.citations) {
    if (!isRecord(citation) || !isNonNegativeSafeInteger(citation.session_evidence_count)) return false;
    if (citation.date !== value.date || citation.project !== value.project) return false;
    sessionEvidenceCount += citation.session_evidence_count;
    if (!Number.isSafeInteger(sessionEvidenceCount) || sessionEvidenceCount > value.session_evidence_count) {
      return false;
    }
  }
  return sessionEvidenceCount === value.session_evidence_count;
}

function projectWorkSummariesWithinReport(value: unknown, report: ProjectWorkReport): boolean {
  if (!Array.isArray(value) || value.length > report.total_items) return false;
  let workItemCount = 0;
  let sessionEvidenceCount = 0;
  for (const summary of value) {
    if (!isRecord(summary)
      || !isPositiveSafeInteger(summary.work_item_count)
      || !isNonNegativeSafeInteger(summary.session_evidence_count)) {
      return false;
    }
    workItemCount += summary.work_item_count;
    sessionEvidenceCount += summary.session_evidence_count;
    if (!Number.isSafeInteger(workItemCount)
      || !Number.isSafeInteger(sessionEvidenceCount)
      || workItemCount > report.total_items
      || sessionEvidenceCount > report.session_evidence_count) {
      return false;
    }
  }
  return true;
}

function isProjectWorkSummaryPersistence(value: unknown): boolean {
  return isRecord(value)
    && isNonBlankString(value.database_path)
    && isPositiveSafeInteger(value.snapshot_id)
    && isPositiveSafeInteger(value.snapshot_count);
}

function parseProjectWorkSummaryResult(value: unknown): ProjectWorkSummaryResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.provider)
    || typeof value.used_ai !== "boolean"
    || typeof value.narrative_markdown !== "string"
    || !Array.isArray(value.summaries)
    || !value.summaries.every(isProjectWorkSummary)
    || !isProjectWorkReport(value.report)
    || !projectWorkSummariesWithinReport(value.summaries, value.report)
    || !(value.extraction_merge === null || isProjectWorkLogExtractionMergeResult(value.extraction_merge))
    || !(value.persistence === null || isProjectWorkSummaryPersistence(value.persistence))
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkSummaryResult;
}

function projectWorkSummarySnapshotIdsAreUnique(snapshots: unknown): boolean {
  return recordNumberFieldValuesAreUnique(snapshots, "id");
}

function projectWorkSummarySnapshotSummariesWithinSnapshot(value: unknown): boolean {
  if (!isRecord(value)
    || !Array.isArray(value.summaries)
    || !isNonNegativeSafeInteger(value.total_items)
    || !isNonNegativeSafeInteger(value.session_evidence_count)) {
    return false;
  }
  let workItemCount = 0;
  let sessionEvidenceCount = 0;
  for (const summary of value.summaries) {
    if (!isRecord(summary)
      || !isPositiveSafeInteger(summary.work_item_count)
      || !isNonNegativeSafeInteger(summary.session_evidence_count)) {
      return false;
    }
    workItemCount += summary.work_item_count;
    sessionEvidenceCount += summary.session_evidence_count;
    if (!Number.isSafeInteger(workItemCount)
      || !Number.isSafeInteger(sessionEvidenceCount)
      || workItemCount > value.total_items
      || sessionEvidenceCount > value.session_evidence_count) {
      return false;
    }
  }
  return true;
}

function isProjectWorkSummarySnapshot(value: unknown): boolean {
  return isRecord(value)
    && isPositiveSafeInteger(value.id)
    && isTimestampString(value.created_at)
    && isNonBlankString(value.provider)
    && typeof value.used_ai === "boolean"
    && typeof value.narrative_markdown === "string"
    && isNonNegativeSafeInteger(value.total_items)
    && isNonNegativeSafeIntegerAtMost(value.project_count, value.total_items)
    && isNonNegativeSafeIntegerAtMost(value.date_count, value.total_items)
    && isNonNegativeSafeInteger(value.files_seen)
    && isNonNegativeSafeInteger(value.session_evidence_count)
    && isNonNegativeSafeIntegerAtMost(value.session_evidence_unique_count, value.session_evidence_count)
    && isNonNegativeSafeIntegerAtMost(value.summary_count, value.total_items)
    && Array.isArray(value.summaries)
    && value.summaries.length === value.summary_count
    && value.summaries.every(isProjectWorkSummary)
    && projectWorkSummarySnapshotSummariesWithinSnapshot(value)
    && (value.extraction_merge === null || isProjectWorkLogExtractionMergeResult(value.extraction_merge))
    && isNonBlankStringArray(value.warnings);
}

function parseProjectWorkSummarySnapshotsResult(value: unknown): ProjectWorkSummarySnapshotsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !isNonNegativeSafeInteger(value.total_snapshots)
    || !isNonNegativeSafeIntegerAtMost(value.returned_snapshot_count, value.total_snapshots)
    || !isUniqueNonBlankStringArray(value.available_dates)
    || !isUniqueNonBlankStringArray(value.available_projects)
    || !Array.isArray(value.snapshots)
    || value.snapshots.length !== value.returned_snapshot_count
    || !value.snapshots.every(isProjectWorkSummarySnapshot)
    || !projectWorkSummarySnapshotIdsAreUnique(value.snapshots)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ProjectWorkSummarySnapshotsResult;
}

function parseImportStatesResult(value: unknown): ImportStatesResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !Array.isArray(value.states)
    || !value.states.every(isImportState)
    || !importStateSourceIdsAreUnique(value.states)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeIntegerAtMost(value.completed_sources, value.total_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeIntegerAtMost(value.processed_files, value.total_files)
    || !isNonNegativeSafeInteger(value.imported_prompt_count)
    || !isImportStatesAggregate(value)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportStatesResult;
}

function parseImportEventsResult(value: unknown): ImportEventsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !Array.isArray(value.events)
    || !value.events.every(isImportEvent)
    || !importEventIdsAreUnique(value.events)
    || !importEventIdsAreDescending(value.events)
    || !isNonNegativeSafeInteger(value.total_events)
    || value.total_events < value.events.length) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportEventsResult;
}

function parseStoredPromptFacetsResult(value: unknown): StoredPromptFacetsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !isNonNegativeSafeInteger(value.total_prompts)
    || !isFrequencyItemsWithinTotal(value.sources, value.total_prompts)
    || !frequencyTextsAreUnique(value.sources)
    || !isFrequencyItemsWithinTotal(value.dates, value.total_prompts)
    || !frequencyTextsAreUnique(value.dates)
    || !isFrequencyItemsWithinTotal(value.workspaces, value.total_prompts)
    || !frequencyTextsAreUnique(value.workspaces)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as StoredPromptFacetsResult;
}

function parseScanPlan(value: unknown): ScanPlan {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeIntegerAtMost(value.available_sources, value.total_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.total_bytes)
    || !isNonNegativeSafeIntegerAtMost(value.large_file_count, value.total_files)
    || !isNonNegativeSafeIntegerAtMost(value.largest_file_bytes, value.total_bytes)
    || !Array.isArray(value.sources)
    || !value.sources.every(isSourcePlan)
    || !sourcePlanIdsAreUnique(value.sources)
    || !isNonBlankStringArray(value.warnings)
    || !isScanPlanAggregate(value)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanPlan;
}

function parseScanResult(
  value: unknown,
  promptTruncationValidator: PromptTruncationValidator = isPromptTruncationState,
): ScanResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isScanOutputPathState(value.output_path, value.markdown_written)
    || !isMarkdownBodyState(value.markdown, value.markdown_included)
    || !isScanStats(value.stats)
    || !Array.isArray(value.prompts)
    || !value.prompts.every(isPromptRecord)
    || !promptRecordIdsAreUnique(value.prompts)
    || !isReturnedPromptCount(value.returned_prompt_count, value.prompts, value.stats)
    || !promptTruncationValidator(
      value.prompts_truncated,
      value.returned_prompt_count,
      value.stats,
      value.persistence,
    )
    || !isUntruncatedPromptWordTotal(value)
    || !isUntruncatedPromptAverageQuality(value)
    || !isUntruncatedPromptWeakCount(value)
    || !isUntruncatedSourceAverageQuality(value)
    || !isUntruncatedSourcePromptCounts(value)
    || !isUntruncatedSourceWeakCounts(value)
    || !isPreviewSortString(value.preview_sort)
    || typeof value.markdown_written !== "boolean"
    || !(isPersistStats(value.persistence) || value.persistence === null)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanResult;
}

function parseStoredPromptsResult(value: unknown): ScanResult {
  const result = parseScanResult(value, isStoredPromptTruncationState);
  const completePreviewResult = { ...(value as Record<string, unknown>), prompts_truncated: false };
  if (result.output_path !== null
    || result.markdown !== ""
    || result.markdown_included !== false
    || result.markdown_written !== false
    || result.persistence === null
    || !isUntruncatedPromptWordTotal(completePreviewResult)
    || !isUntruncatedPromptAverageQuality(completePreviewResult)
    || !isUntruncatedPromptWeakCount(completePreviewResult)
    || !isUntruncatedSourceAverageQuality(completePreviewResult)
    || !isUntruncatedSourcePromptCounts(completePreviewResult)
    || !isUntruncatedSourceWeakCounts(completePreviewResult)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return result;
}

function parseScanProgressResult(value: unknown): ScanProgress {
  if (!isRecord(value)
    || !isNonBlankString(value.run_id)
    || typeof value.active !== "boolean"
    || typeof value.canceled !== "boolean"
    || !isNullableNonBlankString(value.source_id)
    || !isNullableNonBlankString(value.source_label)
    || !isNonNegativeSafeInteger(value.source_index)
    || !isNonNegativeSafeInteger(value.source_count)
    || !isNonNegativeSafeInteger(value.files_seen)
    || !isNonNegativeSafeInteger(value.source_files_seen)
    || !isNonNegativeSafeInteger(value.source_files_discovered)
    || !isNullableNonNegativeSafeInteger(value.source_file_count)
    || !isNonNegativeSafeInteger(value.prompts_found)
    || !isNullableNonNegativeSafeInteger(value.limit)
    || !isTimestampString(value.updated_at)
    || !isScanProgressSourceIdentityConsistent(value)
    || !isScanProgressSourcePositionConsistent(value)
    || !isSourceLessScanProgressCounterConsistent(value)
    || !isFinalizedScanProgressSourceCountConsistent(value)
    || !isPendingScanProgressSourceCountConsistent(value)
    || value.source_files_seen > value.files_seen
    || value.source_files_seen > value.source_files_discovered
    || (value.source_file_count !== null && !isNonNegativeSafeIntegerAtMost(value.source_files_seen, value.source_file_count))
    || (value.limit !== null && !isNonNegativeSafeIntegerAtMost(value.prompts_found, value.limit))
    || (value.source_index !== 0 && !isNonNegativeSafeIntegerAtMost(value.source_index, value.source_count))
    || !isInactiveScanProgressSnapshot(value)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanProgress;
}

async function postBridge<T>(
  path: string,
  body: unknown,
  validate?: (value: unknown) => T,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(bridgeEndpoint(path), {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  } catch {
    throw new Error(browserBridgeUnavailableMessage());
  }

  if (!response.ok) {
    throw new Error(browserBridgeHttpErrorMessage(response.status));
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new Error("PromptVault 브라우저 브리지 응답을 읽지 못했습니다.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("PromptVault 브라우저 브리지 응답을 JSON으로 해석하지 못했습니다.");
  }
  return validate ? validate(parsed) : parsed as T;
}
