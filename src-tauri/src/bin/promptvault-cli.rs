use promptvault_lib::{
    build_scan_plan, cancel_scan_run, default_database_path, improve_prompt_inner,
    redact_sensitive_text, run_import_batch, run_list_import_events, run_list_import_states,
    run_list_project_work_log_extraction_items, run_list_project_work_summary_snapshots,
    run_list_stored_prompt_facets,
    run_load_stored_prompts, run_project_work_log_coverage,
    run_project_work_log_extraction_candidates, run_project_work_log_extraction_proposals,
    run_project_work_report, run_project_work_summary, run_scan, source_specs, CancelScanOptions,
    ImportBatchOptions, ImportEventsOptions, ImportStatesOptions, ImproveRequest,
    ProjectWorkLogExtractionCandidatesOptions, ProjectWorkLogExtractionItemsOptions,
    ProjectWorkLogExtractionProposalsOptions,
    ProjectWorkReportOptions, ProjectWorkSummaryOptions, ProjectWorkSummarySnapshotsOptions,
    PromptRecord, ScanOptions, ScanPlanOptions, ScanProgressOptions, StoredPromptFacetsOptions,
    StoredPromptsOptions,
};
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{TcpListener, TcpStream};

const MAX_JSON_PROMPT_PREVIEW: usize = 25;
const MAX_REPAIR_COUNT: usize = 10;

