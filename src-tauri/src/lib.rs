use chrono::{Local, TimeZone, Utc};
use regex::Regex;
use rusqlite::{Connection, OpenFlags};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Read};
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use walkdir::WalkDir;

const APP_DIR_NAME: &str = "PromptVault";
const SECRET_ENV_PATH: &str = "/Users/wj/Ai/System/70_Governance/🔐 Secrets/secrets.env";

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
    pub source_summaries: Vec<SourceSummary>,
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
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImproveRequest {
    pub prompt: String,
    pub context: Option<String>,
    pub force_local: Option<bool>,
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
}

#[tauri::command]
fn scan_prompts(options: Option<ScanOptions>) -> Result<ScanResult, String> {
    let opts = options.unwrap_or_default();
    run_scan(opts).map_err(|err| err.to_string())
}

#[tauri::command]
async fn improve_prompt(request: ImproveRequest) -> Result<ImproveResult, String> {
    improve_prompt_inner(request)
        .await
        .map_err(|err| err.to_string())
}

pub fn run_scan(options: ScanOptions) -> Result<ScanResult, Box<dyn std::error::Error>> {
    if matches!(options.limit, Some(0)) {
        return Err("scan limit requires a positive integer".into());
    }
    let limit = options.limit.unwrap_or(usize::MAX);
    let preview_limit = options.preview_limit;
    let include_markdown = options.include_markdown.unwrap_or(true);
    let write_markdown = options.write_markdown.unwrap_or(true);
    if matches!(options.output_path.as_deref(), Some(path) if path.trim().is_empty()) {
        return Err("output path requires a non-empty value".into());
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

    for source in sources {
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
            summary
                .notes
                .push("Path was not present on this machine.".to_string());
            summaries.push(summary);
            continue;
        }

        summary.status = "ok".to_string();
        match collect_from_source(&source, &mut summary, limit.saturating_sub(prompts.len())) {
            Ok(mut found) => {
                summary.prompts_found = found.len();
                summarize_source_quality(&mut summary, &found);
                prompts.append(&mut found);
            }
            Err(err) => {
                summary.status = "partial".to_string();
                summary.notes.push(err.to_string());
                warnings.push(format!("{}: {}", source.label, err));
            }
        }
        summaries.push(summary);

        if limit != usize::MAX && prompts.len() >= limit {
            warnings.push(format!(
                "Scan stopped at configured limit of {limit} prompts."
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
        render_markdown(&generated_at, &stats, &prompts)
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
        warnings,
    })
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

    let requested = requested
        .iter()
        .map(|id| id.trim())
        .filter(|id| !id.is_empty())
        .collect::<HashSet<_>>();
    if requested.is_empty() {
        return sources;
    }

    sources
        .into_iter()
        .filter(|source| requested.contains(source.id))
        .collect::<Vec<_>>()
}

pub async fn improve_prompt_inner(
    request: ImproveRequest,
) -> Result<ImproveResult, Box<dyn std::error::Error>> {
    let prompt = request.prompt.trim().to_string();
    if prompt.is_empty() {
        return Err("improve requires a non-empty prompt".into());
    }

    if request.force_local.unwrap_or(false) {
        return Ok(local_improvement(
            &prompt,
            request.context.as_deref(),
            Vec::new(),
        ));
    }

    let env = read_secret_env(Path::new(SECRET_ENV_PATH)).unwrap_or_default();
    let key = env
        .get("GLM_API_KEY")
        .or_else(|| env.get("GLM_API_KEY_2"))
        .cloned();
    let endpoint =
        normalize_chat_endpoint(&env.get("GLM_CODING_ENDPOINT").cloned().unwrap_or_else(|| {
            "https://open.bigmodel.cn/api/paas/v4/chat/completions".to_string()
        }));
    let model = env
        .get("GLM_CODING_MODEL")
        .cloned()
        .unwrap_or_else(|| "glm-4.6".to_string());

    if let Some(api_key) = key {
        let system = "You improve developer prompts. Return concise Korean guidance. Preserve user intent, make scope, context, constraints, success criteria, and verification explicit. Do not add unsupported facts.";
        let mut user = String::new();
        if let Some(context) = request
            .context
            .as_deref()
            .filter(|value| !value.trim().is_empty())
        {
            user.push_str("Context:\n");
            user.push_str(context.trim());
            user.push_str("\n\n");
        }
        user.push_str("Original prompt:\n");
        user.push_str(&prompt);
        user.push_str("\n\nReturn JSON with keys revised_prompt, rationale, checklist.");

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
        match client
            .post(endpoint)
            .bearer_auth(api_key)
            .json(&body)
            .send()
            .await
        {
            Ok(response) if response.status().is_success() => {
                let value: Value = response.json().await?;
                if let Some(content) = value
                    .pointer("/choices/0/message/content")
                    .and_then(Value::as_str)
                {
                    if let Ok(parsed) = serde_json::from_str::<Value>(content) {
                        let revised = parsed
                            .get("revised_prompt")
                            .and_then(Value::as_str)
                            .unwrap_or(content)
                            .trim()
                            .to_string();
                        let rationale = string_array(parsed.get("rationale"));
                        let checklist = string_array(parsed.get("checklist"));
                        return Ok(ImproveResult {
                            provider: "glm".to_string(),
                            used_ai: true,
                            quality_delta: quality_delta(&prompt, &revised),
                            revised_prompt: revised,
                            rationale,
                            checklist,
                            warnings: Vec::new(),
                        });
                    }
                    let revised = content.trim().to_string();
                    return Ok(ImproveResult {
                        provider: "glm".to_string(),
                        used_ai: true,
                        quality_delta: quality_delta(&prompt, &revised),
                        revised_prompt: revised,
                        rationale: vec![
                            "GLM returned non-JSON text; preserved the model output.".to_string()
                        ],
                        checklist: prompt_checklist(),
                        warnings: Vec::new(),
                    });
                }
            }
            Ok(response) => {
                let warning = format!(
                    "GLM returned HTTP {}; used local fallback.",
                    response.status()
                );
                return Ok(local_improvement(
                    &prompt,
                    request.context.as_deref(),
                    vec![warning],
                ));
            }
            Err(err) => {
                let warning = format!("GLM request failed: {err}; used local fallback.");
                return Ok(local_improvement(
                    &prompt,
                    request.context.as_deref(),
                    vec![warning],
                ));
            }
        }
    }

    Ok(local_improvement(
        &prompt,
        request.context.as_deref(),
        vec!["GLM_API_KEY/GLM_API_KEY_2 was not available; used local fallback.".to_string()],
    ))
}

pub fn source_specs() -> Vec<SourceSpec> {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/Users/wj"));
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
            label: "Antigravity conversation DB",
            root: home.join(".gemini/antigravity-cli/conversations"),
            kind: SourceKind::AntigravityConversationSqlite,
        },
        SourceSpec {
            id: "gemini-tmp-chat",
            label: "Gemini temporary chats",
            root: home.join(".gemini/tmp/wj/chats"),
            kind: SourceKind::GeminiTmpChatJson,
        },
    ]
}

