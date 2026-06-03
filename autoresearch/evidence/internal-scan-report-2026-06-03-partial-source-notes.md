# Internal Scan Report: Partial Source Notes

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `fb70114`

Code commit: `f9cf72c`

## Baseline

`collect_from_source` can skip a bad file and append a note such as
`Skipped bad.jsonl: ...`. In the successful `run_scan` branch those notes did
not change source status or produce scan warnings. A source could therefore look
`ok` even when one or more files were skipped.

## RED

```bash
cargo test --lib source_notes_are_promoted_to_partial_warning
```

Observed failure before implementation:

- The source-note promotion helper did not exist.

## Change

- Added `promote_source_notes_to_warning`.
- `run_scan` now calls it after successful source collection and quality
  summarization.
- Non-empty notes set source status to `partial` and add a scan warning.

## Verification

```bash
cargo fmt --all
cargo test --lib source_notes_are_promoted_to_partial_warning
cargo test --lib jsonl_lines_propagates_read_errors
npm run check
```

Observed:

- Source-note promotion test: PASS.
- JSONL read-error propagation test: PASS.
- Full check: PASS, Vite build, 29 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Skipped-file notes now surface through the existing partial status and
warning channels.
