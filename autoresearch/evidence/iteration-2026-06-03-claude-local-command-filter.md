# AutoResearch Iteration: Claude Local-Command Filter

Date: 2026-06-03

## Change

- Added a focused Rust regression test for Claude project local-command output wrappers.
- Updated `strip_injected_context` to drop `<local-command-...>` wrapper text before record insertion.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-local-command-filter.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-local-command-filter.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test parse_claude_project_jsonl_skips_local_command_output_records` failed with 2 records instead of 1.
- GREEN: `cargo test parse_claude_project_jsonl_skips_local_command_output_records` passed.
- Full gate: `npm run check` passed.
- Post-fix smoke: Claude projects weakest scan returned `containsLocalCommand=false` and `containsCommandWrapper=false`.

## Result

Claude local-command stdout/stderr-style wrappers no longer pollute weak-prompt previews or repair queues.
