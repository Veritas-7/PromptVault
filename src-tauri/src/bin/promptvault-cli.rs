use promptvault_lib::{
    improve_prompt_inner, run_scan, source_specs, ImproveRequest, PromptRecord, ScanOptions,
};

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
            let json = take_flag(&mut args, "--json");
            let include_markdown = take_flag(&mut args, "--include-markdown");
            let include_prompts = take_flag(&mut args, "--include-prompts");
            let no_export = take_flag(&mut args, "--no-export");
            let mut limit = None;
            let mut output_path = None;
            let mut preview_limit = Some(0);
            let mut preview_sort = None;
            let mut source_ids = Vec::new();
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = Some(parse_usize_arg(iter.next(), "--limit")?);
                    }
                    "--output" => {
                        output_path = Some(parse_required_arg(iter.next(), "--output")?);
                    }
                    "--preview-limit" => {
                        preview_limit = Some(parse_usize_arg(iter.next(), "--preview-limit")?);
                    }
                    "--preview-sort" => {
                        preview_sort = Some(parse_preview_sort_arg(iter.next())?);
                    }
                    "--weakest-first" => {
                        preview_sort = Some("quality-asc".to_string());
                    }
                    "--source" => {
                        source_ids.extend(parse_source_ids_arg(iter.next())?);
                    }
                    other => {
                        return Err(format!("unknown scan argument: {other}").into());
                    }
                }
            }
            let result = run_scan(ScanOptions {
                limit,
                output_path,
                preview_limit,
                preview_sort,
                include_markdown: Some(include_markdown),
                write_markdown: Some(!no_export),
                source_ids: if source_ids.is_empty() {
                    None
                } else {
                    Some(source_ids)
                },
            })?;
            if json {
                let mut warnings = result.warnings.clone();
                let prompts = json_prompt_preview(&result.prompts, include_prompts, &mut warnings);
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
            println!("files: {}", result.stats.total_files);
            println!("avg_words: {:.1}", result.stats.average_words);
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
                        count = parse_usize_arg(iter.next(), "--count")?;
                    }
                    "--limit" => {
                        limit = Some(parse_usize_arg(iter.next(), "--limit")?);
                    }
                    "--source" => {
                        source_ids.extend(parse_source_ids_arg(iter.next())?);
                    }
                    other => return Err(format!("unknown repair argument: {other}").into()),
                }
            }

            let count = bounded_count(count, MAX_REPAIR_COUNT, "Repair", &mut warnings);
            let scan = run_scan(ScanOptions {
                limit,
                output_path: None,
                preview_limit: Some(count),
                preview_sort: Some("quality-asc".to_string()),
                include_markdown: Some(false),
                write_markdown: Some(false),
                source_ids: if source_ids.is_empty() {
                    None
                } else {
                    Some(source_ids)
                },
            })?;
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
                })
                .await?;
                repairs.push(serde_json::json!({
                    "prompt": prompt,
                    "recommendation": recommendation
                }));
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

fn parse_usize_arg(value: Option<String>, flag: &str) -> Result<usize, Box<dyn std::error::Error>> {
    let value = value.ok_or_else(|| format!("{flag} requires a value"))?;
    value
        .parse::<usize>()
        .map_err(|_| format!("{flag} requires a non-negative integer").into())
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
    let ids = value
        .split(',')
        .map(str::trim)
        .filter(|id| !id.is_empty())
        .map(str::to_string)
        .collect::<Vec<_>>();
    if ids.is_empty() {
        return Err("--source requires at least one source id".into());
    }
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
                "--prompt" => prompt = iter.next(),
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

fn json_prompt_preview<'a>(
    prompts: &'a [PromptRecord],
    include_prompts: bool,
    warnings: &mut Vec<String>,
) -> Vec<&'a PromptRecord> {
    if !include_prompts {
        return Vec::new();
    }
    if prompts.len() > MAX_JSON_PROMPT_PREVIEW {
        warnings.push(format!(
            "Prompt stdout preview capped at {MAX_JSON_PROMPT_PREVIEW}; lower --preview-limit for exact stdout previews."
        ));
    }
    prompts.iter().take(MAX_JSON_PROMPT_PREVIEW).collect()
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
    println!(
        "PromptVault CLI\n\nCommands:\n  sources [--json]\n  scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export] [--json]\n  improve [--json] [--local] --prompt TEXT\n  improve [--json] [--local] < prompt.txt\n  repair [--json] [--source ID] [--limit N] [--count N]"
    );
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
}
