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

export interface ImprovePromptRequest {
  prompt: string;
  context?: string | null;
  prompt_id?: string;
  source?: string;
  database_path?: string;
  persist?: boolean;
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
  return postBridge<ScanResult>("/api/prompts", { options }, parseScanResult);
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

function isNonBlankStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every(isNonBlankString);
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

function isQualityAverage(value: unknown): boolean {
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

function isPreviewSortString(value: unknown): value is string {
  return value === "latest" || value === "quality_asc";
}

function isPromptQuality(value: unknown): boolean {
  return isRecord(value)
    && isQualityScore(value.score)
    && isNonBlankString(value.band)
    && isNonBlankStringArray(value.missing)
    && isNonBlankStringArray(value.suggestions);
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
    && (typeof value.timestamp === "undefined" || isNullableNonBlankString(value.timestamp))
    && (typeof value.cwd === "undefined" || isNullableNonBlankString(value.cwd))
    && isNonBlankString(value.text)
    && isPromptWordCount(value.text, value.word_count)
    && isPromptCharCount(value.text, value.char_count)
    && isNonBlankString(value.hash)
    && isNonBlankStringArray(value.risk_flags)
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
    && isNonBlankStringArray(value.notes);
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
    || !(
      typeof value.newest_modified_at === "undefined"
      || value.newest_modified_at === null
      || isTimestampString(value.newest_modified_at)
    )
    || !isNonBlankStringArray(value.notes)) {
    return false;
  }
  return value.large_file_count <= value.file_count
    && value.largest_file_bytes <= value.byte_count
    && (value.file_count > 0 || value.byte_count === 0);
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

function isScanStats(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeSafeInteger(value.total_prompts)
    && isNonNegativeSafeInteger(value.total_files)
    && isNonNegativeSafeInteger(value.total_words)
    && isNonNegativeFiniteNumber(value.average_words)
    && isQualityAverage(value.average_quality)
    && isNonNegativeSafeIntegerAtMost(value.weak_prompt_count, value.total_prompts)
    && isEmptyScanAggregateConsistent(value)
    && isFrequencyItemsWithinTotal(value.top_words, value.total_words)
    && isFrequencyItemsWithinTotal(value.top_phrases, value.total_words)
    && isFrequencyItemsWithinTotal(value.repeated_prompts, value.total_prompts)
    && isFrequencyItemsEachWithinTotal(value.top_quality_gaps, value.total_prompts)
    && isFrequencyItemsWithinTotal(value.prompts_by_date, value.total_prompts)
    && Array.isArray(value.source_summaries)
    && value.source_summaries.every(isSourceSummary)
    && sourceFilesSeenTotalMatches(value.source_summaries, value.total_files)
    && sourcePromptTotalsMatch(value.source_summaries, value.total_prompts, value.weak_prompt_count);
}

function isReturnedPromptCount(value: unknown, prompts: unknown, stats: unknown): boolean {
  return Array.isArray(prompts)
    && isRecord(stats)
    && isNonNegativeSafeIntegerAtMost(value, stats.total_prompts)
    && prompts.length === value;
}

function isPromptTruncationState(value: unknown, returnedPromptCount: unknown, stats: unknown): boolean {
  return typeof value === "boolean"
    && isRecord(stats)
    && isNonNegativeSafeInteger(returnedPromptCount)
    && isNonNegativeSafeInteger(stats.total_prompts)
    && (value || returnedPromptCount === stats.total_prompts);
}

function isScanOutputPathState(outputPath: unknown, markdownWritten: unknown): boolean {
  if (markdownWritten !== true && markdownWritten !== false) return false;
  if (outputPath === null) return markdownWritten === false;
  return markdownWritten === true && isNonBlankString(outputPath);
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

function isQualityDelta(value: unknown): boolean {
  return isRecord(value)
    && isPromptQuality(value.before)
    && isPromptQuality(value.after)
    && isSafeInteger(value.score_delta)
    && isNonBlankStringArray(value.resolved_gaps)
    && isNonBlankStringArray(value.remaining_gaps);
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
    || !isScanStats(value.stats)
    || !isImportBatchPromptCounts(value)
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

function parseImportStatesResult(value: unknown): ImportStatesResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonBlankString(value.database_path)
    || !Array.isArray(value.states)
    || !value.states.every(isImportState)
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
    || !isFrequencyItemsWithinTotal(value.dates, value.total_prompts)
    || !isFrequencyItemsWithinTotal(value.workspaces, value.total_prompts)) {
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
    || !isNonBlankStringArray(value.warnings)
    || !isScanPlanAggregate(value)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanPlan;
}

function parseScanResult(value: unknown): ScanResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isScanOutputPathState(value.output_path, value.markdown_written)
    || typeof value.markdown !== "string"
    || !isScanStats(value.stats)
    || !Array.isArray(value.prompts)
    || !value.prompts.every(isPromptRecord)
    || !isReturnedPromptCount(value.returned_prompt_count, value.prompts, value.stats)
    || !isPromptTruncationState(value.prompts_truncated, value.returned_prompt_count, value.stats)
    || !isPreviewSortString(value.preview_sort)
    || typeof value.markdown_included !== "boolean"
    || typeof value.markdown_written !== "boolean"
    || !(isPersistStats(value.persistence) || value.persistence === null)
    || !isNonBlankStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanResult;
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
    || value.source_files_seen > value.source_files_discovered
    || (value.source_file_count !== null && !isNonNegativeSafeIntegerAtMost(value.source_files_seen, value.source_file_count))
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