#[tokio::main]
async fn main() {
    if let Err(err) = run().await {
        eprintln!("promptvault-cli error: {err}");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1).collect::<Vec<_>>();
    let command = if args.is_empty() {
        "help".to_string()
    } else {
        args.remove(0)
    };

    match command.as_str() {
        "sources" => {
            let json = take_flag(&mut args, "--json");
            reject_extra_args(&args, "sources")?;
            if json {
                let rows = source_specs()
                    .into_iter()
                    .map(|source| {
                        serde_json::json!({
                            "id": source.id,
                            "label": source.label,
                            "status": if source.root.exists() { "ok" } else { "missing" },
                            "path": source.root.display().to_string()
                        })
                    })
                    .collect::<Vec<_>>();
                println!("{}", serde_json::to_string_pretty(&rows)?);
                return Ok(());
            }
            for source in source_specs() {
                let exists = if source.root.exists() {
                    "ok"
                } else {
                    "missing"
                };
                println!(
                    "{}\t{}\t{}\t{}",
                    source.id,
                    source.label,
                    exists,
                    source.root.display()
                );
            }
        }
        "scan" => {
            let parsed = parse_scan_args(args)?;
            let result = run_scan(parsed.options)?;
            if parsed.json {
                let mut warnings = result.warnings.clone();
                let prompts =
                    json_prompt_preview(&result.prompts, parsed.include_prompts, &mut warnings);
                let summary = serde_json::json!({
                    "generated_at": &result.generated_at,
                    "output_path": &result.output_path,
                    "stats": &result.stats,
                    "returned_prompt_count": result.returned_prompt_count,
                    "prompt_stdout_count": prompts.len(),
                    "prompts_truncated": result.prompts_truncated,
                    "preview_sort": &result.preview_sort,
                    "markdown_included": result.markdown_included,
                    "markdown_written": result.markdown_written,
                    "persistence": &result.persistence,
                    "warnings": warnings,
                    "prompts": prompts
                });
                println!("{}", serde_json::to_string_pretty(&summary)?);
                return Ok(());
            }
            println!("PromptVault scan complete");
            println!(
                "output: {}",
                result.output_path.as_deref().unwrap_or("<no export>")
            );
            println!("markdown_written: {}", result.markdown_written);
            println!("prompts: {}", result.stats.total_prompts);
            println!("returned_prompts: {}", result.returned_prompt_count);
            println!("preview_sort: {}", result.preview_sort);
            if let Some(persistence) = &result.persistence {
                println!("database: {}", persistence.database_path);
                println!("stored_prompts: {}", persistence.stored_prompt_count);
                println!("inserted_prompts: {}", persistence.inserted_prompt_count);
                println!("updated_prompts: {}", persistence.updated_prompt_count);
                println!("date_count: {}", persistence.date_count);
            }
            println!("files: {}", result.stats.total_files);
            println!("avg_words: {:.1}", result.stats.average_words);
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in result.warnings {
                    println!("- {warning}");
                }
            }
        }
        "plan" => {
            let json = take_flag(&mut args, "--json");
            let mut source_ids = Vec::new();
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--source" => {
                        source_ids.extend(parse_source_ids_arg(iter.next())?);
                    }
                    other => return Err(format!("unknown plan argument: {other}").into()),
                }
            }
            let plan = build_scan_plan(ScanPlanOptions {
                source_ids: if source_ids.is_empty() {
                    None
                } else {
                    Some(source_ids)
                },
            })?;
            if json {
                println!("{}", serde_json::to_string_pretty(&plan)?);
                return Ok(());
            }
            println!("PromptVault scan plan");
            println!("sources: {}/{}", plan.available_sources, plan.total_sources);
            println!("files: {}", plan.total_files);
            println!("bytes: {}", format_bytes(plan.total_bytes));
            println!("large_files: {}", plan.large_file_count);
            if !plan.warnings.is_empty() {
                println!("warnings:");
                for warning in &plan.warnings {
                    println!("- {warning}");
                }
            }
            for source in &plan.sources {
                println!(
                    "{}\t{}\t{}\t{}\t{}",
                    source.id,
                    source.status,
                    source.file_count,
                    format_bytes(source.byte_count),
                    source.root_path
                );
            }
        }
        "import-batch" => {
            let json = take_flag(&mut args, "--json");
            let reset = take_flag(&mut args, "--reset");
            let mut source_ids = Vec::new();
            let mut file_batch_size = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--source" => {
                        source_ids.extend(parse_source_ids_arg(iter.next())?);
                    }
                    "--files" => {
                        file_batch_size = Some(parse_positive_usize_arg(iter.next(), "--files")?);
                    }
                    other => return Err(format!("unknown import-batch argument: {other}").into()),
                }
            }
            if source_ids.len() != 1 {
                return Err("import-batch requires exactly one --source ID".into());
            }
            let result = run_import_batch(ImportBatchOptions {
                source_id: source_ids.remove(0),
                file_batch_size,
                reset: Some(reset),
                preview_limit: Some(25),
                database_path: None,
            })?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }
            println!("PromptVault import batch");
            println!("source: {}", result.state.source_label);
            println!(
                "files: {}..{} / {}",
                result.batch_start_index, result.state.processed_files, result.state.total_files
            );
            println!("batch_files: {}", result.batch_file_count);
            println!("batch_prompts: {}", result.batch_prompt_count);
            println!("completed: {}", result.state.completed);
            println!("stored_prompts: {}", result.persistence.stored_prompt_count);
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in result.warnings {
                    println!("- {warning}");
                }
            }
        }
        "improve" => {
            let json = take_flag(&mut args, "--json");
            let local = take_flag(&mut args, "--local");
            let prompt = collect_prompt_arg(args)?;
            let result = improve_prompt_inner(ImproveRequest {
                prompt,
                context: None,
                force_local: if local { Some(true) } else { None },
                ..Default::default()
            })
            .await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }
            println!("provider: {}", result.provider);
            println!("used_ai: {}", result.used_ai);
            println!(
                "quality: {} -> {} ({:+})",
                result.quality_delta.before.score,
                result.quality_delta.after.score,
                result.quality_delta.score_delta
            );
            if !result.quality_delta.resolved_gaps.is_empty() {
                println!(
                    "resolved_gaps: {}",
                    result.quality_delta.resolved_gaps.join(", ")
                );
            }
            println!("\n{}", result.revised_prompt);
            if !result.rationale.is_empty() {
                println!("\nrationale:");
                for item in result.rationale {
                    println!("- {item}");
                }
            }
            if !result.warnings.is_empty() {
                println!("\nwarnings:");
                for warning in result.warnings {
                    println!("- {warning}");
                }
            }
        }
        "work-report" => {
            let json = take_flag(&mut args, "--json");
            let refresh_session_index = take_flag(&mut args, "--refresh-session-index");
            let mut limit = None;
            let mut session_limit = None;
            let mut database_path = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--session-limit" => {
                        session_limit =
                            Some(parse_positive_usize_arg(iter.next(), "--session-limit")?);
                    }
                    "--database" => {
                        database_path = Some(parse_required_arg(iter.next(), "--database")?);
                    }
                    other => return Err(format!("unknown work-report argument: {other}").into()),
                }
            }

            let report = run_project_work_report(ProjectWorkReportOptions {
                limit,
                session_limit,
                database_path,
                refresh_session_index: Some(refresh_session_index),
            })?;
            if json {
                println!("{}", serde_json::to_string_pretty(&report)?);
                return Ok(());
            }

            println!("PromptVault project work report");
            println!("items: {}", report.total_items);
            println!("projects: {}", report.project_count);
            println!("dates: {}", report.date_count);
            println!("files_seen: {}", report.files_seen);
            println!(
                "session_prompts_scanned: {}",
                report.session_scan_prompt_count
            );
            println!("session_evidence: {}", report.session_evidence_count);
            println!(
                "unique_session_evidence: {}",
                report.session_evidence_unique_count
            );
            println!("session_index_used: {}", report.session_evidence_index_used);
            println!(
                "session_index_updated: {}",
                report.session_evidence_index_updated
            );
            println!(
                "session_index_records: {}",
                report.session_evidence_index_count
            );
            if !report.warnings.is_empty() {
                println!("warnings:");
                for warning in &report.warnings {
                    println!("- {warning}");
                }
            }
            println!("dates:");
            for item in &report.items_by_date {
                println!("- {}: {}", item.text, item.count);
            }
            println!("projects:");
            for item in &report.items_by_project {
                println!("- {}: {}", item.text, item.count);
            }
            println!("session scan sources:");
            for item in &report.session_scan_sources {
                println!("- {}: {}", item.text, item.count);
            }
            println!("session sources:");
            for item in &report.session_sources {
                println!("- {}: {}", item.text, item.count);
            }
            println!("unique session sources:");
            for item in &report.session_evidence_unique_sources {
                println!("- {}: {}", item.text, item.count);
            }
            for item in &report.items {
                println!(
                    "\n{} · {} · {} · {} · {} sessions",
                    item.date, item.project, item.status, item.title, item.session_evidence_count
                );
                if !item.evidence.is_empty() {
                    println!("- {}", item.evidence);
                }
                println!("  {}", item.source_path);
            }
        }
        "work-log-coverage" => {
            let json = take_flag(&mut args, "--json");
            reject_extra_args(&args, "work-log-coverage")?;
            let result = run_project_work_log_coverage()?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault project work log coverage");
            println!("root: {}", result.root_path);
            println!("files_seen: {}", result.files_seen);
            println!("parsed_files: {}", result.parsed_file_count);
            println!("unparsed_files: {}", result.unparsed_file_count);
            println!("projects: {}", result.project_count);
            println!("work_items: {}", result.work_item_count);
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in &result.warnings {
                    println!("- {warning}");
                }
            }
            for file in &result.files {
                println!(
                    "\n{} · {} · {} · {} items",
                    file.project, file.source_file, file.status, file.work_item_count
                );
                if let Some(date) = &file.latest_date {
                    println!(
                        "- latest: {} · {}",
                        date,
                        file.latest_title.as_deref().unwrap_or("Untitled work")
                    );
                }
                println!("  {}", file.source_path);
            }
        }
        "work-log-candidates" => {
            let json = take_flag(&mut args, "--json");
            let mut limit = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    other => {
                        return Err(format!("unknown work-log-candidates argument: {other}").into())
                    }
                }
            }
            let result = run_project_work_log_extraction_candidates(
                ProjectWorkLogExtractionCandidatesOptions { limit },
            )?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault project work log extraction candidates");
            println!("root: {}", result.root_path);
            println!("files_seen: {}", result.files_seen);
            println!("candidates: {}", result.candidate_count);
            println!("skipped_parsed: {}", result.skipped_parsed_file_count);
            println!(
                "skipped_unreadable: {}",
                result.skipped_unreadable_file_count
            );
            println!("skipped_empty: {}", result.skipped_empty_file_count);
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in &result.warnings {
                    println!("- {warning}");
                }
            }
            for candidate in &result.candidates {
                println!(
                    "\n{} · {} · {} · {} lines",
                    candidate.candidate_id,
                    candidate.project,
                    candidate.source_file,
                    candidate.line_count
                );
                if !candidate.risk_flags.is_empty() {
                    println!("- risk_flags: {}", candidate.risk_flags.join(", "));
                }
                println!("- reason: {}", candidate.reason);
                println!("- excerpt: {}", candidate.excerpt);
                println!("  {}", candidate.source_path);
            }
        }
        "work-log-extract" => {
            let json = take_flag(&mut args, "--json");
            let ai = take_flag(&mut args, "--ai");
            let save = take_flag(&mut args, "--save");
            let mut limit = None;
            let mut database_path = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--database" => {
                        database_path = Some(parse_required_arg(iter.next(), "--database")?);
                    }
                    other => {
                        return Err(format!("unknown work-log-extract argument: {other}").into())
                    }
                }
            }
            let result = run_project_work_log_extraction_proposals(
                ProjectWorkLogExtractionProposalsOptions {
                    limit,
                    ai: Some(ai),
                    database_path,
                    save: Some(save),
                },
            )
            .await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault project work log extraction proposals");
            println!("root: {}", result.root_path);
            println!("provider: {}", result.provider);
            println!("used_ai: {}", result.used_ai);
            println!("candidates: {}", result.candidate_count);
            println!("accepted: {}", result.accepted_count);
            println!("rejected: {}", result.rejected_count);
            if let Some(persistence) = &result.persistence {
                println!(
                    "saved: {} accepted proposals (total {}) to {}",
                    persistence.saved_item_count,
                    persistence.total_saved_item_count,
                    persistence.database_path
                );
            }
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in &result.warnings {
                    println!("- {warning}");
                }
            }
            for proposal in &result.proposals {
                println!(
                    "\n{} · {} · {} · {}",
                    proposal.candidate_id,
                    proposal.project,
                    proposal.date.as_deref().unwrap_or("undated"),
                    if proposal.accepted {
                        "accepted"
                    } else {
                        "rejected"
                    }
                );
                println!("- title: {}", proposal.title);
                println!("- status: {}", proposal.status);
                println!("- confidence: {:.2}", proposal.confidence);
                if let Some(reason) = &proposal.rejection_reason {
                    println!("- rejection_reason: {reason}");
                }
                println!("- evidence: {}", proposal.evidence);
                println!("  {}", proposal.source_path);
            }
        }
        "work-log-items" => {
            let json = take_flag(&mut args, "--json");
            let mut limit = None;
            let mut database_path = None;
            let mut date = None;
            let mut project = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--database" => {
                        database_path = Some(parse_required_arg(iter.next(), "--database")?);
                    }
                    "--date" => {
                        date = Some(parse_required_arg(iter.next(), "--date")?);
                    }
                    "--project" => {
                        project = Some(parse_required_arg(iter.next(), "--project")?);
                    }
                    other => return Err(format!("unknown work-log-items argument: {other}").into()),
                }
            }
            let result =
                run_list_project_work_log_extraction_items(ProjectWorkLogExtractionItemsOptions {
                    database_path,
                    limit,
                    date,
                    project,
                })?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault saved work log extraction items");
            println!("database: {}", result.database_path);
            println!("items: {}", result.total_items);
            println!("returned: {}", result.returned_item_count);
            for item in &result.items {
                println!(
                    "\n#{} · {} · {} · {} · confidence {:.2}",
                    item.id, item.date, item.project, item.provider, item.confidence
                );
                println!("- title: {}", item.title);
                println!("- status: {}", item.status);
                println!("- evidence: {}", item.evidence);
                if !item.warnings.is_empty() {
                    println!("- warnings: {}", item.warnings.join("; "));
                }
                println!("  {}", item.source_path);
            }
        }
        "work-summary" => {
            let json = take_flag(&mut args, "--json");
            let ai = take_flag(&mut args, "--ai");
            let include_extractions = take_flag(&mut args, "--include-extractions");
            let extraction_ai = take_flag(&mut args, "--extraction-ai");
            let refresh_session_index = take_flag(&mut args, "--refresh-session-index");
            let save_snapshot = take_flag(&mut args, "--save-snapshot");
            let mut limit = None;
            let mut session_limit = None;
            let mut summary_limit = None;
            let mut extraction_limit = None;
            let mut database_path = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--session-limit" => {
                        session_limit =
                            Some(parse_positive_usize_arg(iter.next(), "--session-limit")?);
                    }
                    "--summary-limit" => {
                        summary_limit =
                            Some(parse_positive_usize_arg(iter.next(), "--summary-limit")?);
                    }
                    "--extraction-limit" => {
                        extraction_limit =
                            Some(parse_positive_usize_arg(iter.next(), "--extraction-limit")?);
                    }
                    "--database" => {
                        database_path = Some(parse_required_arg(iter.next(), "--database")?);
                    }
                    other => return Err(format!("unknown work-summary argument: {other}").into()),
                }
            }

            let result = run_project_work_summary(ProjectWorkSummaryOptions {
                report: ProjectWorkReportOptions {
                    limit,
                    session_limit,
                    database_path,
                    refresh_session_index: Some(refresh_session_index),
                },
                summary_limit,
                force_local: Some(!ai),
                save_snapshot: Some(save_snapshot),
                include_extractions: Some(include_extractions),
                extraction_limit,
                extraction_ai: Some(extraction_ai),
            })
            .await?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault project work summary");
            println!("provider: {}", result.provider);
            println!("used_ai: {}", result.used_ai);
            println!("summaries: {}", result.summaries.len());
            println!(
                "session_index_used: {}",
                result.report.session_evidence_index_used
            );
            println!(
                "session_index_updated: {}",
                result.report.session_evidence_index_updated
            );
            if let Some(extraction_merge) = &result.extraction_merge {
                println!(
                    "extraction_merge: provider={} used_ai={} merged={} accepted={} rejected={}",
                    extraction_merge.provider,
                    extraction_merge.used_ai,
                    extraction_merge.merged_item_count,
                    extraction_merge.accepted_count,
                    extraction_merge.rejected_count
                );
            }
            if let Some(persistence) = &result.persistence {
                println!(
                    "snapshot: #{} ({} total) {}",
                    persistence.snapshot_id, persistence.snapshot_count, persistence.database_path
                );
            }
            if !result.warnings.is_empty() {
                println!("warnings:");
                for warning in &result.warnings {
                    println!("- {warning}");
                }
            }
            println!("\n{}", result.narrative_markdown);
            for summary in &result.summaries {
                println!(
                    "\n{} · {} · {} items · {} sessions",
                    summary.date,
                    summary.project,
                    summary.work_item_count,
                    summary.session_evidence_count
                );
                for citation in &summary.citations {
                    println!(
                        "- [{}] {} · {} · {}",
                        citation.id, citation.status, citation.title, citation.source_path
                    );
                }
            }
        }
        "work-summary-snapshots" => {
            let json = take_flag(&mut args, "--json");
            let mut limit = None;
            let mut database_path = None;
            let mut date = None;
            let mut project = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--database" => {
                        database_path = Some(parse_required_arg(iter.next(), "--database")?);
                    }
                    "--date" => {
                        date = Some(parse_required_arg(iter.next(), "--date")?);
                    }
                    "--project" => {
                        project = Some(parse_required_arg(iter.next(), "--project")?);
                    }
                    other => {
                        return Err(
                            format!("unknown work-summary-snapshots argument: {other}").into()
                        )
                    }
                }
            }
            let result =
                run_list_project_work_summary_snapshots(ProjectWorkSummarySnapshotsOptions {
                    database_path,
                    limit,
                    date,
                    project,
                })?;
            if json {
                println!("{}", serde_json::to_string_pretty(&result)?);
                return Ok(());
            }

            println!("PromptVault project work summary snapshots");
            println!("database: {}", result.database_path);
            println!("snapshots: {}", result.total_snapshots);
            println!("returned: {}", result.returned_snapshot_count);
            for snapshot in &result.snapshots {
                println!(
                    "\n#{} · {} · {} · {} projects · {} days · {} items",
                    snapshot.id,
                    snapshot.created_at,
                    snapshot.provider,
                    snapshot.project_count,
                    snapshot.date_count,
                    snapshot.total_items
                );
                println!("{}", snapshot.narrative_markdown);
            }
        }
        "repair" => {
            let json = take_flag(&mut args, "--json");
            let mut count = 5usize;
            let mut limit = None;
            let mut source_ids = Vec::new();
            let mut warnings = Vec::new();
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--count" => {
                        count = parse_positive_usize_arg(iter.next(), "--count")?;
                    }
                    "--limit" => {
                        limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
                    }
                    "--source" => {
                        source_ids.extend(parse_source_ids_arg(iter.next())?);
                    }
                    other => return Err(format!("unknown repair argument: {other}").into()),
                }
            }

            let count = bounded_count(count, MAX_REPAIR_COUNT, "Repair", &mut warnings);
            let scan = run_scan(repair_scan_options(limit, count, source_ids))?;
            warnings.extend(scan.warnings.clone());

            let mut repairs = Vec::new();
            for prompt in &scan.prompts {
                let recommendation = improve_prompt_inner(ImproveRequest {
                    prompt: prompt.text.clone(),
                    context: Some(format!(
                        "{} · {}",
                        prompt.source,
                        prompt.cwd.as_deref().unwrap_or("unknown workspace")
                    )),
                    force_local: Some(true),
                    ..Default::default()
                })
                .await?;
                repairs.push(repair_json_entry(
                    prompt,
                    serde_json::to_value(&recommendation)?,
                ));
            }

            if json {
                let summary = serde_json::json!({
                    "generated_at": &scan.generated_at,
                    "provider": "local-rules",
                    "preview_sort": &scan.preview_sort,
                    "scanned_prompt_count": scan.stats.total_prompts,
                    "returned_prompt_count": scan.returned_prompt_count,
                    "repair_count": repairs.len(),
                    "markdown_written": scan.markdown_written,
                    "output_path": &scan.output_path,
                    "warnings": warnings,
                    "repairs": repairs
                });
                println!("{}", serde_json::to_string_pretty(&summary)?);
                return Ok(());
            }

            println!("PromptVault repair suggestions");
            println!("provider: local-rules");
            println!("repairs: {}", repairs.len());
            if !warnings.is_empty() {
                println!("warnings:");
                for warning in warnings {
                    println!("- {warning}");
                }
            }
            for (idx, repair) in repairs.iter().enumerate() {
                let prompt = &scan.prompts[idx];
                let recommendation = repair
                    .get("recommendation")
                    .expect("repair recommendation exists");
                println!(
                    "\n#{} {} · {} · {}",
                    idx + 1,
                    prompt.quality.score,
                    prompt.quality.band,
                    prompt.source
                );
                if let Some(delta) = recommendation.pointer("/quality_delta/score_delta") {
                    println!("score_delta: {delta}");
                }
                if let Some(revised) = recommendation
                    .get("revised_prompt")
                    .and_then(serde_json::Value::as_str)
                {
                    println!("{revised}");
                }
            }
        }
        "serve" => {
            let mut addr = "127.0.0.1:5174".to_string();
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--addr" => addr = parse_required_arg(iter.next(), "--addr")?,
                    other => return Err(format!("unknown serve argument: {other}").into()),
                }
            }
            serve_bridge(&addr)?;
        }
        command if is_help_command(command) => print_help(),
        other => {
            print_help();
            return Err(format!("unknown command: {other}").into());
        }
    }
    Ok(())
}