fn collect_from_source(
    source: &SourceSpec,
    summary: &mut SourceSummary,
    remaining: usize,
) -> Result<Vec<PromptRecord>, Box<dyn std::error::Error>> {
    if remaining == 0 {
        return Ok(Vec::new());
    }

    let mut prompts = Vec::new();
    let mut seen_keys = HashSet::new();
    for file in matching_source_files(&source.root, source.kind) {
        if prompts.len() >= remaining {
            break;
        }
        summary.files_seen += 1;
        let found = match source.kind {
            SourceKind::CodexJsonl => parse_codex_jsonl(source, &file),
            SourceKind::ClaudeProjectJsonl => parse_claude_project_jsonl(source, &file),
            SourceKind::ClaudeTranscriptJsonl => parse_claude_transcript_jsonl(source, &file),
            SourceKind::ClaudeHistoryJsonl => parse_claude_history_jsonl(source, &file),
            SourceKind::AntigravityTranscriptJsonl => {
                parse_antigravity_transcript_jsonl(source, &file)
            }
            SourceKind::AntigravityHistoryJsonl => parse_antigravity_history_jsonl(source, &file),
            SourceKind::AntigravityConversationSqlite => {
                parse_antigravity_conversation_sqlite(source, &file)
            }
            SourceKind::GeminiTmpChatJson => parse_gemini_tmp_chat(source, &file),
        };

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
                .push(format!("Skipped {}: {}", file.display(), err)),
        }
    }
    Ok(prompts)
}

