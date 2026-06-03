# AutoResearch Iteration: Claude Command Wrapper Filter

Date: 2026-06-03

## Change

- Added a focused Rust regression test for Claude project command wrapper records.
- Updated `strip_injected_context` to drop command wrapper text before record insertion.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-command-wrapper-filter.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-command-wrapper-filter.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test parse_claude_project_jsonl_skips_command_wrapper_records` failed with 2 records instead of 1.
- GREEN: `cargo test parse_claude_project_jsonl_skips_command_wrapper_records` passed.
- Full gate: `npm run check` passed.
- Post-fix smoke: Claude projects weakest scan returned `containsCommandWrapper=false`.

## Result

Claude CLI command wrappers no longer pollute weak-prompt previews or repair queues.
