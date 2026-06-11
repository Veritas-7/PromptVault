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
  prompts_by_project?: FrequencyItem[];
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
  projects?: FrequencyItem[];
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
  session_evidence_mode: string;
  items: ProjectWorkItem[];
  warnings: string[];
}

export interface ProjectWorkStatusExportRow {
  date: string;
  project: string;
  operational_status: string;
  source_statuses: FrequencyItem[];
  work_item_count: number;
  source_file_count: number;
  source_files: string[];
  source_file_roles: FrequencyItem[];
  top_titles: string[];
  sample_evidence: string;
  latest_source_path: string;
  latest_source_file: string;
  latest_source_role: string;
  session_evidence_count: number;
  unique_session_evidence_count: number;
  session_evidence_reviewed_item_count: number;
  has_session_evidence_reviewed_item: boolean;
  session_sources: FrequencyItem[];
  needs_session_evidence: boolean;
  session_evidence_audit: string;
  needs_title_normalization: boolean;
  same_project_same_date_session_count: number;
  same_project_other_session_dates: FrequencyItem[];
  same_project_other_session_date_count: number;
  nearest_same_project_other_session_date: string | null;
  nearest_same_project_other_session_distance_days: number | null;
}

export interface ProjectWorkStatusExportResult {
  generated_at: string;
  database_path: string;
  markdown: string;
  total_row_count: number;
  row_offset: number;
  returned_row_count: number;
  next_row_offset: number | null;
  rows_truncated: boolean;
  report_total_items: number;
  report_project_count: number;
  report_date_count: number;
  report_files_seen: number;
  report_session_scan_prompt_count: number;
  report_session_evidence_count: number;
  report_unique_session_evidence_count: number;
  report_session_evidence_index_used: boolean;
  report_session_evidence_index_updated: boolean;
  report_session_evidence_index_count: number;
  report_session_evidence_index_total_count: number;
  report_session_evidence_mode: string;
  rows: ProjectWorkStatusExportRow[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceCandidate {
  candidate_id: string;
  date: string;
  project: string;
  operational_status: string;
  source_statuses: FrequencyItem[];
  work_item_count: number;
  source_file_count: number;
  source_files: string[];
  source_file_roles: FrequencyItem[];
  top_titles: string[];
  sample_evidence: string;
  latest_source_path: string;
  latest_source_file: string;
  latest_source_role: string;
  reason: string;
  session_evidence_audit: string;
  needs_title_normalization: boolean;
  same_project_same_date_session_count: number;
  same_project_other_session_dates: FrequencyItem[];
  same_project_other_session_date_count: number;
  nearest_same_project_other_session_date: string | null;
}

export interface ProjectWorkSessionEvidenceCandidatesResult {
  generated_at: string;
  database_path: string;
  requested_limit: number;
  session_limit_used: number;
  total_candidate_count: number;
  returned_candidate_count: number;
  report_total_rows: number;
  report_total_items: number;
  report_project_count: number;
  report_date_count: number;
  report_files_seen: number;
  report_session_scan_prompt_count: number;
  report_session_evidence_count: number;
  report_unique_session_evidence_count: number;
  report_session_evidence_index_used: boolean;
  report_session_evidence_index_updated: boolean;
  report_session_evidence_index_count: number;
  report_session_evidence_index_total_count: number;
  report_session_evidence_mode: string;
  bounded_session_limit_count: number;
  unresolved_after_full_index_count: number;
  needs_title_normalization_count: number;
  candidates: ProjectWorkSessionEvidenceCandidate[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceProposal {
  candidate_id: string;
  project: string;
  date: string;
  source_path: string;
  source_file: string;
  source_role: string;
  candidate_reason: string;
  proposal_kind: string;
  proposed_action: string;
  source_trace: string;
  confidence: number;
  accepted: boolean;
  rejection_reason: string | null;
  work_item_count: number;
  session_evidence_audit: string;
  needs_title_normalization: boolean;
  top_titles: string[];
  sample_evidence: string;
  risk_flags: string[];
}

export interface ProjectWorkSessionEvidenceProposalsResult {
  generated_at: string;
  database_path: string;
  provider: string;
  provider_model: string | null;
  provider_runtime: string;
  used_ai: boolean;
  total_candidate_count: number;
  returned_proposal_count: number;
  accepted_count: number;
  rejected_count: number;
  report_total_rows: number;
  report_total_items: number;
  report_project_count: number;
  report_date_count: number;
  report_files_seen: number;
  report_session_evidence_index_count: number;
  report_session_evidence_index_total_count: number;
  proposals: ProjectWorkSessionEvidenceProposal[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceReviewQueueItem {
  candidate_id: string;
  first_seen_at: string;
  last_seen_at: string;
  review_state: string;
  review_reason: string;
  project: string;
  date: string;
  operational_status: string;
  source_statuses: FrequencyItem[];
  work_item_count: number;
  source_file_count: number;
  source_files: string[];
  source_file_roles: FrequencyItem[];
  top_titles: string[];
  sample_evidence: string;
  latest_source_path: string;
  latest_source_file: string;
  latest_source_role: string;
  candidate_reason: string;
  session_evidence_audit: string;
  needs_title_normalization: boolean;
  same_project_same_date_session_count: number;
  same_project_other_session_dates: FrequencyItem[];
  same_project_other_session_date_count: number;
  nearest_same_project_other_session_date: string | null;
  source_review: ProjectWorkSessionEvidenceSourceProposal | null;
}

export interface ProjectWorkSessionEvidenceReviewQueueResult {
  generated_at: string;
  database_path: string;
  synced_candidate_count: number;
  stale_candidate_count: number;
  total_items: number;
  returned_item_count: number;
  pending_review_count: number;
  stale_count: number;
  deferred_count: number;
  approved_count: number;
  rejected_count: number;
  needs_title_normalization_count: number;
  items: ProjectWorkSessionEvidenceReviewQueueItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceReviewedItem {
  id: number;
  applied_at: string;
  candidate_id: string;
  review_reason: string;
  project: string;
  date: string;
  operational_status: string;
  source_statuses: FrequencyItem[];
  work_item_count: number;
  source_file_count: number;
  source_files: string[];
  source_file_roles: FrequencyItem[];
  top_titles: string[];
  sample_evidence: string;
  latest_source_path: string;
  latest_source_file: string;
  latest_source_role: string;
  candidate_reason: string;
  session_evidence_audit: string;
  needs_title_normalization: boolean;
  same_project_same_date_session_count: number;
  same_project_other_session_dates: FrequencyItem[];
  same_project_other_session_date_count: number;
  nearest_same_project_other_session_date: string | null;
  source_review: ProjectWorkSessionEvidenceSourceProposal | null;
}

export interface ProjectWorkSessionEvidenceReviewApplyResult {
  generated_at: string;
  database_path: string;
  approved_queue_count: number;
  processed_queue_count: number;
  applied_item_count: number;
  skipped_existing_count: number;
  total_reviewed_item_count: number;
  returned_item_count: number;
  items: ProjectWorkSessionEvidenceReviewedItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceReviewedItemsResult {
  generated_at: string;
  database_path: string;
  total_items: number;
  returned_item_count: number;
  available_dates: string[];
  available_projects: string[];
  items: ProjectWorkSessionEvidenceReviewedItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceNearbyItem {
  id: string;
  source: string;
  session_id: string;
  source_path: string;
  timestamp: string | null;
  prompt_date: string;
  cwd: string | null;
  date_distance_days: number | null;
  match_score: number;
  matched_terms: string[];
  excerpt: string;
  word_count: number;
  char_count: number;
  risk_flags: string[];
}

export interface ProjectWorkSessionEvidenceNearbyResult {
  generated_at: string;
  database_path: string;
  project: string;
  date: string;
  query: string | null;
  query_term_count: number;
  requested_limit: number;
  total_match_count: number;
  returned_item_count: number;
  items: ProjectWorkSessionEvidenceNearbyItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceSourceSearchItem {
  id: string;
  line_number: number;
  session_id: string | null;
  timestamp: string | null;
  cwd: string | null;
  match_score: number;
  matched_terms: string[];
  excerpt: string;
  word_count: number;
  char_count: number;
  risk_flags: string[];
}

export interface ProjectWorkSessionEvidenceSourceSearchResult {
  generated_at: string;
  source_path: string;
  query: string;
  query_term_count: number;
  requested_limit: number;
  requested_max_lines: number;
  scanned_line_count: number;
  matched_line_count: number;
  returned_item_count: number;
  items: ProjectWorkSessionEvidenceSourceSearchItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceSourceProposal {
  candidate_id: string;
  project: string;
  date: string;
  source_path: string;
  source_line_number: number;
  source_session_id: string | null;
  source_timestamp: string | null;
  source_cwd: string | null;
  source_search_hit_id: string;
  proposal_kind: string;
  proposed_action: string;
  source_trace: string;
  trace_validated: boolean;
  review_ready: boolean;
  blocker_reason: string | null;
  match_score: number;
  matched_terms: string[];
  confidence: number;
  risk_flags: string[];
}

export interface ProjectWorkSessionEvidenceSourceProposalsResult {
  generated_at: string;
  database_path: string;
  candidate_id: string;
  project: string;
  date: string;
  source_path: string;
  query: string;
  query_term_count: number;
  scanned_line_count: number;
  matched_line_count: number;
  returned_proposal_count: number;
  review_ready_count: number;
  blocked_count: number;
  proposals: ProjectWorkSessionEvidenceSourceProposal[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceSourceAuditItem {
  candidate_id: string;
  project: string;
  date: string;
  review_state: string;
  review_reason: string;
  outcome: string;
  recommended_source_path: string | null;
  recommended_session_id: string | null;
  recommended_prompt_date: string | null;
  recommended_match_score: number | null;
  nearby_total_match_count: number;
  nearby_returned_item_count: number;
  source_search_scanned_line_count: number;
  source_search_matched_line_count: number;
  source_search_returned_item_count: number;
  returned_proposal_count: number;
  review_ready_count: number;
  blocked_count: number;
  blocker_reason_counts: FrequencyItem[];
  risk_flag_counts: FrequencyItem[];
  warnings: string[];
}

export interface ProjectWorkSessionEvidenceSourceAuditOperatorPlan {
  review_ready_count: number;
  manual_defer_count: number;
  bulk_reject_count: number;
  manual_inspect_count: number;
  approval_requires_source_review_count: number;
  review_ready_candidate_ids: string[];
  manual_defer_candidate_ids: string[];
  bulk_reject_candidate_ids: string[];
  manual_inspect_candidate_ids: string[];
}

export interface ProjectWorkSessionEvidenceSourceAuditResult {
  generated_at: string;
  database_path: string;
  requested_limit: number;
  nearby_limit_used: number;
  source_limit_used: number;
  max_lines_used: number;
  total_items: number;
  returned_item_count: number;
  audited_item_count: number;
  no_recommended_source_count: number;
  no_source_hit_count: number;
  rows_with_review_ready_count: number;
  rows_with_blocked_proposals_count: number;
  total_review_ready_count: number;
  total_blocked_count: number;
  outcome_counts: FrequencyItem[];
  blocker_reason_counts: FrequencyItem[];
  risk_flag_counts: FrequencyItem[];
  operator_plan: ProjectWorkSessionEvidenceSourceAuditOperatorPlan;
  items: ProjectWorkSessionEvidenceSourceAuditItem[];
  warnings: string[];
}

export interface ProjectWorkSessionIndexSourceState {
  source_id: string;
  source_label: string;
  root_path: string;
  total_files: number;
  next_file_index: number;
  processed_files: number;
  matched_prompt_count: number;
  completed: boolean;
  updated_at: string;
}

export interface ProjectWorkSessionIndexResult {
  generated_at: string;
  database_path: string;
  requested_limit: number;
  batch_files: number | null;
  max_batches: number | null;
  until_complete: boolean;
  batches_run: number;
  scanned_prompt_count: number;
  sanitized_prompt_count: number;
  stored_prompt_count: number;
  reset: boolean;
  all_sources_completed: boolean;
  source_states: ProjectWorkSessionIndexSourceState[];
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
  unreadable_file_count: number;
  pointer_file_count: number;
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
  skipped_pointer_file_count: number;
  review_queue_state: string;
  review_queue_reason: string;
  pending_review_count: number;
  safe_ai_candidate_count: number;
  risk_blocked_candidate_count: number;
  candidate_count: number;
  candidates: ProjectWorkLogExtractionCandidate[];
  warnings: string[];
}

export interface ProjectWorkLogReviewQueueItem {
  candidate_id: string;
  first_seen_at: string;
  last_seen_at: string;
  review_state: string;
  review_reason: string;
  provider_route: string;
  project: string;
  source_path: string;
  source_file: string;
  candidate_reason: string;
  excerpt: string;
  line_count: number;
  char_count: number;
  risk_flags: string[];
  modified_at: string | null;
}

export interface ProjectWorkLogReviewQueueResult {
  generated_at: string;
  database_path: string;
  synced_candidate_count: number;
  stale_candidate_count: number;
  total_items: number;
  returned_item_count: number;
  pending_ai_review_count: number;
  risk_blocked_count: number;
  stale_count: number;
  approved_count: number;
  rejected_count: number;
  items: ProjectWorkLogReviewQueueItem[];
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
  provider_model: string | null;
  provider_runtime: string;
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
  provider_model: string | null;
  provider_runtime: string;
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

export interface ProjectWorkLogExtractionRun {
  id: number;
  started_at: string;
  finished_at: string;
  trigger: string;
  status: string;
  provider: string;
  provider_model: string | null;
  provider_runtime: string;
  used_ai: boolean;
  candidate_count: number;
  accepted_count: number;
  rejected_count: number;
  saved_item_count: number;
  total_saved_item_count: number;
  candidate_ids: string[];
  warnings: string[];
  error_message: string | null;
}

export interface ProjectWorkLogExtractionRunsResult {
  generated_at: string;
  database_path: string;
  total_runs: number;
  returned_run_count: number;
  runs: ProjectWorkLogExtractionRun[];
  warnings: string[];
}

export interface ProjectWorkLogNormalizationCandidate {
  candidate_id: string;
  project: string;
  date: string;
  title: string;
  status: string;
  source_path: string;
  source_file: string;
  reason: string;
  evidence: string;
  work_item_count: number;
  session_evidence_count: number;
  saved_extraction_count: number;
  ai_saved_extraction_count: number;
  best_ai_confidence: number | null;
  risk_flags: string[];
}

export interface ProjectWorkLogNormalizationCandidatesResult {
  generated_at: string;
  database_path: string;
  total_candidate_count: number;
  returned_candidate_count: number;
  report_total_items: number;
  report_project_count: number;
  report_date_count: number;
  candidates: ProjectWorkLogNormalizationCandidate[];
  warnings: string[];
}

export interface ProjectWorkLogNormalizationProposal {
  candidate_id: string;
  project: string;
  date: string;
  source_path: string;
  source_file: string;
  reason: string;
  original_title: string;
  original_status: string;
  original_evidence: string;
  normalized_title: string;
  normalized_status: string;
  normalized_evidence: string;
  confidence: number;
  accepted: boolean;
  rejection_reason: string | null;
  work_item_count: number;
  session_evidence_count: number;
  saved_extraction_count: number;
  ai_saved_extraction_count: number;
  best_ai_confidence: number | null;
  risk_flags: string[];
}

export interface ProjectWorkLogNormalizationProposalsResult {
  generated_at: string;
  database_path: string;
  provider: string;
  provider_model: string | null;
  provider_runtime: string;
  used_ai: boolean;
  total_candidate_count: number;
  returned_proposal_count: number;
  accepted_count: number;
  rejected_count: number;
  report_total_items: number;
  report_project_count: number;
  report_date_count: number;
  proposals: ProjectWorkLogNormalizationProposal[];
  warnings: string[];
}

export interface ProjectWorkLogNormalizationReviewQueueItem
  extends ProjectWorkLogNormalizationProposal {
  first_seen_at: string;
  last_seen_at: string;
  review_state: "pending_review" | "stale" | "approved" | "rejected";
  review_reason: string;
  provider: string;
  provider_model: string | null;
  provider_runtime: string;
  used_ai: boolean;
}

export interface ProjectWorkLogNormalizationReviewQueueResult {
  generated_at: string;
  database_path: string;
  synced_proposal_count: number;
  stale_proposal_count: number;
  total_items: number;
  returned_item_count: number;
  pending_review_count: number;
  stale_count: number;
  approved_count: number;
  rejected_count: number;
  accepted_proposal_count: number;
  rejected_proposal_count: number;
  items: ProjectWorkLogNormalizationReviewQueueItem[];
  warnings: string[];
}

export interface ProjectWorkLogNormalizationApplyOptions {
  database_path?: string;
  limit?: number;
}

export interface ProjectWorkLogNormalizedItemsOptions {
  database_path?: string;
  limit?: number;
  date?: string;
  project?: string;
}

export interface ProjectWorkLogNormalizedItem extends ProjectWorkLogNormalizationProposal {
  id: number;
  applied_at: string;
  review_reason: string;
  provider: string;
  provider_model: string | null;
  provider_runtime: string;
  used_ai: boolean;
}

export interface ProjectWorkLogNormalizationApplyResult {
  generated_at: string;
  database_path: string;
  approved_queue_count: number;
  processed_queue_count: number;
  applied_item_count: number;
  skipped_existing_count: number;
  total_applied_item_count: number;
  returned_item_count: number;
  items: ProjectWorkLogNormalizedItem[];
  warnings: string[];
}

export interface ProjectWorkLogNormalizedItemsResult {
  generated_at: string;
  database_path: string;
  total_items: number;
  returned_item_count: number;
  available_dates: string[];
  available_projects: string[];
  items: ProjectWorkLogNormalizedItem[];
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

export interface ProjectWorkAiProviderStatusProvider {
  provider: string;
  provider_runtime: string;
  configured: boolean;
  usable_for_work_management: boolean;
  capabilities: string[];
  model: string | null;
  endpoint: string | null;
  timeout_seconds: number | null;
  notes: string[];
}

export interface ProjectWorkAiProviderStatusResult {
  generated_at: string;
  external_provider_available: boolean;
  fallback_provider: string;
  providers: ProjectWorkAiProviderStatusProvider[];
  warnings: string[];
}

export interface ProjectWorkAiProviderHealthProvider {
  provider: string;
  provider_runtime: string;
  configured: boolean;
  probe_attempted: boolean;
  live_ok: boolean;
  health_status: string;
  model: string | null;
  endpoint: string | null;
  timeout_seconds: number | null;
  duration_ms: number | null;
  http_status: number | null;
  error: string | null;
  notes: string[];
}

export interface ProjectWorkAiProviderHealthResult {
  generated_at: string;
  live_provider_available: boolean;
  providers: ProjectWorkAiProviderHealthProvider[];
  warnings: string[];
}
