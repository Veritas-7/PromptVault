# Internal Scan Report: Scan Limit File Walk

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `05f6770`

## Baseline

`collect_from_source` called `collect_files` before parsing records. That meant limited scans still traversed and counted every matching source file before stopping on prompt count.

The RED test confirmed the behavior:

```bash
cargo test --lib collect_from_source_stops_file_walk_after_limit
```

Observed before implementation:

- The test failed.
- `summary.files_seen` was `5`.
- Expected `summary.files_seen` was `1`.

## Selected Candidate

Replace eager file collection with a deterministic lazy matching-file iterator and increment `files_seen` only for files actually visited before the prompt limit stops collection.

## Success Metric

```bash
cargo test --lib collect_from_source_stops_file_walk_after_limit
cargo test --lib selects_requested_sources
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Expected:

- Focused temp-source test passes with `files_seen=1`.
- Source selection remains green.
- Real Codex limit smoke reports `files_seen=1`.
- Full local check passes.
