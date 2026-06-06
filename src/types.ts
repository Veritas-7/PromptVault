export interface FrequencyItem {
  text: string;
  count: number;
}

export interface SourceSummary {
  id: string;
  label: string;
  root_path: string;
  files_seen: number;
  prompts_found: number;
  average_quality: number;
  weak_prompt_count: number;
  status: string;
  notes: string[];
}

export interface PromptRecord {
  id: string;
  source: string;
  session_id: string;
  path: string;
  timestamp?: string | null;
  cwd?: string | null;
  text: string;
  word_count: number;
  char_count: number;
  hash: string;
  risk_flags: string[];
  quality: PromptQuality;
}

export interface PromptQuality {
  score: number;
  band: string;
  missing: string[];
  suggestions: string[];
}

export interface ScanStats {
  total_prompts: number;
  total_files: number;
  total_words: number;
  average_words: number;
  average_quality: number;
  weak_prompt_count: number;
  top_words: FrequencyItem[];
  top_phrases: FrequencyItem[];
  repeated_prompts: FrequencyItem[];
  top_quality_gaps: FrequencyItem[];
  prompts_by_date: FrequencyItem[];
  source_summaries: SourceSummary[];
}

export interface PersistStats {
  database_path: string;
  stored_prompt_count: number;
  inserted_prompt_count: number;
  updated_prompt_count: number;
  date_count: number;
}

export interface ScanResult {
  generated_at: string;
  output_path: string | null;
  markdown: string;
  stats: ScanStats;
  prompts: PromptRecord[];
  returned_prompt_count: number;
  prompts_truncated: boolean;
  preview_sort: string;
  markdown_included: boolean;
  markdown_written: boolean;
  persistence: PersistStats | null;
  warnings: string[];
}

export interface CancelScanResult {
  run_id: string;
  canceled: boolean;
}

export interface ScanProgress {
  run_id: string;
  active: boolean;
  canceled: boolean;
  source_id: string | null;
  source_label: string | null;
  source_index: number;
  source_count: number;
  files_seen: number;
  source_files_seen: number;
  source_files_discovered: number;
  source_file_count: number | null;
  prompts_found: number;
  limit: number | null;
  updated_at: string;
}

export interface SourcePlan {
  id: string;
  label: string;
  root_path: string;
  status: string;
  file_count: number;
  byte_count: number;
  large_file_count: number;
  largest_file_bytes: number;
  newest_modified_at?: string | null;
  notes: string[];
}

export interface ScanPlan {
  generated_at: string;
  total_sources: number;
  available_sources: number;
  total_files: number;
  total_bytes: number;
  large_file_count: number;
  largest_file_bytes: number;
  sources: SourcePlan[];
  warnings: string[];
}

export interface ImportState {
  source_id: string;
  source_label: string;
  root_path: string;
  total_files: number;
  total_bytes: number;
  next_file_index: number;
  processed_files: number;
  imported_prompt_count: number;
  completed: boolean;
  updated_at: string;
}

export interface ImportStatesResult {
  generated_at: string;
  database_path: string;
  states: ImportState[];
  total_sources: number;
  completed_sources: number;
  total_files: number;
  processed_files: number;
  imported_prompt_count: number;
}

export interface ImportEvent {
  id: number;
  generated_at: string;
  source_id: string;
  source_label: string;
  root_path: string;
  batch_start_index: number;
  batch_file_count: number;
  batch_prompt_count: number;
  processed_files: number;
  total_files: number;
  completed: boolean;
  warnings: string[];
}

export interface ImportEventsResult {
  generated_at: string;
  database_path: string;
  events: ImportEvent[];
  total_events: number;
}

export interface StoredPromptFacetsResult {
  generated_at: string;
  database_path: string;
  total_prompts: number;
  sources: FrequencyItem[];
  dates: FrequencyItem[];
  workspaces: FrequencyItem[];
}

export interface ImportBatchResult {
  generated_at: string;
  source: SourcePlan;
  state: ImportState;
  batch_start_index: number;
  batch_file_count: number;
  batch_prompt_count: number;
  returned_prompt_count: number;
  prompts: PromptRecord[];
  stats: ScanStats;
  persistence: PersistStats;
  warnings: string[];
}

export interface ImproveResult {
  provider: string;
  used_ai: boolean;
  revised_prompt: string;
  rationale: string[];
  checklist: string[];
  quality_delta: {
    before: PromptQuality;
    after: PromptQuality;
    score_delta: number;
    resolved_gaps: string[];
    remaining_gaps: string[];
  };
  warnings: string[];
}
