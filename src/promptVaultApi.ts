import { invoke } from "@tauri-apps/api/core";
import { bridgeEndpoint, browserBridgeUnavailableMessage, hasTauriInvoke } from "./browserBridge";
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
  return postBridge<ImportStatesResult>("/api/import-states", { options });
}

export async function listImportEvents(options: ImportEventsOptions = {}): Promise<ImportEventsResult> {
  if (hasTauriInvoke()) {
    return invoke<ImportEventsResult>("list_import_events", { options });
  }
  return postBridge<ImportEventsResult>("/api/import-events", { options });
}

export async function listStoredPromptFacets(
  options: StoredPromptFacetsOptions = {},
): Promise<StoredPromptFacetsResult> {
  if (hasTauriInvoke()) {
    return invoke<StoredPromptFacetsResult>("list_stored_prompt_facets", { options });
  }
  return postBridge<StoredPromptFacetsResult>("/api/prompt-facets", { options });
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
  return postBridge<ScanProgress>("/api/scan/progress", { options });
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

async function postBridge<T>(path: string, body: unknown): Promise<T> {
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

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `PromptVault 브라우저 브리지가 HTTP ${response.status}를 반환했습니다.`);
  }

  return JSON.parse(text) as T;
}
