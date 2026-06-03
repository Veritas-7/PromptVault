# AutoResearch Iteration: Command-Only History Filter

Date: 2026-06-03

## Change

- Added a Rust regression test for Claude history command-only display records.
- Added a narrow slash command-only detector that drops `/clear`-style entries while preserving slash commands with prompt arguments.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-command-only-history-filter.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-command-only-history-filter.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test parse_claude_history_jsonl_skips_command_only_records` failed with 2 records instead of 1.
- GREEN: `cargo test parse_claude_history_jsonl_skips_command_only_records` passed.
- Full gate: `npm run check` passed.
- Post-fix smoke: Claude history weakest scan returned `commandOnlyCount=0`.

## Result

Command-only Claude history entries no longer pollute prompt history or weak-prompt repair queues.
