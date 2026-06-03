# Internal Scan Report: Command-Only History Filter

Generated: 2026-06-03T21:07:13+0900

## Local Evidence

Claude prompt history includes command-only display entries such as `/exit`, `/clear`, `/login`, and `/model`. These are operational commands, not prompt text. Slash commands with arguments, such as `/sdd ...`, remain meaningful prompts and must be preserved.

## RED

Command:

```bash
cargo test parse_claude_history_jsonl_skips_command_only_records
```

Result: FAIL as expected. The focused test collected 2 records instead of the expected 1.

## GREEN

Command:

```bash
cargo test parse_claude_history_jsonl_skips_command_only_records
```

Result: PASS after command-only slash strings were stripped to empty text.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 39 Rust library tests, 14 CLI tests, doc-tests, and strict clippy.

## Post-Fix Smoke

Command:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source claude-code-history --limit 60 --preview-limit 20 --weakest-first --include-prompts --no-export --json
```

Result: PASS. The summary returned `commandOnlyCount=0`, `containsRedaction=true`, and the expected configured-limit warning.

## Commit

Code commit: `742639db7aa65bae6f24068de0dc75ee4024d048`
