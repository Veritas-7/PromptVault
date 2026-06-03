use promptvault_lib::{
    improve_prompt_inner, run_scan, source_specs, ImproveRequest, PromptRecord, ScanOptions,
};

const MAX_JSON_PROMPT_PREVIEW: usize = 25;

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
                        limit = iter.next().and_then(|value| value.parse::<usize>().ok());
                    }
                    "--output" => {
                        output_path = iter.next();
                    }
                    "--preview-limit" => {
                        preview_limit = iter.next().and_then(|value| value.parse::<usize>().ok());
                    }
                    "--preview-sort" => {
                        preview_sort = iter.next();
                    }
                    "--weakest-first" => {
                        preview_sort = Some("quality-asc".to_string());
                    }
                    "--source" => {
                        if let Some(value) = iter.next() {
                            source_ids.extend(
                                value
                                    .split(',')
                                    .map(str::trim)
                                    .filter(|id| !id.is_empty())
                                    .map(str::to_string),
                            );
                        }
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
            let prompt = collect_prompt_arg(args)?;
            let result = improve_prompt_inner(ImproveRequest {
                prompt,
                context: None,
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
        _ => print_help(),
    }
    Ok(())
}

fn collect_prompt_arg(args: Vec<String>) -> Result<String, Box<dyn std::error::Error>> {
    if args.is_empty() {
        let mut buf = String::new();
        std::io::Read::read_to_string(&mut std::io::stdin(), &mut buf)?;
        return Ok(buf);
    }

    let mut iter = args.into_iter();
    let mut prompt = None;
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--prompt" => prompt = iter.next(),
            other => return Err(format!("unknown improve argument: {other}").into()),
        }
    }
    Ok(prompt.unwrap_or_default())
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

fn print_help() {
    println!(
        "PromptVault CLI\n\nCommands:\n  sources [--json]\n  scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export] [--json]\n  improve [--json] --prompt TEXT\n  improve [--json] < prompt.txt"
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
}