fn is_help_command(command: &str) -> bool {
    matches!(command, "help" | "-h" | "--help")
}

fn reject_extra_args(args: &[String], command: &str) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(arg) = args.first() {
        return Err(format!("unknown {command} argument: {arg}").into());
    }
    Ok(())
}

struct ScanCommandArgs {
    json: bool,
    include_prompts: bool,
    options: ScanOptions,
}

fn parse_scan_args(mut args: Vec<String>) -> Result<ScanCommandArgs, Box<dyn std::error::Error>> {
    let json = take_flag(&mut args, "--json");
    let include_markdown = take_flag(&mut args, "--include-markdown");
    let include_prompts = take_flag(&mut args, "--include-prompts");
    let no_export = take_flag(&mut args, "--no-export");
    let no_persist = take_flag(&mut args, "--no-persist");
    let mut limit = None;
    let mut output_path = None;
    let mut preview_limit = Some(0);
    let mut preview_sort = None;
    let mut preview_sort_source = None;
    let mut source_limit = None;
    let mut source_ids = Vec::new();
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--limit" => {
                limit = Some(parse_positive_usize_arg(iter.next(), "--limit")?);
            }
            "--source-limit" => {
                source_limit = Some(parse_positive_usize_arg(iter.next(), "--source-limit")?);
            }
            "--output" => {
                output_path = Some(parse_required_arg(iter.next(), "--output")?);
            }
            "--preview-limit" => {
                preview_limit = Some(parse_usize_arg(iter.next(), "--preview-limit")?);
            }
            "--preview-sort" => {
                let value = parse_preview_sort_arg(iter.next())?;
                set_preview_sort(
                    &mut preview_sort,
                    &mut preview_sort_source,
                    "--preview-sort",
                    value,
                )?;
            }
            "--weakest-first" => {
                set_preview_sort(
                    &mut preview_sort,
                    &mut preview_sort_source,
                    "--weakest-first",
                    "quality-asc".to_string(),
                )?;
            }
            "--source" => {
                source_ids.extend(parse_source_ids_arg(iter.next())?);
            }
            other => {
                return Err(format!("unknown scan argument: {other}").into());
            }
        }
    }
    validate_scan_output_options(&output_path, no_export)?;

    Ok(ScanCommandArgs {
        json,
        include_prompts,
        options: ScanOptions {
            limit,
            output_path,
            preview_limit,
            preview_sort,
            include_markdown: Some(include_markdown),
            write_markdown: Some(!no_export),
            persist: if no_persist { Some(false) } else { None },
            source_limit,
            source_ids: if source_ids.is_empty() {
                None
            } else {
                Some(source_ids)
            },
            ..Default::default()
        },
    })
}

