# AutoResearch Iteration: Scan Limit File Walk

Date: 2026-06-03

## Objective

Make limited scans stop file traversal earlier instead of building the full source file list first.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-scan-limit-file-walk.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-scan-limit-file-walk.md`

Observed issue:

- `collect_files` collected and sorted every matching source file before parsing.
- `collect_from_source` then stopped after enough prompts.
- This made `--limit 1` still expensive on large sources.

## RED

```bash
cargo test --lib collect_from_source_stops_file_walk_after_limit
```

Observed:

- FAILED before implementation.
- Failure showed `files_seen=5` for a temp source where one prompt file satisfied `remaining=1`.

## Change

- Replaced eager `collect_files` with `matching_source_files`.
- Added `source_file_matches`.
- `collect_from_source` now increments `files_seen` as it visits files and stops as soon as the prompt limit is reached.
- Added `collect_from_source_stops_file_walk_after_limit`.

## Evidence

```bash
cargo fmt --all
cargo test --lib collect_from_source_stops_file_walk_after_limit
cargo test --lib selects_requested_sources
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Observed:

- Focused file-walk limit test: PASS.
- Focused source selection test: PASS.
- Real Codex `--limit 1` smoke: PASS, returned `files_seen=1`, `total_files=1`, `total_prompts=1`, and the configured-limit warning.
- `npm run check`: PASS, Vite build passed, 23 library tests plus 13 CLI tests passed, and strict clippy passed.

Note:

- The full check briefly waited on Cargo's artifact directory lock because the real smoke ran in parallel; both commands completed successfully.

## Decision

Keep. Limited scans now reduce source file traversal work.
