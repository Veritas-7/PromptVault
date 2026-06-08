use chrono::{Local, TimeZone, Utc};
use regex::{Captures, Regex};
use rusqlite::{Connection, OpenFlags, ToSql};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use walkdir::WalkDir;

const APP_DIR_NAME: &str = "PromptVault";
const USER_SECRET_ENV_RELATIVE_PATH: &str = "Ai/System/70_Governance/🔐 Secrets/secrets.env";
const PROMPTVAULT_SECRET_ENV_RELATIVE_PATH: &str = ".config/promptvault/secrets.env";
const DEFAULT_OPENAI_RESPONSES_ENDPOINT: &str = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL: &str = "gpt-5.2";
const DEFAULT_GLM_CHAT_ENDPOINT: &str = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_GLM_MODEL: &str = "glm-4.6";
const LARGE_SOURCE_FILE_COUNT: usize = 10_000;
const LARGE_SOURCE_BYTES: u64 = 5 * 1024 * 1024 * 1024;
const LARGE_FILE_BYTES: u64 = 50 * 1024 * 1024;
const PROJECT_PROGRESS_MAX_DEPTH: usize = 4;
const PROJECT_PROGRESS_HEAD_CHARS: usize = 24_000;
const PROJECT_PROGRESS_TAIL_CHARS: usize = 8_000;
const DEFAULT_IMPORT_EVENT_LIMIT: usize = 20;
const MAX_IMPORT_EVENT_LIMIT: usize = 100;
const DEFAULT_STORED_PROMPT_LIMIT: usize = 200;
const MAX_STORED_PROMPT_LIMIT: usize = 1_000;
const DEFAULT_STORED_FACET_LIMIT: usize = 50;
const MAX_STORED_FACET_LIMIT: usize = 200;
const SQLITE_DELETE_CHUNK_SIZE: usize = 500;
const SCAN_CANCELED_WARNING: &str = "사용자 요청으로 스캔이 취소되어 일부 결과만 반환합니다.";
const SCAN_CANCELED_NOT_PERSISTED_WARNING: &str = "취소된 스캔은 저장소에 저장하지 않았습니다.";

type ScanCancelFlag = Arc<AtomicBool>;

