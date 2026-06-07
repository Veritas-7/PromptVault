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
  return postBridge<CancelScanResult>("/api/scan/cancel", { options }, parseCancelScanResult);
}

export async function scanProgress(run_id: string): Promise<ScanProgress> {
  const options: ScanProgressOptions = { run_id };
  if (hasTauriInvoke()) {
    return invoke<ScanProgress>("scan_progress", { options });
  }
  return postBridge<ScanProgress>("/api/scan/progress", { options }, parseScanProgressResult);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFrequencyItem(value: unknown): boolean {
  return isRecord(value)
    && typeof value.text === "string"
    && isNonNegativeSafeInteger(value.count);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
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

function isNonNegativeSafeIntegerAtMost(value: unknown, max: unknown): boolean {
  return isNonNegativeSafeInteger(value) && isNonNegativeSafeInteger(max) && value <= max;
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

function isPromptQuality(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeSafeInteger(value.score)
    && typeof value.band === "string"
    && isStringArray(value.missing)
    && isStringArray(value.suggestions);
}

function isPromptRecord(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.source === "string"
    && typeof value.session_id === "string"
    && typeof value.path === "string"
    && (typeof value.timestamp === "undefined" || typeof value.timestamp === "string" || value.timestamp === null)
    && (typeof value.cwd === "undefined" || typeof value.cwd === "string" || value.cwd === null)
    && typeof value.text === "string"
    && isNonNegativeSafeInteger(value.word_count)
    && isNonNegativeSafeInteger(value.char_count)
    && typeof value.hash === "string"
    && isStringArray(value.risk_flags)
    && isPromptQuality(value.quality);
}

function isSourceSummary(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.label === "string"
    && typeof value.root_path === "string"
    && isNonNegativeSafeInteger(value.files_seen)
    && isNonNegativeSafeInteger(value.prompts_found)
    && isNonNegativeFiniteNumber(value.average_quality)
    && isNonNegativeSafeInteger(value.weak_prompt_count)
    && typeof value.status === "string"
    && isStringArray(value.notes);
}

function isSourcePlan(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.label === "string"
    && typeof value.root_path === "string"
    && typeof value.status === "string"
    && isNonNegativeSafeInteger(value.file_count)
    && isNonNegativeSafeInteger(value.byte_count)
    && isNonNegativeSafeInteger(value.large_file_count)
    && isNonNegativeSafeInteger(value.largest_file_bytes)
    && (
      typeof value.newest_modified_at === "undefined"
      || typeof value.newest_modified_at === "string"
      || value.newest_modified_at === null
    )
    && isStringArray(value.notes);
}

function isImportState(value: unknown): boolean {
  return isRecord(value)
    && typeof value.source_id === "string"
    && typeof value.source_label === "string"
    && typeof value.root_path === "string"
    && isNonNegativeSafeInteger(value.total_files)
    && isNonNegativeSafeInteger(value.total_bytes)
    && isNonNegativeSafeIntegerAtMost(value.next_file_index, value.total_files)
    && isNonNegativeSafeIntegerAtMost(value.processed_files, value.total_files)
    && isNonNegativeSafeInteger(value.imported_prompt_count)
    && typeof value.completed === "boolean"
    && isTimestampString(value.updated_at);
}

function isImportEvent(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeSafeInteger(value.id)
    && isTimestampString(value.generated_at)
    && typeof value.source_id === "string"
    && typeof value.source_label === "string"
    && typeof value.root_path === "string"
    && isNonNegativeSafeInteger(value.batch_start_index)
    && isNonNegativeSafeInteger(value.batch_file_count)
    && isNonNegativeSafeInteger(value.batch_prompt_count)
    && isNonNegativeSafeInteger(value.processed_files)
    && isNonNegativeSafeInteger(value.total_files)
    && typeof value.completed === "boolean"
    && Array.isArray(value.warnings)
    && value.warnings.every((warning) => typeof warning === "string");
}

function isPersistStats(value: unknown): boolean {
  return isRecord(value)
    && typeof value.database_path === "string"
    && isNonNegativeSafeInteger(value.stored_prompt_count)
    && isNonNegativeSafeInteger(value.inserted_prompt_count)
    && isNonNegativeSafeInteger(value.updated_prompt_count)
    && isNonNegativeSafeInteger(value.date_count);
}

function isScanStats(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeSafeInteger(value.total_prompts)
    && isNonNegativeSafeInteger(value.total_files)
    && isNonNegativeSafeInteger(value.total_words)
    && isNonNegativeFiniteNumber(value.average_words)
    && isNonNegativeFiniteNumber(value.average_quality)
    && isNonNegativeSafeInteger(value.weak_prompt_count)
    && Array.isArray(value.top_words)
    && value.top_words.every(isFrequencyItem)
    && Array.isArray(value.top_phrases)
    && value.top_phrases.every(isFrequencyItem)
    && Array.isArray(value.repeated_prompts)
    && value.repeated_prompts.every(isFrequencyItem)
    && Array.isArray(value.top_quality_gaps)
    && value.top_quality_gaps.every(isFrequencyItem)
    && Array.isArray(value.prompts_by_date)
    && value.prompts_by_date.every(isFrequencyItem)
    && Array.isArray(value.source_summaries)
    && value.source_summaries.every(isSourceSummary);
}

function isImprovePersistence(value: unknown): boolean {
  return isRecord(value)
    && typeof value.database_path === "string"
    && isNonNegativeSafeInteger(value.improvement_event_id)
    && isNonNegativeSafeInteger(value.prompt_improvement_count);
}

function isQualityDelta(value: unknown): boolean {
  return isRecord(value)
    && isPromptQuality(value.before)
    && isPromptQuality(value.after)
    && isSafeInteger(value.score_delta)
    && isStringArray(value.resolved_gaps)
    && isStringArray(value.remaining_gaps);
}

function parseCancelScanResult(value: unknown): CancelScanResult {
  if (!isRecord(value) || typeof value.run_id !== "string" || typeof value.canceled !== "boolean") {
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
    || !isNonNegativeSafeInteger(value.batch_prompt_count)
    || !isNonNegativeSafeInteger(value.returned_prompt_count)
    || !Array.isArray(value.prompts)
    || !value.prompts.every(isPromptRecord)
    || !isScanStats(value.stats)
    || !isPersistStats(value.persistence)
    || !isStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportBatchResult;
}

function parseImproveResult(value: unknown): ImproveResult {
  if (!isRecord(value)
    || typeof value.provider !== "string"
    || typeof value.used_ai !== "boolean"
    || typeof value.revised_prompt !== "string"
    || !isStringArray(value.rationale)
    || !isStringArray(value.checklist)
    || !isQualityDelta(value.quality_delta)
    || !isStringArray(value.warnings)
    || !(isImprovePersistence(value.persistence) || value.persistence === null)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImproveResult;
}

function parseImportStatesResult(value: unknown): ImportStatesResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || typeof value.database_path !== "string"
    || !Array.isArray(value.states)
    || !value.states.every(isImportState)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeInteger(value.completed_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.processed_files)
    || !isNonNegativeSafeInteger(value.imported_prompt_count)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportStatesResult;
}

function parseImportEventsResult(value: unknown): ImportEventsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || typeof value.database_path !== "string"
    || !Array.isArray(value.events)
    || !value.events.every(isImportEvent)
    || !isNonNegativeSafeInteger(value.total_events)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportEventsResult;
}

function parseStoredPromptFacetsResult(value: unknown): StoredPromptFacetsResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || typeof value.database_path !== "string"
    || !isNonNegativeSafeInteger(value.total_prompts)
    || !Array.isArray(value.sources)
    || !value.sources.every(isFrequencyItem)
    || !Array.isArray(value.dates)
    || !value.dates.every(isFrequencyItem)
    || !Array.isArray(value.workspaces)
    || !value.workspaces.every(isFrequencyItem)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as StoredPromptFacetsResult;
}

function parseScanPlan(value: unknown): ScanPlan {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !isNonNegativeSafeInteger(value.total_sources)
    || !isNonNegativeSafeInteger(value.available_sources)
    || !isNonNegativeSafeInteger(value.total_files)
    || !isNonNegativeSafeInteger(value.total_bytes)
    || !isNonNegativeSafeInteger(value.large_file_count)
    || !isNonNegativeSafeInteger(value.largest_file_bytes)
    || !Array.isArray(value.sources)
    || !value.sources.every(isSourcePlan)
    || !isStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanPlan;
}

function parseScanResult(value: unknown): ScanResult {
  if (!isRecord(value)
    || !isTimestampString(value.generated_at)
    || !(typeof value.output_path === "string" || value.output_path === null)
    || typeof value.markdown !== "string"
    || !isScanStats(value.stats)
    || !Array.isArray(value.prompts)
    || !value.prompts.every(isPromptRecord)
    || !isNonNegativeSafeInteger(value.returned_prompt_count)
    || typeof value.prompts_truncated !== "boolean"
    || typeof value.preview_sort !== "string"
    || typeof value.markdown_included !== "boolean"
    || typeof value.markdown_written !== "boolean"
    || !(isPersistStats(value.persistence) || value.persistence === null)
    || !isStringArray(value.warnings)) {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ScanResult;
}

function parseScanProgressResult(value: unknown): ScanProgress {
  if (!isRecord(value)
    || typeof value.run_id !== "string"
    || typeof value.active !== "boolean"
    || typeof value.canceled !== "boolean"
    || !(typeof value.source_id === "string" || value.source_id === null)
    || !(typeof value.source_label === "string" || value.source_label === null)
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
    || (value.source_index !== 0 && !isNonNegativeSafeIntegerAtMost(value.source_index, value.source_count))) {
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
