# Internal Scan Report: Source Walk Errors

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `4157774`

Code commit: `548e29c`

## Baseline

`matching_source_files` used `filter_map(Result::ok)`, which silently dropped
`WalkDir` traversal errors. If a source contained an unreadable directory, the
scan could skip it without recording a note or warning.

## RED

```bash
cargo test --lib collect_from_source_reports_walk_errors
```

Observed failure before implementation:

- The test created an unreadable subdirectory and `summary.notes` stayed empty.

## Change

- `matching_source_files` now yields `Result<PathBuf, walkdir::Error>`.
- `collect_from_source` records traversal errors as `Skipped walk entry: ...`
  notes.
- The iterator remains lazy and still stops at the configured prompt limit.

## Verification

```bash
cargo fmt --all
cargo test --lib collect_from_source_reports_walk_errors
cargo test --lib collect_from_source_stops_file_walk_after_limit
npm run check
```

Observed:

- Walk-error regression test: PASS.
- Limit-walk regression test: PASS.
- Full check: PASS, 9 quiet UI helper tests, Vite build, 32 library tests, 13
  CLI tests, and strict clippy passed.

## Decision

Keep. Source traversal errors are now visible through source notes and existing
partial-warning promotion.