fn repair_scan_options(limit: Option<usize>, count: usize, source_ids: Vec<String>) -> ScanOptions {
    ScanOptions {
        limit,
        output_path: None,
        preview_limit: Some(count),
        preview_sort: Some("quality-asc".to_string()),
        include_markdown: Some(false),
        write_markdown: Some(false),
        persist: Some(false),
        source_ids: if source_ids.is_empty() {
            None
        } else {
            Some(source_ids)
        },
        ..Default::default()
    }
}

fn parse_usize_arg(value: Option<String>, flag: &str) -> Result<usize, Box<dyn std::error::Error>> {
    let value = value.ok_or_else(|| format!("{flag} requires a value"))?;
    value
        .parse::<usize>()
        .map_err(|_| format!("{flag} requires a non-negative integer").into())
}

fn parse_positive_usize_arg(
    value: Option<String>,
    flag: &str,
) -> Result<usize, Box<dyn std::error::Error>> {
    let parsed = parse_usize_arg(value, flag)?;
    if parsed == 0 {
        return Err(format!("{flag} requires a positive integer").into());
    }
    Ok(parsed)
}

fn parse_required_arg(
    value: Option<String>,
    flag: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    let value = value.ok_or_else(|| format!("{flag} requires a value"))?;
    if value.trim().is_empty() || value.starts_with("--") {
        return Err(format!("{flag} requires a value").into());
    }
    Ok(value)
}

fn parse_source_ids_arg(value: Option<String>) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let value = parse_required_arg(value, "--source")?;
    let raw_ids = value.split(',').map(str::trim).collect::<Vec<_>>();
    if raw_ids.iter().all(|id| id.is_empty()) {
        return Err("--source requires at least one source id".into());
    }
    if raw_ids.iter().any(|id| id.is_empty()) {
        return Err("--source cannot include empty values".into());
    }
    let ids = raw_ids.into_iter().map(str::to_string).collect::<Vec<_>>();
    let known_ids = source_specs()
        .into_iter()
        .map(|source| source.id)
        .collect::<Vec<_>>();
    let unknown_ids = ids
        .iter()
        .filter(|id| !known_ids.contains(&id.as_str()))
        .cloned()
        .collect::<Vec<_>>();
    if !unknown_ids.is_empty() {
        return Err(format!("unknown source id: {}", unknown_ids.join(", ")).into());
    }
    Ok(ids)
}

fn parse_preview_sort_arg(value: Option<String>) -> Result<String, Box<dyn std::error::Error>> {
    let value = parse_required_arg(value, "--preview-sort")?;
    match value.trim() {
        "latest" => Ok("latest".to_string()),
        "quality-asc" | "quality_asc" | "weakest" => Ok("quality-asc".to_string()),
        "quality-desc" | "quality_desc" | "strongest" => Ok("quality-desc".to_string()),
        other => Err(format!(
            "--preview-sort must be one of latest, quality-asc, quality-desc; got {other}"
        )
        .into()),
    }
}

fn validate_scan_output_options(
    output_path: &Option<String>,
    no_export: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    if no_export && output_path.is_some() {
        return Err("--output cannot be used with --no-export".into());
    }
    Ok(())
}

fn set_preview_sort(
    preview_sort: &mut Option<String>,
    preview_sort_source: &mut Option<&'static str>,
    source: &'static str,
    value: String,
) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(existing) = preview_sort_source {
        return Err(format!("{source} cannot be combined with {existing}").into());
    }
    *preview_sort = Some(value);
    *preview_sort_source = Some(source);
    Ok(())
}

fn collect_prompt_arg(args: Vec<String>) -> Result<String, Box<dyn std::error::Error>> {
    let prompt = if args.is_empty() {
        let mut buf = String::new();
        std::io::Read::read_to_string(&mut std::io::stdin(), &mut buf)?;
        buf
    } else {
        let mut iter = args.into_iter();
        let mut prompt = None;
        while let Some(arg) = iter.next() {
            match arg.as_str() {
                "--prompt" => prompt = Some(parse_required_arg(iter.next(), "--prompt")?),
                other => return Err(format!("unknown improve argument: {other}").into()),
            }
        }
        prompt.unwrap_or_default()
    };

    if prompt.trim().is_empty() {
        return Err("improve requires a non-empty prompt".into());
    }
    Ok(prompt)
}

fn take_flag(args: &mut Vec<String>, flag: &str) -> bool {
    let mut found = false;
    args.retain(|arg| {
        if arg == flag {
            found = true;
            false
        } else {
            true
        }
    });
    found
}