static SCAN_CANCEL_FLAGS: OnceLock<Mutex<HashMap<String, ScanCancelFlag>>> = OnceLock::new();
static SCAN_PROGRESS: OnceLock<Mutex<HashMap<String, ScanProgress>>> = OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptRecord {
    pub id: String,
    pub source: String,
    pub session_id: String,
    pub path: String,
    pub timestamp: Option<String>,
    pub cwd: Option<String>,
    pub text: String,
    pub word_count: usize,
    pub char_count: usize,
    pub hash: String,
    pub risk_flags: Vec<String>,
    pub quality: PromptQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PromptQuality {
    pub score: u8,
    pub band: String,
    pub missing: Vec<String>,
    pub suggestions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceSummary {
    pub id: String,
    pub label: String,
    pub root_path: String,
    pub files_seen: usize,
    pub prompts_found: usize,
    pub average_quality: f64,
    pub weak_prompt_count: usize,
    pub status: String,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequencyItem {
    pub text: String,
    pub count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanStats {
    pub total_prompts: usize,
    pub total_files: usize,
    pub total_words: usize,
    pub average_words: f64,
    pub average_quality: f64,
    pub weak_prompt_count: usize,
    pub top_words: Vec<FrequencyItem>,
    pub top_phrases: Vec<FrequencyItem>,
    pub repeated_prompts: Vec<FrequencyItem>,
    pub top_quality_gaps: Vec<FrequencyItem>,
    pub prompts_by_date: Vec<FrequencyItem>,
    pub source_summaries: Vec<SourceSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistStats {
    pub database_path: String,
    pub stored_prompt_count: usize,
    pub inserted_prompt_count: usize,
    pub updated_prompt_count: usize,
    pub date_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub generated_at: String,
    pub output_path: Option<String>,
    pub markdown: String,
    pub stats: ScanStats,
    pub prompts: Vec<PromptRecord>,
    pub returned_prompt_count: usize,
    pub prompts_truncated: bool,
    pub preview_sort: String,
    pub markdown_included: bool,
    pub markdown_written: bool,
    pub persistence: Option<PersistStats>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourcePlan {
    pub id: String,
    pub label: String,
    pub root_path: String,
    pub status: String,
    pub file_count: usize,
    pub byte_count: u64,
    pub large_file_count: usize,
    pub largest_file_bytes: u64,
    pub newest_modified_at: Option<String>,
    pub notes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanPlan {
    pub generated_at: String,
    pub total_sources: usize,
    pub available_sources: usize,
    pub total_files: usize,
    pub total_bytes: u64,
    pub large_file_count: usize,
    pub largest_file_bytes: u64,
    pub sources: Vec<SourcePlan>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CancelScanResult {
    pub run_id: String,
    pub canceled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub run_id: String,
    pub active: bool,
    pub canceled: bool,
    pub source_id: Option<String>,
    pub source_label: Option<String>,
    pub source_index: usize,
    pub source_count: usize,
    pub files_seen: usize,
    pub source_files_seen: usize,
    pub source_files_discovered: usize,
    pub source_file_count: Option<usize>,
    pub prompts_found: usize,
    pub limit: Option<usize>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportState {
    pub source_id: String,
    pub source_label: String,
    pub root_path: String,
    pub total_files: usize,
    pub total_bytes: u64,
    pub next_file_index: usize,
    pub processed_files: usize,
    pub imported_prompt_count: usize,
    pub completed: bool,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportBatchResult {
    pub generated_at: String,
    pub source: SourcePlan,
    pub state: ImportState,
    pub batch_start_index: usize,
    pub batch_file_count: usize,
    pub batch_prompt_count: usize,
    pub returned_prompt_count: usize,
    pub prompts: Vec<PromptRecord>,
    pub stats: ScanStats,
    pub persistence: PersistStats,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportStatesResult {
    pub generated_at: String,
    pub database_path: String,
    pub states: Vec<ImportState>,
    pub total_sources: usize,
    pub completed_sources: usize,
    pub total_files: usize,
    pub processed_files: usize,
    pub imported_prompt_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportEvent {
    pub id: i64,
    pub generated_at: String,
    pub source_id: String,
    pub source_label: String,
    pub root_path: String,
    pub batch_start_index: usize,
    pub batch_file_count: usize,
    pub batch_prompt_count: usize,
    pub processed_files: usize,
    pub total_files: usize,
    pub completed: bool,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportEventsResult {
    pub generated_at: String,
    pub database_path: String,
    pub events: Vec<ImportEvent>,
    pub total_events: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredPromptFacetsResult {
    pub generated_at: String,
    pub database_path: String,
    pub total_prompts: usize,
    pub sources: Vec<FrequencyItem>,
    pub dates: Vec<FrequencyItem>,
    pub workspaces: Vec<FrequencyItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScanPlanOptions {
    pub source_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImportBatchOptions {
    pub source_id: String,
    pub file_batch_size: Option<usize>,
    pub reset: Option<bool>,
    pub preview_limit: Option<usize>,
    pub database_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImportStatesOptions {
    pub database_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImportEventsOptions {
    pub database_path: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoredPromptFacetsOptions {
    pub database_path: Option<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StoredPromptsOptions {
    pub database_path: Option<String>,
    pub limit: Option<usize>,
    pub query: Option<String>,
    pub source: Option<String>,
    pub date: Option<String>,
    pub workspace: Option<String>,
    pub preview_sort: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ImproveRequest {
    pub prompt: String,
    pub context: Option<String>,
    pub force_local: Option<bool>,
    pub prompt_id: Option<String>,
    pub source: Option<String>,
    pub database_path: Option<String>,
    pub persist: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImproveResult {
    pub provider: String,
    pub used_ai: bool,
    pub revised_prompt: String,
    pub rationale: Vec<String>,
    pub checklist: Vec<String>,
    pub quality_delta: QualityDelta,
    pub warnings: Vec<String>,
    pub persistence: Option<ImprovePersistence>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImprovePersistence {
    pub database_path: String,
    pub improvement_event_id: i64,
    pub prompt_improvement_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityDelta {
    pub before: PromptQuality,
    pub after: PromptQuality,
    pub score_delta: i16,
    pub resolved_gaps: Vec<String>,
    pub remaining_gaps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ScanOptions {
    pub limit: Option<usize>,
    pub output_path: Option<String>,
    pub preview_limit: Option<usize>,
    pub preview_sort: Option<String>,
    pub include_markdown: Option<bool>,
    pub write_markdown: Option<bool>,
    pub source_ids: Option<Vec<String>>,
    pub source_limit: Option<usize>,
    pub persist: Option<bool>,
    pub persist_on_cancel: Option<bool>,
    pub database_path: Option<String>,
    pub run_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CancelScanOptions {
    pub run_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgressOptions {
    pub run_id: String,
}

#[derive(Debug, Clone)]
pub struct SourceSpec {
    pub id: &'static str,
    pub label: &'static str,
    pub root: PathBuf,
    kind: SourceKind,
}

#[derive(Debug, Clone, Copy)]
enum SourceKind {
    CodexJsonl,
    ClaudeProjectJsonl,
    ClaudeTranscriptJsonl,
    ClaudeHistoryJsonl,
    AntigravityTranscriptJsonl,
    AntigravityHistoryJsonl,
    AntigravityConversationSqlite,
    GeminiTmpChatJson,
    ProjectProgressMarkdown,
}

#[tauri::command]
fn scan_prompts(options: Option<ScanOptions>) -> Result<ScanResult, String> {
    let opts = options.unwrap_or_default();
    run_scan(opts).map_err(|err| err.to_string())
}

#[tauri::command]
fn cancel_scan(options: CancelScanOptions) -> Result<CancelScanResult, String> {
    cancel_scan_run(options).map_err(|err| err.to_string())
}

#[tauri::command]
fn scan_progress(options: ScanProgressOptions) -> Result<ScanProgress, String> {
    scan_progress_run(options).map_err(|err| err.to_string())
}

#[tauri::command]
fn plan_scan(options: Option<ScanPlanOptions>) -> Result<ScanPlan, String> {
    let opts = options.unwrap_or_default();
    build_scan_plan(opts).map_err(|err| err.to_string())
}

#[tauri::command]
fn import_batch(options: ImportBatchOptions) -> Result<ImportBatchResult, String> {
    run_import_batch(options).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_import_states(options: Option<ImportStatesOptions>) -> Result<ImportStatesResult, String> {
    run_list_import_states(options.unwrap_or_default()).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_import_events(options: Option<ImportEventsOptions>) -> Result<ImportEventsResult, String> {
    run_list_import_events(options.unwrap_or_default()).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_stored_prompt_facets(
    options: Option<StoredPromptFacetsOptions>,
) -> Result<StoredPromptFacetsResult, String> {
    run_list_stored_prompt_facets(options.unwrap_or_default()).map_err(|err| err.to_string())
}

#[tauri::command]
fn load_stored_prompts(options: Option<StoredPromptsOptions>) -> Result<ScanResult, String> {
    run_load_stored_prompts(options.unwrap_or_default()).map_err(|err| err.to_string())
}

#[tauri::command]
async fn improve_prompt(request: ImproveRequest) -> Result<ImproveResult, String> {
    improve_prompt_inner(request)
        .await
        .map_err(|err| err.to_string())
}

fn scan_cancel_flags() -> &'static Mutex<HashMap<String, ScanCancelFlag>> {
    SCAN_CANCEL_FLAGS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn scan_progress_registry() -> &'static Mutex<HashMap<String, ScanProgress>> {
    SCAN_PROGRESS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn normalized_scan_run_id(
    run_id: Option<&str>,
) -> Result<Option<String>, Box<dyn std::error::Error>> {
    match run_id {
        Some(value) if value.trim().is_empty() => {
            Err("scan run_id requires a non-empty value".into())
        }
        Some(value) => Ok(Some(value.trim().to_string())),
        None => Ok(None),
    }
}

fn register_scan_run(
    run_id: Option<&str>,
) -> Result<Option<ScanCancelFlag>, Box<dyn std::error::Error>> {
    let Some(run_id) = run_id else {
        return Ok(None);
    };
    let flag = Arc::new(AtomicBool::new(false));
    let mut flags = scan_cancel_flags()
        .lock()
        .map_err(|_| "scan cancellation registry is unavailable")?;
    if flags.contains_key(run_id) {
        return Err(format!("scan run_id is already active: {run_id}").into());
    }
    flags.insert(run_id.to_string(), flag.clone());
    Ok(Some(flag))
}

fn inactive_scan_progress(run_id: String) -> ScanProgress {
    ScanProgress {
        run_id,
        active: false,
        canceled: false,
        source_id: None,
        source_label: None,
        source_index: 0,
        source_count: 0,
        files_seen: 0,
        source_files_seen: 0,
        source_files_discovered: 0,
        source_file_count: None,
        prompts_found: 0,
        limit: None,
        updated_at: Utc::now().to_rfc3339(),
    }
}

fn start_scan_progress(run_id: Option<&str>, source_count: usize, limit: usize) {
    let Some(run_id) = run_id else {
        return;
    };
    if let Ok(mut progress) = scan_progress_registry().lock() {
        progress.insert(
            run_id.to_string(),
            ScanProgress {
                run_id: run_id.to_string(),
                active: true,
                canceled: false,
                source_id: None,
                source_label: None,
                source_index: 0,
                source_count,
                files_seen: 0,
                source_files_seen: 0,
                source_files_discovered: 0,
                source_file_count: None,
                prompts_found: 0,
                limit: if limit == usize::MAX {
                    None
                } else {
                    Some(limit)
                },
                updated_at: Utc::now().to_rfc3339(),
            },
        );
    }
}

fn update_scan_progress<F>(run_id: Option<&str>, update: F)
where
    F: FnOnce(&mut ScanProgress),
{
    let Some(run_id) = run_id else {
        return;
    };
    if let Ok(mut progress) = scan_progress_registry().lock() {
        if let Some(progress) = progress.get_mut(run_id) {
            update(progress);
            progress.updated_at = Utc::now().to_rfc3339();
        }
    }
}

fn remove_scan_progress(run_id: &str) {
    if let Ok(mut progress) = scan_progress_registry().lock() {
        progress.remove(run_id);
    }
}

fn scan_cancel_requested(cancel_flag: Option<&ScanCancelFlag>) -> bool {
    cancel_flag
        .map(|flag| flag.load(Ordering::Relaxed))
        .unwrap_or(false)
}

fn push_scan_canceled_warning(warnings: &mut Vec<String>) {
    if !warnings
        .iter()
        .any(|warning| warning == SCAN_CANCELED_WARNING)
    {
        warnings.push(SCAN_CANCELED_WARNING.to_string());
    }
}

fn scan_was_canceled(warnings: &[String]) -> bool {
    warnings
        .iter()
        .any(|warning| warning == SCAN_CANCELED_WARNING)
}

fn should_persist_scan_result(persist: bool, persist_on_cancel: bool, warnings: &[String]) -> bool {
    persist && (persist_on_cancel || !scan_was_canceled(warnings))
}

pub fn run_scan(options: ScanOptions) -> Result<ScanResult, Box<dyn std::error::Error>> {
    let run_id = normalized_scan_run_id(options.run_id.as_deref())?;
    let cancel_flag = register_scan_run(run_id.as_deref())?;
    let result = run_scan_with_cancel(options, cancel_flag.as_ref());
    if let Some(run_id) = run_id {
        scan_cancel_flags()
            .lock()
            .map_err(|_| "scan cancellation registry is unavailable")?
            .remove(&run_id);
        remove_scan_progress(&run_id);
    }
    result
}

pub fn cancel_scan_run(
    options: CancelScanOptions,
) -> Result<CancelScanResult, Box<dyn std::error::Error>> {
    let run_id = normalized_scan_run_id(Some(options.run_id.as_str()))?
        .ok_or("scan run_id requires a non-empty value")?;
    let canceled = scan_cancel_flags()
        .lock()
        .map_err(|_| "scan cancellation registry is unavailable")?
        .get(&run_id)
        .map(|flag| {
            flag.store(true, Ordering::Relaxed);
            update_scan_progress(Some(&run_id), |progress| {
                progress.canceled = true;
            });
            true
        })
        .unwrap_or(false);
    Ok(CancelScanResult { run_id, canceled })
}

pub fn scan_progress_run(
    options: ScanProgressOptions,
) -> Result<ScanProgress, Box<dyn std::error::Error>> {
    let run_id = normalized_scan_run_id(Some(options.run_id.as_str()))?
        .ok_or("scan run_id requires a non-empty value")?;
    let progress = scan_progress_registry()
        .lock()
        .map_err(|_| "scan progress registry is unavailable")?
        .get(&run_id)
        .cloned()
        .unwrap_or_else(|| inactive_scan_progress(run_id));
    Ok(progress)
}

fn run_scan_with_cancel(
    options: ScanOptions,
    cancel_flag: Option<&ScanCancelFlag>,
) -> Result<ScanResult, Box<dyn std::error::Error>> {
    if matches!(options.limit, Some(0)) {
        return Err("scan limit requires a positive integer".into());
    }
    if matches!(options.source_limit, Some(0)) {
        return Err("scan source limit requires a positive integer".into());
    }
    let limit = options.limit.unwrap_or(usize::MAX);
    let source_limit = options.source_limit.unwrap_or(usize::MAX);
    let preview_limit = options.preview_limit;
    let include_markdown = options.include_markdown.unwrap_or(true);
    let write_markdown = options.write_markdown.unwrap_or(true);
    let persist = options.persist.unwrap_or(true);
    let persist_on_cancel = options.persist_on_cancel.unwrap_or(true);
    if matches!(options.output_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("output path requires a non-empty value".into());
    }
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    if !write_markdown && options.output_path.is_some() {
        return Err("output path cannot be used when markdown export is disabled".into());
    }
    let mut warnings = Vec::new();
    let preview_sort = PreviewSort::from_option(options.preview_sort.as_deref())?;
    validate_source_ids(options.source_ids.as_deref())?;
    let mut prompts = Vec::new();
    let mut summaries = Vec::new();
    let sources = selected_source_specs(options.source_ids.as_deref());
    let source_count = sources.len();
    let run_id = normalized_scan_run_id(options.run_id.as_deref())?;
    start_scan_progress(run_id.as_deref(), source_count, limit);

    for (source_index, source) in sources.into_iter().enumerate() {
        if scan_cancel_requested(cancel_flag) {
            update_scan_progress(run_id.as_deref(), |progress| {
                progress.canceled = true;
            });
            push_scan_canceled_warning(&mut warnings);
            break;
        }
        update_scan_progress(run_id.as_deref(), |progress| {
            progress.source_id = Some(source.id.to_string());
            progress.source_label = Some(source.label.to_string());
            progress.source_index = source_index + 1;
            progress.source_count = source_count;
            progress.source_files_seen = 0;
            progress.source_files_discovered = 0;
            progress.source_file_count = None;
        });
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "missing".to_string(),
            notes: Vec::new(),
        };

        if !source.root.exists() {
            summary.notes.push("이 머신에 경로가 없습니다.".to_string());
            summaries.push(summary);
            continue;
        }

        summary.status = "ok".to_string();
        match collect_from_source(
            &source,
            &mut summary,
            limit.saturating_sub(prompts.len()).min(source_limit),
            cancel_flag,
            run_id.as_deref(),
            prompts.len(),
        ) {
            Ok(mut found) => {
                summary.prompts_found = found.len();
                summarize_source_quality(&mut summary, &found);
                promote_source_notes_to_warning(&source, &mut summary, &mut warnings);
                prompts.append(&mut found);
            }
            Err(err) => {
                summary.status = "partial".to_string();
                summary.notes.push(err.to_string());
                warnings.push(format!("{}: {}", source.label, err));
            }
        }
        if scan_cancel_requested(cancel_flag) {
            summary.status = "partial".to_string();
            summary
                .notes
                .push("현재 파일 처리 후 스캔을 취소했습니다.".to_string());
            update_scan_progress(run_id.as_deref(), |progress| {
                progress.canceled = true;
            });
            push_scan_canceled_warning(&mut warnings);
            summaries.push(summary);
            break;
        }
        summaries.push(summary);

        if limit != usize::MAX && prompts.len() >= limit {
            warnings.push(format!(
                "설정된 제한 {limit}개 프롬프트에서 스캔을 중지했습니다."
            ));
            break;
        }
    }

    prompts.sort_by(|a, b| {
        let at = a.timestamp.as_deref().unwrap_or("");
        let bt = b.timestamp.as_deref().unwrap_or("");
        at.cmp(bt).then_with(|| a.source.cmp(&b.source))
    });
    prompts.dedup_by(|a, b| a.hash == b.hash && a.source == b.source);

    let stats = build_stats(&prompts, summaries);
    let generated_at = Utc::now().to_rfc3339();
    let should_render_markdown = write_markdown || include_markdown;
    let markdown = if should_render_markdown {
        render_markdown(&generated_at, &stats, &prompts, &warnings)
    } else {
        String::new()
    };
    let requested_output_path = options.output_path.map(PathBuf::from);
    let output_path = if write_markdown {
        Some(requested_output_path.unwrap_or_else(default_markdown_path))
    } else {
        None
    };

    if let Some(path) = &output_path {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(path, &markdown)?;
    }

    let should_persist = should_persist_scan_result(persist, persist_on_cancel, &warnings);
    if persist && !should_persist {
        warnings.push(SCAN_CANCELED_NOT_PERSISTED_WARNING.to_string());
    }

    let persistence = if should_persist {
        let database_path = options
            .database_path
            .as_deref()
            .map(PathBuf::from)
            .unwrap_or_else(default_database_path);
        Some(persist_scan_result(
            &database_path,
            &generated_at,
            &prompts,
            &stats,
            &warnings,
        )?)
    } else {
        None
    };

    let response_prompts = response_prompts(&prompts, preview_limit, preview_sort);
    let returned_prompt_count = response_prompts.len();
    let prompts_truncated = returned_prompt_count < prompts.len();
    let response_markdown = if include_markdown {
        markdown
    } else {
        String::new()
    };

    Ok(ScanResult {
        generated_at,
        output_path: output_path.map(|path| path.display().to_string()),
        markdown: response_markdown,
        stats,
        prompts: response_prompts,
        returned_prompt_count,
        prompts_truncated,
        preview_sort: preview_sort.as_str().to_string(),
        markdown_included: include_markdown,
        markdown_written: write_markdown,
        persistence,
        warnings,
    })
}

pub fn build_scan_plan(options: ScanPlanOptions) -> Result<ScanPlan, Box<dyn std::error::Error>> {
    validate_source_ids(options.source_ids.as_deref())?;
    let generated_at = Utc::now().to_rfc3339();
    let sources = selected_source_specs(options.source_ids.as_deref());
    Ok(build_scan_plan_for_sources(generated_at, sources))
}

pub fn run_import_batch(
    options: ImportBatchOptions,
) -> Result<ImportBatchResult, Box<dyn std::error::Error>> {
    let source_id = options.source_id.trim();
    if source_id.is_empty() {
        return Err("import batch requires a source_id".into());
    }
    validate_source_ids(Some(&[source_id.to_string()]))?;
    let file_batch_size = options.file_batch_size.unwrap_or(25);
    if file_batch_size == 0 {
        return Err("file_batch_size requires a positive integer".into());
    }
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    let database_path = options
        .database_path
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    let source = selected_source_specs(Some(&[source_id.to_string()]))
        .into_iter()
        .next()
        .ok_or("unknown source id")?;

    run_import_batch_for_source(
        &database_path,
        source,
        file_batch_size,
        options.reset.unwrap_or(false),
        options.preview_limit,
    )
}

pub fn run_list_import_states(
    options: ImportStatesOptions,
) -> Result<ImportStatesResult, Box<dyn std::error::Error>> {
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    let generated_at = Utc::now().to_rfc3339();
    let database_path = options
        .database_path
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    let conn = open_promptvault_database(&database_path)?;
    refresh_import_metadata_source_labels(&conn)?;
    let mut states = read_import_states(&conn)?;
    canonicalize_import_state_labels(&mut states);
    Ok(import_states_result(
        generated_at,
        database_path.display().to_string(),
        states,
    ))
}

pub fn run_list_import_events(
    options: ImportEventsOptions,
) -> Result<ImportEventsResult, Box<dyn std::error::Error>> {
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    if matches!(options.limit, Some(0)) {
        return Err("import event limit requires a positive integer".into());
    }
    let generated_at = Utc::now().to_rfc3339();
    let database_path = options
        .database_path
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    let limit = options
        .limit
        .unwrap_or(DEFAULT_IMPORT_EVENT_LIMIT)
        .min(MAX_IMPORT_EVENT_LIMIT);
    let conn = open_promptvault_database(&database_path)?;
    refresh_import_metadata_source_labels(&conn)?;
    let (mut events, total_events) = read_import_events(&conn, limit)?;
    canonicalize_import_event_labels(&mut events);
    Ok(ImportEventsResult {
        generated_at,
        database_path: database_path.display().to_string(),
        events,
        total_events,
    })
}

pub fn run_list_stored_prompt_facets(
    options: StoredPromptFacetsOptions,
) -> Result<StoredPromptFacetsResult, Box<dyn std::error::Error>> {
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    if matches!(options.limit, Some(0)) {
        return Err("stored prompt facet limit requires a positive integer".into());
    }
    let generated_at = Utc::now().to_rfc3339();
    let database_path = options
        .database_path
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    let limit = options
        .limit
        .unwrap_or(DEFAULT_STORED_FACET_LIMIT)
        .min(MAX_STORED_FACET_LIMIT);
    let conn = open_promptvault_database(&database_path)?;
    let total_prompts: i64 =
        conn.query_row("SELECT COUNT(*) FROM prompts", [], |row| row.get(0))?;

    let sources = read_stored_prompt_facet(
        &conn,
        "source",
        "source IS NOT NULL AND source <> ''",
        limit,
    )?;
    let mut dates = read_stored_prompt_facet(
        &conn,
        "prompt_date",
        "prompt_date IS NOT NULL AND prompt_date <> ''",
        limit,
    )?;
    ensure_unknown_date_facet(&conn, &mut dates, limit)?;
    let workspaces =
        read_stored_prompt_facet(&conn, "COALESCE(cwd, '')", "COALESCE(cwd, '') <> ''", limit)?;

    Ok(StoredPromptFacetsResult {
        generated_at,
        database_path: database_path.display().to_string(),
        total_prompts: total_prompts as usize,
        sources,
        dates,
        workspaces,
    })
}

pub fn run_load_stored_prompts(
    options: StoredPromptsOptions,
) -> Result<ScanResult, Box<dyn std::error::Error>> {
    if matches!(options.database_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("database path requires a non-empty value".into());
    }
    if matches!(options.limit, Some(0)) {
        return Err("stored prompt limit requires a positive integer".into());
    }
    let generated_at = Utc::now().to_rfc3339();
    let database_path = options
        .database_path
        .as_deref()
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    let limit = options
        .limit
        .unwrap_or(DEFAULT_STORED_PROMPT_LIMIT)
        .min(MAX_STORED_PROMPT_LIMIT);
    let preview_sort = PreviewSort::from_option(options.preview_sort.as_deref())?;
    let query = options.query.unwrap_or_default();
    let source = options.source.unwrap_or_default();
    let date = options.date.unwrap_or_default();
    let workspace = options.workspace.unwrap_or_default();
    let conn = open_promptvault_database(&database_path)?;
    let filters = StoredPromptFilters {
        query: query.trim(),
        source: source.trim(),
        date: date.trim(),
        workspace: workspace.trim(),
    };
    let prompts = read_stored_prompts(&conn, limit, &filters, preview_sort)?;
    let total_matches = count_stored_prompt_matches(&conn, &filters)?;
    let stats = build_stats(&prompts, stored_source_summaries(&prompts));
    let persistence = prompt_database_stats(&conn, &database_path, 0, 0)?;
    let returned_prompt_count = prompts.len();
    Ok(ScanResult {
        generated_at,
        output_path: None,
        markdown: String::new(),
        stats,
        prompts,
        returned_prompt_count,
        prompts_truncated: total_matches > returned_prompt_count,
        preview_sort: preview_sort.as_str().to_string(),
        markdown_included: false,
        markdown_written: false,
        persistence: Some(persistence),
        warnings: Vec::new(),
    })
}

fn run_import_batch_for_source(
    database_path: &Path,
    source: SourceSpec,
    file_batch_size: usize,
    reset: bool,
    preview_limit: Option<usize>,
) -> Result<ImportBatchResult, Box<dyn std::error::Error>> {
    if file_batch_size == 0 {
        return Err("file_batch_size requires a positive integer".into());
    }
    let generated_at = Utc::now().to_rfc3339();
    let mut warnings = Vec::new();
    let mut candidates = Vec::new();
    for candidate in matching_source_file_candidates(&source.root, source.kind) {
        match candidate {
            Ok(candidate) => candidates.push(candidate),
            Err(err) => warnings.push(format!("순회 항목을 건너뜀: {err}")),
        }
    }
    let source_plan = source_plan_from_candidates(&source, &candidates, &warnings);
    let total_files = candidates.len();
    let total_bytes = candidates
        .iter()
        .map(|candidate| candidate.byte_count)
        .sum::<u64>();

    let conn = open_promptvault_database(database_path)?;
    let previous_state = if reset {
        None
    } else {
        read_import_state(&conn, source.id)?
    };
    let batch_start_index = previous_state
        .as_ref()
        .map(|state| state.next_file_index.min(total_files))
        .unwrap_or(0);
    let batch_end_index = batch_start_index
        .saturating_add(file_batch_size)
        .min(total_files);
    let batch_candidates = &candidates[batch_start_index..batch_end_index];

    let mut summary = SourceSummary {
        id: source.id.to_string(),
        label: source.label.to_string(),
        root_path: source.root.display().to_string(),
        files_seen: 0,
        prompts_found: 0,
        average_quality: 0.0,
        weak_prompt_count: 0,
        status: source_plan.status.clone(),
        notes: source_plan.notes.clone(),
    };
    let mut prompts = collect_from_candidates(
        &source,
        &mut summary,
        batch_candidates,
        usize::MAX,
        None,
        None,
        0,
    )?;
    summary.prompts_found = prompts.len();
    summarize_source_quality(&mut summary, &prompts);
    promote_source_notes_to_warning(&source, &mut summary, &mut warnings);
    prompts.sort_by(|a, b| {
        let at = a.timestamp.as_deref().unwrap_or("");
        let bt = b.timestamp.as_deref().unwrap_or("");
        at.cmp(bt).then_with(|| a.source.cmp(&b.source))
    });
    prompts.dedup_by(|a, b| a.hash == b.hash && a.source == b.source);

    let stats = build_stats(&prompts, vec![summary]);
    let persistence =
        persist_incremental_scan_result(database_path, &generated_at, &prompts, &stats, &warnings)?;
    let imported_prompt_count = previous_state
        .map(|state| state.imported_prompt_count)
        .unwrap_or(0)
        .saturating_add(prompts.len());
    let completed = batch_end_index >= total_files;
    let state = ImportState {
        source_id: source.id.to_string(),
        source_label: source.label.to_string(),
        root_path: source.root.display().to_string(),
        total_files,
        total_bytes,
        next_file_index: batch_end_index,
        processed_files: batch_end_index,
        imported_prompt_count,
        completed,
        updated_at: generated_at.clone(),
    };
    upsert_import_state(&conn, &state)?;
    insert_import_event(
        &conn,
        &generated_at,
        &state,
        batch_start_index,
        batch_candidates.len(),
        prompts.len(),
        &warnings,
    )?;

    let response_prompts = response_prompts(&prompts, preview_limit, PreviewSort::Latest);
    Ok(ImportBatchResult {
        generated_at,
        source: source_plan,
        state,
        batch_start_index,
        batch_file_count: batch_candidates.len(),
        batch_prompt_count: prompts.len(),
        returned_prompt_count: response_prompts.len(),
        prompts: response_prompts,
        stats,
        persistence,
        warnings,
    })
}

fn build_scan_plan_for_sources(generated_at: String, sources: Vec<SourceSpec>) -> ScanPlan {
    let total_sources = sources.len();
    let mut plans = Vec::new();
    let mut warnings = Vec::new();

    for source in sources {
        let plan = source_plan(&source);
        if plan.file_count >= LARGE_SOURCE_FILE_COUNT || plan.byte_count >= LARGE_SOURCE_BYTES {
            warnings.push(format!(
                "{} has {} matching files and {}; use a prompt limit or run incremental import slices before an unrestricted scan.",
                plan.label,
                plan.file_count,
                format_bytes(plan.byte_count)
            ));
        }
        if plan.large_file_count > 0 {
            warnings.push(format!(
                "{} includes {} files larger than {}; large JSONL files may dominate scan time.",
                plan.label,
                plan.large_file_count,
                format_bytes(LARGE_FILE_BYTES)
            ));
        }
        plans.push(plan);
    }

    let available_sources = plans
        .iter()
        .filter(|source| source.status != "missing")
        .count();
    let total_files = plans.iter().map(|source| source.file_count).sum();
    let total_bytes = plans.iter().map(|source| source.byte_count).sum();
    let large_file_count = plans.iter().map(|source| source.large_file_count).sum();
    let largest_file_bytes = plans
        .iter()
        .map(|source| source.largest_file_bytes)
        .max()
        .unwrap_or(0);

    ScanPlan {
        generated_at,
        total_sources,
        available_sources,
        total_files,
        total_bytes,
        large_file_count,
        largest_file_bytes,
        sources: plans,
        warnings,
    }
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum PreviewSort {
    Latest,
    QualityAsc,
    QualityDesc,
}

impl PreviewSort {
    fn from_option(value: Option<&str>) -> Result<Self, Box<dyn std::error::Error>> {
        let Some(value) = value else {
            return Ok(Self::Latest);
        };
        match value.trim() {
            "" => Err("preview sort requires a non-empty value".into()),
            "latest" => Ok(Self::Latest),
            "quality_asc" | "quality-asc" | "weakest" => Ok(Self::QualityAsc),
            "quality_desc" | "quality-desc" | "strongest" => Ok(Self::QualityDesc),
            other => Err(format!(
                "preview sort must be one of latest, quality-asc, quality-desc; got {other}"
            )
            .into()),
        }
    }

    fn as_str(self) -> &'static str {
        match self {
            Self::Latest => "latest",
            Self::QualityAsc => "quality_asc",
            Self::QualityDesc => "quality_desc",
        }
    }
}

fn response_prompts(
    prompts: &[PromptRecord],
    preview_limit: Option<usize>,
    preview_sort: PreviewSort,
) -> Vec<PromptRecord> {
    let limit = preview_limit.unwrap_or(prompts.len());
    if limit == 0 {
        return Vec::new();
    }

    match preview_limit {
        None if preview_sort == PreviewSort::Latest => prompts.to_vec(),
        Some(_) if preview_sort == PreviewSort::Latest => {
            let start = prompts.len().saturating_sub(limit);
            prompts[start..].to_vec()
        }
        _ => {
            let mut out = prompts.to_vec();
            out.sort_by(|a, b| match preview_sort {
                PreviewSort::Latest => std::cmp::Ordering::Equal,
                PreviewSort::QualityAsc => a
                    .quality
                    .score
                    .cmp(&b.quality.score)
                    .then_with(|| b.quality.missing.len().cmp(&a.quality.missing.len()))
                    .then_with(|| {
                        b.timestamp
                            .as_deref()
                            .unwrap_or("")
                            .cmp(a.timestamp.as_deref().unwrap_or(""))
                    }),
                PreviewSort::QualityDesc => b
                    .quality
                    .score
                    .cmp(&a.quality.score)
                    .then_with(|| a.quality.missing.len().cmp(&b.quality.missing.len()))
                    .then_with(|| {
                        b.timestamp
                            .as_deref()
                            .unwrap_or("")
                            .cmp(a.timestamp.as_deref().unwrap_or(""))
                    }),
            });
            out.truncate(limit);
            out
        }
    }
}

fn validate_source_ids(source_ids: Option<&[String]>) -> Result<(), Box<dyn std::error::Error>> {
    let Some(requested) = source_ids else {
        return Ok(());
    };
    if requested.is_empty() {
        return Err("source ids require at least one source id".into());
    }
    let trimmed = requested.iter().map(|id| id.trim()).collect::<Vec<_>>();
    if trimmed.iter().all(|id| id.is_empty()) {
        return Err("source ids require at least one source id".into());
    }
    if trimmed.iter().any(|id| id.is_empty()) {
        return Err("source ids cannot include empty values".into());
    }

    let requested = trimmed.into_iter().collect::<BTreeSet<_>>();

    let known = source_specs()
        .into_iter()
        .map(|source| source.id)
        .collect::<HashSet<_>>();
    let unknown = requested
        .into_iter()
        .filter(|id| !known.contains(id))
        .collect::<Vec<_>>();

    if unknown.is_empty() {
        Ok(())
    } else {
        Err(format!("unknown source id: {}", unknown.join(", ")).into())
    }
}

fn selected_source_specs(source_ids: Option<&[String]>) -> Vec<SourceSpec> {
    let sources = source_specs();
    let Some(requested) = source_ids else {
        return sources;
    };
    if requested.is_empty() {
        return sources;
    }

    let mut source_by_id = sources
        .into_iter()
        .map(|source| (source.id, source))
        .collect::<HashMap<_, _>>();
    let mut seen = HashSet::new();
    let selected = requested
        .iter()
        .map(|id| id.trim())
        .filter(|id| !id.is_empty())
        .filter_map(|id| {
            if !seen.insert(id) {
                return None;
            }
            source_by_id.remove(id)
        })
        .collect::<Vec<_>>();

    if selected.is_empty() {
        return source_specs();
    }

    selected
}

pub async fn improve_prompt_inner(
    request: ImproveRequest,
) -> Result<ImproveResult, Box<dyn std::error::Error>> {
    improve_prompt_with_env(request, load_improve_env()).await
}

async fn improve_prompt_with_env(
    request: ImproveRequest,
    env: HashMap<String, String>,
) -> Result<ImproveResult, Box<dyn std::error::Error>> {
    let prompt = request.prompt.trim().to_string();
    if prompt.is_empty() {
        return Err("improve requires a non-empty prompt".into());
    }

    if request.force_local.unwrap_or(false) {
        let result = local_improvement(&prompt, request.context.as_deref(), Vec::new());
        return finalize_improvement_result(&request, result);
    }

    if let Some(warning) = external_improve_block_reason(&prompt, request.context.as_deref()) {
        let result = local_improvement(&prompt, request.context.as_deref(), vec![warning]);
        return finalize_improvement_result(&request, result);
    }

    let mut warnings = Vec::new();
    let openai_key = openai_api_key_from_env(&env);
    let glm_key = glm_api_key_from_env(&env);

    if let Some(api_key) = openai_key {
        match request_openai_improvement(&prompt, request.context.as_deref(), &env, &api_key).await
        {
            Ok(mut result) => {
                result.warnings.extend(warnings);
                return finalize_improvement_result(&request, result);
            }
            Err(warning) => warnings.push(warning),
        }
    }

    if let Some(api_key) = glm_key {
        match request_glm_improvement(&prompt, request.context.as_deref(), &env, &api_key).await {
            Ok(mut result) => {
                result.warnings.extend(warnings);
                return finalize_improvement_result(&request, result);
            }
            Err(warning) => warnings.push(warning),
        }
    }

    if openai_api_key_from_env(&env).is_none() && glm_api_key_from_env(&env).is_none() {
        warnings.push(
            "OPENAI_API_KEY 및 GLM_API_KEY/GLM_API_KEY_2가 없어 로컬 fallback을 사용했습니다."
                .to_string(),
        );
    }
    let result = local_improvement(&prompt, request.context.as_deref(), warnings);
    finalize_improvement_result(&request, result)
}

fn finalize_improvement_result(
    request: &ImproveRequest,
    mut result: ImproveResult,
) -> Result<ImproveResult, Box<dyn std::error::Error>> {
    if !request.persist.unwrap_or(false) {
        return Ok(result);
    }
    let database_path = request
        .database_path
        .as_deref()
        .map(str::trim)
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(default_database_path);
    result.persistence = Some(persist_improvement_result(
        &database_path,
        request.prompt_id.as_deref(),
        request.source.as_deref(),
        &result,
    )?);
    Ok(result)
}

async fn request_openai_improvement(
    prompt: &str,
    context: Option<&str>,
    env: &HashMap<String, String>,
    api_key: &str,
) -> Result<ImproveResult, String> {
    let endpoint = normalize_openai_responses_endpoint(
        &env.get("OPENAI_RESPONSES_ENDPOINT")
            .or_else(|| env.get("OPENAI_BASE_URL"))
            .cloned()
            .unwrap_or_else(|| DEFAULT_OPENAI_RESPONSES_ENDPOINT.to_string()),
    );
    let model = openai_model_from_env(env);
    let (system, user) = improvement_messages(prompt, context);
    let body = serde_json::json!({
        "model": model,
        "input": [
            {
                "role": "developer",
                "content": [
                    { "type": "input_text", "text": system }
                ]
            },
            {
                "role": "user",
                "content": [
                    { "type": "input_text", "text": user }
                ]
            }
        ],
        "temperature": 0.2,
        "text": {
            "format": {
                "type": "json_schema",
                "name": "prompt_improvement",
                "strict": true,
                "schema": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                        "revised_prompt": { "type": "string" },
                        "rationale": {
                            "type": "array",
                            "items": { "type": "string" }
                        },
                        "checklist": {
                            "type": "array",
                            "items": { "type": "string" }
                        }
                    },
                    "required": ["revised_prompt", "rationale", "checklist"]
                }
            }
        }
    });

    let client = reqwest::Client::new();
    let response = client
        .post(endpoint)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|err| {
            format!("OpenAI 요청 실패: {err}; 다음 provider 또는 로컬 fallback을 사용합니다.")
        })?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!(
            "OpenAI가 HTTP {status}를 반환해 다음 provider 또는 로컬 fallback을 사용합니다."
        ));
    }

    let value = response
        .json::<Value>()
        .await
        .map_err(|err| format!("OpenAI 응답 JSON 파싱 실패: {err}; 로컬 fallback을 사용합니다."))?;
    openai_improvement_from_response(prompt, &value).ok_or_else(|| {
        "OpenAI 응답에 비어 있지 않은 revised_prompt가 없어 다음 provider 또는 로컬 fallback을 사용합니다."
            .to_string()
    })
}

async fn request_glm_improvement(
    prompt: &str,
    context: Option<&str>,
    env: &HashMap<String, String>,
    api_key: &str,
) -> Result<ImproveResult, String> {
    let endpoint = normalize_chat_endpoint(
        &env.get("GLM_CODING_ENDPOINT")
            .cloned()
            .unwrap_or_else(|| DEFAULT_GLM_CHAT_ENDPOINT.to_string()),
    );
    let model = glm_model_from_env(env);
    let (system, user) = improvement_messages(prompt, context);

    let body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user }
        ],
        "temperature": 0.2,
        "response_format": { "type": "json_object" }
    });

    let client = reqwest::Client::new();
    let response = client
        .post(endpoint)
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|err| format!("GLM 요청 실패: {err}; 로컬 fallback을 사용했습니다."))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!(
            "GLM이 HTTP {status}를 반환해 로컬 fallback을 사용했습니다."
        ));
    }

    let value = response
        .json::<Value>()
        .await
        .map_err(|err| format!("GLM 응답 JSON 파싱 실패: {err}; 로컬 fallback을 사용했습니다."))?;
    let content = value
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
        .ok_or_else(|| "GLM 응답 content가 없어 로컬 fallback을 사용했습니다.".to_string())?;

    glm_improvement_from_content(prompt, content).ok_or_else(|| {
        "GLM 응답에 비어 있지 않은 revised_prompt가 없어 로컬 fallback을 사용했습니다.".to_string()
    })
}

fn improvement_messages(prompt: &str, context: Option<&str>) -> (&'static str, String) {
    let system = "You improve developer prompts. Return concise Korean guidance. Preserve user intent, make scope, context, constraints, success criteria, and verification explicit. Do not add unsupported facts.";
    let mut user = String::new();
    if let Some(context) = context.filter(|value| !value.trim().is_empty()) {
        user.push_str("Context:\n");
        user.push_str(context.trim());
        user.push_str("\n\n");
    }
    user.push_str("Original prompt:\n");
    user.push_str(prompt);
    user.push_str("\n\nReturn JSON with keys revised_prompt, rationale, checklist.");
    (system, user)
}

fn external_improve_block_reason(prompt: &str, context: Option<&str>) -> Option<String> {
    let flags = detect_risks(prompt)
        .into_iter()
        .chain(
            context
                .filter(|value| !value.trim().is_empty())
                .map(detect_risks)
                .unwrap_or_default(),
        )
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect::<Vec<_>>();

    if flags.is_empty() {
        None
    } else {
        Some(format!(
            "프롬프트/맥락에 위험 패턴 텍스트({})가 있어 외부 AI provider 대신 로컬 fallback을 사용했습니다.",
            flags.join(", ")
        ))
    }
}

fn glm_improvement_from_content(prompt: &str, content: &str) -> Option<ImproveResult> {
    improvement_from_content("glm", prompt, content)
}

fn openai_improvement_from_response(prompt: &str, value: &Value) -> Option<ImproveResult> {
    let content = openai_response_content(value)?;
    improvement_from_content("openai", prompt, &content)
}

fn openai_response_content(value: &Value) -> Option<String> {
    if let Some(text) = value.get("output_text").and_then(Value::as_str) {
        let trimmed = text.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    if let Some(text) = value
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
    {
        let trimmed = text.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    let outputs = value.get("output")?.as_array()?;
    for output in outputs {
        if let Some(contents) = output.get("content").and_then(Value::as_array) {
            for item in contents {
                if let Some(text) = item.get("text").and_then(Value::as_str) {
                    let trimmed = text.trim();
                    if !trimmed.is_empty() {
                        return Some(trimmed.to_string());
                    }
                }
            }
        }
    }
    None
}

fn improvement_from_content(provider: &str, prompt: &str, content: &str) -> Option<ImproveResult> {
    if let Ok(parsed) = serde_json::from_str::<Value>(content) {
        let revised = parsed
            .get("revised_prompt")
            .and_then(Value::as_str)?
            .trim()
            .to_string();
        if revised.is_empty() {
            return None;
        }
        let rationale = string_array(parsed.get("rationale"));
        let checklist = string_array(parsed.get("checklist"));
        return Some(ImproveResult {
            provider: provider.to_string(),
            used_ai: true,
            quality_delta: quality_delta(prompt, &revised),
            revised_prompt: revised,
            rationale,
            checklist,
            warnings: Vec::new(),
            persistence: None,
        });
    }

    let revised = content.trim().to_string();
    if revised.is_empty() {
        return None;
    }
    Some(ImproveResult {
        provider: provider.to_string(),
        used_ai: true,
        quality_delta: quality_delta(prompt, &revised),
        revised_prompt: revised,
        rationale: vec![format!(
            "{provider} provider가 JSON이 아닌 텍스트를 반환해 모델 출력을 그대로 보존했습니다."
        )],
        checklist: prompt_checklist(),
        warnings: Vec::new(),
        persistence: None,
    })
}

pub fn source_specs() -> Vec<SourceSpec> {
    source_specs_for_home(&user_home_dir())
}

fn source_specs_for_home(home: &Path) -> Vec<SourceSpec> {
    vec![
        SourceSpec {
            id: "codex",
            label: "Codex",
            root: home.join(".codex/sessions"),
            kind: SourceKind::CodexJsonl,
        },
        SourceSpec {
            id: "codex-cx",
            label: "Codex CX",
            root: home.join(".codex-cx/sessions"),
            kind: SourceKind::CodexJsonl,
        },
        SourceSpec {
            id: "claude-code-projects",
            label: "Claude Code projects",
            root: home.join(".claude/projects"),
            kind: SourceKind::ClaudeProjectJsonl,
        },
        SourceSpec {
            id: "claude-code-transcripts",
            label: "Claude transcripts",
            root: home.join(".claude/transcripts"),
            kind: SourceKind::ClaudeTranscriptJsonl,
        },
        SourceSpec {
            id: "claude-code-history",
            label: "Claude prompt history",
            root: home.join(".claude/history.jsonl"),
            kind: SourceKind::ClaudeHistoryJsonl,
        },
        SourceSpec {
            id: "antigravity-cli-transcripts",
            label: "Antigravity CLI transcripts",
            root: home.join(".gemini/antigravity-cli/brain"),
            kind: SourceKind::AntigravityTranscriptJsonl,
        },
        SourceSpec {
            id: "antigravity-ide-transcripts",
            label: "Antigravity IDE transcripts",
            root: home.join(".gemini/antigravity/brain"),
            kind: SourceKind::AntigravityTranscriptJsonl,
        },
        SourceSpec {
            id: "antigravity-ide-alt-transcripts",
            label: "Antigravity IDE alt transcripts",
            root: home.join(".gemini/antigravity-ide/brain"),
            kind: SourceKind::AntigravityTranscriptJsonl,
        },
        SourceSpec {
            id: "antigravity-cli-history",
            label: "Antigravity prompt history",
            root: home.join(".gemini/antigravity-cli/history.jsonl"),
            kind: SourceKind::AntigravityHistoryJsonl,
        },
        SourceSpec {
            id: "antigravity-cli-conversation-db",
            label: "Antigravity CLI conversation DB",
            root: home.join(".gemini/antigravity-cli/conversations"),
            kind: SourceKind::AntigravityConversationSqlite,
        },
        SourceSpec {
            id: "antigravity-ide-conversation-db",
            label: "Antigravity IDE conversation DB",
            root: home.join(".gemini/antigravity/conversations"),
            kind: SourceKind::AntigravityConversationSqlite,
        },
        SourceSpec {
            id: "gemini-tmp-chat",
            label: "Gemini temporary chats",
            root: home.join(".gemini/tmp"),
            kind: SourceKind::GeminiTmpChatJson,
        },
        SourceSpec {
            id: "project-progress-logs",
            label: "Project progress logs",
            root: home.join("Ai/System/10_Projects"),
            kind: SourceKind::ProjectProgressMarkdown,
        },
    ]
}

fn collect_from_source(
    source: &SourceSpec,
    summary: &mut SourceSummary,
    remaining: usize,
    cancel_flag: Option<&ScanCancelFlag>,
    run_id: Option<&str>,
    prompt_offset: usize,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    if remaining == 0 {
        return Ok(Vec::new());
    }

    let files = matching_source_files_with_cancel(&source.root, source.kind, cancel_flag, run_id)
        .into_iter()
        .filter_map(|file| match file {
            Ok(path) => Some(SourceFileCandidate {
                byte_count: path.metadata().map(|metadata| metadata.len()).unwrap_or(0),
                modified_ms: path
                    .metadata()
                    .and_then(|metadata| metadata.modified())
                    .ok()
                    .and_then(|modified| modified.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|duration| duration.as_millis())
                    .unwrap_or(0),
                path,
            }),
            Err(err) => {
                summary.notes.push(format!("순회 항목을 건너뜀: {err}"));
                None
            }
        })
        .collect::<Vec<_>>();
    update_scan_progress(run_id, |progress| {
        progress.source_files_discovered = files.len();
        progress.source_file_count = Some(files.len());
    });
    collect_from_candidates(
        source,
        summary,
        &files,
        remaining,
        cancel_flag,
        run_id,
        prompt_offset,
    )
}

fn collect_from_candidates(
    source: &SourceSpec,
    summary: &mut SourceSummary,
    files: &[SourceFileCandidate],
    remaining: usize,
    cancel_flag: Option<&ScanCancelFlag>,
    run_id: Option<&str>,
    prompt_offset: usize,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut prompts = Vec::new();
    let mut seen_keys = HashSet::new();
    for file in files {
        if scan_cancel_requested(cancel_flag) {
            break;
        }
        if prompts.len() >= remaining {
            break;
        }
        summary.files_seen += 1;
        let found = parse_source_file(source, &file.path);

        match found {
            Ok(records) => {
                for record in records {
                    let key = (record.source.clone(), record.hash.clone());
                    if seen_keys.insert(key) {
                        prompts.push(record);
                    }
                    if prompts.len() >= remaining {
                        break;
                    }
                }
            }
            Err(err) => summary
                .notes
                .push(format!("{} 건너뜀: {}", file.path.display(), err)),
        }
        update_scan_progress(run_id, |progress| {
            progress.files_seen += 1;
            progress.source_files_seen = summary.files_seen;
            progress.prompts_found = prompt_offset + prompts.len();
            progress.canceled = scan_cancel_requested(cancel_flag);
        });
    }
    Ok(prompts)
}

fn parse_source_file(
    source: &SourceSpec,
    file: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    match source.kind {
        SourceKind::CodexJsonl => parse_codex_jsonl(source, file),
        SourceKind::ClaudeProjectJsonl => parse_claude_project_jsonl(source, file),
        SourceKind::ClaudeTranscriptJsonl => parse_claude_transcript_jsonl(source, file),
        SourceKind::ClaudeHistoryJsonl => parse_claude_history_jsonl(source, file),
        SourceKind::AntigravityTranscriptJsonl => parse_antigravity_transcript_jsonl(source, file),
        SourceKind::AntigravityHistoryJsonl => parse_antigravity_history_jsonl(source, file),
        SourceKind::AntigravityConversationSqlite => {
            parse_antigravity_conversation_sqlite(source, file)
        }
        SourceKind::GeminiTmpChatJson => parse_gemini_tmp_chat(source, file),
        SourceKind::ProjectProgressMarkdown => parse_project_progress_markdown(source, file),
    }
}

fn matching_source_files_with_cancel(
    root: &Path,
    kind: SourceKind,
    cancel_flag: Option<&ScanCancelFlag>,
    run_id: Option<&str>,
) -> Vec<Result<PathBuf, walkdir::Error>> {
    matching_source_file_candidates_with_cancel(root, kind, cancel_flag, run_id)
        .into_iter()
        .map(|candidate| candidate.map(|candidate| candidate.path))
        .collect()
}

#[derive(Debug, Clone)]
struct SourceFileCandidate {
    path: PathBuf,
    byte_count: u64,
    modified_ms: u128,
}

fn matching_source_file_candidates(
    root: &Path,
    kind: SourceKind,
) -> Vec<Result<SourceFileCandidate, walkdir::Error>> {
    matching_source_file_candidates_with_cancel(root, kind, None, None)
}

fn matching_source_file_candidates_with_cancel(
    root: &Path,
    kind: SourceKind,
    cancel_flag: Option<&ScanCancelFlag>,
    run_id: Option<&str>,
) -> Vec<Result<SourceFileCandidate, walkdir::Error>> {
    if root.is_file() {
        update_scan_progress(run_id, |progress| {
            progress.source_files_discovered = 1;
        });
        return vec![Ok(file_candidate(root))];
    }

    let mut paths = Vec::new();
    let mut errors = Vec::new();
    let walker = WalkDir::new(root).follow_links(false);
    let walker = match kind {
        SourceKind::ProjectProgressMarkdown => walker.max_depth(PROJECT_PROGRESS_MAX_DEPTH),
        _ => walker,
    };

    for entry in walker
        .into_iter()
        .filter_entry(|entry| source_should_descend(entry.path(), kind))
    {
        if scan_cancel_requested(cancel_flag) {
            break;
        }
        let entry = match entry {
            Ok(entry) => entry,
            Err(err) => {
                errors.push(err);
                continue;
            }
        };
        let path = entry.path();
        if source_file_matches(path, kind) {
            paths.push(file_candidate(path));
            if paths.len() <= 10 || paths.len() % 50 == 0 {
                let discovered = paths.len();
                update_scan_progress(run_id, |progress| {
                    progress.source_files_discovered = discovered;
                });
            }
        }
    }
    update_scan_progress(run_id, |progress| {
        progress.source_files_discovered = paths.len();
    });
    paths.sort_by(|a, b| {
        b.modified_ms
            .cmp(&a.modified_ms)
            .then_with(|| b.path.cmp(&a.path))
    });

    paths
        .into_iter()
        .map(Ok)
        .chain(errors.into_iter().map(Err))
        .collect()
}

fn source_file_matches(path: &Path, kind: SourceKind) -> bool {
    if !path.is_file() {
        return false;
    }

    let path_str = path.to_string_lossy();
    match kind {
        SourceKind::CodexJsonl
        | SourceKind::ClaudeProjectJsonl
        | SourceKind::ClaudeTranscriptJsonl
        | SourceKind::ClaudeHistoryJsonl
        | SourceKind::AntigravityHistoryJsonl => path.extension().is_some_and(|ext| ext == "jsonl"),
        SourceKind::AntigravityTranscriptJsonl => {
            path_str.ends_with("/.system_generated/logs/transcript.jsonl")
                || path_str.ends_with("/.system_generated/logs/transcript_full.jsonl")
        }
        SourceKind::AntigravityConversationSqlite => {
            path.extension().is_some_and(|ext| ext == "db")
        }
        SourceKind::GeminiTmpChatJson => {
            path.extension().is_some_and(|ext| ext == "json")
                && path
                    .parent()
                    .and_then(Path::file_name)
                    .and_then(|name| name.to_str())
                    .is_some_and(|name| name == "chats")
        }
        SourceKind::ProjectProgressMarkdown => {
            path.extension()
                .and_then(|ext| ext.to_str())
                .is_some_and(|ext| ext.eq_ignore_ascii_case("md"))
                && path
                    .file_name()
                    .and_then(|name| name.to_str())
                    .is_some_and(is_project_progress_log_name)
        }
    }
}

fn source_should_descend(path: &Path, kind: SourceKind) -> bool {
    match kind {
        SourceKind::ProjectProgressMarkdown if path.is_dir() => path
            .file_name()
            .and_then(|name| name.to_str())
            .is_none_or(|name| !is_ignored_project_progress_dir(name)),
        _ => true,
    }
}

fn is_ignored_project_progress_dir(name: &str) -> bool {
    matches!(
        name,
        ".cache"
            | ".git"
            | ".next"
            | ".nuxt"
            | ".svelte-kit"
            | ".tauri"
            | ".turbo"
            | ".venv"
            | "build"
            | "coverage"
            | "dist"
            | "node_modules"
            | "out"
            | "target"
            | "venv"
    )
}

fn is_project_progress_log_name(name: &str) -> bool {
    matches!(
        name.to_ascii_lowercase().as_str(),
        "working.md" | "worklog.md" | "project_status.md" | "progress_log.md" | "progress.md"
    )
}

fn file_candidate(path: &Path) -> SourceFileCandidate {
    let metadata = path.metadata().ok();
    SourceFileCandidate {
        path: path.to_path_buf(),
        byte_count: metadata
            .as_ref()
            .map(|metadata| metadata.len())
            .unwrap_or(0),
        modified_ms: metadata
            .and_then(|metadata| metadata.modified().ok())
            .and_then(|modified| modified.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis())
            .unwrap_or(0),
    }
}

fn source_plan(source: &SourceSpec) -> SourcePlan {
    let mut plan = SourcePlan {
        id: source.id.to_string(),
        label: source.label.to_string(),
        root_path: source.root.display().to_string(),
        status: if source.root.exists() {
            "ok".to_string()
        } else {
            "missing".to_string()
        },
        file_count: 0,
        byte_count: 0,
        large_file_count: 0,
        largest_file_bytes: 0,
        newest_modified_at: None,
        notes: Vec::new(),
    };

    if !source.root.exists() {
        plan.notes.push("이 머신에 경로가 없습니다.".to_string());
        return plan;
    }

    let mut newest_ms = 0;
    for file in matching_source_file_candidates(&source.root, source.kind) {
        match file {
            Ok(candidate) => {
                plan.file_count += 1;
                plan.byte_count = plan.byte_count.saturating_add(candidate.byte_count);
                plan.largest_file_bytes = plan.largest_file_bytes.max(candidate.byte_count);
                if candidate.byte_count >= LARGE_FILE_BYTES {
                    plan.large_file_count += 1;
                }
                newest_ms = newest_ms.max(candidate.modified_ms);
            }
            Err(err) => plan.notes.push(format!("순회 항목을 건너뜀: {err}")),
        }
    }
    if newest_ms > 0 {
        plan.newest_modified_at = timestamp_millis_to_rfc3339(newest_ms);
    }
    if plan.file_count == 0 && plan.status == "ok" {
        plan.status = "empty".to_string();
        plan.notes
            .push("일치하는 프롬프트 파일을 찾지 못했습니다.".to_string());
    }
    plan
}

fn source_plan_from_candidates(
    source: &SourceSpec,
    candidates: &[SourceFileCandidate],
    notes: &[String],
) -> SourcePlan {
    let mut plan = SourcePlan {
        id: source.id.to_string(),
        label: source.label.to_string(),
        root_path: source.root.display().to_string(),
        status: if source.root.exists() {
            "ok".to_string()
        } else {
            "missing".to_string()
        },
        file_count: candidates.len(),
        byte_count: 0,
        large_file_count: 0,
        largest_file_bytes: 0,
        newest_modified_at: None,
        notes: notes.to_vec(),
    };

    let mut newest_ms = 0;
    for candidate in candidates {
        plan.byte_count = plan.byte_count.saturating_add(candidate.byte_count);
        plan.largest_file_bytes = plan.largest_file_bytes.max(candidate.byte_count);
        if candidate.byte_count >= LARGE_FILE_BYTES {
            plan.large_file_count += 1;
        }
        newest_ms = newest_ms.max(candidate.modified_ms);
    }
    if newest_ms > 0 {
        plan.newest_modified_at = timestamp_millis_to_rfc3339(newest_ms);
    }
    if plan.file_count == 0 && plan.status == "ok" {
        plan.status = "empty".to_string();
        plan.notes
            .push("일치하는 프롬프트 파일을 찾지 못했습니다.".to_string());
    }
    plan
}

fn timestamp_millis_to_rfc3339(millis: u128) -> Option<String> {
    let seconds = i64::try_from(millis / 1000).ok()?;
    let nanos = u32::try_from((millis % 1000) * 1_000_000).ok()?;
    Utc.timestamp_opt(seconds, nanos)
        .single()
        .map(|value| value.to_rfc3339())
}

fn format_bytes(bytes: u64) -> String {
    const UNITS: [&str; 5] = ["B", "KiB", "MiB", "GiB", "TiB"];
    let mut value = bytes as f64;
    let mut unit = 0;
    while value >= 1024.0 && unit < UNITS.len() - 1 {
        value /= 1024.0;
        unit += 1;
    }
    if unit == 0 {
        format!("{bytes} {}", UNITS[unit])
    } else {
        format!("{value:.1} {}", UNITS[unit])
    }
}

fn parse_codex_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    let mut cwd: Option<String> = None;
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        if value.get("type").and_then(Value::as_str) == Some("turn_context") {
            cwd = value
                .pointer("/payload/cwd")
                .and_then(Value::as_str)
                .map(str::to_string);
            continue;
        }
        if value.get("type").and_then(Value::as_str) != Some("response_item") {
            continue;
        }
        if value.pointer("/payload/role").and_then(Value::as_str) != Some("user") {
            continue;
        }
        let text = text_from_value(value.pointer("/payload/content"));
        push_record(&mut records, source, path, &value, cwd.clone(), text);
    }
    Ok(records)
}

fn parse_claude_project_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        if value.get("type").and_then(Value::as_str) != Some("user") {
            continue;
        }
        if value.get("isMeta").and_then(Value::as_bool) == Some(true) {
            continue;
        }
        if value.pointer("/message/role").and_then(Value::as_str) != Some("user") {
            continue;
        }
        let text = text_from_value(value.pointer("/message/content"));
        let cwd = value.get("cwd").and_then(Value::as_str).map(str::to_string);
        push_record(&mut records, source, path, &value, cwd, text);
    }
    Ok(records)
}

fn parse_claude_transcript_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        let kind = value
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if !matches!(kind, "human" | "user" | "prompt") {
            continue;
        }
        let text = text_from_value(value.get("content"));
        push_record(&mut records, source, path, &value, None, text);
    }
    Ok(records)
}

fn parse_claude_history_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        let text = text_from_value(value.get("display"));
        let cwd = value
            .get("project")
            .and_then(Value::as_str)
            .map(str::to_string);
        push_record(&mut records, source, path, &value, cwd, text);
    }
    Ok(records)
}

fn parse_antigravity_transcript_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        let src = value
            .get("source")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let kind = value
            .get("type")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if src != "USER_EXPLICIT" && kind != "USER_INPUT" {
            continue;
        }
        let text = text_from_value(value.get("content"));
        push_record(&mut records, source, path, &value, None, text);
    }
    Ok(records)
}

fn parse_antigravity_history_jsonl(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut records = Vec::new();
    for line in jsonl_lines(path)? {
        let value: Value = serde_json::from_str(&line)?;
        let text = text_from_value(value.get("display"));
        let cwd = value
            .get("workspace")
            .and_then(Value::as_str)
            .map(str::to_string);
        push_record(&mut records, source, path, &value, cwd, text);
    }
    Ok(records)
}

fn parse_antigravity_conversation_sqlite(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let conn = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    let mut stmt =
        conn.prepare("SELECT idx, step_payload FROM steps WHERE step_type = 14 ORDER BY idx")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, Vec<u8>>(1)?))
    })?;

    let conversation_id = path
        .file_stem()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown-antigravity-conversation")
        .to_string();
    let mut records = Vec::new();

    for row in rows {
        let (idx, payload) = row?;
        let strings = protobuf_string_entries(&payload);
        if let Some(text) = best_prompt_candidate(&strings) {
            let cwd = best_workspace_candidate(&strings);
            let value = serde_json::json!({
                "conversation_id": conversation_id,
                "idx": idx,
            });
            push_record(&mut records, source, path, &value, cwd, text);
        }
    }

    Ok(records)
}

fn parse_gemini_tmp_chat(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut buf = String::new();
    File::open(path)?.read_to_string(&mut buf)?;
    let value: Value = serde_json::from_str(&buf)?;
    let mut records = Vec::new();
    let session_id = value
        .get("sessionId")
        .and_then(Value::as_str)
        .map(str::to_string);
    if let Some(messages) = value.get("messages").and_then(Value::as_array) {
        for message in messages {
            let kind = message
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_default();
            if !matches!(kind, "user" | "human") {
                continue;
            }
            let text = text_from_value(message.get("content"));
            let mut metadata = message.clone();
            if let (Some(session_id), Some(object)) = (&session_id, metadata.as_object_mut()) {
                object.insert("sessionId".to_string(), Value::String(session_id.clone()));
            }
            push_record(&mut records, source, path, &metadata, None, text);
        }
    }
    Ok(records)
}

fn parse_project_progress_markdown(
    source: &SourceSpec,
    path: &Path,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let mut text = String::new();
    File::open(path)?.read_to_string(&mut text)?;
    let text = project_progress_analysis_text(&text);
    let text = normalize_prompt_text(&text);
    if text.is_empty() {
        return Ok(Vec::new());
    }

    let project_dir = path.parent().map(Path::to_path_buf);
    let project_name = project_dir
        .as_deref()
        .and_then(Path::file_name)
        .and_then(|name| name.to_str())
        .unwrap_or("unknown-project");
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("progress.md");
    let session_id = format!("{project_name}:{file_name}");
    let timestamp = path
        .metadata()
        .ok()
        .and_then(|metadata| metadata.modified().ok())
        .and_then(|modified| modified.duration_since(std::time::UNIX_EPOCH).ok())
        .and_then(|duration| timestamp_millis_to_rfc3339(duration.as_millis()));
    let metadata = serde_json::json!({
        "session_id": session_id,
        "timestamp": timestamp,
    });

    let mut records = Vec::new();
    push_record(
        &mut records,
        source,
        path,
        &metadata,
        project_dir.map(|path| path.display().to_string()),
        text,
    );
    Ok(records)
}

fn project_progress_analysis_text(text: &str) -> String {
    let max_chars = PROJECT_PROGRESS_HEAD_CHARS + PROJECT_PROGRESS_TAIL_CHARS;
    if text.chars().count() <= max_chars {
        return text.to_string();
    }

    let head = text
        .chars()
        .take(PROJECT_PROGRESS_HEAD_CHARS)
        .collect::<String>();
    let tail = text
        .chars()
        .rev()
        .take(PROJECT_PROGRESS_TAIL_CHARS)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect::<String>();
    format!("{head}\n\n[... project progress log truncated for prompt analysis ...]\n\n{tail}")
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ProtobufStringEntry {
    path: Vec<u64>,
    text: String,
}

fn protobuf_string_entries(bytes: &[u8]) -> Vec<ProtobufStringEntry> {
    let mut out = Vec::new();
    let mut path = Vec::new();
    collect_protobuf_string_entries(bytes, 0, &mut path, &mut out);
    out.sort_by(|left, right| {
        left.path
            .cmp(&right.path)
            .then_with(|| left.text.cmp(&right.text))
    });
    out.dedup();
    out
}

fn collect_protobuf_string_entries(
    bytes: &[u8],
    depth: usize,
    path: &mut Vec<u64>,
    out: &mut Vec<ProtobufStringEntry>,
) {
    if depth > 8 || bytes.is_empty() || bytes.len() > 2_000_000 {
        return;
    }

    let mut index = 0;
    while index < bytes.len() {
        let Some(key) = read_varint(bytes, &mut index) else {
            break;
        };
        let wire = key & 0b111;
        match wire {
            0 => {
                if read_varint(bytes, &mut index).is_none() {
                    break;
                }
            }
            1 => {
                if !skip_bytes(bytes, &mut index, 8) {
                    break;
                }
            }
            2 => {
                let Some(len) = read_varint(bytes, &mut index).map(|value| value as usize) else {
                    break;
                };
                if index + len > bytes.len() {
                    break;
                }
                let slice = &bytes[index..index + len];
                path.push(key >> 3);
                if let Ok(text) = std::str::from_utf8(slice) {
                    let normalized = normalize_prompt_text(text);
                    if is_human_readable_blob_string(&normalized) {
                        out.push(ProtobufStringEntry {
                            path: path.clone(),
                            text: normalized,
                        });
                    }
                }
                collect_protobuf_string_entries(slice, depth + 1, path, out);
                path.pop();
                index += len;
            }
            5 => {
                if !skip_bytes(bytes, &mut index, 4) {
                    break;
                }
            }
            _ => break,
        }
    }
}

fn read_varint(bytes: &[u8], index: &mut usize) -> Option<u64> {
    let mut value = 0_u64;
    let mut shift = 0;
    while *index < bytes.len() && shift < 64 {
        let byte = bytes[*index];
        *index += 1;
        value |= ((byte & 0x7f) as u64) << shift;
        if byte & 0x80 == 0 {
            return Some(value);
        }
        shift += 7;
    }
    None
}

fn skip_bytes(bytes: &[u8], index: &mut usize, count: usize) -> bool {
    if *index + count > bytes.len() {
        return false;
    }
    *index += count;
    true
}

fn best_prompt_candidate(strings: &[ProtobufStringEntry]) -> Option<String> {
    // Antigravity conversation DB user-input steps store the actual prompt at
    // field path 19.2. Preserve that schema signal before falling back to the
    // older string heuristic for unknown payload variants.
    for preferred_path in [&[19_u64, 2_u64][..], &[19_u64, 3_u64, 1_u64][..]] {
        if let Some(entry) = strings.iter().find(|entry| {
            entry.path.as_slice() == preferred_path && is_prompt_candidate(&entry.text)
        }) {
            return Some(entry.text.clone());
        }
    }

    strings
        .iter()
        .filter(|entry| is_prompt_candidate(&entry.text))
        .max_by_key(|entry| prompt_candidate_score(&entry.text))
        .map(|entry| entry.text.clone())
}

fn best_workspace_candidate(strings: &[ProtobufStringEntry]) -> Option<String> {
    strings
        .iter()
        .find(|entry| {
            entry.text.starts_with("/Users/")
                && !entry.text.contains("/.gemini/")
                && !entry.text.contains("/Library/")
                && entry.text.chars().count() < 512
        })
        .map(|entry| entry.text.clone())
}

fn is_human_readable_blob_string(text: &str) -> bool {
    let chars = text.chars().count();
    if !(3..=20_000).contains(&chars) {
        return false;
    }
    let printable = text
        .chars()
        .filter(|ch| !ch.is_control() || matches!(ch, '\n' | '\r' | '\t'))
        .count();
    printable * 100 / chars.max(1) >= 95
}

fn is_prompt_candidate(text: &str) -> bool {
    let trimmed = text.trim();
    let chars = trimmed.chars().count();
    if chars < 3 {
        return false;
    }
    if looks_like_uuid(trimmed)
        || looks_like_identifier(trimmed)
        || trimmed.starts_with('/')
        || trimmed.starts_with("bot-")
        || trimmed == "sessionID"
        || trimmed.contains("(*)")
        || trimmed.contains("/.gemini/")
    {
        return false;
    }
    true
}

fn prompt_candidate_score(text: &str) -> usize {
    let mut score = text.chars().count().min(10_000);
    if text.chars().any(char::is_whitespace) {
        score += 1_000;
    }
    if contains_any(
        &text.to_lowercase(),
        &[
            "reply",
            "write",
            "fix",
            "build",
            "create",
            "analyze",
            "user request",
            "검토",
            "작성",
            "수정",
            "구현",
        ],
    ) {
        score += 1_000;
    }
    score
}

fn looks_like_uuid(text: &str) -> bool {
    let bytes = text.as_bytes();
    if bytes.len() != 36 {
        return false;
    }
    for (idx, byte) in bytes.iter().enumerate() {
        let is_dash = matches!(idx, 8 | 13 | 18 | 23) && *byte == b'-';
        let is_hex = byte.is_ascii_hexdigit();
        if !is_dash && !is_hex {
            return false;
        }
    }
    true
}

fn looks_like_identifier(text: &str) -> bool {
    let chars = text.chars().count();
    chars >= 20
        && text
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.'))
}

fn push_record(
    records: &mut Vec<PromptRecord>,
    source: &SourceSpec,
    path: &Path,
    value: &Value,
    cwd: Option<String>,
    text: String,
) {
    let text = normalize_prompt_text(&strip_injected_context(&text));
    if text.is_empty() {
        return;
    }

    let timestamp = extract_timestamp(value);
    let session_id = extract_session_id(value)
        .or_else(|| {
            path.file_stem()
                .and_then(|name| name.to_str())
                .map(str::to_string)
        })
        .unwrap_or_else(|| "unknown-session".to_string());
    let hash = hash_text(&format!("{}:{}:{}", source.id, session_id, text));
    let words = count_words(&text);
    let risk_flags = detect_risks(&text);
    let quality = assess_prompt_quality(&text, &risk_flags);

    records.push(PromptRecord {
        id: hash.chars().take(16).collect(),
        source: source.label.to_string(),
        session_id,
        path: path.display().to_string(),
        timestamp,
        cwd,
        text: text.clone(),
        word_count: words,
        char_count: text.chars().count(),
        hash,
        risk_flags,
        quality,
    });
}

fn jsonl_lines(path: &Path) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut lines = Vec::new();
    for line in reader.lines() {
        let line = line?;
        if !line.trim().is_empty() {
            lines.push(line);
        }
    }
    Ok(lines)
}

fn text_from_value(value: Option<&Value>) -> String {
    match value {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| {
                if item.get("type").and_then(Value::as_str) == Some("tool_result") {
                    None
                } else if let Some(text) = item.as_str() {
                    Some(text.to_string())
                } else if let Some(text) = item.get("text").and_then(Value::as_str) {
                    Some(text.to_string())
                } else if let Some(text) = item.get("content").and_then(Value::as_str) {
                    Some(text.to_string())
                } else {
                    item.pointer("/message/content")
                        .and_then(Value::as_str)
                        .map(str::to_string)
                }
            })
            .collect::<Vec<_>>()
            .join("\n"),
        Some(Value::Object(map)) => {
            for key in ["text", "content", "display", "message", "prompt"] {
                if let Some(text) = map.get(key).and_then(Value::as_str) {
                    return text.to_string();
                }
            }
            if let Some(text) = map
                .get("message")
                .and_then(|message| message.get("content"))
                .and_then(Value::as_str)
            {
                return text.to_string();
            }
            String::new()
        }
        _ => String::new(),
    }
}

fn normalize_prompt_text(text: &str) -> String {
    let sanitized = text
        .chars()
        .map(|ch| {
            if ch == '\n' || ch == '\r' || ch == '\t' || !ch.is_control() {
                ch
            } else {
                ' '
            }
        })
        .collect::<String>();

    sanitized
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn strip_injected_context(text: &str) -> String {
    let mut candidate = text.trim_start();

    if candidate.starts_with("# AGENTS.md instructions for ") {
        if let Some(index) = candidate.find("</environment_context>") {
            candidate = &candidate[index + "</environment_context>".len()..];
        } else if let Some(index) = candidate.find("</INSTRUCTIONS>") {
            candidate = &candidate[index + "</INSTRUCTIONS>".len()..];
        } else {
            return String::new();
        }
    }

    if candidate.starts_with("<command-name>")
        && candidate.contains("</command-name>")
        && candidate.contains("<command-message>")
    {
        return String::new();
    }
    if candidate.starts_with("<local-command-") && candidate.contains("</local-command-") {
        return String::new();
    }
    if is_command_only_prompt(candidate) {
        return String::new();
    }

    loop {
        let trimmed = candidate.trim_start();
        if let Some(rest) = trimmed.strip_prefix("<environment_context>") {
            if let Some(index) = rest.find("</environment_context>") {
                candidate = &rest[index + "</environment_context>".len()..];
                continue;
            }
        }
        candidate = trimmed;
        break;
    }

    candidate.trim().to_string()
}

fn is_command_only_prompt(text: &str) -> bool {
    let trimmed = text.trim();
    let Some(command) = trimmed.strip_prefix('/') else {
        return false;
    };
    !command.is_empty()
        && command
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_'))
}

fn extract_timestamp(value: &Value) -> Option<String> {
    for key in ["timestamp", "created_at", "time", "started_at"] {
        if let Some(text) = value.get(key).and_then(Value::as_str) {
            return Some(text.to_string());
        }
        if let Some(num) = value.get(key).and_then(Value::as_i64) {
            return Some(format_epoch(num));
        }
        if let Some(num) = value.get(key).and_then(Value::as_u64) {
            return Some(format_epoch(num as i64));
        }
    }
    value
        .pointer("/payload/started_at")
        .and_then(Value::as_str)
        .map(str::to_string)
}

fn format_epoch(value: i64) -> String {
    let seconds = if value > 10_000_000_000 {
        value / 1000
    } else {
        value
    };
    Utc.timestamp_opt(seconds, 0)
        .single()
        .map(|dt| dt.to_rfc3339())
        .unwrap_or_else(|| value.to_string())
}

fn extract_session_id(value: &Value) -> Option<String> {
    for key in [
        "sessionId",
        "session_id",
        "conversationId",
        "conversation_id",
        "id",
    ] {
        if let Some(text) = value.get(key).and_then(Value::as_str) {
            return Some(text.to_string());
        }
    }
    value
        .pointer("/payload/turn_id")
        .and_then(Value::as_str)
        .map(str::to_string)
}

fn hash_text(value: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn count_words(text: &str) -> usize {
    word_regex().find_iter(text).count()
}

fn detect_risks(text: &str) -> Vec<String> {
    let mut flags = Vec::new();
    for (label, regex) in risk_regexes() {
        if regex.is_match(text) {
            flags.push(label.to_string());
        }
    }
    flags
}

pub fn redact_sensitive_text(text: &str) -> String {
    let mut redacted = json_sensitive_property_regex()
        .replace_all(text, "[REDACTED_POSSIBLE_API_KEY]")
        .to_string();
    redacted = quoted_curl_sensitive_header_regex()
        .replace_all(&redacted, |captures: &Captures| {
            if let Some(prefix) = captures.get(1) {
                return format!("{}\"[REDACTED_POSSIBLE_API_KEY]\"", prefix.as_str());
            }
            let prefix = captures
                .get(2)
                .expect("single-quoted curl cookie header prefix")
                .as_str();
            format!("{}'[REDACTED_POSSIBLE_API_KEY]'", prefix)
        })
        .to_string();
    for (label, regex) in risk_regexes() {
        let replacement = format!("[REDACTED_{}]", label.to_ascii_uppercase());
        redacted = regex
            .replace_all(&redacted, replacement.as_str())
            .to_string();
    }
    redacted
}

fn assess_prompt_quality(text: &str, risk_flags: &[String]) -> PromptQuality {
    let lower = text.to_lowercase();
    let words = count_words(text);
    let mut missing = Vec::new();
    let mut suggestions = Vec::new();
    let mut penalty: i32 = 0;

    if words < 8 {
        missing.push("specific_goal".to_string());
        suggestions.push("목표 산출물과 성공 기준을 한 문장 이상으로 구체화하세요.".to_string());
        penalty += 18;
    } else if !contains_any(
        &lower,
        &[
            "build",
            "fix",
            "create",
            "write",
            "analyze",
            "review",
            "test",
            "deploy",
            "improve",
            "구현",
            "수정",
            "작성",
            "분석",
            "검토",
            "테스트",
            "배포",
            "개선",
        ],
    ) {
        missing.push("action_verb".to_string());
        suggestions.push("에이전트가 해야 할 동사를 명확히 넣으세요.".to_string());
        penalty += 10;
    }

    if !contains_any(
        &lower,
        &[
            "/", ".rs", ".ts", ".tsx", ".py", "repo", "path", "file", "error", "current", "경로",
            "파일", "레포", "오류", "현재", "상태",
        ],
    ) {
        missing.push("context".to_string());
        suggestions.push("관련 repo/path, 현재 상태, 오류, 입력 자료를 추가하세요.".to_string());
        penalty += 12;
    }

    if !contains_any(
        &lower,
        &[
            "must",
            "only",
            "do not",
            "avoid",
            "preserve",
            "constraint",
            "scope",
            "반드시",
            "하지",
            "금지",
            "보존",
            "범위",
            "제약",
        ],
    ) {
        missing.push("constraints".to_string());
        suggestions.push("허용/금지 작업, 보존해야 할 파일, 작업 범위를 분리하세요.".to_string());
        penalty += 12;
    }

    if !contains_any(
        &lower,
        &[
            "verify",
            "test",
            "build",
            "check",
            "pass",
            "fail",
            "qa",
            "screenshot",
            "검증",
            "확인",
            "테스트",
            "빌드",
            "통과",
            "실패",
        ],
    ) {
        missing.push("verification".to_string());
        suggestions.push("완료 전 실행할 검증 명령과 PASS/FAIL 기준을 명시하세요.".to_string());
        penalty += 14;
    }

    if !contains_any(
        &lower,
        &[
            "json", "markdown", "table", "report", "summary", "format", "output", "docs", "md",
            "형식", "출력", "표", "보고", "문서",
        ],
    ) {
        missing.push("output_format".to_string());
        suggestions.push("최종 산출물 형식과 저장 위치를 명시하세요.".to_string());
        penalty += 8;
    }

    if text.chars().count() > 4000 {
        missing.push("too_long".to_string());
        suggestions.push("긴 배경과 실제 지시를 분리해 context drift를 줄이세요.".to_string());
        penalty += 8;
    }

    if !risk_flags.is_empty() {
        missing.push("sensitive_content_risk".to_string());
        suggestions.push(
            "API key, token, secret처럼 보이는 문자열은 제거하거나 별도 안전 경로로 전달하세요."
                .to_string(),
        );
        penalty += 20;
    }

    let score = (100 - penalty).clamp(0, 100) as u8;
    let band = if score >= 80 {
        "strong"
    } else if score >= 60 {
        "workable"
    } else {
        "weak"
    }
    .to_string();

    PromptQuality {
        score,
        band,
        missing,
        suggestions,
    }
}

fn quality_delta(original: &str, revised: &str) -> QualityDelta {
    let before = assess_prompt_quality(original, &detect_risks(original));
    let after = assess_prompt_quality(revised, &detect_risks(revised));
    let remaining = after.missing.iter().cloned().collect::<BTreeSet<_>>();
    let resolved_gaps = before
        .missing
        .iter()
        .filter(|gap| !remaining.contains(*gap))
        .cloned()
        .collect::<Vec<_>>();

    QualityDelta {
        score_delta: after.score as i16 - before.score as i16,
        remaining_gaps: after.missing.clone(),
        before,
        after,
        resolved_gaps,
    }
}

fn contains_any(haystack: &str, needles: &[&str]) -> bool {
    needles.iter().any(|needle| haystack.contains(needle))
}

fn build_stats(prompts: &[PromptRecord], source_summaries: Vec<SourceSummary>) -> ScanStats {
    let total_words = prompts.iter().map(|prompt| prompt.word_count).sum();
    let average_words = if prompts.is_empty() {
        0.0
    } else {
        total_words as f64 / prompts.len() as f64
    };

    ScanStats {
        total_prompts: prompts.len(),
        total_files: source_summaries
            .iter()
            .map(|source| source.files_seen)
            .sum(),
        total_words,
        average_words,
        average_quality: average_quality(prompts),
        weak_prompt_count: prompts
            .iter()
            .filter(|prompt| prompt.quality.band == "weak")
            .count(),
        top_words: top_words(prompts, 40),
        top_phrases: top_phrases(prompts, 30),
        repeated_prompts: repeated_prompts(prompts, 20),
        top_quality_gaps: top_quality_gaps(prompts, 20),
        prompts_by_date: prompts_by_date(prompts, 40),
        source_summaries,
    }
}

fn average_quality(prompts: &[PromptRecord]) -> f64 {
    if prompts.is_empty() {
        return 0.0;
    }
    let total: usize = prompts
        .iter()
        .map(|prompt| prompt.quality.score as usize)
        .sum();
    total as f64 / prompts.len() as f64
}

fn summarize_source_quality(summary: &mut SourceSummary, prompts: &[PromptRecord]) {
    summary.average_quality = average_quality(prompts);
    summary.weak_prompt_count = prompts
        .iter()
        .filter(|prompt| prompt.quality.band == "weak")
        .count();
}

fn promote_source_notes_to_warning(
    source: &SourceSpec,
    summary: &mut SourceSummary,
    warnings: &mut Vec<String>,
) {
    if summary.notes.is_empty() {
        return;
    }
    summary.status = "partial".to_string();
    warnings.push(format!("{}: {}", source.label, summary.notes.join("; ")));
}

fn top_words(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let stop = stop_words();
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        let text = frequency_safe_prompt_text(&prompt.text);
        for mat in word_regex().find_iter(&text) {
            let token = mat.as_str().trim_matches(|c: char| c == '_' || c == '-');
            if token.chars().count() < 2 || stop.contains(token) {
                continue;
            }
            *counts.entry(token.to_string()).or_default() += 1;
        }
    }
    rank_counts(counts, limit)
}

fn top_phrases(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        let text = frequency_safe_prompt_text(&prompt.text);
        for sentence in text
            .split(['.', '?', '!', '\n', ';', '。', '？', '！'])
            .map(str::trim)
            .filter(|sentence| sentence.chars().count() >= 12)
        {
            let phrase = sentence
                .split_whitespace()
                .take(14)
                .collect::<Vec<_>>()
                .join(" ");
            if phrase.chars().count() >= 12 {
                *counts.entry(phrase).or_default() += 1;
            }
        }
    }
    rank_counts(counts, limit)
}

fn repeated_prompts(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        let normalized = frequency_safe_prompt_text(&prompt.text);
        let short = normalized
            .chars()
            .take(180)
            .collect::<String>()
            .replace('\n', " ");
        *counts.entry(short).or_default() += 1;
    }
    rank_counts(counts, limit)
        .into_iter()
        .filter(|item| item.count > 1)
        .collect()
}

fn frequency_safe_prompt_text(text: &str) -> String {
    redact_sensitive_text(&text.to_lowercase())
}

fn top_quality_gaps(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        for gap in &prompt.quality.missing {
            *counts.entry(gap.clone()).or_default() += 1;
        }
    }
    rank_counts(counts, limit)
}

fn prompts_by_date(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        *counts
            .entry(prompt_date(prompt.timestamp.as_deref()))
            .or_default() += 1;
    }
    let mut items = counts
        .into_iter()
        .map(|(text, count)| FrequencyItem { text, count })
        .collect::<Vec<_>>();
    items.sort_by(|a, b| b.text.cmp(&a.text));
    items.truncate(limit);
    items
}

fn prompt_date(timestamp: Option<&str>) -> String {
    let Some(timestamp) = timestamp.map(str::trim).filter(|value| !value.is_empty()) else {
        return "unknown-date".to_string();
    };
    if timestamp.len() >= 10 {
        let date = &timestamp[..10];
        if date.chars().enumerate().all(|(idx, ch)| {
            (matches!(idx, 4 | 7) && ch == '-') || (!matches!(idx, 4 | 7) && ch.is_ascii_digit())
        }) {
            return date.to_string();
        }
    }
    "unknown-date".to_string()
}

fn open_promptvault_database(
    database_path: &Path,
) -> Result<Connection, Box<dyn std::error::Error>> {
    if let Some(parent) = database_path.parent() {
        fs::create_dir_all(parent)?;
    }
    let conn = Connection::open(database_path)?;
    ensure_promptvault_schema(&conn)?;
    Ok(conn)
}

fn ensure_promptvault_schema(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    conn.execute_batch(
        "
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS scan_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            generated_at TEXT NOT NULL,
            total_prompts INTEGER NOT NULL,
            total_files INTEGER NOT NULL,
            average_quality REAL NOT NULL,
            weak_prompt_count INTEGER NOT NULL,
            warnings_json TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS prompts (
            id TEXT PRIMARY KEY,
            hash TEXT NOT NULL,
            source TEXT NOT NULL,
            session_id TEXT NOT NULL,
            source_path TEXT NOT NULL,
            timestamp TEXT,
            prompt_date TEXT NOT NULL,
            cwd TEXT,
            text TEXT NOT NULL,
            word_count INTEGER NOT NULL,
            char_count INTEGER NOT NULL,
            risk_flags_json TEXT NOT NULL,
            quality_json TEXT NOT NULL,
            quality_score INTEGER NOT NULL,
            quality_band TEXT NOT NULL,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_prompts_date ON prompts(prompt_date);
        CREATE INDEX IF NOT EXISTS idx_prompts_source ON prompts(source);
        CREATE INDEX IF NOT EXISTS idx_prompts_quality ON prompts(quality_score);
        CREATE TABLE IF NOT EXISTS source_summaries (
            scan_run_id INTEGER NOT NULL,
            source_id TEXT NOT NULL,
            label TEXT NOT NULL,
            root_path TEXT NOT NULL,
            files_seen INTEGER NOT NULL,
            prompts_found INTEGER NOT NULL,
            average_quality REAL NOT NULL,
            weak_prompt_count INTEGER NOT NULL,
            status TEXT NOT NULL,
            notes_json TEXT NOT NULL,
            FOREIGN KEY(scan_run_id) REFERENCES scan_runs(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_source_summaries_run ON source_summaries(scan_run_id);
        CREATE TABLE IF NOT EXISTS import_states (
            source_id TEXT PRIMARY KEY,
            source_label TEXT NOT NULL,
            root_path TEXT NOT NULL,
            total_files INTEGER NOT NULL,
            total_bytes INTEGER NOT NULL,
            next_file_index INTEGER NOT NULL,
            processed_files INTEGER NOT NULL,
            imported_prompt_count INTEGER NOT NULL,
            completed INTEGER NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS import_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            generated_at TEXT NOT NULL,
            source_id TEXT NOT NULL,
            source_label TEXT NOT NULL,
            root_path TEXT NOT NULL,
            batch_start_index INTEGER NOT NULL,
            batch_file_count INTEGER NOT NULL,
            batch_prompt_count INTEGER NOT NULL,
            processed_files INTEGER NOT NULL,
            total_files INTEGER NOT NULL,
            completed INTEGER NOT NULL,
            warnings_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_import_events_generated_at
            ON import_events(generated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_import_events_source
            ON import_events(source_id, generated_at DESC);
        CREATE TABLE IF NOT EXISTS prompt_improvements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            prompt_id TEXT,
            source TEXT,
            provider TEXT NOT NULL,
            used_ai INTEGER NOT NULL,
            original_quality_score INTEGER NOT NULL,
            revised_quality_score INTEGER NOT NULL,
            score_delta INTEGER NOT NULL,
            resolved_gaps_json TEXT NOT NULL,
            remaining_gaps_json TEXT NOT NULL,
            warnings_json TEXT NOT NULL,
            rationale_json TEXT NOT NULL,
            checklist_json TEXT NOT NULL,
            revised_prompt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_prompt_improvements_prompt
            ON prompt_improvements(prompt_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_prompt_improvements_created_at
            ON prompt_improvements(created_at DESC);
        ",
    )?;
    Ok(())
}

fn read_import_state(
    conn: &Connection,
    source_id: &str,
) -> Result<Option<ImportState>, Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare(
        "SELECT source_id, source_label, root_path, total_files, total_bytes,
            next_file_index, processed_files, imported_prompt_count, completed, updated_at
         FROM import_states WHERE source_id = ?1",
    )?;
    let mut rows = stmt.query([source_id])?;
    let Some(row) = rows.next()? else {
        return Ok(None);
    };
    Ok(Some(ImportState {
        source_id: row.get(0)?,
        source_label: row.get(1)?,
        root_path: row.get(2)?,
        total_files: row.get::<_, i64>(3)? as usize,
        total_bytes: row.get::<_, i64>(4)? as u64,
        next_file_index: row.get::<_, i64>(5)? as usize,
        processed_files: row.get::<_, i64>(6)? as usize,
        imported_prompt_count: row.get::<_, i64>(7)? as usize,
        completed: row.get::<_, i64>(8)? != 0,
        updated_at: row.get(9)?,
    }))
}

fn read_import_states(conn: &Connection) -> Result<Vec<ImportState>, Box<dyn std::error::Error>> {
    let mut stmt = conn.prepare(
        "SELECT source_id, source_label, root_path, total_files, total_bytes,
            next_file_index, processed_files, imported_prompt_count, completed, updated_at
         FROM import_states
         ORDER BY completed ASC, updated_at DESC, source_label ASC",
    )?;
    let states = stmt
        .query_map([], |row| {
            Ok(ImportState {
                source_id: row.get(0)?,
                source_label: row.get(1)?,
                root_path: row.get(2)?,
                total_files: row.get::<_, i64>(3)? as usize,
                total_bytes: row.get::<_, i64>(4)? as u64,
                next_file_index: row.get::<_, i64>(5)? as usize,
                processed_files: row.get::<_, i64>(6)? as usize,
                imported_prompt_count: row.get::<_, i64>(7)? as usize,
                completed: row.get::<_, i64>(8)? != 0,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(states)
}

fn import_states_result(
    generated_at: String,
    database_path: String,
    states: Vec<ImportState>,
) -> ImportStatesResult {
    ImportStatesResult {
        generated_at,
        database_path,
        total_sources: states.len(),
        completed_sources: states.iter().filter(|state| state.completed).count(),
        total_files: states.iter().map(|state| state.total_files).sum(),
        processed_files: states.iter().map(|state| state.processed_files).sum(),
        imported_prompt_count: states.iter().map(|state| state.imported_prompt_count).sum(),
        states,
    }
}

fn current_source_label_map() -> HashMap<&'static str, &'static str> {
    source_specs()
        .into_iter()
        .map(|source| (source.id, source.label))
        .collect()
}

fn canonicalize_import_state_labels(states: &mut [ImportState]) {
    let source_labels = current_source_label_map();
    for state in states {
        if let Some(label) = source_labels.get(state.source_id.as_str()) {
            state.source_label = (*label).to_string();
        }
    }
}

fn canonicalize_import_event_labels(events: &mut [ImportEvent]) {
    let source_labels = current_source_label_map();
    for event in events {
        if let Some(label) = source_labels.get(event.source_id.as_str()) {
            event.source_label = (*label).to_string();
        }
    }
}

fn refresh_import_metadata_source_labels(
    conn: &Connection,
) -> Result<(), Box<dyn std::error::Error>> {
    for source in source_specs() {
        conn.execute(
            "UPDATE import_states
             SET source_label = ?1
             WHERE source_id = ?2 AND source_label <> ?1",
            rusqlite::params![source.label, source.id],
        )?;
        conn.execute(
            "UPDATE import_events
             SET source_label = ?1
             WHERE source_id = ?2 AND source_label <> ?1",
            rusqlite::params![source.label, source.id],
        )?;
    }
    Ok(())
}

fn upsert_import_state(
    conn: &Connection,
    state: &ImportState,
) -> Result<(), Box<dyn std::error::Error>> {
    conn.execute(
        "INSERT INTO import_states (
            source_id, source_label, root_path, total_files, total_bytes,
            next_file_index, processed_files, imported_prompt_count, completed, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
        ON CONFLICT(source_id) DO UPDATE SET
            source_label = excluded.source_label,
            root_path = excluded.root_path,
            total_files = excluded.total_files,
            total_bytes = excluded.total_bytes,
            next_file_index = excluded.next_file_index,
            processed_files = excluded.processed_files,
            imported_prompt_count = excluded.imported_prompt_count,
            completed = excluded.completed,
            updated_at = excluded.updated_at",
        rusqlite::params![
            &state.source_id,
            &state.source_label,
            &state.root_path,
            state.total_files as i64,
            state.total_bytes as i64,
            state.next_file_index as i64,
            state.processed_files as i64,
            state.imported_prompt_count as i64,
            if state.completed { 1_i64 } else { 0_i64 },
            &state.updated_at,
        ],
    )?;
    Ok(())
}

fn insert_import_event(
    conn: &Connection,
    generated_at: &str,
    state: &ImportState,
    batch_start_index: usize,
    batch_file_count: usize,
    batch_prompt_count: usize,
    warnings: &[String],
) -> Result<(), Box<dyn std::error::Error>> {
    conn.execute(
        "INSERT INTO import_events (
            generated_at, source_id, source_label, root_path, batch_start_index,
            batch_file_count, batch_prompt_count, processed_files, total_files,
            completed, warnings_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        rusqlite::params![
            generated_at,
            &state.source_id,
            &state.source_label,
            &state.root_path,
            batch_start_index as i64,
            batch_file_count as i64,
            batch_prompt_count as i64,
            state.processed_files as i64,
            state.total_files as i64,
            if state.completed { 1_i64 } else { 0_i64 },
            serde_json::to_string(warnings)?,
        ],
    )?;
    Ok(())
}

fn read_import_events(
    conn: &Connection,
    limit: usize,
) -> Result<(Vec<ImportEvent>, usize), Box<dyn std::error::Error>> {
    let total_events = conn.query_row("SELECT COUNT(*) FROM import_events", [], |row| {
        row.get::<_, i64>(0)
    })? as usize;
    let mut stmt = conn.prepare(
        "SELECT id, generated_at, source_id, source_label, root_path,
            batch_start_index, batch_file_count, batch_prompt_count,
            processed_files, total_files, completed, warnings_json
         FROM import_events
         ORDER BY id DESC
         LIMIT ?1",
    )?;
    let events = stmt
        .query_map([limit as i64], |row| {
            let warnings_json: String = row.get(11)?;
            let warnings = serde_json::from_str::<Vec<String>>(&warnings_json).unwrap_or_default();
            Ok(ImportEvent {
                id: row.get(0)?,
                generated_at: row.get(1)?,
                source_id: row.get(2)?,
                source_label: row.get(3)?,
                root_path: row.get(4)?,
                batch_start_index: row.get::<_, i64>(5)? as usize,
                batch_file_count: row.get::<_, i64>(6)? as usize,
                batch_prompt_count: row.get::<_, i64>(7)? as usize,
                processed_files: row.get::<_, i64>(8)? as usize,
                total_files: row.get::<_, i64>(9)? as usize,
                completed: row.get::<_, i64>(10)? != 0,
                warnings,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok((events, total_events))
}

struct StoredPromptRow {
    id: String,
    hash: String,
    source: String,
    session_id: String,
    path: String,
    timestamp: Option<String>,
    cwd: Option<String>,
    text: String,
    word_count: usize,
    char_count: usize,
    risk_flags_json: String,
    quality_json: String,
}

struct StoredPromptFilters<'a> {
    query: &'a str,
    source: &'a str,
    date: &'a str,
    workspace: &'a str,
}

fn read_stored_prompts(
    conn: &Connection,
    limit: usize,
    filters: &StoredPromptFilters<'_>,
    preview_sort: PreviewSort,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    let order_by = match preview_sort {
        PreviewSort::Latest => "COALESCE(timestamp, last_seen_at, first_seen_at, '') DESC, id DESC",
        PreviewSort::QualityAsc => {
            "quality_score ASC, prompt_date DESC, COALESCE(timestamp, last_seen_at, '') DESC"
        }
        PreviewSort::QualityDesc => {
            "quality_score DESC, prompt_date DESC, COALESCE(timestamp, last_seen_at, '') DESC"
        }
    };
    let sql = format!(
        "SELECT id, hash, source, session_id, source_path, timestamp, cwd, text,
            word_count, char_count, risk_flags_json, quality_json
         FROM prompts
         WHERE (?1 = ''
            OR LOWER(text) LIKE ?2
            OR LOWER(source) LIKE ?2
            OR LOWER(COALESCE(cwd, '')) LIKE ?2
            OR prompt_date LIKE ?2)
           AND (?3 = '' OR source = ?3)
           AND (?4 = '' OR prompt_date = ?4)
           AND (?5 = '' OR LOWER(COALESCE(cwd, '')) LIKE ?6)
         ORDER BY {order_by}
         LIMIT ?7"
    );
    let query_lower = filters.query.to_lowercase();
    let like = format!("%{query_lower}%");
    let workspace_lower = filters.workspace.to_lowercase();
    let workspace_like = format!("%{workspace_lower}%");
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt
        .query_map(
            rusqlite::params![
                query_lower,
                like,
                filters.source,
                filters.date,
                workspace_lower,
                workspace_like,
                limit as i64,
            ],
            |row| {
                Ok(StoredPromptRow {
                    id: row.get(0)?,
                    hash: row.get(1)?,
                    source: row.get(2)?,
                    session_id: row.get(3)?,
                    path: row.get(4)?,
                    timestamp: row.get(5)?,
                    cwd: row.get(6)?,
                    text: row.get(7)?,
                    word_count: row.get::<_, i64>(8)? as usize,
                    char_count: row.get::<_, i64>(9)? as usize,
                    risk_flags_json: row.get(10)?,
                    quality_json: row.get(11)?,
                })
            },
        )?
        .collect::<Result<Vec<_>, _>>()?;

    let mut prompts = rows
        .into_iter()
        .map(|row| {
            Ok(PromptRecord {
                id: row.id,
                source: row.source,
                session_id: row.session_id,
                path: row.path,
                timestamp: row.timestamp,
                cwd: row.cwd,
                text: row.text,
                word_count: row.word_count,
                char_count: row.char_count,
                hash: row.hash,
                risk_flags: serde_json::from_str(&row.risk_flags_json)?,
                quality: serde_json::from_str(&row.quality_json)?,
            })
        })
        .collect::<Result<Vec<_>, Box<dyn std::error::Error>>>()?;

    if preview_sort == PreviewSort::Latest {
        prompts.reverse();
    }

    Ok(prompts)
}

fn count_stored_prompt_matches(
    conn: &Connection,
    filters: &StoredPromptFilters<'_>,
) -> Result<usize, Box<dyn std::error::Error>> {
    let query_lower = filters.query.to_lowercase();
    let like = format!("%{query_lower}%");
    let workspace_lower = filters.workspace.to_lowercase();
    let workspace_like = format!("%{workspace_lower}%");
    let count: i64 = conn.query_row(
        "SELECT COUNT(*)
         FROM prompts
         WHERE (?1 = ''
            OR LOWER(text) LIKE ?2
            OR LOWER(source) LIKE ?2
            OR LOWER(COALESCE(cwd, '')) LIKE ?2
            OR prompt_date LIKE ?2)
           AND (?3 = '' OR source = ?3)
           AND (?4 = '' OR prompt_date = ?4)
           AND (?5 = '' OR LOWER(COALESCE(cwd, '')) LIKE ?6)",
        rusqlite::params![
            query_lower,
            like,
            filters.source,
            filters.date,
            workspace_lower,
            workspace_like,
        ],
        |row| row.get(0),
    )?;
    Ok(count as usize)
}

fn read_stored_prompt_facet(
    conn: &Connection,
    expression: &str,
    where_clause: &str,
    limit: usize,
) -> Result<Vec<FrequencyItem>, Box<dyn std::error::Error>> {
    let sql = format!(
        "SELECT {expression} AS facet_value, COUNT(*) AS facet_count
         FROM prompts
         WHERE {where_clause}
         GROUP BY facet_value
         ORDER BY facet_count DESC, LOWER(facet_value) ASC
         LIMIT ?1"
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt
        .query_map([limit as i64], |row| {
            Ok(FrequencyItem {
                text: row.get(0)?,
                count: row.get::<_, i64>(1)? as usize,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

fn ensure_unknown_date_facet(
    conn: &Connection,
    items: &mut Vec<FrequencyItem>,
    limit: usize,
) -> Result<(), Box<dyn std::error::Error>> {
    const UNKNOWN_DATE: &str = "unknown-date";
    if items.iter().any(|item| item.text == UNKNOWN_DATE) {
        return Ok(());
    }

    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM prompts WHERE prompt_date = ?1",
        [UNKNOWN_DATE],
        |row| row.get(0),
    )?;
    if count <= 0 {
        return Ok(());
    }

    if items.len() >= limit {
        items.pop();
    }
    items.push(FrequencyItem {
        text: UNKNOWN_DATE.to_string(),
        count: count as usize,
    });
    Ok(())
}

fn stored_source_summaries(prompts: &[PromptRecord]) -> Vec<SourceSummary> {
    let mut by_source = BTreeMap::<String, Vec<&PromptRecord>>::new();
    for prompt in prompts {
        by_source
            .entry(prompt.source.clone())
            .or_default()
            .push(prompt);
    }
    by_source
        .into_iter()
        .map(|(source, items)| {
            let unique_paths = items
                .iter()
                .map(|prompt| prompt.path.as_str())
                .collect::<BTreeSet<_>>()
                .len();
            let mut summary = SourceSummary {
                id: source.clone(),
                label: source,
                root_path: "stored prompt vault".to_string(),
                files_seen: unique_paths,
                prompts_found: items.len(),
                average_quality: 0.0,
                weak_prompt_count: 0,
                status: "stored".to_string(),
                notes: Vec::new(),
            };
            let source_prompts = items.into_iter().cloned().collect::<Vec<_>>();
            summarize_source_quality(&mut summary, &source_prompts);
            summary
        })
        .collect()
}

fn prompt_database_stats(
    conn: &Connection,
    database_path: &Path,
    inserted_prompt_count: usize,
    updated_prompt_count: usize,
) -> Result<PersistStats, Box<dyn std::error::Error>> {
    let stored_prompt_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM prompts", [], |row| row.get(0))?;
    let date_count: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT prompt_date) FROM prompts",
        [],
        |row| row.get(0),
    )?;

    Ok(PersistStats {
        database_path: database_path.display().to_string(),
        stored_prompt_count: stored_prompt_count as usize,
        inserted_prompt_count,
        updated_prompt_count,
        date_count: date_count as usize,
    })
}

fn should_reconcile_stored_source_rows(warnings: &[String]) -> bool {
    !warnings.iter().any(|warning| {
        warning == SCAN_CANCELED_WARNING
            || warning == SCAN_CANCELED_NOT_PERSISTED_WARNING
            || warning.starts_with("설정된 제한")
    })
}

fn reconcile_stored_source_rows(
    tx: &rusqlite::Transaction<'_>,
    prompts: &[PromptRecord],
    stats: &ScanStats,
    warnings: &[String],
) -> Result<(), Box<dyn std::error::Error>> {
    if !should_reconcile_stored_source_rows(warnings) {
        return Ok(());
    }

    let mut prompt_ids_by_source = BTreeMap::<String, BTreeSet<String>>::new();
    for prompt in prompts {
        prompt_ids_by_source
            .entry(prompt.source.clone())
            .or_default()
            .insert(prompt.id.clone());
    }

    for source in &stats.source_summaries {
        if source.status != "ok" || !source.notes.is_empty() {
            continue;
        }
        let ids = prompt_ids_by_source
            .get(&source.label)
            .cloned()
            .unwrap_or_default();
        if ids.is_empty() {
            tx.execute("DELETE FROM prompts WHERE source = ?1", [&source.label])?;
            continue;
        }

        let mut stmt = tx.prepare("SELECT id FROM prompts WHERE source = ?1")?;
        let existing_ids = stmt
            .query_map([&source.label], |row| row.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?;
        let stale_ids = existing_ids
            .into_iter()
            .filter(|id| !ids.contains(id))
            .collect::<Vec<_>>();
        for chunk in stale_ids.chunks(SQLITE_DELETE_CHUNK_SIZE) {
            let placeholders = std::iter::repeat_n("?", chunk.len())
                .collect::<Vec<_>>()
                .join(", ");
            let sql = format!("DELETE FROM prompts WHERE source = ? AND id IN ({placeholders})");
            let mut params: Vec<&dyn ToSql> = Vec::with_capacity(chunk.len() + 1);
            params.push(&source.label);
            for id in chunk {
                params.push(id);
            }
            tx.execute(&sql, params.as_slice())?;
        }
    }

    Ok(())
}

fn persist_scan_result(
    database_path: &Path,
    generated_at: &str,
    prompts: &[PromptRecord],
    stats: &ScanStats,
    warnings: &[String],
) -> Result<PersistStats, Box<dyn std::error::Error>> {
    persist_scan_result_inner(database_path, generated_at, prompts, stats, warnings, true)
}

fn persist_incremental_scan_result(
    database_path: &Path,
    generated_at: &str,
    prompts: &[PromptRecord],
    stats: &ScanStats,
    warnings: &[String],
) -> Result<PersistStats, Box<dyn std::error::Error>> {
    persist_scan_result_inner(database_path, generated_at, prompts, stats, warnings, false)
}

fn persist_scan_result_inner(
    database_path: &Path,
    generated_at: &str,
    prompts: &[PromptRecord],
    stats: &ScanStats,
    warnings: &[String],
    reconcile_source_rows: bool,
) -> Result<PersistStats, Box<dyn std::error::Error>> {
    let mut conn = open_promptvault_database(database_path)?;

    let tx = conn.transaction()?;
    tx.execute(
        "INSERT INTO scan_runs (
            generated_at, total_prompts, total_files, average_quality,
            weak_prompt_count, warnings_json
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![
            generated_at,
            stats.total_prompts as i64,
            stats.total_files as i64,
            stats.average_quality,
            stats.weak_prompt_count as i64,
            serde_json::to_string(warnings)?,
        ],
    )?;
    let scan_run_id = tx.last_insert_rowid();

    for source in &stats.source_summaries {
        tx.execute(
            "INSERT INTO source_summaries (
                scan_run_id, source_id, label, root_path, files_seen, prompts_found,
                average_quality, weak_prompt_count, status, notes_json
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                scan_run_id,
                source.id,
                source.label,
                source.root_path,
                source.files_seen as i64,
                source.prompts_found as i64,
                source.average_quality,
                source.weak_prompt_count as i64,
                source.status,
                serde_json::to_string(&source.notes)?,
            ],
        )?;
    }

    let mut inserted_prompt_count = 0usize;
    let mut updated_prompt_count = 0usize;
    for prompt in prompts {
        let exists: i64 = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM prompts WHERE id = ?1)",
            [&prompt.id],
            |row| row.get(0),
        )?;
        if exists == 0 {
            inserted_prompt_count += 1;
        } else {
            updated_prompt_count += 1;
        }

        tx.execute(
            "INSERT INTO prompts (
                id, hash, source, session_id, source_path, timestamp, prompt_date, cwd,
                text, word_count, char_count, risk_flags_json, quality_json,
                quality_score, quality_band, first_seen_at, last_seen_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?16)
            ON CONFLICT(id) DO UPDATE SET
                hash = excluded.hash,
                source = excluded.source,
                session_id = excluded.session_id,
                source_path = excluded.source_path,
                timestamp = excluded.timestamp,
                prompt_date = excluded.prompt_date,
                cwd = excluded.cwd,
                text = excluded.text,
                word_count = excluded.word_count,
                char_count = excluded.char_count,
                risk_flags_json = excluded.risk_flags_json,
                quality_json = excluded.quality_json,
                quality_score = excluded.quality_score,
                quality_band = excluded.quality_band,
                last_seen_at = excluded.last_seen_at",
            rusqlite::params![
                &prompt.id,
                &prompt.hash,
                &prompt.source,
                &prompt.session_id,
                &prompt.path,
                prompt.timestamp.as_deref(),
                prompt_date(prompt.timestamp.as_deref()),
                prompt.cwd.as_deref(),
                &prompt.text,
                prompt.word_count as i64,
                prompt.char_count as i64,
                serde_json::to_string(&prompt.risk_flags)?,
                serde_json::to_string(&prompt.quality)?,
                prompt.quality.score as i64,
                &prompt.quality.band,
                generated_at,
            ],
        )?;
    }
    if reconcile_source_rows {
        reconcile_stored_source_rows(&tx, prompts, stats, warnings)?;
    }
    tx.commit()?;

    prompt_database_stats(
        &conn,
        database_path,
        inserted_prompt_count,
        updated_prompt_count,
    )
}

fn persist_improvement_result(
    database_path: &Path,
    prompt_id: Option<&str>,
    source: Option<&str>,
    result: &ImproveResult,
) -> Result<ImprovePersistence, Box<dyn std::error::Error>> {
    let conn = open_promptvault_database(database_path)?;
    let created_at = Utc::now().to_rfc3339();
    let prompt_id = prompt_id
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    let source = source
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string);
    conn.execute(
        "INSERT INTO prompt_improvements (
            created_at, prompt_id, source, provider, used_ai,
            original_quality_score, revised_quality_score, score_delta,
            resolved_gaps_json, remaining_gaps_json, warnings_json,
            rationale_json, checklist_json, revised_prompt
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        rusqlite::params![
            created_at,
            prompt_id.as_deref(),
            source.as_deref(),
            &result.provider,
            if result.used_ai { 1i64 } else { 0i64 },
            result.quality_delta.before.score as i64,
            result.quality_delta.after.score as i64,
            result.quality_delta.score_delta as i64,
            serde_json::to_string(&result.quality_delta.resolved_gaps)?,
            serde_json::to_string(&result.quality_delta.remaining_gaps)?,
            serde_json::to_string(&result.warnings)?,
            serde_json::to_string(&result.rationale)?,
            serde_json::to_string(&result.checklist)?,
            &result.revised_prompt,
        ],
    )?;
    let improvement_event_id = conn.last_insert_rowid();
    let prompt_improvement_count = if let Some(prompt_id) = prompt_id.as_deref() {
        conn.query_row(
            "SELECT COUNT(*) FROM prompt_improvements WHERE prompt_id = ?1",
            [prompt_id],
            |row| row.get::<_, i64>(0),
        )?
    } else {
        conn.query_row("SELECT COUNT(*) FROM prompt_improvements", [], |row| {
            row.get::<_, i64>(0)
        })?
    };

    Ok(ImprovePersistence {
        database_path: database_path.display().to_string(),
        improvement_event_id,
        prompt_improvement_count: prompt_improvement_count as usize,
    })
}

fn rank_counts(counts: HashMap<String, usize>, limit: usize) -> Vec<FrequencyItem> {
    let mut items = counts
        .into_iter()
        .map(|(text, count)| FrequencyItem { text, count })
        .collect::<Vec<_>>();
    items.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.text.cmp(&b.text)));
    items.truncate(limit);
    items
}

fn word_regex() -> &'static Regex {
    static WORD_REGEX: OnceLock<Regex> = OnceLock::new();
    WORD_REGEX
        .get_or_init(|| Regex::new(r"[A-Za-z가-힣0-9][A-Za-z가-힣0-9_\-']*").expect("word regex"))
}

fn quoted_curl_sensitive_header_regex() -> &'static Regex {
    static QUOTED_CURL_SENSITIVE_HEADER_REGEX: OnceLock<Regex> = OnceLock::new();
    QUOTED_CURL_SENSITIVE_HEADER_REGEX.get_or_init(|| {
        Regex::new(
            r#"(?im)((?:--header(?:\s+|=)|-H\s*))"(?:[a-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[a-z0-9_-]*)\s*:\s*[^"\r\n]*"|((?:--header(?:\s+|=)|-H\s*))'(?:[a-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[a-z0-9_-]*)\s*:\s*[^'\r\n]*'"#,
        )
        .expect("quoted curl sensitive header regex")
    })
}

fn json_sensitive_property_regex() -> &'static Regex {
    static JSON_SENSITIVE_PROPERTY_REGEX: OnceLock<Regex> = OnceLock::new();
    JSON_SENSITIVE_PROPERTY_REGEX.get_or_init(|| {
        Regex::new(
            r#"(?im)"[a-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[a-z0-9_-]*"\s*:\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*')|'[a-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[a-z0-9_-]*'\s*:\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*')"#,
        )
        .expect("json sensitive property regex")
    })
}

fn risk_regexes() -> &'static Vec<(&'static str, Regex)> {
    static RISK_REGEXES: OnceLock<Vec<(&'static str, Regex)>> = OnceLock::new();
    RISK_REGEXES.get_or_init(|| {
        vec![
            (
                "possible_api_key",
                Regex::new(
                    r#"(?im)--[a-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[a-z0-9_-]*(?:=|\s+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^-\s][^\s]*|-[^-\s][^\s]*)|\bgh[oprsu]_[a-z0-9_]{20,}\b|\b(?:bearer|basic)\s+(?:"(?:[a-z0-9][a-z0-9]*[._~+/=-][a-z0-9._~+/=-]*[a-z0-9_=/+-]|[a-z0-9]{16,})"|'(?:[a-z0-9][a-z0-9]*[._~+/=-][a-z0-9._~+/=-]*[a-z0-9_=/+-]|[a-z0-9]{16,})'|(?:[a-z0-9][a-z0-9]*[._~+/=-][a-z0-9._~+/=-]*[a-z0-9_=/+-]|[a-z0-9]{16,})\b)|(?:--user|-u)\s+[^:\s]+:[^\s]+|(?:--cookie|-b)\s+[^=\s]+=[^\s]+|\b[a-z][a-z0-9+.-]*://(?:[^@\s/?#:]*:)[^@\s/?#]+@\S+|^\s*(?:set-cookie|cookie)\s*:\s*[^\r\n]*|\b(?:[a-z0-9]+[_-])*((?:aws[ _-]?)?access[ _-]?key(?:[ _-]?id)?|(?:aws[ _-]?)?secret[ _-]?access[ _-]?key|api[ _-]?key|private[ _-]?key|(?:access|refresh|auth|id)[ _-]?token|authorization|cookie|credential|secret|signature|token|password)\s*[:=]\s*("[^"\r\n]*"|'[^'\r\n]*'|(?:[a-z]+\s+)?[^\s&]+)?"#,
                )
                    .expect("api key regex"),
            ),
            (
                "private_key",
                Regex::new(
                    r"(?is)-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----.*?-----END [A-Z ]*PRIVATE KEY(?: BLOCK)?-----",
                )
                .expect("private key regex"),
            ),
            (
                "long_base64_like_token",
                Regex::new(
                    r"\b[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b|[A-Za-z0-9_\-]{48,}",
                )
                .expect("token regex"),
            ),
        ]
    })
}

fn stop_words() -> HashSet<&'static str> {
    [
        "the",
        "and",
        "for",
        "that",
        "with",
        "this",
        "from",
        "you",
        "are",
        "was",
        "were",
        "have",
        "has",
        "had",
        "not",
        "but",
        "all",
        "can",
        "will",
        "your",
        "into",
        "then",
        "than",
        "just",
        "내",
        "너",
        "너는",
        "이",
        "그",
        "저",
        "것",
        "수",
        "좀",
        "더",
        "및",
        "에서",
        "으로",
        "하고",
        "하게",
        "하면",
        "되는",
        "위해",
        "대한",
        "그리고",
        "있는",
        "없는",
        "다시",
        "전체",
        "파일",
    ]
    .into_iter()
    .collect()
}

fn render_markdown(
    generated_at: &str,
    stats: &ScanStats,
    prompts: &[PromptRecord],
    warnings: &[String],
) -> String {
    let mut md = String::new();
    md.push_str("# PromptVault Export\n\n");
    md.push_str(&format!("- Generated: `{generated_at}`\n"));
    md.push_str(&format!("- Total prompts: `{}`\n", stats.total_prompts));
    md.push_str(&format!("- Total files scanned: `{}`\n", stats.total_files));
    md.push_str(&format!(
        "- Average words per prompt: `{:.1}`\n\n",
        stats.average_words
    ));
    md.push_str(&format!(
        "- Average quality score: `{:.1}`\n",
        stats.average_quality
    ));
    md.push_str(&format!(
        "- Weak prompts: `{}`\n\n",
        stats.weak_prompt_count
    ));

    if !warnings.is_empty() {
        md.push_str("## Warnings\n\n");
        for warning in warnings {
            md.push_str(&format!("- {}\n", warning));
        }
        md.push('\n');
    }

    md.push_str("## Source Coverage\n\n");
    md.push_str("| Source | Status | Files | Prompts | Avg Quality | Weak | Path |\n");
    md.push_str("|---|---:|---:|---:|---:|---:|---|\n");
    for source in &stats.source_summaries {
        md.push_str(&format!(
            "| {} | {} | {} | {} | {:.1} | {} | `{}` |\n",
            escape_table(&source.label),
            source.status,
            source.files_seen,
            source.prompts_found,
            source.average_quality,
            source.weak_prompt_count,
            escape_table(&source.root_path)
        ));
    }

    md.push_str("\n## Frequent Words\n\n");
    for item in &stats.top_words {
        md.push_str(&format!("- `{}`: {}\n", item.text, item.count));
    }

    md.push_str("\n## Frequent Phrases\n\n");
    for item in &stats.top_phrases {
        md.push_str(&format!("- {} ({})\n", item.text, item.count));
    }

    md.push_str("\n## Repeated Prompt Starts\n\n");
    if stats.repeated_prompts.is_empty() {
        md.push_str("- No exact repeated prompt starts found in this scan.\n");
    } else {
        for item in &stats.repeated_prompts {
            md.push_str(&format!("- {} ({})\n", item.text, item.count));
        }
    }

    md.push_str("\n## Prompts By Date\n\n");
    if stats.prompts_by_date.is_empty() {
        md.push_str("- No dated prompts found in this scan.\n");
    } else {
        for item in &stats.prompts_by_date {
            md.push_str(&format!("- `{}`: {}\n", item.text, item.count));
        }
    }

    md.push_str("\n## Frequent Quality Gaps\n\n");
    if stats.top_quality_gaps.is_empty() {
        md.push_str("- No quality gaps found in this scan.\n");
    } else {
        for item in &stats.top_quality_gaps {
            md.push_str(&format!("- `{}`: {}\n", item.text, item.count));
        }
    }

    md.push_str("\n## Prompt Improvement Principles\n\n");
    for item in prompt_checklist() {
        md.push_str(&format!("- {item}\n"));
    }

    md.push_str("\n## User Prompts\n\n");
    let mut grouped: BTreeMap<&str, Vec<&PromptRecord>> = BTreeMap::new();
    for prompt in prompts {
        grouped.entry(&prompt.source).or_default().push(prompt);
    }
    for (source, entries) in grouped {
        md.push_str(&format!("### {source}\n\n"));
        for prompt in entries {
            md.push_str(&format!(
                "#### {} · {}\n\n",
                prompt.timestamp.as_deref().unwrap_or("unknown-time"),
                prompt.id
            ));
            md.push_str(&format!(
                "- Session: `{}`\n",
                escape_inline(&prompt.session_id)
            ));
            if let Some(cwd) = &prompt.cwd {
                md.push_str(&format!("- Workspace: `{}`\n", escape_inline(cwd)));
            }
            md.push_str(&format!(
                "- Source file: `{}`\n",
                escape_inline(&prompt.path)
            ));
            if !prompt.risk_flags.is_empty() {
                md.push_str(&format!(
                    "- Risk flags: `{}`\n",
                    prompt.risk_flags.join(", ")
                ));
            }
            md.push_str(&format!(
                "- Quality: `{}` ({})\n",
                prompt.quality.score, prompt.quality.band
            ));
            if !prompt.quality.missing.is_empty() {
                md.push_str(&format!(
                    "- Quality gaps: `{}`\n",
                    prompt.quality.missing.join(", ")
                ));
            }
            md.push_str("\n```text\n");
            md.push_str(&prompt.text);
            md.push_str("\n```\n\n");
        }
    }
    md
}

fn prompt_checklist() -> Vec<String> {
    vec![
        "목표 산출물과 성공 기준을 한 문장으로 먼저 고정한다.".to_string(),
        "읽기 전용 조사, 파일 편집, 테스트 실행, 배포/푸시 권한을 분리해서 명시한다.".to_string(),
        "필수 입력 경로, 금지 경로, 기존 사용자 변경 보존 조건을 함께 적는다.".to_string(),
        "검증 명령과 PASS/FAIL 기준을 프롬프트 안에 포함한다.".to_string(),
        "외부 연구나 최신 문서가 필요한 경우 날짜와 출처 저장 위치를 요구한다.".to_string(),
        "긴 작업은 체크리스트와 완료 감사표를 요구해 대리 지표에 속지 않게 한다.".to_string(),
    ]
}

fn escape_table(value: &str) -> String {
    value.replace('|', "\\|")
}

fn escape_inline(value: &str) -> String {
    value.replace('`', "'")
}

fn default_markdown_path() -> PathBuf {
    let home = user_home_dir();
    let stamp = Local::now().format("%Y-%m-%d-%H%M%S").to_string();
    home.join("Documents")
        .join(APP_DIR_NAME)
        .join(format!("promptvault-export-{stamp}.md"))
}

pub fn default_database_path() -> PathBuf {
    let home = user_home_dir();
    home.join("Documents")
        .join(APP_DIR_NAME)
        .join("promptvault.sqlite")
}

fn local_improvement(prompt: &str, context: Option<&str>, warnings: Vec<String>) -> ImproveResult {
    let mut revised = String::new();
    let redacted_prompt = redact_sensitive_text(prompt);
    let goal = first_sentence(&redacted_prompt);
    revised.push_str("목표:\n");
    revised.push_str("- ");
    revised.push_str(
        goal.as_deref()
            .unwrap_or("해결하려는 작업을 명확히 수행한다."),
    );
    revised.push_str("\n\n맥락:\n");
    let redacted_context = context
        .filter(|value| !value.trim().is_empty())
        .map(redact_sensitive_text);
    if let Some(context) = redacted_context.as_deref() {
        revised.push_str("- ");
        revised.push_str(context.trim());
        revised.push('\n');
    } else {
        revised.push_str("- 관련 repo/path, 현재 오류, 이미 시도한 방법을 확인한 뒤 진행한다.\n");
    }
    revised.push_str("\n요구사항:\n");
    revised.push_str("- 사용자 원본 파일과 기존 변경을 보존한다.\n");
    revised.push_str("- 필요한 최신 문서나 외부 근거는 출처와 날짜를 남긴다.\n");
    revised.push_str("- 구현은 작은 단위로 진행하고, 변경 파일을 명시한다.\n");
    revised.push_str("- 완료 전 실제 명령으로 빌드/테스트/검증한다.\n");
    revised.push_str("\n완료 보고:\n");
    revised.push_str("- 변경 요약, 검증 결과, 남은 리스크를 짧게 보고한다.");

    ImproveResult {
        provider: "local-rules".to_string(),
        used_ai: false,
        quality_delta: quality_delta(prompt, &revised),
        revised_prompt: revised,
        rationale: vec![
            "목표와 성공 기준을 분리해 에이전트가 산출물을 놓치지 않게 했습니다.".to_string(),
            "권한/보존/검증 조건을 명시해 기존 소스와 비밀정보 리스크를 낮췄습니다.".to_string(),
            "완료 보고 형식을 고정해 결과 검토 비용을 줄였습니다.".to_string(),
        ],
        checklist: prompt_checklist(),
        warnings,
        persistence: None,
    }
}

fn first_sentence(prompt: &str) -> Option<String> {
    prompt
        .split(['.', '?', '!', '\n', '。', '？', '！'])
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(|line| line.chars().take(180).collect())
}

fn read_secret_env(path: &Path) -> Result<HashMap<String, String>, Box<dyn std::error::Error>> {
    let mut buf = String::new();
    File::open(path)?.read_to_string(&mut buf)?;
    let mut env = HashMap::new();
    for line in buf.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        if let Some((key, value)) = line.split_once('=') {
            env.insert(
                key.trim().to_string(),
                value
                    .trim()
                    .trim_matches('"')
                    .trim_matches('\'')
                    .to_string(),
            );
        }
    }
    Ok(env)
}

fn user_home_dir() -> PathBuf {
    dirs::home_dir()
        .or_else(|| {
            std::env::var_os("HOME")
                .filter(|value| !value.is_empty())
                .map(PathBuf::from)
        })
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

fn secret_env_candidates_for_home(home: &Path) -> Vec<PathBuf> {
    vec![
        home.join(PROMPTVAULT_SECRET_ENV_RELATIVE_PATH),
        home.join(USER_SECRET_ENV_RELATIVE_PATH),
    ]
}

fn secret_env_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();
    if let Some(path) = std::env::var_os("PROMPTVAULT_SECRET_ENV")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
    {
        candidates.push(path);
    }
    candidates.extend(secret_env_candidates_for_home(&user_home_dir()));
    candidates
}

fn load_improve_env() -> HashMap<String, String> {
    let mut env = HashMap::new();
    for path in secret_env_candidates() {
        if let Ok(values) = read_secret_env(&path) {
            env.extend(values);
            break;
        }
    }
    for key in [
        "OPENAI_API_KEY",
        "OPENAI_BASE_URL",
        "OPENAI_RESPONSES_ENDPOINT",
        "OPENAI_MODEL",
        "GLM_API_KEY",
        "GLM_API_KEY_2",
        "GLM_CODING_ENDPOINT",
        "GLM_CODING_MODEL",
    ] {
        if let Ok(value) = std::env::var(key) {
            if !value.trim().is_empty() {
                env.insert(key.to_string(), value);
            }
        }
    }
    env
}

fn non_empty_env_value(env: &HashMap<String, String>, key: &str) -> Option<String> {
    env.get(key)
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn openai_api_key_from_env(env: &HashMap<String, String>) -> Option<String> {
    non_empty_env_value(env, "OPENAI_API_KEY")
}

fn openai_model_from_env(env: &HashMap<String, String>) -> String {
    non_empty_env_value(env, "OPENAI_MODEL").unwrap_or_else(|| DEFAULT_OPENAI_MODEL.to_string())
}

fn glm_api_key_from_env(env: &HashMap<String, String>) -> Option<String> {
    non_empty_env_value(env, "GLM_API_KEY").or_else(|| non_empty_env_value(env, "GLM_API_KEY_2"))
}

fn glm_model_from_env(env: &HashMap<String, String>) -> String {
    non_empty_env_value(env, "GLM_CODING_MODEL").unwrap_or_else(|| DEFAULT_GLM_MODEL.to_string())
}

fn normalize_openai_responses_endpoint(endpoint: &str) -> String {
    let trimmed = endpoint.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return DEFAULT_OPENAI_RESPONSES_ENDPOINT.to_string();
    }
    if trimmed.ends_with("/responses") {
        trimmed.to_string()
    } else if trimmed.ends_with("/v1") {
        format!("{trimmed}/responses")
    } else {
        format!("{trimmed}/v1/responses")
    }
}

fn normalize_chat_endpoint(endpoint: &str) -> String {
    let trimmed = endpoint.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return DEFAULT_GLM_CHAT_ENDPOINT.to_string();
    }
    if trimmed.ends_with("/chat/completions") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/chat/completions")
    }
}

fn string_array(value: Option<&Value>) -> Vec<String> {
    match value {
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(Value::as_str)
            .map(str::to_string)
            .collect(),
        Some(Value::String(text)) => vec![text.to_string()],
        _ => Vec::new(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_prompts,
            cancel_scan,
            scan_progress,
            plan_scan,
            import_batch,
            list_import_states,
            list_import_events,
            list_stored_prompt_facets,
            load_stored_prompts,
            improve_prompt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    fn find_subslice(haystack: &[u8], needle: &[u8]) -> Option<usize> {
        haystack
            .windows(needle.len())
            .position(|window| window == needle)
    }

    fn captured_content_length(headers: &str) -> Option<usize> {
        headers.lines().find_map(|line| {
            let (key, value) = line.split_once(':')?;
            if key.eq_ignore_ascii_case("content-length") {
                value.trim().parse::<usize>().ok()
            } else {
                None
            }
        })
    }

    fn spawn_json_server(status: u16, body: Value) -> (String, std::sync::mpsc::Receiver<String>) {
        use std::io::{Read, Write};
        use std::net::TcpListener;
        use std::sync::mpsc;
        use std::time::Duration;

        let listener = TcpListener::bind("127.0.0.1:0").expect("bind test server");
        let addr = listener.local_addr().expect("test server addr");
        let (tx, rx) = mpsc::channel();
        let response_body = body.to_string();

        std::thread::spawn(move || {
            let (mut stream, _) = listener.accept().expect("accept one test request");
            let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
            let mut bytes = Vec::new();
            let mut buffer = [0_u8; 4096];

            loop {
                match stream.read(&mut buffer) {
                    Ok(0) => break,
                    Ok(count) => {
                        bytes.extend_from_slice(&buffer[..count]);
                        if let Some(header_end) = find_subslice(&bytes, b"\r\n\r\n") {
                            let headers = String::from_utf8_lossy(&bytes[..header_end]);
                            let body_len = captured_content_length(&headers).unwrap_or(0);
                            if bytes.len() >= header_end + 4 + body_len {
                                break;
                            }
                        }
                    }
                    Err(_) => break,
                }
            }

            let request = String::from_utf8_lossy(&bytes).to_string();
            let _ = tx.send(request);
            let status_text = if status == 200 {
                "200 OK"
            } else {
                "500 Internal Server Error"
            };
            let response = format!(
                "HTTP/1.1 {status_text}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                response_body.len(),
                response_body
            );
            let _ = stream.write_all(response.as_bytes());
        });

        (format!("http://{addr}"), rx)
    }

    #[test]
    fn strips_codex_injected_context() {
        let text = "# AGENTS.md instructions for /tmp\n<INSTRUCTIONS>\npolicy\n</INSTRUCTIONS>\n<environment_context>\n  <cwd>/tmp</cwd>\n</environment_context>\nBuild the app and run tests.";
        assert_eq!(strip_injected_context(text), "Build the app and run tests.");
    }

    #[test]
    fn drops_context_only_record() {
        let text = "# AGENTS.md instructions for /tmp\n<INSTRUCTIONS>\npolicy\n</INSTRUCTIONS>";
        assert_eq!(strip_injected_context(text), "");
    }

    #[test]
    fn normalizes_control_characters() {
        assert_eq!(
            normalize_prompt_text("alpha\u{0}beta\n\ngamma"),
            "alpha beta\ngamma"
        );
    }

    #[test]
    fn local_improvement_keeps_verification_section() {
        let result = local_improvement("Fix the failing parser test.", None, Vec::new());
        assert!(result.revised_prompt.contains("목표:"));
        assert!(result.revised_prompt.contains("완료 전 실제 명령"));
    }

    #[test]
    fn local_improvement_reports_quality_delta() {
        let result = local_improvement("make better", None, Vec::new());

        assert!(result.quality_delta.score_delta > 0);
        assert_eq!(result.quality_delta.before.band, "weak");
        assert!(result.quality_delta.after.score >= 80);
        assert!(result
            .quality_delta
            .resolved_gaps
            .contains(&"verification".to_string()));
    }

    #[test]
    fn local_improvement_redacts_risky_original_sentence() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let result = local_improvement(
            &format!("Fix parser handling for {synthetic_token}"),
            None,
            Vec::new(),
        );

        assert!(!result.revised_prompt.contains(&synthetic_token));
        assert!(result
            .revised_prompt
            .contains("[REDACTED_LONG_BASE64_LIKE_TOKEN]"));
    }

    #[test]
    fn external_improve_block_reason_flags_risky_prompt() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let warning = external_improve_block_reason(
            &format!("Fix parser handling for {synthetic_token}"),
            None,
        )
        .expect("risky prompt should block external improve");

        assert!(warning.contains("위험 패턴 텍스트"));
        assert!(!warning.contains(&synthetic_token));
    }

    #[test]
    fn external_improve_block_reason_flags_risky_context() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let warning = external_improve_block_reason(
            "Fix parser handling.",
            Some(&format!("workspace token {synthetic_token}")),
        )
        .expect("risky context should block external improve");

        assert!(warning.contains("위험 패턴 텍스트"));
        assert!(!warning.contains(&synthetic_token));
    }

    #[test]
    fn local_improvement_redacts_risky_context() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let result = local_improvement(
            "Fix parser handling.",
            Some(&format!("workspace token {synthetic_token}")),
            Vec::new(),
        );

        assert!(!result.revised_prompt.contains(&synthetic_token));
        assert!(result
            .revised_prompt
            .contains("[REDACTED_LONG_BASE64_LIKE_TOKEN]"));
    }

    #[test]
    fn glm_content_parser_rejects_empty_revised_prompt() {
        let content = r#"{"revised_prompt":"   ","rationale":["ok"],"checklist":["verify"]}"#;

        assert!(glm_improvement_from_content("make better", content).is_none());
    }

    #[test]
    fn openai_response_parser_reads_output_text() {
        let value = serde_json::json!({
            "output_text": "{\"revised_prompt\":\"목표:\\n- Improve parsing tests\\n\\n검증:\\n- cargo test\",\"rationale\":[\"structured\"],\"checklist\":[\"run tests\"]}"
        });

        let result =
            openai_improvement_from_response("make better", &value).expect("parse openai output");

        assert_eq!(result.provider, "openai");
        assert!(result.used_ai);
        assert!(result.revised_prompt.contains("목표:"));
    }

    #[test]
    fn openai_response_parser_reads_nested_output_text() {
        let value = serde_json::json!({
            "output": [{
                "content": [{
                    "type": "output_text",
                    "text": "{\"revised_prompt\":\"목표:\\n- Improve nested output parsing\\n\\n검증:\\n- cargo test\",\"rationale\":[\"nested\"],\"checklist\":[\"verify\"]}"
                }]
            }]
        });

        let result =
            openai_improvement_from_response("make better", &value).expect("parse nested output");

        assert_eq!(result.provider, "openai");
        assert!(result.revised_prompt.contains("nested output"));
    }

    #[test]
    fn openai_api_key_selection_ignores_blank_key() {
        let mut env = HashMap::new();
        env.insert("OPENAI_API_KEY".to_string(), "   ".to_string());

        assert!(openai_api_key_from_env(&env).is_none());
    }

    #[test]
    fn openai_model_selection_ignores_blank_model() {
        let mut env = HashMap::new();
        env.insert("OPENAI_MODEL".to_string(), "   ".to_string());

        assert_eq!(openai_model_from_env(&env), DEFAULT_OPENAI_MODEL);
    }

    #[test]
    fn normalizes_openai_responses_endpoint() {
        assert_eq!(
            normalize_openai_responses_endpoint(""),
            DEFAULT_OPENAI_RESPONSES_ENDPOINT
        );
        assert_eq!(
            normalize_openai_responses_endpoint("https://api.openai.com"),
            "https://api.openai.com/v1/responses"
        );
        assert_eq!(
            normalize_openai_responses_endpoint("https://api.openai.com/v1"),
            "https://api.openai.com/v1/responses"
        );
        assert_eq!(
            normalize_openai_responses_endpoint("https://api.openai.com/v1/responses"),
            "https://api.openai.com/v1/responses"
        );
    }

    #[test]
    fn glm_api_key_selection_ignores_blank_primary_key() {
        let mut env = HashMap::new();
        env.insert("GLM_API_KEY".to_string(), "   ".to_string());
        env.insert("GLM_API_KEY_2".to_string(), "secondary-key".to_string());

        assert_eq!(glm_api_key_from_env(&env).as_deref(), Some("secondary-key"));
    }

    #[test]
    fn glm_model_selection_ignores_blank_model() {
        let mut env = HashMap::new();
        env.insert("GLM_CODING_MODEL".to_string(), "   ".to_string());

        assert_eq!(glm_model_from_env(&env), "glm-4.6");
    }

    #[tokio::test]
    async fn improve_prompt_with_env_uses_openai_provider() {
        let response = serde_json::json!({
            "output": [{
                "content": [{
                    "type": "output_text",
                    "text": "{\"revised_prompt\":\"목표:\\n- Make the parser test failure reproducible\\n\\n맥락:\\n- Preserve user files\\n\\n검증:\\n- cargo test parser\",\"rationale\":[\"adds goal and verification\"],\"checklist\":[\"run targeted test\"]}"
                }]
            }]
        });
        let (base_url, request_rx) = spawn_json_server(200, response);
        let mut env = HashMap::new();
        env.insert("OPENAI_API_KEY".to_string(), "mock-openai-key".to_string());
        env.insert("OPENAI_MODEL".to_string(), "mock-openai-model".to_string());
        env.insert(
            "OPENAI_RESPONSES_ENDPOINT".to_string(),
            format!("{base_url}/v1/responses"),
        );

        let result = improve_prompt_with_env(
            ImproveRequest {
                prompt: "make better".to_string(),
                context: Some("workspace policy: preserve user files".to_string()),
                force_local: None,
                ..Default::default()
            },
            env,
        )
        .await
        .expect("openai improvement");

        let request = request_rx
            .recv_timeout(std::time::Duration::from_secs(2))
            .expect("captured openai request");
        assert_eq!(result.provider, "openai");
        assert!(result.used_ai);
        assert!(result.warnings.is_empty());
        assert!(result.revised_prompt.contains("검증:"));
        assert!(request.starts_with("POST /v1/responses HTTP/1.1"));
        assert!(request.contains("authorization: Bearer mock-openai-key"));
        assert!(request.contains("\"model\":\"mock-openai-model\""));
        assert!(request.contains("\"json_schema\""));
    }

    #[tokio::test]
    async fn improve_prompt_with_env_uses_glm_when_openai_is_missing() {
        let response = serde_json::json!({
            "choices": [{
                "message": {
                    "content": "{\"revised_prompt\":\"목표:\\n- Make the GLM path reproducible\\n\\n검증:\\n- cargo test glm\",\"rationale\":[\"uses glm\"],\"checklist\":[\"inspect request\"]}"
                }
            }]
        });
        let (base_url, request_rx) = spawn_json_server(200, response);
        let mut env = HashMap::new();
        env.insert("GLM_API_KEY".to_string(), "mock-glm-key".to_string());
        env.insert("GLM_CODING_MODEL".to_string(), "mock-glm-model".to_string());
        env.insert("GLM_CODING_ENDPOINT".to_string(), base_url);

        let result = improve_prompt_with_env(
            ImproveRequest {
                prompt: "make better".to_string(),
                context: None,
                force_local: None,
                ..Default::default()
            },
            env,
        )
        .await
        .expect("glm improvement");

        let request = request_rx
            .recv_timeout(std::time::Duration::from_secs(2))
            .expect("captured glm request");
        assert_eq!(result.provider, "glm");
        assert!(result.used_ai);
        assert!(result.warnings.is_empty());
        assert!(request.starts_with("POST /chat/completions HTTP/1.1"));
        assert!(request.contains("authorization: Bearer mock-glm-key"));
        assert!(request.contains("\"model\":\"mock-glm-model\""));
        assert!(request.contains("\"json_object\""));
    }

    #[tokio::test]
    async fn improve_prompt_inner_can_force_local_provider() {
        let result = improve_prompt_inner(ImproveRequest {
            prompt: "make better".to_string(),
            context: None,
            force_local: Some(true),
            ..Default::default()
        })
        .await
        .expect("force local improvement");

        assert_eq!(result.provider, "local-rules");
        assert!(!result.used_ai);
        assert!(result.warnings.is_empty());
        assert!(result.quality_delta.score_delta > 0);
    }

    #[tokio::test]
    async fn improve_prompt_inner_persists_history_when_requested() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-improve-history-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create improve history root");
        let db_path = root.join("promptvault.sqlite");

        let result = improve_prompt_inner(ImproveRequest {
            prompt: "fix parsing".to_string(),
            context: Some("Codex · /Users/wj/Ai/System/10_Projects/PromptVault".to_string()),
            force_local: Some(true),
            prompt_id: Some("codex-history-row".to_string()),
            source: Some("Codex".to_string()),
            database_path: Some(db_path.display().to_string()),
            persist: Some(true),
        })
        .await
        .expect("persist improvement");

        let persistence = result.persistence.expect("improvement persistence");
        assert_eq!(persistence.database_path, db_path.display().to_string());
        assert_eq!(persistence.prompt_improvement_count, 1);
        assert!(persistence.improvement_event_id > 0);

        let conn = Connection::open(&db_path).expect("open improvement db");
        let row = conn
            .query_row(
                "SELECT prompt_id, source, provider, used_ai, score_delta
                 FROM prompt_improvements WHERE id = ?1",
                [persistence.improvement_event_id],
                |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, i64>(3)?,
                        row.get::<_, i64>(4)?,
                    ))
                },
            )
            .expect("improvement history row");
        assert_eq!(row.0, "codex-history-row");
        assert_eq!(row.1, "Codex");
        assert_eq!(row.2, "local-rules");
        assert_eq!(row.3, 0);
        assert!(row.4 > 0);

        std::fs::remove_dir_all(root).expect("remove improve history root");
    }

    #[tokio::test]
    async fn improve_prompt_inner_does_not_persist_by_default() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-improve-no-history-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let db_path = root.join("promptvault.sqlite");

        let result = improve_prompt_inner(ImproveRequest {
            prompt: "fix parsing".to_string(),
            context: None,
            force_local: Some(true),
            database_path: Some(db_path.display().to_string()),
            ..Default::default()
        })
        .await
        .expect("default improvement");

        assert!(result.persistence.is_none());
        assert!(!db_path.exists());
    }

    #[tokio::test]
    async fn improve_prompt_inner_rejects_empty_prompt() {
        let err = improve_prompt_inner(ImproveRequest {
            prompt: "  ".to_string(),
            context: None,
            force_local: Some(true),
            ..Default::default()
        })
        .await
        .expect_err("empty prompt should fail closed");

        assert!(err
            .to_string()
            .contains("improve requires a non-empty prompt"));
    }

    #[test]
    fn response_prompt_preview_returns_latest_records() {
        let prompts = vec![record("a"), record("b"), record("c")];
        let preview = response_prompts(&prompts, Some(2), PreviewSort::Latest);
        assert_eq!(
            preview
                .iter()
                .map(|item| item.id.as_str())
                .collect::<Vec<_>>(),
            vec!["b", "c"]
        );
        assert!(response_prompts(&prompts, Some(0), PreviewSort::Latest).is_empty());
        assert_eq!(
            response_prompts(&prompts, None, PreviewSort::Latest).len(),
            3
        );
    }

    #[test]
    fn run_scan_rejects_zero_limit() {
        let err = run_scan(ScanOptions {
            limit: Some(0),
            include_markdown: Some(false),
            write_markdown: Some(false),
            ..Default::default()
        })
        .expect_err("zero scan limit should fail closed");

        assert!(err
            .to_string()
            .contains("scan limit requires a positive integer"));
    }

    #[test]
    fn run_scan_rejects_zero_source_limit() {
        let err = run_scan(ScanOptions {
            source_limit: Some(0),
            include_markdown: Some(false),
            write_markdown: Some(false),
            ..Default::default()
        })
        .expect_err("zero source limit should fail closed");

        assert!(err
            .to_string()
            .contains("scan source limit requires a positive integer"));
    }

    #[test]
    fn cancel_scan_run_sets_active_cancel_flag() {
        let run_id = format!(
            "test-scan-cancel-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        );
        let flag = register_scan_run(Some(&run_id))
            .expect("register scan")
            .expect("scan cancel flag");

        let result = cancel_scan_run(CancelScanOptions {
            run_id: run_id.clone(),
        })
        .expect("cancel scan");

        assert_eq!(result.run_id, run_id);
        assert!(result.canceled);
        assert!(flag.load(Ordering::Relaxed));

        scan_cancel_flags()
            .lock()
            .expect("scan registry")
            .remove(&run_id);
    }

    #[test]
    fn cancel_scan_run_reports_missing_active_run() {
        let result = cancel_scan_run(CancelScanOptions {
            run_id: "missing-scan-run".to_string(),
        })
        .expect("cancel missing scan");

        assert_eq!(result.run_id, "missing-scan-run");
        assert!(!result.canceled);
    }

    #[test]
    fn should_persist_scan_result_honors_canceled_scan_policy() {
        let canceled_warnings = vec![SCAN_CANCELED_WARNING.to_string()];
        let normal_warnings =
            vec!["설정된 제한 10개 프롬프트에서 스캔을 중지했습니다.".to_string()];

        assert!(should_persist_scan_result(true, true, &canceled_warnings));
        assert!(!should_persist_scan_result(true, false, &canceled_warnings));
        assert!(should_persist_scan_result(true, false, &normal_warnings));
        assert!(!should_persist_scan_result(false, true, &normal_warnings));
    }

    #[test]
    fn scan_progress_run_reports_active_progress_and_missing_runs() {
        let run_id = format!(
            "test-scan-progress-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        );

        start_scan_progress(Some(&run_id), 3, 25);
        update_scan_progress(Some(&run_id), |progress| {
            progress.source_id = Some("codex".to_string());
            progress.source_label = Some("Codex".to_string());
            progress.source_index = 1;
            progress.source_file_count = Some(50);
            progress.files_seen = 7;
            progress.source_files_seen = 7;
            progress.source_files_discovered = 9;
            progress.prompts_found = 12;
        });

        let progress = scan_progress_run(ScanProgressOptions {
            run_id: run_id.clone(),
        })
        .expect("read active progress");

        assert!(progress.active);
        assert_eq!(progress.source_label.as_deref(), Some("Codex"));
        assert_eq!(progress.source_count, 3);
        assert_eq!(progress.source_file_count, Some(50));
        assert_eq!(progress.files_seen, 7);
        assert_eq!(progress.source_files_discovered, 9);
        assert_eq!(progress.prompts_found, 12);
        assert_eq!(progress.limit, Some(25));

        remove_scan_progress(&run_id);
        let inactive = scan_progress_run(ScanProgressOptions {
            run_id: run_id.clone(),
        })
        .expect("read inactive progress");

        assert_eq!(inactive.run_id, run_id);
        assert!(!inactive.active);
        assert_eq!(inactive.files_seen, 0);
        assert_eq!(inactive.source_files_discovered, 0);
    }

    #[test]
    fn collect_from_source_reports_discovered_files_in_progress() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-discovery-progress-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create discovery root");
        std::fs::write(
            root.join("001.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Add discovery progress telemetry, run cargo test, and report evidence."}]}}"#,
        )
        .expect("write first prompt file");
        std::fs::write(
            root.join("002.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Verify discovered file counts in the scan progress UI and backend."}]}}"#,
        )
        .expect("write second prompt file");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };
        let run_id = format!(
            "test-discovery-progress-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        );

        start_scan_progress(Some(&run_id), 1, 10);
        update_scan_progress(Some(&run_id), |progress| {
            progress.source_id = Some(source.id.to_string());
            progress.source_label = Some(source.label.to_string());
            progress.source_index = 1;
            progress.source_count = 1;
        });

        let prompts = collect_from_source(&source, &mut summary, 10, None, Some(&run_id), 0)
            .expect("collect source with progress");
        let progress = scan_progress_run(ScanProgressOptions {
            run_id: run_id.clone(),
        })
        .expect("read progress");

        remove_scan_progress(&run_id);
        std::fs::remove_dir_all(root).expect("remove discovery root");

        assert_eq!(prompts.len(), 2);
        assert_eq!(progress.source_files_discovered, 2);
        assert_eq!(progress.source_file_count, Some(2));
        assert_eq!(progress.source_files_seen, 2);
    }

    #[test]
    fn run_scan_rejects_output_path_when_export_disabled() {
        let err = run_scan(ScanOptions {
            output_path: Some("/tmp/promptvault-disabled-export.md".to_string()),
            include_markdown: Some(false),
            write_markdown: Some(false),
            source_ids: Some(vec!["missing-source".to_string()]),
            ..Default::default()
        })
        .expect_err("output path with disabled export should fail closed");

        assert!(err
            .to_string()
            .contains("output path cannot be used when markdown export is disabled"));
    }

    #[test]
    fn run_scan_rejects_empty_output_path() {
        let err = run_scan(ScanOptions {
            output_path: Some("  ".to_string()),
            include_markdown: Some(false),
            write_markdown: Some(true),
            source_ids: Some(vec!["missing-source".to_string()]),
            ..Default::default()
        })
        .expect_err("empty output path should fail closed");

        assert!(err
            .to_string()
            .contains("output path requires a non-empty value"));
    }

    #[test]
    fn run_scan_rejects_unknown_preview_sort() {
        let err = run_scan(ScanOptions {
            preview_sort: Some("nonsense".to_string()),
            include_markdown: Some(false),
            write_markdown: Some(false),
            source_ids: Some(vec!["missing-source".to_string()]),
            ..Default::default()
        })
        .expect_err("unknown preview sort should fail closed");

        assert!(err
            .to_string()
            .contains("preview sort must be one of latest, quality-asc, quality-desc"));
    }

    #[test]
    fn preview_sort_rejects_empty_values() {
        let err = PreviewSort::from_option(Some("  "))
            .expect_err("empty preview sort should fail closed");

        assert!(err
            .to_string()
            .contains("preview sort requires a non-empty value"));
    }

    #[test]
    fn run_scan_rejects_unknown_source_ids() {
        let err = run_scan(ScanOptions {
            include_markdown: Some(false),
            write_markdown: Some(false),
            source_ids: Some(vec!["missing-source".to_string()]),
            ..Default::default()
        })
        .expect_err("unknown source ids should fail closed");

        assert!(err
            .to_string()
            .contains("unknown source id: missing-source"));
    }

    #[test]
    fn run_scan_rejects_empty_source_ids() {
        for source_ids in [Vec::new(), vec![" ".to_string()]] {
            let err = run_scan(ScanOptions {
                limit: Some(1),
                include_markdown: Some(false),
                write_markdown: Some(false),
                source_ids: Some(source_ids),
                ..Default::default()
            })
            .expect_err("empty source ids should fail closed");

            assert!(err
                .to_string()
                .contains("source ids require at least one source id"));
        }
    }

    #[test]
    fn validate_source_ids_rejects_mixed_empty_source_ids() {
        let err = validate_source_ids(Some(&["codex".to_string(), " ".to_string()]))
            .expect_err("mixed empty source ids should fail closed");

        assert!(err
            .to_string()
            .contains("source ids cannot include empty values"));
    }

    #[test]
    fn response_prompt_preview_can_return_weakest_records() {
        let prompts = vec![
            record("Fix src-tauri/src/lib.rs parser error, preserve files, run cargo test, and report Markdown output."),
            record("make better"),
            record("Fix the failing test in src/App.tsx and run npm test."),
        ];

        let preview = response_prompts(&prompts, Some(2), PreviewSort::QualityAsc);
        let scores = preview
            .iter()
            .map(|item| item.quality.score)
            .collect::<Vec<_>>();

        assert_eq!(preview[0].text, "make better");
        assert_eq!(scores.len(), 2);
        assert!(scores[0] <= scores[1]);
    }

    #[test]
    fn selects_requested_sources_in_requested_order() {
        let selected = selected_source_specs(Some(&[
            "antigravity-cli-conversation-db".to_string(),
            "codex".to_string(),
            "antigravity-cli-conversation-db".to_string(),
            "antigravity-ide-conversation-db".to_string(),
        ]));

        assert_eq!(
            selected.iter().map(|source| source.id).collect::<Vec<_>>(),
            vec![
                "antigravity-cli-conversation-db",
                "codex",
                "antigravity-ide-conversation-db"
            ]
        );
    }

    #[test]
    fn scan_plan_counts_matching_files_and_bytes() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-plan-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        std::fs::write(root.join("one.jsonl"), "one\n").expect("write one");
        std::fs::write(root.join("two.jsonl"), "two\n").expect("write two");
        std::fs::write(root.join("ignored.txt"), "ignored\n").expect("write ignored");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };

        let plan = build_scan_plan_for_sources("2026-06-06T00:00:00Z".to_string(), vec![source]);

        assert_eq!(plan.total_sources, 1);
        assert_eq!(plan.available_sources, 1);
        assert_eq!(plan.total_files, 2);
        assert_eq!(plan.total_bytes, 8);
        assert!(plan.warnings.is_empty());
        assert_eq!(plan.sources[0].status, "ok");
        assert_eq!(plan.sources[0].file_count, 2);
        assert_eq!(plan.sources[0].byte_count, 8);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn scan_plan_warns_for_large_matching_files() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-plan-large-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        let file = std::fs::File::create(root.join("large.jsonl")).expect("create large file");
        file.set_len(LARGE_FILE_BYTES).expect("make sparse file");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };

        let plan = build_scan_plan_for_sources("2026-06-06T00:00:00Z".to_string(), vec![source]);

        assert_eq!(plan.total_files, 1);
        assert_eq!(plan.large_file_count, 1);
        assert_eq!(plan.largest_file_bytes, LARGE_FILE_BYTES);
        assert!(plan
            .warnings
            .iter()
            .any(|warning| warning.contains("large JSONL files may dominate scan time")));

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn import_batch_persists_resume_state() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-batch-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        for idx in 1..=3 {
            std::fs::write(
                root.join(format!("{idx:03}.jsonl")),
                format!(
                    "{{\"type\":\"response_item\",\"payload\":{{\"role\":\"user\",\"content\":[{{\"text\":\"Fix resumable import batch {idx}, preserve files, run cargo test, and report results.\"}}]}}}}\n"
                ),
            )
            .expect("write prompt file");
        }
        let db_path = root.join("promptvault.sqlite");
        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };

        let first = run_import_batch_for_source(&db_path, source.clone(), 1, true, Some(10))
            .expect("first import batch");
        let second = run_import_batch_for_source(&db_path, source, 1, false, Some(10))
            .expect("second import batch");

        assert_eq!(first.batch_start_index, 0);
        assert_eq!(first.batch_file_count, 1);
        assert_eq!(first.batch_prompt_count, 1);
        assert_eq!(first.state.processed_files, 1);
        assert!(!first.state.completed);
        assert_eq!(second.batch_start_index, 1);
        assert_eq!(second.batch_file_count, 1);
        assert_eq!(second.batch_prompt_count, 1);
        assert_eq!(second.state.processed_files, 2);
        assert_eq!(second.state.imported_prompt_count, 2);
        assert!(!second.state.completed);

        let conn = Connection::open(&db_path).expect("open import db");
        let next_file_index: i64 = conn
            .query_row(
                "SELECT next_file_index FROM import_states WHERE source_id = 'test-codex'",
                [],
                |row| row.get(0),
            )
            .expect("read import state");
        let stored_prompts: i64 = conn
            .query_row("SELECT COUNT(*) FROM prompts", [], |row| row.get(0))
            .expect("read prompt count");
        assert_eq!(next_file_index, 2);
        assert_eq!(stored_prompts, 2);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn list_import_states_returns_empty_snapshot_for_new_database() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-states-empty-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let db_path = root.join("promptvault.sqlite");

        let result = run_list_import_states(ImportStatesOptions {
            database_path: Some(db_path.display().to_string()),
        })
        .expect("list empty import states");

        assert_eq!(result.database_path, db_path.display().to_string());
        assert_eq!(result.states.len(), 0);
        assert_eq!(result.total_sources, 0);
        assert_eq!(result.completed_sources, 0);
        assert_eq!(result.total_files, 0);
        assert_eq!(result.processed_files, 0);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn list_import_states_summarizes_saved_cursors() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-states-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        let db_path = root.join("promptvault.sqlite");
        let conn = open_promptvault_database(&db_path).expect("open import db");
        upsert_import_state(
            &conn,
            &ImportState {
                source_id: "source-a".to_string(),
                source_label: "Source A".to_string(),
                root_path: root.display().to_string(),
                total_files: 10,
                total_bytes: 100,
                next_file_index: 4,
                processed_files: 4,
                imported_prompt_count: 7,
                completed: false,
                updated_at: "2026-06-06T00:00:00Z".to_string(),
            },
        )
        .expect("upsert source a");
        upsert_import_state(
            &conn,
            &ImportState {
                source_id: "source-b".to_string(),
                source_label: "Source B".to_string(),
                root_path: root.display().to_string(),
                total_files: 2,
                total_bytes: 20,
                next_file_index: 2,
                processed_files: 2,
                imported_prompt_count: 3,
                completed: true,
                updated_at: "2026-06-06T00:01:00Z".to_string(),
            },
        )
        .expect("upsert source b");
        drop(conn);

        let result = run_list_import_states(ImportStatesOptions {
            database_path: Some(db_path.display().to_string()),
        })
        .expect("list import states");

        assert_eq!(result.total_sources, 2);
        assert_eq!(result.completed_sources, 1);
        assert_eq!(result.total_files, 12);
        assert_eq!(result.processed_files, 6);
        assert_eq!(result.imported_prompt_count, 10);
        assert_eq!(result.states[0].source_id, "source-a");
        assert_eq!(result.states[1].source_id, "source-b");

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn list_import_states_uses_current_source_labels() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-states-current-label-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        let db_path = root.join("promptvault.sqlite");
        let conn = open_promptvault_database(&db_path).expect("open import db");
        upsert_import_state(
            &conn,
            &ImportState {
                source_id: "antigravity-cli-conversation-db".to_string(),
                source_label: "Antigravity conversation DB".to_string(),
                root_path: root.display().to_string(),
                total_files: 10,
                total_bytes: 100,
                next_file_index: 10,
                processed_files: 10,
                imported_prompt_count: 10,
                completed: true,
                updated_at: "2026-06-06T00:00:00Z".to_string(),
            },
        )
        .expect("upsert stale label state");
        drop(conn);

        let result = run_list_import_states(ImportStatesOptions {
            database_path: Some(db_path.display().to_string()),
        })
        .expect("list import states");

        assert_eq!(result.states.len(), 1);
        assert_eq!(
            result.states[0].source_id,
            "antigravity-cli-conversation-db"
        );
        assert_eq!(
            result.states[0].source_label,
            "Antigravity CLI conversation DB"
        );
        let conn = Connection::open(&db_path).expect("reopen import db");
        let stored_label: String = conn
            .query_row(
                "SELECT source_label FROM import_states WHERE source_id = ?1",
                ["antigravity-cli-conversation-db"],
                |row| row.get(0),
            )
            .expect("read refreshed import state label");
        assert_eq!(stored_label, "Antigravity CLI conversation DB");
        drop(conn);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn list_import_events_returns_empty_snapshot_for_new_database() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-events-empty-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let db_path = root.join("promptvault.sqlite");

        let result = run_list_import_events(ImportEventsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: None,
        })
        .expect("list empty import events");

        assert_eq!(result.database_path, db_path.display().to_string());
        assert_eq!(result.events.len(), 0);
        assert_eq!(result.total_events, 0);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn list_import_events_uses_current_source_labels() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-events-current-label-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        let db_path = root.join("promptvault.sqlite");
        let conn = open_promptvault_database(&db_path).expect("open import db");
        let state = ImportState {
            source_id: "antigravity-cli-conversation-db".to_string(),
            source_label: "Antigravity conversation DB".to_string(),
            root_path: root.display().to_string(),
            total_files: 10,
            total_bytes: 100,
            next_file_index: 10,
            processed_files: 10,
            imported_prompt_count: 10,
            completed: true,
            updated_at: "2026-06-06T00:00:00Z".to_string(),
        };
        insert_import_event(&conn, "2026-06-06T00:00:00Z", &state, 0, 10, 10, &[])
            .expect("insert stale label event");
        drop(conn);

        let result = run_list_import_events(ImportEventsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: None,
        })
        .expect("list import events");

        assert_eq!(result.events.len(), 1);
        assert_eq!(
            result.events[0].source_id,
            "antigravity-cli-conversation-db"
        );
        assert_eq!(
            result.events[0].source_label,
            "Antigravity CLI conversation DB"
        );
        let conn = Connection::open(&db_path).expect("reopen import db");
        let stored_label: String = conn
            .query_row(
                "SELECT source_label FROM import_events WHERE source_id = ?1",
                ["antigravity-cli-conversation-db"],
                |row| row.get(0),
            )
            .expect("read refreshed import event label");
        assert_eq!(stored_label, "Antigravity CLI conversation DB");
        drop(conn);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn import_batch_records_persistent_import_events() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-import-events-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");
        for idx in 1..=2 {
            std::fs::write(
                root.join(format!("{idx:03}.jsonl")),
                format!(
                    "{{\"type\":\"response_item\",\"payload\":{{\"role\":\"user\",\"content\":[{{\"text\":\"Record import event {idx}, persist audit history, and verify the PromptVault database.\"}}]}}}}\n"
                ),
            )
            .expect("write prompt file");
        }
        let db_path = root.join("promptvault.sqlite");
        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };

        run_import_batch_for_source(&db_path, source.clone(), 1, true, Some(10))
            .expect("first import batch");
        run_import_batch_for_source(&db_path, source, 1, false, Some(10))
            .expect("second import batch");

        let result = run_list_import_events(ImportEventsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(1),
        })
        .expect("list import events");

        assert_eq!(result.total_events, 2);
        assert_eq!(result.events.len(), 1);
        let latest = &result.events[0];
        assert_eq!(latest.source_id, "test-codex");
        assert_eq!(latest.source_label, "Test Codex");
        assert_eq!(latest.batch_start_index, 1);
        assert_eq!(latest.batch_file_count, 1);
        assert_eq!(latest.batch_prompt_count, 1);
        assert_eq!(latest.processed_files, 2);
        assert_eq!(latest.total_files, 2);
        assert!(latest.completed);
        assert!(latest.warnings.is_empty());

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn collect_from_source_stops_file_walk_after_limit() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-limit-walk-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");

        for idx in 1..=4 {
            std::fs::write(root.join(format!("{idx:03}.jsonl")), "\n").expect("write extra file");
        }
        std::fs::write(
            root.join("999.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Fix parser performance, run cargo test, and report markdown output."}]}}"#,
        )
        .expect("write prompt file");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };

        let prompts =
            collect_from_source(&source, &mut summary, 1, None, None, 0).expect("collect source");

        assert_eq!(prompts.len(), 1);
        assert_eq!(summary.files_seen, 1);

        std::fs::remove_dir_all(root).expect("remove temp root");
    }

    #[test]
    fn collect_from_source_applies_limit_after_deduping_prompts() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-dedup-limit-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create temp root");

        let duplicate = r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Fix duplicate prompt handling, run cargo test, and report markdown output."}]}}"#;
        std::fs::write(
            root.join("001.jsonl"),
            format!("{duplicate}\n{duplicate}\n"),
        )
        .expect("write duplicate prompt file");
        std::fs::write(
            root.join("002.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Fix the second unique prompt path, run cargo test, and report markdown output."}]}}"#,
        )
        .expect("write unique prompt file");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };

        let prompts =
            collect_from_source(&source, &mut summary, 2, None, None, 0).expect("collect source");
        let files_seen = summary.files_seen;
        std::fs::remove_dir_all(root).expect("remove temp root");

        assert_eq!(prompts.len(), 2);
        assert!(prompts
            .iter()
            .any(|prompt| prompt.text.contains("second unique prompt path")));
        assert_eq!(files_seen, 2);
    }

    #[test]
    fn collect_from_source_stops_when_scan_cancel_requested() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-cancel-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create cancel root");
        std::fs::write(
            root.join("001.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Fix cancelable scan path, run cargo test, and report results."}]}}"#,
        )
        .expect("write cancel prompt file");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };
        let cancel_flag = Arc::new(AtomicBool::new(true));

        let prompts = collect_from_source(&source, &mut summary, 1, Some(&cancel_flag), None, 0)
            .expect("collect canceled source");

        assert!(prompts.is_empty());
        assert_eq!(summary.files_seen, 0);

        std::fs::remove_dir_all(root).expect("remove cancel root");
    }

    #[cfg(unix)]
    #[test]
    fn collect_from_source_reports_walk_errors() {
        use std::os::unix::fs::PermissionsExt;

        let root = std::env::temp_dir().join(format!(
            "promptvault-walk-error-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let blocked = root.join("000-blocked");
        std::fs::create_dir_all(&blocked).expect("create blocked dir");
        std::fs::set_permissions(&blocked, std::fs::Permissions::from_mode(0o000))
            .expect("block traversal");

        let source = SourceSpec {
            id: "test-codex",
            label: "Test Codex",
            root: root.clone(),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 0,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };

        let result = collect_from_source(&source, &mut summary, 1, None, None, 0);
        std::fs::set_permissions(&blocked, std::fs::Permissions::from_mode(0o700))
            .expect("restore traversal");
        std::fs::remove_dir_all(root).expect("remove temp root");
        result.expect("collect source");

        assert!(
            summary
                .notes
                .iter()
                .any(|note| note.contains("순회 항목을 건너뜀")),
            "expected walk error note, got {:?}",
            summary.notes
        );
    }

    #[test]
    fn prompt_quality_scores_actionable_prompts_higher() {
        let strong = assess_prompt_quality(
            "Fix src-tauri/src/lib.rs parser error, preserve existing user files, run cargo test, and report PASS/FAIL in Markdown.",
            &[],
        );
        let weak = assess_prompt_quality("make better", &[]);

        assert!(strong.score >= 80);
        assert_eq!(strong.band, "strong");
        assert!(weak.score < strong.score);
        assert!(weak.missing.contains(&"specific_goal".to_string()));
        assert!(weak.missing.contains(&"verification".to_string()));
    }

    #[test]
    fn source_summary_reports_quality_triage() {
        let prompts = vec![
            record("make better"),
            record(
                "Fix src-tauri/src/lib.rs parser error, preserve files, run cargo test, and report Markdown output.",
            ),
        ];
        let mut summary = SourceSummary {
            id: "test-source".to_string(),
            label: "Test Source".to_string(),
            root_path: "/tmp/test-source".to_string(),
            files_seen: 2,
            prompts_found: prompts.len(),
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: Vec::new(),
        };

        summarize_source_quality(&mut summary, &prompts);

        assert_eq!(summary.weak_prompt_count, 1);
        assert!(summary.average_quality > 0.0);
        assert!(summary.average_quality < 100.0);
    }

    #[test]
    fn source_notes_are_promoted_to_partial_warning() {
        let source = SourceSpec {
            id: "test-source",
            label: "Test Source",
            root: PathBuf::from("/tmp/test-source"),
            kind: SourceKind::CodexJsonl,
        };
        let mut summary = SourceSummary {
            id: source.id.to_string(),
            label: source.label.to_string(),
            root_path: source.root.display().to_string(),
            files_seen: 1,
            prompts_found: 0,
            average_quality: 0.0,
            weak_prompt_count: 0,
            status: "ok".to_string(),
            notes: vec!["Skipped bad.jsonl: stream did not contain valid UTF-8".to_string()],
        };
        let mut warnings = Vec::new();

        promote_source_notes_to_warning(&source, &mut summary, &mut warnings);

        assert_eq!(summary.status, "partial");
        assert_eq!(warnings.len(), 1);
        assert!(warnings[0].contains("Test Source"));
        assert!(warnings[0].contains("Skipped bad.jsonl"));
    }

    #[test]
    fn markdown_source_coverage_includes_quality_triage() {
        let stats = build_stats(
            &[],
            vec![SourceSummary {
                id: "test-source".to_string(),
                label: "Test Source".to_string(),
                root_path: "/tmp/test-source".to_string(),
                files_seen: 4,
                prompts_found: 7,
                average_quality: 42.5,
                weak_prompt_count: 3,
                status: "ok".to_string(),
                notes: Vec::new(),
            }],
        );

        let markdown = render_markdown("2026-06-03T00:00:00Z", &stats, &[], &[]);

        assert!(
            markdown.contains("| Source | Status | Files | Prompts | Avg Quality | Weak | Path |")
        );
        assert!(markdown.contains("| Test Source | ok | 4 | 7 | 42.5 | 3 | `/tmp/test-source` |"));
    }

    #[test]
    fn markdown_export_includes_scan_warnings() {
        let stats = build_stats(&[], Vec::new());
        let warnings = vec!["설정된 제한 1개 프롬프트에서 스캔을 중지했습니다.".to_string()];

        let markdown = render_markdown("2026-06-03T00:00:00Z", &stats, &[], &warnings);

        assert!(markdown.contains("## Warnings"));
        assert!(markdown.contains("- 설정된 제한 1개 프롬프트에서 스캔을 중지했습니다."));
    }

    #[test]
    fn source_specs_are_home_relative_without_user_literal_paths() {
        let home = Path::new("/Users/alice");
        let specs = source_specs_for_home(home);

        let codex = specs
            .iter()
            .find(|source| source.id == "codex")
            .expect("codex source exists");
        assert_eq!(codex.root, home.join(".codex/sessions"));

        let gemini = specs
            .iter()
            .find(|source| source.id == "gemini-tmp-chat")
            .expect("gemini tmp source exists");
        assert_eq!(gemini.root, home.join(".gemini/tmp"));
        assert!(!gemini.root.to_string_lossy().contains("/wj/"));

        let project_logs = specs
            .iter()
            .find(|source| source.id == "project-progress-logs")
            .expect("project progress logs source exists");
        assert_eq!(project_logs.root, home.join("Ai/System/10_Projects"));
        assert!(!project_logs.root.to_string_lossy().contains("/wj/"));
    }

    #[test]
    fn gemini_tmp_chat_matching_finds_only_chat_json_files() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-gemini-tmp-match-{}",
            std::process::id()
        ));
        let chat_dir = root.join("alice/chats");
        let tool_dir = root.join("alice/tool-outputs");
        std::fs::create_dir_all(&chat_dir).expect("create chat fixture dir");
        std::fs::create_dir_all(&tool_dir).expect("create tool fixture dir");
        let chat_json = chat_dir.join("session.json");
        let chat_text = chat_dir.join("session.txt");
        let tool_json = tool_dir.join("tool.json");
        std::fs::write(&chat_json, "{}").expect("write chat json");
        std::fs::write(&chat_text, "{}").expect("write chat text");
        std::fs::write(&tool_json, "{}").expect("write tool json");

        assert!(source_file_matches(
            &chat_json,
            SourceKind::GeminiTmpChatJson
        ));
        assert!(!source_file_matches(
            &chat_text,
            SourceKind::GeminiTmpChatJson
        ));
        assert!(!source_file_matches(
            &tool_json,
            SourceKind::GeminiTmpChatJson
        ));

        std::fs::remove_dir_all(root).expect("remove gemini tmp fixture");
    }

    #[test]
    fn project_progress_log_matching_finds_only_known_progress_markdown_files() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-project-progress-match-{}",
            std::process::id()
        ));
        let project_dir = root.join("ExampleProject");
        std::fs::create_dir_all(&project_dir).expect("create project fixture dir");
        let working = project_dir.join("working.md");
        let status = project_dir.join("PROJECT_STATUS.md");
        let notes = project_dir.join("notes.md");
        let json = project_dir.join("working.json");
        std::fs::write(&working, "# Working\n").expect("write working");
        std::fs::write(&status, "# Status\n").expect("write status");
        std::fs::write(&notes, "# Notes\n").expect("write notes");
        std::fs::write(&json, "{}").expect("write json");

        assert!(source_file_matches(
            &working,
            SourceKind::ProjectProgressMarkdown
        ));
        assert!(source_file_matches(
            &status,
            SourceKind::ProjectProgressMarkdown
        ));
        assert!(!source_file_matches(
            &notes,
            SourceKind::ProjectProgressMarkdown
        ));
        assert!(!source_file_matches(
            &json,
            SourceKind::ProjectProgressMarkdown
        ));

        std::fs::remove_dir_all(root).expect("remove project progress fixture");
    }

    #[test]
    fn project_progress_scan_skips_dependency_and_build_dirs() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-project-progress-prune-{}",
            std::process::id()
        ));
        let project_dir = root.join("ExampleProject");
        let node_dir = project_dir.join("node_modules/pkg");
        let target_dir = project_dir.join("target/debug");
        let deep_dir = project_dir.join("archive/old/runs/extra");
        std::fs::create_dir_all(&node_dir).expect("create node fixture dir");
        std::fs::create_dir_all(&target_dir).expect("create target fixture dir");
        std::fs::create_dir_all(&deep_dir).expect("create deep fixture dir");
        let project_working = project_dir.join("working.md");
        let dependency_working = node_dir.join("working.md");
        let build_working = target_dir.join("working.md");
        let deep_working = deep_dir.join("working.md");
        std::fs::write(&project_working, "# Project Working\n").expect("write project working");
        std::fs::write(&dependency_working, "# Dependency Working\n")
            .expect("write dependency working");
        std::fs::write(&build_working, "# Build Working\n").expect("write build working");
        std::fs::write(&deep_working, "# Deep Working\n").expect("write deep working");

        let paths = matching_source_file_candidates(&root, SourceKind::ProjectProgressMarkdown)
            .into_iter()
            .map(|candidate| candidate.expect("candidate").path)
            .collect::<Vec<_>>();

        assert!(paths.contains(&project_working));
        assert!(!paths.contains(&dependency_working));
        assert!(!paths.contains(&build_working));
        assert!(!paths.contains(&deep_working));

        std::fs::remove_dir_all(root).expect("remove project progress fixture");
    }

    #[test]
    fn parse_project_progress_markdown_preserves_content_and_project_workspace() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-project-progress-parse-{}",
            std::process::id()
        ));
        let project_dir = root.join("ExampleProject");
        std::fs::create_dir_all(&project_dir).expect("create project fixture dir");
        let working = project_dir.join("working.md");
        std::fs::write(
            &working,
            "# Working Log\n\nCurrent Goal:\n- Track project work by date.\n",
        )
        .expect("write working");
        let source = SourceSpec {
            id: "project-progress-logs",
            label: "Project progress logs",
            root: root.clone(),
            kind: SourceKind::ProjectProgressMarkdown,
        };

        let records =
            parse_project_progress_markdown(&source, &working).expect("parse progress log");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].source, "Project progress logs");
        assert_eq!(records[0].session_id, "ExampleProject:working.md");
        assert_eq!(
            records[0].cwd.as_deref(),
            Some(project_dir.to_str().unwrap())
        );
        assert!(records[0].text.contains("Track project work by date."));

        std::fs::remove_dir_all(root).expect("remove project progress fixture");
    }

    #[test]
    fn project_progress_analysis_text_truncates_large_logs_with_head_and_tail() {
        let large_log = format!(
            "{}\n{}\n{}",
            "head-marker ".repeat(PROJECT_PROGRESS_HEAD_CHARS / 12 + 10),
            "middle-marker ".repeat(1_000),
            "tail-marker ".repeat(PROJECT_PROGRESS_TAIL_CHARS / 12 + 10)
        );

        let snapshot = project_progress_analysis_text(&large_log);

        assert!(snapshot.contains("head-marker"));
        assert!(snapshot.contains("tail-marker"));
        assert!(snapshot.contains("[... project progress log truncated for prompt analysis ...]"));
        assert!(!snapshot.contains("middle-marker"));
        assert!(
            snapshot.chars().count()
                <= PROJECT_PROGRESS_HEAD_CHARS + PROJECT_PROGRESS_TAIL_CHARS + 80
        );
    }

    #[test]
    fn secret_env_candidates_are_home_relative_and_overrideable() {
        let home = Path::new("/Users/alice");
        let candidates = secret_env_candidates_for_home(home);

        assert!(candidates.contains(&home.join(PROMPTVAULT_SECRET_ENV_RELATIVE_PATH)));
        assert!(candidates.contains(&home.join(USER_SECRET_ENV_RELATIVE_PATH)));
        assert!(!candidates
            .iter()
            .any(|path| path.to_string_lossy().contains("/Users/wj/")));
    }

    #[test]
    fn jsonl_lines_propagates_read_errors() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-invalid-jsonl-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            b"{\"type\":\"response_item\",\"payload\":{\"role\":\"user\"}}\n\xff\n",
        )
        .expect("write invalid jsonl fixture");

        let result = jsonl_lines(&path);
        std::fs::remove_file(path).expect("remove invalid jsonl fixture");

        let err = result.expect_err("invalid UTF-8 should fail closed");
        assert!(err
            .to_string()
            .contains("stream did not contain valid UTF-8"));
    }

    #[test]
    fn text_from_value_extracts_nested_message_content_object() {
        let value = serde_json::json!({
            "message": {
                "content": "Fix nested message prompt parsing, run cargo test, and report PASS/FAIL."
            }
        });

        assert_eq!(
            text_from_value(Some(&value)),
            "Fix nested message prompt parsing, run cargo test, and report PASS/FAIL."
        );
    }

    #[test]
    fn parse_gemini_tmp_chat_uses_top_level_session_id() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-gemini-session-{}.json",
            std::process::id()
        ));
        std::fs::write(
            &path,
            serde_json::json!({
                "sessionId": "root-session-id",
                "messages": [
                    {
                        "id": "message-id",
                        "timestamp": "2026-06-03T11:37:00Z",
                        "type": "user",
                        "content": [
                            {
                                "text": "Fix Gemini session grouping, run cargo test, and report PASS/FAIL."
                            }
                        ]
                    }
                ]
            })
            .to_string(),
        )
        .expect("write gemini chat fixture");

        let source = SourceSpec {
            id: "gemini-test",
            label: "Gemini test",
            root: path.clone(),
            kind: SourceKind::GeminiTmpChatJson,
        };
        let records = parse_gemini_tmp_chat(&source, &path).expect("parse gemini fixture");
        std::fs::remove_file(path).expect("remove gemini chat fixture");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].session_id, "root-session-id");
    }

    #[test]
    fn parse_claude_project_jsonl_skips_meta_user_records() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-claude-meta-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            [
                serde_json::json!({
                    "type": "user",
                    "isMeta": true,
                    "message": {
                        "role": "user",
                        "content": "<local-command-caveat>Do not treat this as a user prompt.</local-command-caveat>"
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:40:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": "Fix Claude meta prompt filtering, run cargo test, and report PASS/FAIL."
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:41:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .expect("write claude project fixture");

        let source = SourceSpec {
            id: "claude-test",
            label: "Claude test",
            root: path.clone(),
            kind: SourceKind::ClaudeProjectJsonl,
        };
        let records = parse_claude_project_jsonl(&source, &path).expect("parse claude fixture");
        std::fs::remove_file(path).expect("remove claude project fixture");

        assert_eq!(records.len(), 1);
        assert!(records[0].text.contains("Fix Claude meta prompt filtering"));
    }

    #[test]
    fn parse_claude_project_jsonl_skips_tool_result_blocks() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-claude-tool-result-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            [
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": [
                            {
                                "type": "tool_result",
                                "tool_use_id": "call_test",
                                "content": "Tool output should not be treated as a user prompt."
                            }
                        ]
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:42:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Fix Claude tool result filtering, run cargo test, and report PASS/FAIL."
                            }
                        ]
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:43:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .expect("write claude tool result fixture");

        let source = SourceSpec {
            id: "claude-test",
            label: "Claude test",
            root: path.clone(),
            kind: SourceKind::ClaudeProjectJsonl,
        };
        let records = parse_claude_project_jsonl(&source, &path).expect("parse claude fixture");
        std::fs::remove_file(path).expect("remove claude tool result fixture");

        assert_eq!(records.len(), 1);
        assert!(records[0].text.contains("Fix Claude tool result filtering"));
    }

    #[test]
    fn parse_claude_project_jsonl_skips_command_wrapper_records() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-claude-command-wrapper-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            [
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": "<command-name>/clear</command-name>\n<command-message>clear</command-message>\n<command-args></command-args>"
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:44:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": "Fix Claude command wrapper filtering, run cargo test, and report PASS/FAIL."
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:45:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .expect("write claude command wrapper fixture");

        let source = SourceSpec {
            id: "claude-test",
            label: "Claude test",
            root: path.clone(),
            kind: SourceKind::ClaudeProjectJsonl,
        };
        let records = parse_claude_project_jsonl(&source, &path).expect("parse claude fixture");
        std::fs::remove_file(path).expect("remove claude command wrapper fixture");

        assert_eq!(records.len(), 1);
        assert!(records[0]
            .text
            .contains("Fix Claude command wrapper filtering"));
    }

    #[test]
    fn parse_claude_project_jsonl_skips_local_command_output_records() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-claude-local-command-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            [
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": "<local-command-stdout>Set model to glm-5.1 for this session</local-command-stdout>"
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:46:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
                serde_json::json!({
                    "type": "user",
                    "message": {
                        "role": "user",
                        "content": "Fix Claude local command output filtering, run cargo test, and report PASS/FAIL."
                    },
                    "sessionId": "claude-session",
                    "timestamp": "2026-06-03T11:47:00Z",
                    "cwd": "/tmp/project"
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .expect("write claude local command fixture");

        let source = SourceSpec {
            id: "claude-test",
            label: "Claude test",
            root: path.clone(),
            kind: SourceKind::ClaudeProjectJsonl,
        };
        let records = parse_claude_project_jsonl(&source, &path).expect("parse claude fixture");
        std::fs::remove_file(path).expect("remove claude local command fixture");

        assert_eq!(records.len(), 1);
        assert!(records[0]
            .text
            .contains("Fix Claude local command output filtering"));
    }

    #[test]
    fn parse_claude_history_jsonl_skips_command_only_records() {
        let path = std::env::temp_dir().join(format!(
            "promptvault-claude-history-command-{}.jsonl",
            std::process::id()
        ));
        std::fs::write(
            &path,
            [
                serde_json::json!({
                    "display": "/clear",
                    "timestamp": "2026-06-03T11:48:00Z",
                    "project": "/tmp/project",
                    "sessionId": "claude-history"
                })
                .to_string(),
                serde_json::json!({
                    "display": "/sdd 모델 조사해줘",
                    "timestamp": "2026-06-03T11:49:00Z",
                    "project": "/tmp/project",
                    "sessionId": "claude-history"
                })
                .to_string(),
            ]
            .join("\n"),
        )
        .expect("write claude history fixture");

        let source = SourceSpec {
            id: "claude-history-test",
            label: "Claude history test",
            root: path.clone(),
            kind: SourceKind::ClaudeHistoryJsonl,
        };
        let records = parse_claude_history_jsonl(&source, &path).expect("parse history fixture");
        std::fs::remove_file(path).expect("remove claude history fixture");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].text, "/sdd 모델 조사해줘");
    }

    #[test]
    fn redact_sensitive_text_redacts_key_value_pairs() {
        let text = format!("api_key={}", "short-secret-value");
        assert_eq!(redact_sensitive_text(&text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_quoted_key_value_pairs_with_spaces() {
        let text = r#"api_key="alpha beta gamma""#;
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_space_separated_api_key_pairs() {
        let text = "api key=short-secret-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_prefixed_token_pairs() {
        let text = "access_token=short-secret-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_prefixed_api_key_pairs() {
        let text = "openai_api_key=short-secret-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_preserves_leading_words_before_api_key_pairs() {
        let text = "Use api_key=short-secret-value only in local secrets.";
        assert_eq!(
            redact_sensitive_text(text),
            "Use [REDACTED_POSSIBLE_API_KEY] only in local secrets."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_generic_prefixed_secret_pairs() {
        let text =
            "client_secret=short-secret-value db_password=local-password github_token=short-token";
        assert_eq!(
            redact_sensitive_text(text),
            "[REDACTED_POSSIBLE_API_KEY] [REDACTED_POSSIBLE_API_KEY] [REDACTED_POSSIBLE_API_KEY]"
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_long_cli_secret_options() {
        let api_flag = ["--api", "key"].join("-");
        let access_token_flag = ["--access", "token"].join("-");
        let password_flag = ["--pass", "word"].join("");
        let secret_flag = ["--", "secret"].join("");
        let api_key_text = format!("Run tool {api_flag} short-secret-value --format json.");
        let access_token_text =
            format!("Run tool {access_token_flag}=short-token-value --limit 10.");
        let password_text = format!("Run tool {password_flag} \"short password\" --mode safe.");
        let secret_text = format!("Run tool {secret_flag} 'short secret' --verbose.");

        let redacted_api_key = redact_sensitive_text(&api_key_text);
        let redacted_access_token = redact_sensitive_text(&access_token_text);
        let redacted_password = redact_sensitive_text(&password_text);
        let redacted_secret = redact_sensitive_text(&secret_text);

        assert_eq!(
            redacted_api_key,
            "Run tool [REDACTED_POSSIBLE_API_KEY] --format json."
        );
        assert_eq!(
            redacted_access_token,
            "Run tool [REDACTED_POSSIBLE_API_KEY] --limit 10."
        );
        assert_eq!(
            redacted_password,
            "Run tool [REDACTED_POSSIBLE_API_KEY] --mode safe."
        );
        assert_eq!(
            redacted_secret,
            "Run tool [REDACTED_POSSIBLE_API_KEY] --verbose."
        );
        assert!(!redacted_api_key.contains(&api_flag));
        assert!(!redacted_api_key.contains("short-secret-value"));
        assert!(!redacted_access_token.contains(&access_token_flag));
        assert!(!redacted_access_token.contains("short-token-value"));
        assert!(!redacted_password.contains(&password_flag));
        assert!(!redacted_password.contains("short password"));
        assert!(!redacted_secret.contains(&secret_flag));
        assert!(!redacted_secret.contains("short secret"));
    }

    #[test]
    fn redact_sensitive_text_redacts_json_style_sensitive_properties() {
        let api_key = ["api", "key"].join("_");
        let access_token = ["access", "token"].join("_");
        let cookie_key = ["cook", "ie"].join("");
        let cookie_value = ["session", "short", "cookie", "value"].join("-");
        let api_key_text =
            format!(r#"Use {{"{api_key}":"short-secret-value","format":"json"}} locally."#);
        let access_token_text =
            format!("Use {{'{access_token}': 'short-token-value', 'limit': '10'}} locally.");
        let cookie_text =
            format!(r#"Use {{"{cookie_key}":"{cookie_value}","mode":"safe"}} locally."#);

        let redacted_api_key = redact_sensitive_text(&api_key_text);
        let redacted_access_token = redact_sensitive_text(&access_token_text);
        let redacted_cookie = redact_sensitive_text(&cookie_text);

        assert_eq!(
            redacted_api_key,
            r#"Use {[REDACTED_POSSIBLE_API_KEY],"format":"json"} locally."#
        );
        assert_eq!(
            redacted_access_token,
            "Use {[REDACTED_POSSIBLE_API_KEY], 'limit': '10'} locally."
        );
        assert_eq!(
            redacted_cookie,
            r#"Use {[REDACTED_POSSIBLE_API_KEY],"mode":"safe"} locally."#
        );
        assert!(!redacted_api_key.contains(&api_key));
        assert!(!redacted_api_key.contains("short-secret-value"));
        assert!(!redacted_access_token.contains(&access_token));
        assert!(!redacted_access_token.contains("short-token-value"));
        assert!(!redacted_cookie.contains(&cookie_key));
        assert!(!redacted_cookie.contains(&cookie_value));
    }

    #[test]
    fn redact_sensitive_text_redacts_private_key_pairs() {
        let text = "ssh_private_key=short-key-material";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_authorization_bearer_headers() {
        let text = "Authorization: Bearer short-token-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_standalone_bearer_tokens() {
        let text = "Use Bearer short-token-value for the request.";
        assert_eq!(
            redact_sensitive_text(text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_standalone_basic_tokens() {
        let text = "Use Basic short-basic-value for the request.";
        assert_eq!(
            redact_sensitive_text(text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_quoted_standalone_auth_scheme_tokens() {
        let bearer_scheme = ["Bear", "er"].join("");
        let bearer_token = ["short", "bearer", "value"].join("-");
        let basic_scheme = ["Bas", "ic"].join("");
        let basic_token = ["short", "basic", "value"].join("-");
        let bearer_text = format!("Use {bearer_scheme} \"{bearer_token}\" for the request.");
        let basic_text = format!("Use {basic_scheme} '{basic_token}' for the request.");

        assert_eq!(
            redact_sensitive_text(&bearer_text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
        assert_eq!(
            redact_sensitive_text(&basic_text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_standalone_alphanumeric_auth_scheme_tokens() {
        let bearer = ["short", "bearer", "value", "1"].join("");
        let basic = ["short", "basic", "value", "1"].join("");
        let bearer_text = format!("Use Bearer {bearer} for the request.");
        let basic_text = format!("Use Basic {basic} for the request.");

        assert_eq!(
            redact_sensitive_text(&bearer_text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
        assert_eq!(
            redact_sensitive_text(&basic_text),
            "Use [REDACTED_POSSIBLE_API_KEY] for the request."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_standalone_provider_prefixed_tokens() {
        let prefix = ["g", "h", "p"].join("");
        let token = format!("{prefix}_{}", "A".repeat(36));
        let text = format!("Use {token} for repo access.");

        assert_eq!(
            redact_sensitive_text(&text),
            "Use [REDACTED_POSSIBLE_API_KEY] for repo access."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_authorization_scheme_headers() {
        let text = "Authorization: Basic short-basic-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_cookie_headers() {
        let text = "Cookie: session_id=short-session-value; csrf=short-csrf-value";
        assert_eq!(redact_sensitive_text(text), "[REDACTED_POSSIBLE_API_KEY]");
    }

    #[test]
    fn redact_sensitive_text_redacts_curl_cookie_credentials() {
        let first_value = ["short", "session", "value"].join("-");
        let second_value = ["short", "csrf", "value"].join("-");
        let first_cookie = format!("session_id={first_value}");
        let second_cookie = format!("csrf={second_value}");
        let short_cookie_flag = ["-", "b"].join("");
        let long_cookie_flag = ["--", "cookie"].join("");
        let text = [
            "Run",
            "curl",
            &short_cookie_flag,
            &first_cookie,
            "https://example.com",
            "and",
            "curl",
            &long_cookie_flag,
            &second_cookie,
            "https://example.org.",
        ]
        .join(" ");
        assert_eq!(
            redact_sensitive_text(&text),
            "Run curl [REDACTED_POSSIBLE_API_KEY] https://example.com and curl [REDACTED_POSSIBLE_API_KEY] https://example.org."
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_quoted_curl_cookie_header_shape() {
        let value = ["short", "session", "value"].join("-");
        let cookie = format!("session_id={value}");
        let header_flag = ["-", "H"].join("");
        let text = format!("Run curl {header_flag} \"Cookie: {cookie}\" https://example.com");

        assert_eq!(
            redact_sensitive_text(&text),
            "Run curl -H \"[REDACTED_POSSIBLE_API_KEY]\" https://example.com"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_quoted_curl_authorization_header_shape() {
        let auth_scheme = ["Bear", "er"].join("");
        let token = ["short", "bearer", "value"].join("-");
        let header_flag = ["-", "H"].join("");
        let text = format!(
            "Run curl {header_flag} \"Authorization: {auth_scheme} {token}\" https://example.com"
        );

        assert_eq!(
            redact_sensitive_text(&text),
            "Run curl -H \"[REDACTED_POSSIBLE_API_KEY]\" https://example.com"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_equals_style_quoted_curl_header_shape() {
        let auth_scheme = ["Bear", "er"].join("");
        let token = ["short", "bearer", "value"].join("-");
        let cookie_value = ["short", "session", "value"].join("-");
        let long_header_flag = ["--", "header"].join("");
        let auth_text =
            format!("Run curl {long_header_flag}=\"Authorization: {auth_scheme} {token}\" https://example.com");
        let cookie_text = format!(
            "Run curl {long_header_flag}='Cookie: session_id={cookie_value}' https://example.org"
        );

        assert_eq!(
            redact_sensitive_text(&auth_text),
            "Run curl --header=\"[REDACTED_POSSIBLE_API_KEY]\" https://example.com"
        );
        assert_eq!(
            redact_sensitive_text(&cookie_text),
            "Run curl --header='[REDACTED_POSSIBLE_API_KEY]' https://example.org"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_quoted_curl_header_shape_case_insensitively() {
        let auth_scheme = ["Bear", "er"].join("");
        let token = ["short", "bearer", "value"].join("-");
        let cookie_value = ["short", "session", "value"].join("-");
        let header_flag = ["-", "H"].join("");
        let long_header_flag = ["--", "header"].join("");
        let auth_text = format!(
            "Run curl {header_flag} \"AUTHORIZATION: {auth_scheme} {token}\" https://example.com"
        );
        let cookie_text = format!(
            "Run curl {long_header_flag}=\"COOKIE: session_id={cookie_value}\" https://example.org"
        );
        let set_cookie_text =
            format!("Run curl {long_header_flag}='Set-Cookie: session_id={cookie_value}' https://example.net");

        assert_eq!(
            redact_sensitive_text(&auth_text),
            "Run curl -H \"[REDACTED_POSSIBLE_API_KEY]\" https://example.com"
        );
        assert_eq!(
            redact_sensitive_text(&cookie_text),
            "Run curl --header=\"[REDACTED_POSSIBLE_API_KEY]\" https://example.org"
        );
        assert_eq!(
            redact_sensitive_text(&set_cookie_text),
            "Run curl --header='[REDACTED_POSSIBLE_API_KEY]' https://example.net"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_glued_short_curl_header_flag_shape() {
        let auth_scheme = ["Bear", "er"].join("");
        let token = ["short", "bearer", "value"].join("-");
        let cookie_value = ["short", "session", "value"].join("-");
        let header_flag = ["-", "H"].join("");
        let auth_text = format!(
            "Run curl {header_flag}\"Authorization: {auth_scheme} {token}\" https://example.com"
        );
        let cookie_text = format!(
            "Run curl {header_flag}'Cookie: session_id={cookie_value}' https://example.org"
        );

        assert_eq!(
            redact_sensitive_text(&auth_text),
            "Run curl -H\"[REDACTED_POSSIBLE_API_KEY]\" https://example.com"
        );
        assert_eq!(
            redact_sensitive_text(&cookie_text),
            "Run curl -H'[REDACTED_POSSIBLE_API_KEY]' https://example.org"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_quoted_curl_key_like_header_shape() {
        let api_key_header = ["X", "Api", "Key"].join("-");
        let api_key_value = ["short", "api", "value"].join("-");
        let proxy_authorization_header = ["Proxy", "Authorization"].join("-");
        let basic_scheme = ["Bas", "ic"].join("");
        let basic_value = ["short", "basic", "value"].join("-");
        let auth_token_header = ["X", "Auth", "Token"].join("-");
        let token_value = ["short", "token", "value"].join("-");
        let header_flag = ["-", "H"].join("");
        let long_header_flag = ["--", "header"].join("");

        let api_key_text = format!(
            "Run curl {header_flag} \"{api_key_header}: {api_key_value}\" https://example.net"
        );
        let proxy_authorization_text = format!(
            "Run curl {long_header_flag}=\"{proxy_authorization_header}: {basic_scheme} {basic_value}\" https://example.org"
        );
        let auth_token_text = format!(
            "Run curl {header_flag}'{auth_token_header}: {token_value}' https://example.com"
        );

        assert_eq!(
            redact_sensitive_text(&api_key_text),
            "Run curl -H \"[REDACTED_POSSIBLE_API_KEY]\" https://example.net"
        );
        assert_eq!(
            redact_sensitive_text(&proxy_authorization_text),
            "Run curl --header=\"[REDACTED_POSSIBLE_API_KEY]\" https://example.org"
        );
        assert_eq!(
            redact_sensitive_text(&auth_token_text),
            "Run curl -H'[REDACTED_POSSIBLE_API_KEY]' https://example.com"
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_credential_and_signature_params() {
        let text = "X-Amz-Credential=short-credential-value&X-Amz-Signature=short-signature-value";
        assert_eq!(
            redact_sensitive_text(text),
            "[REDACTED_POSSIBLE_API_KEY]&[REDACTED_POSSIBLE_API_KEY]"
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_cloud_access_key_query_params() {
        let text = "AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=short-signature";
        assert_eq!(
            redact_sensitive_text(text),
            "[REDACTED_POSSIBLE_API_KEY]&[REDACTED_POSSIBLE_API_KEY]"
        );
    }

    #[test]
    fn redact_sensitive_text_preserves_safe_query_params_around_sensitive_query_params() {
        let sensitive_key = ["auth", "token"].join("_");
        let sensitive_value = ["short", "token", "value"].join("-");
        let text = format!(
            "Fetch https://example.test/file?format=json&{sensitive_key}={sensitive_value}&limit=10 before request."
        );

        let redacted = redact_sensitive_text(&text);

        assert_eq!(
            redacted,
            "Fetch https://example.test/file?format=json&[REDACTED_POSSIBLE_API_KEY]&limit=10 before request."
        );
        assert!(!redacted.contains(&sensitive_key));
        assert!(!redacted.contains(&sensitive_value));
    }

    #[test]
    fn redact_sensitive_text_redacts_cloud_access_key_assignments() {
        let text = "aws_access_key_id=AKIAIOSFODNN7EXAMPLE aws_secret_access_key=short-secret";
        assert_eq!(
            redact_sensitive_text(text),
            "[REDACTED_POSSIBLE_API_KEY] [REDACTED_POSSIBLE_API_KEY]"
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_url_userinfo_credentials() {
        assert_eq!(
            redact_sensitive_text(
                "Connect postgres://app_user:short-db-pass@db.example/app before request."
            ),
            "Connect [REDACTED_POSSIBLE_API_KEY] before request."
        );
        assert_eq!(
            redact_sensitive_text(
                "Open redis://:short-redis-pass@cache.example:6379/0 before request."
            ),
            "Open [REDACTED_POSSIBLE_API_KEY] before request."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_curl_user_credentials() {
        let first_password = ["short", "secret", "value"].join("-");
        let second_password = ["short", "basic", "value"].join("-");
        let short_user_flag = ["-", "u"].join("");
        let long_user_flag = ["--", "user"].join("");
        let first_credential = format!("alice:{first_password}");
        let second_credential = format!("bob:{second_password}");
        let text = [
            "Run",
            "curl",
            &short_user_flag,
            &first_credential,
            "https://example.com",
            "and",
            "curl",
            &long_user_flag,
            &second_credential,
            "https://example.org.",
        ]
        .join(" ");
        assert_eq!(
            redact_sensitive_text(&text),
            "Run curl [REDACTED_POSSIBLE_API_KEY] https://example.com and curl [REDACTED_POSSIBLE_API_KEY] https://example.org."
        );
    }

    #[test]
    fn redact_sensitive_text_redacts_private_key_blocks() {
        for (marker, body) in [
            ("TEST PRIVATE KEY", "short-body"),
            ("PGP PRIVATE KEY BLOCK", "short-pgp-body"),
        ] {
            let text = format!("-----BEGIN {marker}-----\n{body}\n-----END {marker}-----");

            assert_eq!(redact_sensitive_text(&text), "[REDACTED_PRIVATE_KEY]");
        }
    }

    #[test]
    fn redact_sensitive_text_redacts_compact_jwt_like_tokens() {
        let token = format!(
            "eyJ{}.{}.{}",
            "a".repeat(18),
            "b".repeat(18),
            "c".repeat(18)
        );
        let text = format!("Use {token} for the request.");

        assert_eq!(
            redact_sensitive_text(&text),
            "Use [REDACTED_LONG_BASE64_LIKE_TOKEN] for the request."
        );
    }

    #[test]
    fn frequency_stats_redact_sensitive_prompt_text() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let prompt_text = format!("Fix parser handling for {synthetic_token} and run cargo test.");
        let mut first = record("risky-frequency-a");
        first.text = prompt_text.clone();
        first.word_count = count_words(&first.text);
        first.char_count = first.text.chars().count();
        first.risk_flags = detect_risks(&first.text);
        first.quality = assess_prompt_quality(&first.text, &first.risk_flags);
        let mut second = record("risky-frequency-b");
        second.text = prompt_text;
        second.word_count = count_words(&second.text);
        second.char_count = second.text.chars().count();
        second.risk_flags = detect_risks(&second.text);
        second.quality = assess_prompt_quality(&second.text, &second.risk_flags);

        let stats = build_stats(&[first, second], Vec::new());
        let frequency_text = stats
            .top_words
            .iter()
            .chain(stats.top_phrases.iter())
            .chain(stats.repeated_prompts.iter())
            .map(|item| item.text.as_str())
            .collect::<Vec<_>>()
            .join("\n");
        let markdown = render_markdown("2026-06-08T00:00:00Z", &stats, &[], &[]);
        let synthetic_token_lowercase = synthetic_token.to_lowercase();

        assert!(!frequency_text.contains(&synthetic_token));
        assert!(!frequency_text.contains(&synthetic_token_lowercase));
        assert!(!markdown.contains(&synthetic_token));
        assert!(!markdown.contains(&synthetic_token_lowercase));
        assert!(frequency_text.contains("REDACTED"));
        assert!(markdown.contains("REDACTED"));
    }

    #[test]
    fn parses_antigravity_conversation_db_user_steps() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-antigravity-test-{}.db",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let conn = Connection::open(&db_path).expect("open test db");
        conn.execute(
            "CREATE TABLE steps (
                idx integer,
                step_type integer NOT NULL DEFAULT 0,
                status integer NOT NULL DEFAULT 0,
                has_subtrajectory numeric NOT NULL DEFAULT false,
                metadata blob,
                error_details blob,
                permissions blob,
                task_details blob,
                render_info blob,
                step_payload blob,
                step_format integer NOT NULL DEFAULT 0,
                PRIMARY KEY (idx)
            )",
            [],
        )
        .expect("create steps table");

        let user_payload = pb_message(
            19,
            &[
                pb_string(1, "000b17f0-0396-4964-84b1-9494dbb1b499"),
                pb_string(
                    2,
                    "Fix src-tauri/src/lib.rs, preserve user files, run cargo test, and report PASS/FAIL in Markdown.",
                ),
                pb_string(11, "/Users/wj/Ai/System/10_Projects/PromptVault"),
            ]
            .concat(),
        );
        let model_payload = pb_message(
            20,
            &[pb_string(
                1,
                "This is model output and must not be collected.",
            )]
            .concat(),
        );

        conn.execute(
            "INSERT INTO steps (idx, step_type, status, step_payload) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![0_i64, 14_i64, 3_i64, user_payload],
        )
        .expect("insert user step");
        conn.execute(
            "INSERT INTO steps (idx, step_type, status, step_payload) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![1_i64, 15_i64, 3_i64, model_payload],
        )
        .expect("insert model step");
        drop(conn);

        let source = SourceSpec {
            id: "antigravity-test-db",
            label: "Antigravity test DB",
            root: db_path.clone(),
            kind: SourceKind::AntigravityConversationSqlite,
        };
        let records =
            parse_antigravity_conversation_sqlite(&source, &db_path).expect("parse test db");

        assert_eq!(records.len(), 1);
        assert!(records[0].text.contains("Fix src-tauri/src/lib.rs"));
        assert_eq!(
            records[0].cwd.as_deref(),
            Some("/Users/wj/Ai/System/10_Projects/PromptVault")
        );

        std::fs::remove_file(&db_path).expect("remove test db");
    }

    #[test]
    fn antigravity_conversation_db_prefers_user_prompt_field_over_longer_metadata() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-antigravity-prefer-user-field-{}.db",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let conn = Connection::open(&db_path).expect("open test db");
        conn.execute(
            "CREATE TABLE steps (
                idx integer,
                step_type integer NOT NULL DEFAULT 0,
                status integer NOT NULL DEFAULT 0,
                has_subtrajectory numeric NOT NULL DEFAULT false,
                metadata blob,
                error_details blob,
                permissions blob,
                task_details blob,
                render_info blob,
                step_payload blob,
                step_format integer NOT NULL DEFAULT 0,
                PRIMARY KEY (idx)
            )",
            [],
        )
        .expect("create steps table");

        let user_payload = [
            pb_message(
                5,
                &pb_string(
                    20,
                    "This longer metadata summary must not be collected as the user prompt.",
                ),
            ),
            pb_message(
                19,
                &[
                    pb_string(2, "ok?"),
                    pb_string(11, "/Users/wj/Ai/System/10_Projects/PromptVault"),
                ]
                .concat(),
            ),
        ]
        .concat();
        conn.execute(
            "INSERT INTO steps (idx, step_type, status, step_payload) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![0_i64, 14_i64, 3_i64, user_payload],
        )
        .expect("insert user step");
        drop(conn);

        let source = SourceSpec {
            id: "antigravity-test-db",
            label: "Antigravity test DB",
            root: db_path.clone(),
            kind: SourceKind::AntigravityConversationSqlite,
        };
        let records =
            parse_antigravity_conversation_sqlite(&source, &db_path).expect("parse test db");

        assert_eq!(records.len(), 1);
        assert_eq!(records[0].text, "ok?");
        assert_eq!(
            records[0].cwd.as_deref(),
            Some("/Users/wj/Ai/System/10_Projects/PromptVault")
        );

        std::fs::remove_file(&db_path).expect("remove test db");
    }

    #[test]
    fn normalizes_glm_base_endpoint() {
        assert_eq!(
            normalize_chat_endpoint("   "),
            "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        );
        assert_eq!(
            normalize_chat_endpoint("https://api.z.ai/api/coding/paas/v4"),
            "https://api.z.ai/api/coding/paas/v4/chat/completions"
        );
        assert_eq!(
            normalize_chat_endpoint("https://api.z.ai/api/coding/paas/v4/chat/completions"),
            "https://api.z.ai/api/coding/paas/v4/chat/completions"
        );
    }

    #[test]
    fn prompts_by_date_counts_iso_dates() {
        let prompts = vec![
            dated_record("a", "2026-06-05T12:00:00Z"),
            dated_record("b", "2026-06-05T13:00:00Z"),
            dated_record("c", "2026-06-06T09:00:00+09:00"),
            record("unknown"),
        ];

        let dates = prompts_by_date(&prompts, 10);

        assert_eq!(dates[0].text, "unknown-date");
        assert!(dates
            .iter()
            .any(|item| item.text == "2026-06-05" && item.count == 2));
        assert!(dates
            .iter()
            .any(|item| item.text == "2026-06-06" && item.count == 1));
    }

    #[test]
    fn persist_scan_result_upserts_prompt_records() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-persist-test-{}.sqlite",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let prompts = vec![dated_record("persist-a", "2026-06-06T00:00:00Z")];
        let stats = build_stats(&prompts, Vec::new());

        let first = persist_scan_result(&db_path, "2026-06-06T00:01:00Z", &prompts, &stats, &[])
            .expect("persist first scan");
        let second = persist_scan_result(&db_path, "2026-06-06T00:02:00Z", &prompts, &stats, &[])
            .expect("persist second scan");

        assert_eq!(first.inserted_prompt_count, 1);
        assert_eq!(first.updated_prompt_count, 0);
        assert_eq!(second.inserted_prompt_count, 0);
        assert_eq!(second.updated_prompt_count, 1);
        assert_eq!(second.stored_prompt_count, 1);
        assert_eq!(second.date_count, 1);

        let conn = Connection::open(&db_path).expect("open persisted db");
        let stored_date: String = conn
            .query_row(
                "SELECT prompt_date FROM prompts WHERE id = 'persist-a'",
                [],
                |row| row.get(0),
            )
            .expect("read persisted date");
        assert_eq!(stored_date, "2026-06-06");

        std::fs::remove_file(db_path).expect("remove persisted db");
    }

    #[test]
    fn persist_scan_result_prunes_stale_source_rows_after_complete_scan() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-prune-stale-test-{}.sqlite",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let mut stale = dated_record("stale-row", "2026-06-06T00:00:00Z");
        stale.source = "Antigravity IDE conversation DB".to_string();
        let mut current = dated_record("current-row", "2026-06-06T00:01:00Z");
        current.source = stale.source.clone();
        let first_stats = build_stats(
            &[stale.clone()],
            vec![source_summary_for(&stale.source, 1, 1, "ok", Vec::new())],
        );
        persist_scan_result(
            &db_path,
            "2026-06-06T00:02:00Z",
            &[stale],
            &first_stats,
            &[],
        )
        .expect("persist stale row");

        let second_stats = build_stats(
            &[current.clone()],
            vec![source_summary_for(&current.source, 1, 1, "ok", Vec::new())],
        );
        let persistence = persist_scan_result(
            &db_path,
            "2026-06-06T00:03:00Z",
            &[current],
            &second_stats,
            &[],
        )
        .expect("persist current row");

        assert_eq!(persistence.stored_prompt_count, 1);
        let conn = Connection::open(&db_path).expect("open persisted db");
        let ids = prompt_ids_for_source(&conn, "Antigravity IDE conversation DB");
        assert_eq!(ids, vec!["current-row".to_string()]);

        std::fs::remove_file(db_path).expect("remove persisted db");
    }

    #[test]
    fn persist_scan_result_handles_large_complete_source_reconciliation() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-large-reconcile-test-{}.sqlite",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let prompts = (0..(SQLITE_DELETE_CHUNK_SIZE * 3))
            .map(|idx| {
                let mut prompt =
                    dated_record(&format!("large-row-{idx:04}"), "2026-06-06T00:00:00Z");
                prompt.source = "Codex".to_string();
                prompt
            })
            .collect::<Vec<_>>();
        let stats = build_stats(
            &prompts,
            vec![source_summary_for(
                "Codex",
                prompts.len(),
                prompts.len(),
                "ok",
                Vec::new(),
            )],
        );

        persist_scan_result(&db_path, "2026-06-06T00:01:00Z", &prompts, &stats, &[])
            .expect("persist first large source");
        let persistence =
            persist_scan_result(&db_path, "2026-06-06T00:02:00Z", &prompts, &stats, &[])
                .expect("persist second large source");

        assert_eq!(persistence.stored_prompt_count, prompts.len());
        let conn = Connection::open(&db_path).expect("open large reconcile db");
        let ids = prompt_ids_for_source(&conn, "Codex");
        assert_eq!(ids.len(), prompts.len());

        std::fs::remove_file(db_path).expect("remove large reconcile db");
    }

    #[test]
    fn persist_scan_result_keeps_stale_source_rows_when_scan_was_limited() {
        let db_path = std::env::temp_dir().join(format!(
            "promptvault-keep-limited-stale-test-{}.sqlite",
            std::process::id()
        ));
        let _ = std::fs::remove_file(&db_path);
        let mut stale = dated_record("limited-stale-row", "2026-06-06T00:00:00Z");
        stale.source = "Codex".to_string();
        let mut current = dated_record("limited-current-row", "2026-06-06T00:01:00Z");
        current.source = stale.source.clone();
        let first_stats = build_stats(
            &[stale.clone()],
            vec![source_summary_for(&stale.source, 1, 1, "ok", Vec::new())],
        );
        persist_scan_result(
            &db_path,
            "2026-06-06T00:02:00Z",
            &[stale],
            &first_stats,
            &[],
        )
        .expect("persist stale row");

        let second_stats = build_stats(
            &[current.clone()],
            vec![source_summary_for(&current.source, 1, 1, "ok", Vec::new())],
        );
        let warnings = vec!["설정된 제한 1개 프롬프트에서 스캔을 중지했습니다.".to_string()];
        let persistence = persist_scan_result(
            &db_path,
            "2026-06-06T00:03:00Z",
            &[current],
            &second_stats,
            &warnings,
        )
        .expect("persist limited row");

        assert_eq!(persistence.stored_prompt_count, 2);
        let conn = Connection::open(&db_path).expect("open persisted db");
        let ids = prompt_ids_for_source(&conn, "Codex");
        assert_eq!(
            ids,
            vec![
                "limited-current-row".to_string(),
                "limited-stale-row".to_string()
            ]
        );

        std::fs::remove_file(db_path).expect("remove persisted db");
    }

    #[test]
    fn load_stored_prompts_returns_empty_for_new_database() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-load-empty-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        let db_path = root.join("promptvault.sqlite");

        let result = run_load_stored_prompts(StoredPromptsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(25),
            query: None,
            source: None,
            date: None,
            workspace: None,
            preview_sort: None,
        })
        .expect("load empty prompt vault");

        assert_eq!(result.returned_prompt_count, 0);
        assert_eq!(result.stats.total_prompts, 0);
        assert_eq!(
            result.persistence.expect("persistence").stored_prompt_count,
            0
        );

        std::fs::remove_dir_all(root).expect("remove load empty root");
    }

    #[test]
    fn load_stored_prompts_filters_persisted_rows() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-load-stored-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create load stored root");
        let db_path = root.join("promptvault.sqlite");
        let prompts = vec![
            dated_record("stored-alpha", "2026-06-05T00:00:00Z"),
            dated_record("stored-needle", "2026-06-06T00:00:00Z"),
        ];
        let stats = build_stats(&prompts, Vec::new());
        persist_scan_result(&db_path, "2026-06-06T00:01:00Z", &prompts, &stats, &[])
            .expect("persist prompt vault");

        let result = run_load_stored_prompts(StoredPromptsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(10),
            query: Some("needle".to_string()),
            source: None,
            date: None,
            workspace: None,
            preview_sort: Some("quality-asc".to_string()),
        })
        .expect("load stored prompts");

        assert_eq!(result.returned_prompt_count, 1);
        assert_eq!(result.prompts[0].id, "stored-needle");
        assert_eq!(result.stats.total_prompts, 1);
        assert_eq!(result.stats.prompts_by_date[0].text, "2026-06-06");
        assert_eq!(
            result.persistence.expect("persistence").stored_prompt_count,
            2
        );

        std::fs::remove_dir_all(root).expect("remove load stored root");
    }

    #[test]
    fn load_stored_prompts_latest_preview_matches_scan_order() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-load-latest-order-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create load latest order root");
        let db_path = root.join("promptvault.sqlite");
        let prompts = vec![
            dated_record("stored-old", "2026-06-05T00:00:00Z"),
            dated_record("stored-middle", "2026-06-06T00:00:00Z"),
            dated_record("stored-new", "2026-06-07T00:00:00Z"),
        ];
        let stats = build_stats(&prompts, Vec::new());
        persist_scan_result(&db_path, "2026-06-07T00:01:00Z", &prompts, &stats, &[])
            .expect("persist prompt vault");

        let result = run_load_stored_prompts(StoredPromptsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(2),
            query: None,
            source: None,
            date: None,
            workspace: None,
            preview_sort: Some("latest".to_string()),
        })
        .expect("load latest stored prompts");

        assert_eq!(result.returned_prompt_count, 2);
        assert_eq!(
            result
                .prompts
                .iter()
                .map(|prompt| prompt.id.as_str())
                .collect::<Vec<_>>(),
            vec!["stored-middle", "stored-new"]
        );

        std::fs::remove_dir_all(root).expect("remove load latest order root");
    }

    #[test]
    fn load_stored_prompts_filters_by_source_date_and_workspace() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-load-filtered-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create load filtered root");
        let db_path = root.join("promptvault.sqlite");
        let mut match_prompt = dated_record("stored-match", "2026-06-06T00:00:00Z");
        match_prompt.source = "Codex".to_string();
        match_prompt.cwd = Some("/Users/wj/Ai/System/10_Projects/PromptVault".to_string());
        let mut wrong_source = dated_record("stored-wrong-source", "2026-06-06T00:00:00Z");
        wrong_source.source = "Claude".to_string();
        wrong_source.cwd = match_prompt.cwd.clone();
        let mut wrong_date = dated_record("stored-wrong-date", "2026-06-05T00:00:00Z");
        wrong_date.source = "Codex".to_string();
        wrong_date.cwd = match_prompt.cwd.clone();
        let mut wrong_workspace = dated_record("stored-wrong-workspace", "2026-06-06T00:00:00Z");
        wrong_workspace.source = "Codex".to_string();
        wrong_workspace.cwd = Some("/tmp/OtherProject".to_string());
        let prompts = vec![match_prompt, wrong_source, wrong_date, wrong_workspace];
        let stats = build_stats(&prompts, Vec::new());
        persist_scan_result(&db_path, "2026-06-06T00:01:00Z", &prompts, &stats, &[])
            .expect("persist filtered prompt vault");

        let result = run_load_stored_prompts(StoredPromptsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(10),
            query: Some("src-tauri".to_string()),
            source: Some("Codex".to_string()),
            date: Some("2026-06-06".to_string()),
            workspace: Some("promptvault".to_string()),
            preview_sort: Some("latest".to_string()),
        })
        .expect("load source/date/workspace filtered prompts");

        assert_eq!(result.returned_prompt_count, 1);
        assert_eq!(result.prompts[0].id, "stored-match");
        assert_eq!(result.stats.total_prompts, 1);
        assert_eq!(result.stats.source_summaries[0].label, "Codex");
        assert_eq!(
            result.persistence.expect("persistence").stored_prompt_count,
            4
        );

        std::fs::remove_dir_all(root).expect("remove load filtered root");
    }

    #[test]
    fn stored_prompt_facets_summarize_sources_dates_and_workspaces() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-facets-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create facets root");
        let db_path = root.join("promptvault.sqlite");
        let mut codex_today = dated_record("facet-codex-today", "2026-06-06T00:00:00Z");
        codex_today.source = "Codex".to_string();
        codex_today.cwd = Some("/Users/wj".to_string());
        let mut codex_yesterday = dated_record("facet-codex-yesterday", "2026-06-05T00:00:00Z");
        codex_yesterday.source = "Codex".to_string();
        codex_yesterday.cwd = Some("/Users/wj".to_string());
        let mut claude_today = dated_record("facet-claude-today", "2026-06-06T00:00:00Z");
        claude_today.source = "Claude".to_string();
        claude_today.cwd = Some("/Users/wj".to_string());
        let mut gemini_today = dated_record("facet-gemini-today", "2026-06-06T00:00:00Z");
        gemini_today.source = "Gemini".to_string();
        gemini_today.cwd = Some("/tmp/OtherProject".to_string());
        let prompts = vec![codex_today, codex_yesterday, claude_today, gemini_today];
        let stats = build_stats(&prompts, Vec::new());
        persist_scan_result(&db_path, "2026-06-06T00:01:00Z", &prompts, &stats, &[])
            .expect("persist prompt facets");

        let result = run_list_stored_prompt_facets(StoredPromptFacetsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(2),
        })
        .expect("list stored prompt facets");

        assert_eq!(result.total_prompts, 4);
        assert_eq!(result.sources.len(), 2);
        assert_eq!(result.sources[0].text, "Codex");
        assert_eq!(result.sources[0].count, 2);
        assert_eq!(result.dates[0].text, "2026-06-06");
        assert_eq!(result.dates[0].count, 3);
        assert_eq!(result.workspaces[0].text, "/Users/wj");
        assert_eq!(result.workspaces[0].count, 3);

        std::fs::remove_dir_all(root).expect("remove facets root");
    }

    #[test]
    fn stored_prompt_facets_include_unknown_dates() {
        let root = std::env::temp_dir().join(format!(
            "promptvault-unknown-date-facets-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock")
                .as_nanos()
        ));
        std::fs::create_dir_all(&root).expect("create unknown-date facets root");
        let db_path = root.join("promptvault.sqlite");
        let mut antigravity_db_prompt = record("unknown-date-antigravity-db");
        antigravity_db_prompt.source = "Antigravity IDE conversation DB".to_string();
        antigravity_db_prompt.timestamp = None;
        antigravity_db_prompt.text = "Fix Antigravity conversation DB unknown-date filtering, run cargo test, and report PASS/FAIL.".to_string();
        antigravity_db_prompt.word_count = count_words(&antigravity_db_prompt.text);
        antigravity_db_prompt.char_count = antigravity_db_prompt.text.chars().count();
        antigravity_db_prompt.quality = assess_prompt_quality(&antigravity_db_prompt.text, &[]);
        let mut dated_prompt_a = dated_record("known-date-a", "2026-06-07T02:31:00Z");
        dated_prompt_a.source = "Codex".to_string();
        let mut dated_prompt_b = dated_record("known-date-b", "2026-06-07T02:32:00Z");
        dated_prompt_b.source = "Codex".to_string();
        let prompts = vec![dated_prompt_a, dated_prompt_b, antigravity_db_prompt];
        let stats = build_stats(&prompts, Vec::new());
        persist_scan_result(&db_path, "2026-06-07T02:30:00Z", &prompts, &stats, &[])
            .expect("persist unknown-date prompt");

        let facets = run_list_stored_prompt_facets(StoredPromptFacetsOptions {
            database_path: Some(db_path.display().to_string()),
            limit: Some(1),
        })
        .expect("list unknown-date facets");
        let unknown_date = facets
            .dates
            .iter()
            .find(|item| item.text == "unknown-date")
            .expect("unknown-date facet");
        assert_eq!(unknown_date.count, 1);
        assert_eq!(facets.dates.len(), 1);

        let loaded = run_load_stored_prompts(StoredPromptsOptions {
            database_path: Some(db_path.display().to_string()),
            date: Some("unknown-date".to_string()),
            limit: Some(10),
            ..Default::default()
        })
        .expect("load unknown-date prompts");
        assert_eq!(loaded.stats.total_prompts, 1);
        assert_eq!(loaded.prompts[0].source, "Antigravity IDE conversation DB");

        std::fs::remove_dir_all(root).expect("remove unknown-date facets root");
    }

    fn record(id: &str) -> PromptRecord {
        PromptRecord {
            id: id.to_string(),
            source: "test".to_string(),
            session_id: id.to_string(),
            path: "/tmp/test.jsonl".to_string(),
            timestamp: Some(id.to_string()),
            cwd: None,
            text: id.to_string(),
            word_count: 1,
            char_count: 1,
            hash: id.to_string(),
            risk_flags: Vec::new(),
            quality: assess_prompt_quality(id, &[]),
        }
    }

    fn dated_record(id: &str, timestamp: &str) -> PromptRecord {
        let mut record = record(id);
        record.timestamp = Some(timestamp.to_string());
        record.text = format!(
            "Fix {id} in src-tauri/src/lib.rs, preserve files, run cargo test, and report Markdown output."
        );
        record.word_count = count_words(&record.text);
        record.char_count = record.text.chars().count();
        record.quality = assess_prompt_quality(&record.text, &[]);
        record
    }

    fn source_summary_for(
        label: &str,
        files_seen: usize,
        prompts_found: usize,
        status: &str,
        notes: Vec<String>,
    ) -> SourceSummary {
        SourceSummary {
            id: label.to_string(),
            label: label.to_string(),
            root_path: "/tmp/test-source".to_string(),
            files_seen,
            prompts_found,
            average_quality: 100.0,
            weak_prompt_count: 0,
            status: status.to_string(),
            notes,
        }
    }

    fn prompt_ids_for_source(conn: &Connection, source: &str) -> Vec<String> {
        let mut stmt = conn
            .prepare("SELECT id FROM prompts WHERE source = ?1 ORDER BY id")
            .expect("prepare prompt id query");
        stmt.query_map([source], |row| row.get::<_, String>(0))
            .expect("query prompt ids")
            .collect::<Result<Vec<_>, _>>()
            .expect("collect prompt ids")
    }

    fn pb_string(field: u64, value: &str) -> Vec<u8> {
        let mut out = pb_key(field, 2);
        out.extend(pb_varint(value.len() as u64));
        out.extend(value.as_bytes());
        out
    }

    fn pb_message(field: u64, value: &[u8]) -> Vec<u8> {
        let mut out = pb_key(field, 2);
        out.extend(pb_varint(value.len() as u64));
        out.extend(value);
        out
    }

    fn pb_key(field: u64, wire: u64) -> Vec<u8> {
        pb_varint((field << 3) | wire)
    }

    fn pb_varint(mut value: u64) -> Vec<u8> {
        let mut out = Vec::new();
        loop {
            let mut byte = (value & 0x7f) as u8;
            value >>= 7;
            if value != 0 {
                byte |= 0x80;
            }
            out.push(byte);
            if value == 0 {
                break;
            }
        }
        out
    }
}
