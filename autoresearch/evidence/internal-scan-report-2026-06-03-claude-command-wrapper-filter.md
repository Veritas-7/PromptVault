# Internal Scan Report: Claude Command Wrapper Filter

Generated: 2026-06-03T20:52:07+0900

## Local Evidence

A small Claude projects weakest scan showed repeated command wrapper records such as `<command-name>/clear</command-name>` in weak-prompt previews. These are CLI command events, not user-authored prompts.

## RED

Command:

```bash
cargo test parse_claude_project_jsonl_skips_command_wrapper_records
```

Result: FAIL as expected. The focused test collected 2 records instead of the expected 1.

## GREEN

Command:

```bash
cargo test parse_claude_project_jsonl_skips_command_wrapper_records
```

Result: PASS after `strip_injected_context` dropped command wrapper text to empty.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 37 Rust library tests, 13 CLI tests, doc-tests, and strict clippy.

## Post-Fix Smoke

Command:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source claude-code-projects --limit 80 --preview-limit 10 --weakest-first --include-prompts --no-export --json
```

Result: PASS. The summary returned `containsCommandWrapper=false` with the expected configured-limit warning.

## Commit

Code commit: `4fcb0ee41599f59739ae769a47a999f7c658231b`