fn json_prompt_preview(
    prompts: &[PromptRecord],
    include_prompts: bool,
    warnings: &mut Vec<String>,
) -> Vec<PromptRecord> {
    if !include_prompts {
        return Vec::new();
    }
    if prompts.len() > MAX_JSON_PROMPT_PREVIEW {
        warnings.push(format!(
            "Prompt stdout preview capped at {MAX_JSON_PROMPT_PREVIEW}; lower --preview-limit for exact stdout previews."
        ));
    }
    prompts
        .iter()
        .take(MAX_JSON_PROMPT_PREVIEW)
        .map(redacted_prompt_record)
        .collect()
}

fn redacted_prompt_record(prompt: &PromptRecord) -> PromptRecord {
    let mut prompt = prompt.clone();
    prompt.text = redact_sensitive_text(&prompt.text);
    prompt
}

fn repair_prompt_record(prompt: &PromptRecord) -> PromptRecord {
    let mut prompt = prompt.clone();
    prompt.text = "[REDACTED_PROMPT_TEXT]".to_string();
    prompt
}

fn repair_json_entry(
    prompt: &PromptRecord,
    recommendation: serde_json::Value,
) -> serde_json::Value {
    serde_json::json!({
        "prompt": repair_prompt_record(prompt),
        "recommendation": recommendation
    })
}

fn bounded_count(requested: usize, max: usize, label: &str, warnings: &mut Vec<String>) -> usize {
    if requested > max {
        warnings.push(format!(
            "{label} count capped at {max}; lower --count for exact repair batches."
        ));
        max
    } else {
        requested
    }
}

fn print_help() {
    println!("{}", help_text());
}

fn help_text() -> &'static str {
    "PromptVault CLI\n\nCommands:\n  sources [--json]\n  plan [--source ID[,ID...]] [--json]\n  import-batch --source ID [--files N>0] [--reset] [--json]\n  scan [--source ID[,ID...]] [--limit N>0] [--source-limit N>0] [--output PATH] [--preview-limit N>=0] [--preview-sort latest|quality-asc|quality-desc | --weakest-first] [--include-prompts] [--include-markdown] [--no-export] [--no-persist] [--json]\n  improve [--json] [--local] --prompt TEXT\n  improve [--json] [--local] < prompt.txt\n  work-report [--limit N>0] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--json]\n  work-log-coverage [--json]\n  work-log-candidates [--limit N>0] [--json]\n  work-log-extract [--limit N>0] [--database PATH] [--save] [--ai] [--json]\n  work-log-items [--limit N>0] [--database PATH] [--date YYYY-MM-DD] [--project NAME] [--json]\n  work-summary [--limit N>0] [--session-limit N>0] [--summary-limit N>0] [--database PATH] [--refresh-session-index] [--save-snapshot] [--include-extractions] [--extraction-limit N>0] [--extraction-ai] [--ai] [--json]\n  work-summary-snapshots [--limit N>0] [--database PATH] [--date YYYY-MM-DD] [--project NAME] [--json]\n  repair [--json] [--source ID[,ID...]] [--limit N>0] [--count N>0]\n  serve [--addr 127.0.0.1:5174]\n\nRules:\n  plan inventories matching source files without reading prompt bodies.\n  import-batch persists one resumable source slice and updates its DB cursor.\n  --source-limit caps prompts read from each selected source while --limit still caps the full scan.\n  --no-persist keeps scan results out of the PromptVault database.\n  work-report reads project progress logs and groups slice work by date and project.\n  work-log-coverage lists parsed and unparsed project progress logs by project.\n  work-log-candidates prepares unparsed progress logs as redacted AI extraction candidates.\n  work-log-extract validates AI extraction proposals before they can become dated work items; --save persists accepted dated proposals to SQLite; --ai uses configured OpenAI/GLM providers with local fallback.\n  work-log-items lists saved accepted AI extraction rows by project and date without reading raw progress logs.\n  work-report stores only sanitized session evidence in a local index; use --refresh-session-index to rescan raw sessions.\n  work-report session evidence is bounded by --session-limit.\n  work-summary builds project/date summaries with citation IDs; --include-extractions merges accepted AI work-log proposals into the summary preview; --save-snapshot stores the generated summary in SQLite; --ai uses configured OpenAI/GLM providers with local fallback.\n  work-summary-snapshots lists saved daily/project summary snapshots without raw session bodies.\n  work-summary-snapshots --date and --project filter saved rows by nested summary evidence.\n  --output cannot be combined with --no-export.\n  Use only one preview sort selector: --preview-sort or --weakest-first.\n  repair --count is capped at 10.\n  repair scans are side-effect-free and do not update the PromptVault database.\n  serve exposes local browser-bridge endpoints for cmux/in-app browser QA, including stored prompts, prompt facets, scan cancellation/progress, saved import cursors, and import activity."
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

#[derive(serde::Deserialize)]
struct PlanBridgePayload {
    options: Option<ScanPlanOptions>,
}

#[derive(serde::Deserialize)]
struct ImportBatchBridgePayload {
    options: ImportBatchOptions,
}

#[derive(serde::Deserialize)]
struct ImportStatesBridgePayload {
    options: Option<ImportStatesOptions>,
}

#[derive(serde::Deserialize)]
struct ImportEventsBridgePayload {
    options: Option<ImportEventsOptions>,
}

#[derive(serde::Deserialize)]
struct StoredPromptFacetsBridgePayload {
    options: Option<StoredPromptFacetsOptions>,
}

#[derive(serde::Deserialize)]
struct StoredPromptsBridgePayload {
    options: Option<StoredPromptsOptions>,
}

#[derive(serde::Deserialize)]
struct ScanBridgePayload {
    options: Option<ScanOptions>,
}

#[derive(serde::Deserialize)]
struct CancelScanBridgePayload {
    options: CancelScanOptions,
}

#[derive(serde::Deserialize)]
struct ScanProgressBridgePayload {
    options: ScanProgressOptions,
}

#[derive(serde::Deserialize)]
struct ImproveBridgePayload {
    request: ImproveRequest,
}

#[derive(serde::Deserialize, Default)]
struct ProjectWorkSummaryBridgeOptions {
    limit: Option<usize>,
    session_limit: Option<usize>,
    database_path: Option<String>,
    refresh_session_index: Option<bool>,
    summary_limit: Option<usize>,
    ai: Option<bool>,
    save_snapshot: Option<bool>,
    include_extractions: Option<bool>,
    extraction_limit: Option<usize>,
    extraction_ai: Option<bool>,
}

#[derive(serde::Deserialize)]
struct ProjectWorkSummaryBridgePayload {
    options: Option<ProjectWorkSummaryBridgeOptions>,
}

#[derive(serde::Deserialize)]
struct ProjectWorkLogCandidatesBridgePayload {
    options: Option<ProjectWorkLogExtractionCandidatesOptions>,
}

#[derive(serde::Deserialize)]
struct ProjectWorkLogExtractionBridgePayload {
    options: Option<ProjectWorkLogExtractionProposalsOptions>,
}

#[derive(serde::Deserialize)]
struct ProjectWorkLogItemsBridgePayload {
    options: Option<ProjectWorkLogExtractionItemsOptions>,
}

#[derive(serde::Deserialize, Default)]
struct ProjectWorkSummarySnapshotsBridgeOptions {
    database_path: Option<String>,
    limit: Option<usize>,
    date: Option<String>,
    project: Option<String>,
}

#[derive(serde::Deserialize)]
struct ProjectWorkSummarySnapshotsBridgePayload {
    options: Option<ProjectWorkSummarySnapshotsBridgeOptions>,
}

impl ProjectWorkSummaryBridgeOptions {
    fn into_project_work_summary_options(self) -> ProjectWorkSummaryOptions {
        ProjectWorkSummaryOptions {
            report: ProjectWorkReportOptions {
                limit: self.limit,
                session_limit: self.session_limit,
                database_path: self.database_path,
                refresh_session_index: self.refresh_session_index,
            },
            summary_limit: self.summary_limit,
            force_local: Some(!self.ai.unwrap_or(false)),
            save_snapshot: self.save_snapshot,
            include_extractions: self.include_extractions,
            extraction_limit: self.extraction_limit,
            extraction_ai: self.extraction_ai,
        }
    }
}

