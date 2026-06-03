# Internal Scan Report: Claude Meta User Filter

Generated: 2026-06-03T20:43:54+0900

## Local Evidence

Claude project JSONL files under `/Users/wj/.claude/projects` include harness-generated rows shaped like user messages but marked `isMeta=true`, including local-command caveat content. These are not user-authored prompts.

## RED

Command:

```bash
cargo test parse_claude_project_jsonl_skips_meta_user_records
```

Result: FAIL as expected. The focused test collected 2 records instead of the expected 1.

## GREEN

Command:

```bash
cargo test parse_claude_project_jsonl_skips_meta_user_records
```

Result: PASS after `parse_claude_project_jsonl` skipped `isMeta=true` user-shaped records.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 35 Rust library tests, 13 CLI tests, doc-tests, and strict clippy.

## Commit

Code commit: `a6ca5352b52a40b01fd7a69bf5abb7271f4d9dc9`
