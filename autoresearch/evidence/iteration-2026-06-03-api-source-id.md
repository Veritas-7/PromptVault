# AutoResearch Iteration: API Source ID

Date: 2026-06-03

## Objective

Make `run_scan` reject unknown source ids at the API boundary.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-source-id.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-source-id.md`

Observed issue:

- CLI `--source missing-source` failed closed.
- Direct `run_scan` API callers could still pass `source_ids: Some(["missing-source"])`.
- The API returned success with an empty scan and a warning.

## RED

```bash
cargo test --lib run_scan_rejects_unknown_source_ids
```

Observed:

- FAILED before implementation.
- Failure showed `run_scan` returned a successful `ScanResult`.

## Change

- Added `validate_source_ids`.
- Called it from `run_scan` before source traversal.
- Added `run_scan_rejects_unknown_source_ids`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_unknown_source_ids
cargo test --lib selects_requested_sources_and_warns_for_unknown_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
npm run check
```

Observed:

- Focused API source-id test: PASS.
- Existing source selection helper test: PASS.
- Focused CLI source-id parser test: PASS.
- `npm run check`: PASS, Vite build passed, 19 library tests plus 13 CLI tests passed, and strict clippy passed.

Note:

- One intermediate targeted CLI command was accidentally run from the repo root and failed due to missing `Cargo.toml`; it was rerun from `src-tauri` and passed.

## Decision

Keep. API and CLI now reject unknown source ids instead of returning an empty successful scan.