impl ProjectWorkSummarySnapshotsBridgeOptions {
    fn into_project_work_summary_snapshots_options(self) -> ProjectWorkSummarySnapshotsOptions {
        ProjectWorkSummarySnapshotsOptions {
            database_path: self.database_path,
            limit: self.limit,
            date: self.date,
            project: self.project,
        }
    }
}

struct HttpRequest {
    method: String,
    path: String,
    body: String,
}

fn serve_bridge(addr: &str) -> Result<(), Box<dyn std::error::Error>> {
    let listener = TcpListener::bind(addr)?;
    println!("PromptVault browser bridge listening on http://{addr}");
    println!("database: {}", default_database_path().display());
    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                std::thread::spawn(move || {
                    if let Err(err) = handle_bridge_client(stream) {
                        eprintln!("promptvault bridge request error: {err}");
                    }
                });
            }
            Err(err) => eprintln!("promptvault bridge accept error: {err}"),
        }
    }
    Ok(())
}

fn handle_bridge_client(mut stream: TcpStream) -> Result<(), Box<dyn std::error::Error>> {
    let request = read_http_request(&stream)?;
    if request.method == "OPTIONS" {
        return write_response(&mut stream, 204, "text/plain", "");
    }

    match handle_bridge_route(&mut stream, &request) {
        Ok(()) => Ok(()),
        Err(err) => write_response(&mut stream, 400, "text/plain", &err.to_string()),
    }
}

