# AutoResearch Iteration: API Preview Sort

Date: 2026-06-03

## Objective

Make `run_scan` reject unknown preview sort values at the API boundary.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-preview-sort.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-preview-sort.md`

Observed issue:

- CLI `--preview-sort nonsense` failed closed.
- Direct `run_scan` API callers could still pass `preview_sort: Some("nonsense")`.
- The API returned success with `preview_sort: "latest"` and a warning.

## RED

```bash
cargo test --lib run_scan_rejects_unknown_preview_sort
```

Observed:

- FAILED before implementation.
- Failure showed `run_scan` returned a successful `ScanResult`.

## Change

- Changed `PreviewSort::from_option` to return `Result<PreviewSort, Box<dyn Error>>`.
- Removed the unknown preview-sort warning fallback.
- Added `run_scan_rejects_unknown_preview_sort`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_unknown_preview_sort
cargo test --bin promptvault-cli parse_preview_sort_rejects_unknown_values
npm run check
```

Observed:

- Focused API preview-sort test: PASS.
- Focused CLI preview-sort test: PASS.
- `npm run check`: PASS, Vite build passed, 18 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. API and CLI now reject unknown scan preview-sort values instead of silently falling back to latest.
