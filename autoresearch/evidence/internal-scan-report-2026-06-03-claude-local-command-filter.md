# Internal Scan Report: Claude Local-Command Filter

Generated: 2026-06-03T20:55:19+0900

## Local Evidence

After command wrapper filtering, a small Claude projects weakest scan still showed `<local-command-stdout>Set model to ...</local-command-stdout>` in the preview. This is command output, not a user-authored prompt.

## RED

Command:

```bash
cargo test parse_claude_project_jsonl_skips_local_command_output_records
```

Result: FAIL as expected. The focused test collected 2 records instead of the expected 1.

## GREEN

Command:

```bash
cargo test parse_claude_project_jsonl_skips_local_command_output_records
```

Result: PASS after `strip_injected_context` dropped `<local-command-...>` wrapper text to empty.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 38 Rust library tests, 13 CLI tests, doc-tests, and strict clippy.

## Post-Fix Smoke

Command:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source claude-code-projects --limit 80 --preview-limit 10 --weakest-first --include-prompts --no-export --json
```

Result: PASS. The summary returned `containsLocalCommand=false` and `containsCommandWrapper=false` with the expected configured-limit warning.

## Commit

Code commit: `7c4bf24168587a812a250dda476c2029d75fba14`
