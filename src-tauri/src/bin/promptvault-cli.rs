use promptvault_lib::{improve_prompt_inner, run_scan, source_specs, ImproveRequest, ScanOptions};

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
            let mut limit = None;
            let mut output_path = None;
            let mut iter = args.into_iter();
            while let Some(arg) = iter.next() {
                match arg.as_str() {
                    "--limit" => {
                        limit = iter.next().and_then(|value| value.parse::<usize>().ok());
                    }
                    "--output" => {
                        output_path = iter.next();
                    }
                    other => {
                        return Err(format!("unknown scan argument: {other}").into());
                    }
                }
            }
            let result = run_scan(ScanOptions { limit, output_path })?;
            if json {
                let summary = serde_json::json!({
                    "generated_at": result.generated_at,
                    "output_path": result.output_path,
                    "stats": result.stats,
                    "warnings": result.warnings
                });
                println!("{}", serde_json::to_string_pretty(&summary)?);
                return Ok(());
            }
            println!("PromptVault scan complete");
            println!("output: {}", result.output_path);
            println!("prompts: {}", result.stats.total_prompts);
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

fn print_help() {
    println!(
        "PromptVault CLI\n\nCommands:\n  sources [--json]\n  scan [--limit N] [--output PATH] [--json]\n  improve [--json] --prompt TEXT\n  improve [--json] < prompt.txt"
    );
}
