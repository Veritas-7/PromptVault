import { invoke } from "@tauri-apps/api/core";
import { bridgeEndpoint, browserBridgeUnavailableMessage, hasTauriInvoke } from "./browserBridge.ts";
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
  return postBridge<ScanPlan>("/api/plan", { options });
}

export async function importBatch(options: ImportBatchOptions): Promise<ImportBatchResult> {
  if (hasTauriInvoke()) {
    return invoke<ImportBatchResult>("import_batch", { options });
  }
  return postBridge<ImportBatchResult>("/api/import-batch", { options });
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
  return postBridge<ScanResult>("/api/prompts", { options });
}

export async function scanPrompts(options: ScanPromptOptions): Promise<ScanResult> {
  if (hasTauriInvoke()) {
    return invoke<ScanResult>("scan_prompts", { options });
  }
  return postBridge<ScanResult>("/api/scan", { options });
}

export async function cancelScan(run_id: string): Promise<CancelScanResult> {
  const options: CancelScanOptions = { run_id };
  if (hasTauriInvoke()) {
    return invoke<CancelScanResult>("cancel_scan", { options });
  }
  return postBridge<CancelScanResult>("/api/scan/cancel", { options });
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
  return postBridge<ImproveResult>("/api/improve", { request });
}

export function isBrowserQaMode(): boolean {
  return !hasTauriInvoke();
}

const MALFORMED_BRIDGE_RESPONSE_MESSAGE = "PromptVault 브라우저 브리지 응답 형식이 올바르지 않습니다.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFrequencyItem(value: unknown): boolean {
  return isRecord(value) && typeof value.text === "string" && typeof value.count === "number";
}

function isImportState(value: unknown): boolean {
  return isRecord(value)
    && typeof value.source_id === "string"
    && typeof value.source_label === "string"
    && typeof value.root_path === "string"
    && typeof value.total_files === "number"
    && typeof value.total_bytes === "number"
    && typeof value.next_file_index === "number"
    && typeof value.processed_files === "number"
    && typeof value.imported_prompt_count === "number"
    && typeof value.completed === "boolean"
    && typeof value.updated_at === "string";
}

function isImportEvent(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === "number"
    && typeof value.generated_at === "string"
    && typeof value.source_id === "string"
    && typeof value.source_label === "string"
    && typeof value.root_path === "string"
    && typeof value.batch_start_index === "number"
    && typeof value.batch_file_count === "number"
    && typeof value.batch_prompt_count === "number"
    && typeof value.processed_files === "number"
    && typeof value.total_files === "number"
    && typeof value.completed === "boolean"
    && Array.isArray(value.warnings)
    && value.warnings.every((warning) => typeof warning === "string");
}

function parseImportStatesResult(value: unknown): ImportStatesResult {
  if (!isRecord(value)
    || typeof value.generated_at !== "string"
    || typeof value.database_path !== "string"
    || !Array.isArray(value.states)
    || !value.states.every(isImportState)
    || typeof value.total_sources !== "number"
    || typeof value.completed_sources !== "number"
    || typeof value.total_files !== "number"
    || typeof value.processed_files !== "number"
    || typeof value.imported_prompt_count !== "number") {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportStatesResult;
}

function parseImportEventsResult(value: unknown): ImportEventsResult {
  if (!isRecord(value)
    || typeof value.generated_at !== "string"
    || typeof value.database_path !== "string"
    || !Array.isArray(value.events)
    || !value.events.every(isImportEvent)
    || typeof value.total_events !== "number") {
    throw new Error(MALFORMED_BRIDGE_RESPONSE_MESSAGE);
  }
  return value as unknown as ImportEventsResult;
}

function parseStoredPromptFacetsResult(value: unknown): StoredPromptFacetsResult {
  if (!isRecord(value)
    || typeof value.generated_at !== "string"
    || typeof value.database_path !== "string"
    || typeof value.total_prompts !== "number"
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

function parseScanProgressResult(value: unknown): ScanProgress {
  if (!isRecord(value)
    || typeof value.run_id !== "string"
    || typeof value.active !== "boolean"
    || typeof value.canceled !== "boolean"
    || !(typeof value.source_id === "string" || value.source_id === null)
    || !(typeof value.source_label === "string" || value.source_label === null)
    || typeof value.source_index !== "number"
    || typeof value.source_count !== "number"
    || typeof value.files_seen !== "number"
    || typeof value.source_files_seen !== "number"
    || typeof value.source_files_discovered !== "number"
    || !(typeof value.source_file_count === "number" || value.source_file_count === null)
    || typeof value.prompts_found !== "number"
    || !(typeof value.limit === "number" || value.limit === null)
    || typeof value.updated_at !== "string") {
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

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new Error("PromptVault 브라우저 브리지 응답을 읽지 못했습니다.");
  }

  if (!response.ok) {
    throw new Error(text || `PromptVault 브라우저 브리지가 HTTP ${response.status}를 반환했습니다.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("PromptVault 브라우저 브리지 응답을 JSON으로 해석하지 못했습니다.");
  }
  return validate ? validate(parsed) : parsed as T;
}