fn matching_source_files(root: &Path, kind: SourceKind) -> Box<dyn Iterator<Item = PathBuf> + '_> {
    if root.is_file() {
        return Box::new(std::iter::once(root.to_path_buf()));
    }

    Box::new(
        WalkDir::new(root)
            .follow_links(false)
            .sort_by_file_name()
            .into_iter()
            .filter_map(Result::ok)
            .filter_map(move |entry| {
                let path = entry.path();
                if source_file_matches(path, kind) {
                    Some(path.to_path_buf())
                } else {
                    None
                }
            }),
    )
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
        SourceKind::GeminiTmpChatJson => path.extension().is_some_and(|ext| ext == "json"),
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
        let strings = protobuf_strings(&payload);
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
            push_record(&mut records, source, path, message, None, text);
        }
    }
    Ok(records)
}

fn protobuf_strings(bytes: &[u8]) -> Vec<String> {
    let mut out = Vec::new();
    collect_protobuf_strings(bytes, 0, &mut out);
    out.sort();
    out.dedup();
    out
}

fn collect_protobuf_strings(bytes: &[u8], depth: usize, out: &mut Vec<String>) {
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
                if let Ok(text) = std::str::from_utf8(slice) {
                    let normalized = normalize_prompt_text(text);
                    if is_human_readable_blob_string(&normalized) {
                        out.push(normalized);
                    }
                }
                collect_protobuf_strings(slice, depth + 1, out);
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

fn best_prompt_candidate(strings: &[String]) -> Option<String> {
    strings
        .iter()
        .filter(|text| is_prompt_candidate(text))
        .max_by_key(|text| prompt_candidate_score(text))
        .cloned()
}

fn best_workspace_candidate(strings: &[String]) -> Option<String> {
    strings
        .iter()
        .find(|text| {
            text.starts_with("/Users/")
                && !text.contains("/.gemini/")
                && !text.contains("/Library/")
                && text.chars().count() < 512
        })
        .cloned()
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
    Ok(reader
        .lines()
        .map_while(Result::ok)
        .filter(|line| !line.trim().is_empty())
        .collect())
}

fn text_from_value(value: Option<&Value>) -> String {
    match value {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Array(items)) => items
            .iter()
            .filter_map(|item| {
                if let Some(text) = item.as_str() {
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

fn top_words(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let stop = stop_words();
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        for mat in word_regex().find_iter(&prompt.text.to_lowercase()) {
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
        for sentence in prompt
            .text
            .split(['.', '?', '!', '\n', ';', '。', '？', '！'])
            .map(str::trim)
            .filter(|sentence| sentence.chars().count() >= 12)
        {
            let phrase = sentence
                .split_whitespace()
                .take(14)
                .collect::<Vec<_>>()
                .join(" ")
                .to_lowercase();
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
        let normalized = prompt.text.to_lowercase();
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

fn top_quality_gaps(prompts: &[PromptRecord], limit: usize) -> Vec<FrequencyItem> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    for prompt in prompts {
        for gap in &prompt.quality.missing {
            *counts.entry(gap.clone()).or_default() += 1;
        }
    }
    rank_counts(counts, limit)
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

fn risk_regexes() -> &'static Vec<(&'static str, Regex)> {
    static RISK_REGEXES: OnceLock<Vec<(&'static str, Regex)>> = OnceLock::new();
    RISK_REGEXES.get_or_init(|| {
        vec![
            (
                "possible_api_key",
                Regex::new(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]")
                    .expect("api key regex"),
            ),
            (
                "private_key",
                Regex::new(r"-----BEGIN [A-Z ]*PRIVATE KEY-----").expect("private key regex"),
            ),
            (
                "long_base64_like_token",
                Regex::new(r"[A-Za-z0-9_\-]{48,}").expect("token regex"),
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

fn render_markdown(generated_at: &str, stats: &ScanStats, prompts: &[PromptRecord]) -> String {
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
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("/Users/wj"));
    let stamp = Local::now().format("%Y-%m-%d-%H%M%S").to_string();
    home.join("Documents")
        .join(APP_DIR_NAME)
        .join(format!("promptvault-export-{stamp}.md"))
}

fn local_improvement(prompt: &str, context: Option<&str>, warnings: Vec<String>) -> ImproveResult {
    let mut revised = String::new();
    revised.push_str("목표:\n");
    revised.push_str("- ");
    revised.push_str(
        first_sentence(prompt)
            .as_deref()
            .unwrap_or("해결하려는 작업을 명확히 수행한다."),
    );
    revised.push_str("\n\n맥락:\n");
    if let Some(context) = context.filter(|value| !value.trim().is_empty()) {
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

fn normalize_chat_endpoint(endpoint: &str) -> String {
    let trimmed = endpoint.trim().trim_end_matches('/');
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
        .invoke_handler(tauri::generate_handler![scan_prompts, improve_prompt])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

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

    #[tokio::test]
    async fn improve_prompt_inner_can_force_local_provider() {
        let result = improve_prompt_inner(ImproveRequest {
            prompt: "make better".to_string(),
            context: None,
            force_local: Some(true),
        })
        .await
        .expect("force local improvement");

        assert_eq!(result.provider, "local-rules");
        assert!(!result.used_ai);
        assert!(result.warnings.is_empty());
        assert!(result.quality_delta.score_delta > 0);
    }

    #[tokio::test]
    async fn improve_prompt_inner_rejects_empty_prompt() {
        let err = improve_prompt_inner(ImproveRequest {
            prompt: "  ".to_string(),
            context: None,
            force_local: Some(true),
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
    fn selects_requested_sources() {
        let selected = selected_source_specs(Some(&[
            "antigravity-cli-conversation-db".to_string(),
            "codex".to_string(),
        ]));

        assert_eq!(
            selected.iter().map(|source| source.id).collect::<Vec<_>>(),
            vec!["codex", "antigravity-cli-conversation-db"]
        );
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

        std::fs::write(
            root.join("001.jsonl"),
            r#"{"type":"response_item","payload":{"role":"user","content":[{"text":"Fix parser performance, run cargo test, and report markdown output."}]}}"#,
        )
        .expect("write prompt file");
        for idx in 2..=5 {
            std::fs::write(root.join(format!("{idx:03}.jsonl")), "\n").expect("write extra file");
        }

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

        let prompts = collect_from_source(&source, &mut summary, 1).expect("collect source");

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

        let prompts = collect_from_source(&source, &mut summary, 2).expect("collect source");
        let files_seen = summary.files_seen;
        std::fs::remove_dir_all(root).expect("remove temp root");

        assert_eq!(prompts.len(), 2);
        assert!(prompts
            .iter()
            .any(|prompt| prompt.text.contains("second unique prompt path")));
        assert_eq!(files_seen, 2);
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

        let markdown = render_markdown("2026-06-03T00:00:00Z", &stats, &[]);

        assert!(
            markdown.contains("| Source | Status | Files | Prompts | Avg Quality | Weak | Path |")
        );
        assert!(markdown.contains("| Test Source | ok | 4 | 7 | 42.5 | 3 | `/tmp/test-source` |"));
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
    fn normalizes_glm_base_endpoint() {
        assert_eq!(
            normalize_chat_endpoint("https://api.z.ai/api/coding/paas/v4"),
            "https://api.z.ai/api/coding/paas/v4/chat/completions"
        );
        assert_eq!(
            normalize_chat_endpoint("https://api.z.ai/api/coding/paas/v4/chat/completions"),
            "https://api.z.ai/api/coding/paas/v4/chat/completions"
        );
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
