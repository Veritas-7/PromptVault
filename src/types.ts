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
  timestamp: string | null;
  cwd: string | null;
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
  newest_modified_at: string | null;
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

export interface ProjectWorkItem {
  date: string;
  project: string;
  title: string;
  status: string;
  source_path: string;
  source_file: string;
  evidence: string;
  session_evidence_count: number;
  session_sources: FrequencyItem[];
}

export interface ProjectWorkReport {
  generated_at: string;
  total_items: number;
  project_count: number;
  date_count: number;
  files_seen: number;
  items_by_date: FrequencyItem[];
  items_by_project: FrequencyItem[];
  session_scan_prompt_count: number;
  session_scan_sources: FrequencyItem[];
  session_evidence_count: number;
  session_sources: FrequencyItem[];
  session_evidence_unique_count: number;
  session_evidence_unique_sources: FrequencyItem[];
  session_evidence_index_used: boolean;
  session_evidence_index_updated: boolean;
  session_evidence_index_count: number;
  items: ProjectWorkItem[];
  warnings: string[];
}

export interface ProjectWorkLogCoverageFile {
  project: string;
  source_path: string;
  source_file: string;
  status: string;
  work_item_count: number;
  latest_date: string | null;
  latest_title: string | null;
  modified_at: string | null;
}

export interface ProjectWorkLogCoverageResult {
  generated_at: string;
  root_path: string;
  files_seen: number;
  parsed_file_count: number;
  unparsed_file_count: number;
  project_count: number;
  work_item_count: number;
  files: ProjectWorkLogCoverageFile[];
  warnings: string[];
}

export interface ProjectWorkLogExtractionCandidate {
  candidate_id: string;
  project: string;
  source_path: string;
  source_file: string;
  reason: string;
  excerpt: string;
  line_count: number;
  char_count: number;
  risk_flags: string[];
  modified_at: string | null;
}

export interface ProjectWorkLogExtractionCandidatesResult {
  generated_at: string;
  root_path: string;
  files_seen: number;
  skipped_parsed_file_count: number;
  skipped_unreadable_file_count: number;
  skipped_empty_file_count: number;
  candidate_count: number;
  candidates: ProjectWorkLogExtractionCandidate[];
  warnings: string[];
}

export interface ProjectWorkLogExtractionProposal {
  candidate_id: string;
  project: string;
  source_path: string;
  source_file: string;
  date: string | null;
  title: string;
  status: string;
  evidence: string;
  confidence: number;
  accepted: boolean;
  rejection_reason: string | null;
}

export interface ProjectWorkLogExtractionProposalsResult {
  generated_at: string;
  root_path: string;
  provider: string;
  used_ai: boolean;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  proposals: ProjectWorkLogExtractionProposal[];
  persistence: ProjectWorkLogExtractionPersistence | null;
  warnings: string[];
}

export interface ProjectWorkLogExtractionPersistence {
  database_path: string;
  saved_item_count: number;
  total_saved_item_count: number;
}

export interface ProjectWorkLogExtractionItem {
  id: number;
  saved_at: string;
  run_generated_at: string;
  provider: string;
  used_ai: boolean;
  candidate_id: string;
  project: string;
  source_path: string;
  source_file: string;
  date: string;
  title: string;
  status: string;
  evidence: string;
  confidence: number;
  warnings: string[];
}

export interface ProjectWorkLogExtractionItemsResult {
  generated_at: string;
  database_path: string;
  total_items: number;
  returned_item_count: number;
  available_dates: string[];
  available_projects: string[];
  items: ProjectWorkLogExtractionItem[];
  warnings: string[];
}

export interface ProjectWorkLogExtractionMergeResult {
  provider: string;
  used_ai: boolean;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  merged_item_count: number;
  warnings: string[];
}

export interface ProjectWorkSummaryCitation {
  id: string;
  date: string;
  project: string;
  title: string;
  status: string;
  source_path: string;
  source_file: string;
  evidence: string;
  session_evidence_count: number;
  session_sources: FrequencyItem[];
}

export interface ProjectWorkSummary {
  date: string;
  project: string;
  headline: string;
  work_item_count: number;
  session_evidence_count: number;
  unique_session_evidence_count: number;
  citations: ProjectWorkSummaryCitation[];
  next_actions: string[];
}

export interface ProjectWorkSummaryPersistence {
  database_path: string;
  snapshot_id: number;
  snapshot_count: number;
}

export interface ProjectWorkSummaryResult {
  generated_at: string;
  provider: string;
  used_ai: boolean;
  narrative_markdown: string;
  summaries: ProjectWorkSummary[];
  report: ProjectWorkReport;
  extraction_merge: ProjectWorkLogExtractionMergeResult | null;
  persistence: ProjectWorkSummaryPersistence | null;
  warnings: string[];
}

export interface ProjectWorkSummarySnapshot {
  id: number;
  created_at: string;
  provider: string;
  used_ai: boolean;
  narrative_markdown: string;
  total_items: number;
  project_count: number;
  date_count: number;
  files_seen: number;
  session_evidence_count: number;
  session_evidence_unique_count: number;
  summary_count: number;
  summaries: ProjectWorkSummary[];
  extraction_merge: ProjectWorkLogExtractionMergeResult | null;
  warnings: string[];
}

export interface ProjectWorkSummarySnapshotsResult {
  generated_at: string;
  database_path: string;
  total_snapshots: number;
  returned_snapshot_count: number;
  available_dates: string[];
  available_projects: string[];
  snapshots: ProjectWorkSummarySnapshot[];
  warnings: string[];
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
  persistence: {
    database_path: string;
    improvement_event_id: number;
    prompt_improvement_count: number;
  } | null;
}