fn handle_bridge_route(
    stream: &mut TcpStream,
    request: &HttpRequest,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = request
        .path
        .split_once('?')
        .map(|(path, _)| path)
        .unwrap_or(request.path.as_str());
    match (request.method.as_str(), path) {
        ("GET", "/api/health") => {
            let body = serde_json::json!({
                "ok": true,
                "database_path": default_database_path().display().to_string()
            });
            write_json_response(stream, 200, &body)
        }
        ("POST", "/api/plan") => {
            let payload = serde_json::from_str::<PlanBridgePayload>(&request.body)?;
            let result = build_scan_plan(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/import-batch") => {
            let payload = serde_json::from_str::<ImportBatchBridgePayload>(&request.body)?;
            let result = run_import_batch(payload.options)?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/import-states") => {
            let payload = serde_json::from_str::<ImportStatesBridgePayload>(&request.body)?;
            let result = run_list_import_states(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/import-events") => {
            let payload = serde_json::from_str::<ImportEventsBridgePayload>(&request.body)?;
            let result = run_list_import_events(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/prompt-facets") => {
            let payload = serde_json::from_str::<StoredPromptFacetsBridgePayload>(&request.body)?;
            let result = run_list_stored_prompt_facets(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/prompts") => {
            let payload = serde_json::from_str::<StoredPromptsBridgePayload>(&request.body)?;
            let result = run_load_stored_prompts(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/scan") => {
            let payload = serde_json::from_str::<ScanBridgePayload>(&request.body)?;
            let result = run_scan(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/scan/cancel") => {
            let payload = serde_json::from_str::<CancelScanBridgePayload>(&request.body)?;
            let result = cancel_scan_run(payload.options)?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/scan/progress") => {
            let payload = serde_json::from_str::<ScanProgressBridgePayload>(&request.body)?;
            let result = promptvault_lib::scan_progress_run(payload.options)?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/improve") => {
            let payload = serde_json::from_str::<ImproveBridgePayload>(&request.body)?;
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()?;
            let result = runtime.block_on(improve_prompt_inner(payload.request))?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-summary") => {
            let payload = serde_json::from_str::<ProjectWorkSummaryBridgePayload>(&request.body)?;
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()?;
            let options = payload
                .options
                .unwrap_or_default()
                .into_project_work_summary_options();
            let result = runtime.block_on(run_project_work_summary(options))?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-summary-snapshots") => {
            let payload =
                serde_json::from_str::<ProjectWorkSummarySnapshotsBridgePayload>(&request.body)?;
            let options = payload
                .options
                .unwrap_or_default()
                .into_project_work_summary_snapshots_options();
            let result = run_list_project_work_summary_snapshots(options)?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-log-coverage") => {
            let result = run_project_work_log_coverage()?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-log-candidates") => {
            let payload =
                serde_json::from_str::<ProjectWorkLogCandidatesBridgePayload>(&request.body)?;
            let result =
                run_project_work_log_extraction_candidates(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-log-extract") => {
            let payload =
                serde_json::from_str::<ProjectWorkLogExtractionBridgePayload>(&request.body)?;
            let runtime = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()?;
            let result = runtime.block_on(run_project_work_log_extraction_proposals(
                payload.options.unwrap_or_default(),
            ))?;
            write_json_response(stream, 200, &result)
        }
        ("POST", "/api/work-log-items") => {
            let payload = serde_json::from_str::<ProjectWorkLogItemsBridgePayload>(&request.body)?;
            let result =
                run_list_project_work_log_extraction_items(payload.options.unwrap_or_default())?;
            write_json_response(stream, 200, &result)
        }
        _ => write_response(stream, 404, "text/plain", "Not found"),
    }
}

fn read_http_request(stream: &TcpStream) -> Result<HttpRequest, Box<dyn std::error::Error>> {
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    reader.read_line(&mut request_line)?;
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default().to_string();
    let path = parts.next().unwrap_or_default().to_string();
    if method.is_empty() || path.is_empty() {
        return Err("invalid HTTP request line".into());
    }

    let mut content_length = 0usize;
    loop {
        let mut line = String::new();
        reader.read_line(&mut line)?;
        let trimmed = line.trim_end();
        if trimmed.is_empty() {
            break;
        }
        if let Some((key, value)) = trimmed.split_once(':') {
            if key.eq_ignore_ascii_case("content-length") {
                content_length = value.trim().parse()?;
            }
        }
    }

    let mut body = vec![0_u8; content_length];
    if content_length > 0 {
        reader.read_exact(&mut body)?;
    }

    Ok(HttpRequest {
        method,
        path,
        body: String::from_utf8(body)?,
    })
}

fn write_json_response<T: serde::Serialize>(
    stream: &mut TcpStream,
    status: u16,
    value: &T,
) -> Result<(), Box<dyn std::error::Error>> {
    write_response(
        stream,
        status,
        "application/json",
        &serde_json::to_string(value)?,
    )
}

fn write_response(
    stream: &mut TcpStream,
    status: u16,
    content_type: &str,
    body: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let reason = match status {
        200 => "OK",
        204 => "No Content",
        400 => "Bad Request",
        404 => "Not Found",
        500 => "Internal Server Error",
        _ => "OK",
    };
    write!(
        stream,
        "HTTP/1.1 {status} {reason}\r\n\
         Content-Type: {content_type}; charset=utf-8\r\n\
         Content-Length: {}\r\n\
         Access-Control-Allow-Origin: *\r\n\
         Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n\
         Access-Control-Allow-Headers: Content-Type\r\n\
         Connection: close\r\n\r\n{}",
        body.len(),
        body
    )?;
    stream.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn json_prompt_preview_is_opt_in_and_capped() {
        let prompts = (0..30)
            .map(|idx| PromptRecord {
                id: idx.to_string(),
                source: "test".to_string(),
                session_id: idx.to_string(),
                path: "/tmp/test.jsonl".to_string(),
                timestamp: None,
                cwd: None,
                text: format!("prompt {idx}"),
                word_count: 2,
                char_count: 8,
                hash: idx.to_string(),
                risk_flags: Vec::new(),
                quality: promptvault_lib::PromptQuality {
                    score: 50,
                    band: "weak".to_string(),
                    missing: Vec::new(),
                    suggestions: Vec::new(),
                },
            })
            .collect::<Vec<_>>();

        let mut warnings = Vec::new();
        assert!(json_prompt_preview(&prompts, false, &mut warnings).is_empty());
        assert!(warnings.is_empty());

        let preview = json_prompt_preview(&prompts, true, &mut warnings);
        assert_eq!(preview.len(), MAX_JSON_PROMPT_PREVIEW);
        assert_eq!(preview[0].text, "prompt 0");
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn json_prompt_preview_redacts_long_token_text() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let prompts = vec![PromptRecord {
            id: "secret".to_string(),
            source: "test".to_string(),
            session_id: "secret".to_string(),
            path: "/tmp/test.jsonl".to_string(),
            timestamp: None,
            cwd: None,
            text: synthetic_token,
            word_count: 1,
            char_count: 80,
            hash: "secret".to_string(),
            risk_flags: vec!["long_base64_like_token".to_string()],
            quality: promptvault_lib::PromptQuality {
                score: 10,
                band: "weak".to_string(),
                missing: Vec::new(),
                suggestions: Vec::new(),
            },
        }];

        let mut warnings = Vec::new();
        let preview = json_prompt_preview(&prompts, true, &mut warnings);

        assert_eq!(preview.len(), 1);
        assert_eq!(preview[0].text, "[REDACTED_LONG_BASE64_LIKE_TOKEN]");
    }

    #[test]
    fn repair_json_entry_redacts_prompt_text() {
        let synthetic_token = format!("sk-{}", "A".repeat(60));
        let prompt = PromptRecord {
            id: "secret".to_string(),
            source: "test".to_string(),
            session_id: "secret".to_string(),
            path: "/tmp/test.jsonl".to_string(),
            timestamp: None,
            cwd: None,
            text: synthetic_token.clone(),
            word_count: 1,
            char_count: 80,
            hash: "secret".to_string(),
            risk_flags: vec!["long_base64_like_token".to_string()],
            quality: promptvault_lib::PromptQuality {
                score: 10,
                band: "weak".to_string(),
                missing: Vec::new(),
                suggestions: Vec::new(),
            },
        };

        let entry = repair_json_entry(
            &prompt,
            serde_json::json!({
                "revised_prompt": "safe prompt"
            }),
        );

        assert_eq!(
            entry
                .pointer("/prompt/text")
                .and_then(serde_json::Value::as_str),
            Some("[REDACTED_PROMPT_TEXT]")
        );
        assert_eq!(prompt.text, synthetic_token);
    }

    #[test]
    fn bounded_count_caps_repair_batches() {
        let mut warnings = Vec::new();
        assert_eq!(
            bounded_count(3, MAX_REPAIR_COUNT, "Repair", &mut warnings),
            3
        );
        assert!(warnings.is_empty());

        assert_eq!(
            bounded_count(99, MAX_REPAIR_COUNT, "Repair", &mut warnings),
            MAX_REPAIR_COUNT
        );
        assert_eq!(warnings.len(), 1);
    }

    #[test]
    fn explicit_help_commands_are_recognized() {
        assert!(is_help_command("help"));
        assert!(is_help_command("-h"));
        assert!(is_help_command("--help"));
        assert!(!is_help_command("scna"));
    }

    #[test]
    fn bridge_returns_http_400_for_route_errors() {
        let response = bridge_response_for(
            "/api/scan",
            r#"{"options":{"limit":0,"preview_limit":0,"include_markdown":false,"write_markdown":false,"persist":false}}"#,
        );

        assert!(response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(response.contains("scan limit requires a positive integer"));
        assert!(response.contains("Access-Control-Allow-Origin: *"));
    }

    #[test]
    fn bridge_routes_work_summary_validation_errors() {
        let response = bridge_response_for(
            "/api/work-summary",
            r#"{"options":{"limit":1,"session_limit":1,"summary_limit":0}}"#,
        );

        assert!(response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(response.contains("work-summary summary_limit requires a positive integer"));
        assert!(response.contains("Access-Control-Allow-Origin: *"));
    }

    #[test]
    fn bridge_routes_work_summary_snapshot_validation_errors() {
        let response =
            bridge_response_for("/api/work-summary-snapshots", r#"{"options":{"limit":0}}"#);

        assert!(response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(response.contains("work-summary snapshot limit requires a positive integer"));
        assert!(response.contains("Access-Control-Allow-Origin: *"));

        let date_response = bridge_response_for(
            "/api/work-summary-snapshots",
            r#"{"options":{"date":"   "}}"#,
        );

        assert!(date_response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(
            date_response.contains("work-summary snapshot date filter requires a non-empty value")
        );
    }

    #[test]
    fn bridge_routes_work_log_item_validation_errors() {
        let response = bridge_response_for("/api/work-log-items", r#"{"options":{"limit":0}}"#);

        assert!(response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(response.contains("work-log item limit requires a positive integer"));
        assert!(response.contains("Access-Control-Allow-Origin: *"));

        let project_response =
            bridge_response_for("/api/work-log-items", r#"{"options":{"project":"   "}}"#);

        assert!(project_response.starts_with("HTTP/1.1 400 Bad Request"));
        assert!(project_response.contains("work-log item project filter requires a non-empty value"));
    }

    fn bridge_response_for(path: &str, body: &str) -> String {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").expect("bind listener");
        let addr = listener.local_addr().expect("listener addr");
        let handle = std::thread::spawn(move || {
            let (stream, _) = listener.accept().expect("accept bridge client");
            handle_bridge_client(stream).expect("handle bridge request");
        });

        let mut client = std::net::TcpStream::connect(addr).expect("connect bridge client");
        write!(
            client,
            "POST {path} HTTP/1.1\r\n\
             Host: 127.0.0.1\r\n\
             Content-Type: application/json\r\n\
             Content-Length: {}\r\n\
             Connection: close\r\n\r\n{}",
            body.len(),
            body
        )
        .expect("write bridge request");
        client
            .shutdown(std::net::Shutdown::Write)
            .expect("shutdown bridge client");

        let mut response = String::new();
        client
            .read_to_string(&mut response)
            .expect("read bridge response");
        handle.join().expect("join bridge thread");
        response
    }

    #[test]
    fn help_text_documents_cli_validation_rules() {
        let help = help_text();
        assert!(help.contains("plan [--source ID[,ID...]] [--json]"));
        assert!(help.contains("plan inventories matching source files"));
        assert!(help.contains("import-batch --source ID [--files N>0]"));
        assert!(help.contains("import-batch persists one resumable source slice"));
        assert!(help.contains(
            "work-report [--limit N>0] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--json]"
        ));
        assert!(help.contains("work-log-coverage [--json]"));
        assert!(help.contains("work-log-candidates [--limit N>0] [--json]"));
        assert!(help.contains(
            "work-log-extract [--limit N>0] [--database PATH] [--save] [--ai] [--json]"
        ));
        assert!(help.contains(
            "work-log-items [--limit N>0] [--database PATH] [--date YYYY-MM-DD] [--project NAME] [--json]"
        ));
        assert!(help.contains(
            "work-summary [--limit N>0] [--session-limit N>0] [--summary-limit N>0] [--database PATH] [--refresh-session-index] [--save-snapshot] [--include-extractions] [--extraction-limit N>0] [--extraction-ai] [--ai] [--json]"
        ));
        assert!(help.contains(
            "work-summary-snapshots [--limit N>0] [--database PATH] [--date YYYY-MM-DD] [--project NAME] [--json]"
        ));
        assert!(help.contains("work-report reads project progress logs"));
        assert!(help.contains("work-log-coverage lists parsed and unparsed"));
        assert!(help.contains("work-log-candidates prepares unparsed progress logs"));
        assert!(help.contains("work-log-extract validates AI extraction proposals"));
        assert!(help.contains("--save persists accepted dated proposals to SQLite"));
        assert!(help.contains("work-log-items lists saved accepted AI extraction rows"));
        assert!(help.contains("work-report stores only sanitized session evidence"));
        assert!(help.contains("--refresh-session-index to rescan raw sessions"));
        assert!(help.contains("work-summary builds project/date summaries with citation IDs"));
        assert!(help.contains("--include-extractions merges accepted AI work-log proposals"));
        assert!(help.contains("--save-snapshot stores the generated summary in SQLite"));
        assert!(help.contains("work-summary-snapshots lists saved daily/project summary snapshots"));
        assert!(help.contains("--ai uses configured OpenAI/GLM providers"));
        assert!(help.contains("--limit N>0"));
        assert!(help.contains("--source-limit N>0"));
        assert!(help.contains("--source-limit caps prompts read from each selected source"));
        assert!(help.contains("--no-persist"));
        assert!(help.contains("--no-persist keeps scan results out of the PromptVault database"));
        assert!(help.contains("--count N>0"));
        assert!(help.contains("--output cannot be combined with --no-export"));
        assert!(help.contains("--preview-sort or --weakest-first"));
        assert!(help.contains("repair --count is capped at 10"));
        assert!(help.contains("repair scans are side-effect-free"));
        assert!(help.contains("serve [--addr 127.0.0.1:5174]"));
        assert!(help.contains("browser-bridge endpoints"));
    }

    #[test]
    fn parse_scan_args_supports_no_persist_for_side_effect_free_scans() {
        let parsed = parse_scan_args(vec![
            "--source".to_string(),
            "project-progress-logs".to_string(),
            "--limit".to_string(),
            "3".to_string(),
            "--preview-limit".to_string(),
            "0".to_string(),
            "--no-export".to_string(),
            "--no-persist".to_string(),
            "--json".to_string(),
        ])
        .expect("parse scan args");

        assert!(parsed.json);
        assert!(!parsed.include_prompts);
        assert_eq!(parsed.options.limit, Some(3));
        assert_eq!(parsed.options.preview_limit, Some(0));
        assert_eq!(parsed.options.include_markdown, Some(false));
        assert_eq!(parsed.options.write_markdown, Some(false));
        assert_eq!(parsed.options.persist, Some(false));
        assert_eq!(
            parsed.options.source_ids,
            Some(vec!["project-progress-logs".to_string()])
        );
    }

    #[test]
    fn repair_scan_options_do_not_persist_prompt_records() {
        let options = repair_scan_options(Some(7), 3, vec!["project-progress-logs".to_string()]);

        assert_eq!(options.limit, Some(7));
        assert_eq!(options.preview_limit, Some(3));
        assert_eq!(options.preview_sort, Some("quality-asc".to_string()));
        assert_eq!(options.write_markdown, Some(false));
        assert_eq!(options.persist, Some(false));
        assert_eq!(
            options.source_ids,
            Some(vec!["project-progress-logs".to_string()])
        );
    }

    #[test]
    fn reject_extra_args_reports_first_unknown_argument() {
        assert!(reject_extra_args(&[], "sources").is_ok());
        let err = reject_extra_args(&["--bogus".to_string()], "sources").expect_err("unknown arg");
        assert!(err
            .to_string()
            .contains("unknown sources argument: --bogus"));
    }

    #[test]
    fn collect_prompt_arg_rejects_empty_prompt_flag() {
        assert!(collect_prompt_arg(vec!["--prompt".to_string(), "".to_string()]).is_err());
        assert!(collect_prompt_arg(vec!["--prompt".to_string(), "  ".to_string()]).is_err());
        assert!(collect_prompt_arg(vec!["--prompt".to_string(), "--bogus".to_string()]).is_err());
        assert_eq!(
            collect_prompt_arg(vec!["--prompt".to_string(), "make better".to_string()])
                .expect("non-empty prompt"),
            "make better"
        );
    }

    #[test]
    fn parse_usize_arg_rejects_missing_or_invalid_values() {
        assert_eq!(
            parse_usize_arg(Some("5".to_string()), "--limit").expect("valid usize"),
            5
        );
        assert!(parse_usize_arg(None, "--limit").is_err());
        assert!(parse_usize_arg(Some("nope".to_string()), "--limit").is_err());
    }

    #[test]
    fn parse_positive_usize_arg_rejects_zero() {
        assert_eq!(
            parse_positive_usize_arg(Some("5".to_string()), "--limit").expect("positive usize"),
            5
        );
        assert!(parse_positive_usize_arg(Some("0".to_string()), "--limit").is_err());
        assert!(parse_positive_usize_arg(Some("0".to_string()), "--count").is_err());
        assert!(parse_positive_usize_arg(Some("nope".to_string()), "--limit").is_err());
    }

    #[test]
    fn parse_required_args_reject_missing_flag_like_or_empty_values() {
        assert_eq!(
            parse_required_arg(Some("/tmp/out.md".to_string()), "--output").expect("path"),
            "/tmp/out.md"
        );
        assert!(parse_required_arg(None, "--output").is_err());
        assert!(parse_required_arg(Some("".to_string()), "--output").is_err());
        assert!(parse_required_arg(Some("--limit".to_string()), "--output").is_err());
    }

    #[test]
    fn parse_source_ids_rejects_empty_values() {
        assert_eq!(
            parse_source_ids_arg(Some("codex, claude-code-projects".to_string()))
                .expect("source ids"),
            vec!["codex".to_string(), "claude-code-projects".to_string()]
        );
        assert!(parse_source_ids_arg(None).is_err());
        assert!(parse_source_ids_arg(Some(",".to_string())).is_err());
        assert!(parse_source_ids_arg(Some("codex,".to_string())).is_err());
        assert!(parse_source_ids_arg(Some("codex,,claude-code-projects".to_string())).is_err());
        assert!(parse_source_ids_arg(Some("--limit".to_string())).is_err());
        assert!(parse_source_ids_arg(Some("missing-source".to_string())).is_err());
    }

    #[test]
    fn parse_preview_sort_rejects_unknown_values() {
        assert_eq!(
            parse_preview_sort_arg(Some("latest".to_string())).expect("latest"),
            "latest"
        );
        assert_eq!(
            parse_preview_sort_arg(Some("quality_asc".to_string())).expect("underscore alias"),
            "quality-asc"
        );
        assert_eq!(
            parse_preview_sort_arg(Some("strongest".to_string())).expect("strongest alias"),
            "quality-desc"
        );
        assert!(parse_preview_sort_arg(None).is_err());
        assert!(parse_preview_sort_arg(Some("nonsense".to_string())).is_err());
        assert!(parse_preview_sort_arg(Some("--limit".to_string())).is_err());
    }

    #[test]
    fn validate_scan_output_options_rejects_no_export_output() {
        assert!(validate_scan_output_options(&None, true).is_ok());
        assert!(validate_scan_output_options(&Some("/tmp/out.md".to_string()), false).is_ok());
        assert!(validate_scan_output_options(&Some("/tmp/out.md".to_string()), true).is_err());
    }

    #[test]
    fn set_preview_sort_rejects_multiple_sort_options() {
        let mut preview_sort = None;
        let mut preview_sort_source = None;

        set_preview_sort(
            &mut preview_sort,
            &mut preview_sort_source,
            "--weakest-first",
            "quality-asc".to_string(),
        )
        .expect("first sort option");
        assert_eq!(preview_sort, Some("quality-asc".to_string()));

        let err = set_preview_sort(
            &mut preview_sort,
            &mut preview_sort_source,
            "--preview-sort",
            "latest".to_string(),
        )
        .expect_err("second sort option should fail");
        assert!(err
            .to_string()
            .contains("--preview-sort cannot be combined with --weakest-first"));
    }
}
