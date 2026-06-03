# AutoResearch Iteration: Claude Meta User Filter

Date: 2026-06-03

## Change

- Added a focused Rust regression test for Claude project JSONL records marked `isMeta=true`.
- Updated `parse_claude_project_jsonl` to skip those harness-generated user-shaped records before extracting prompt text.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-meta-user-filter.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-claude-meta-user-filter.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test parse_claude_project_jsonl_skips_meta_user_records` failed with 2 records instead of 1.
- GREEN: `cargo test parse_claude_project_jsonl_skips_meta_user_records` passed.
- Full gate: `npm run check` passed.

## Result

Claude project scans no longer count `isMeta=true` local-command caveats as user-authored prompts, keeping prompt quality and repair views cleaner.
