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
  source_summaries: SourceSummary[];
}

export interface ScanResult {
  generated_at: string;
  output_path: string | null;
  markdown: string;
  stats: ScanStats;
  prompts: PromptRecord[];
  returned_prompt_count: number;
  prompts_truncated: boolean;
  markdown_included: boolean;
  markdown_written: boolean;
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
