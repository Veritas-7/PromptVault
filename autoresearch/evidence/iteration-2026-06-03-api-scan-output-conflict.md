# AutoResearch Iteration: API Scan Output Conflict

Date: 2026-06-03

## Objective

Make `run_scan` reject an output path when Markdown export is disabled.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-scan-output-conflict.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-scan-output-conflict.md`

Observed issue:

- CLI `--output ... --no-export` failed closed.
- Direct `run_scan` API callers could still pass `output_path` with `write_markdown: false`.
- The API returned success with a warning instead of rejecting the conflicting options.

## RED

```bash
cargo test --lib run_scan_rejects_output_path_when_export_disabled
```

Observed:

- FAILED before implementation.
- Failure showed `run_scan` returned a successful `ScanResult`.

## Change

- Added an early `run_scan` guard for `!write_markdown && output_path.is_some()`.
- Removed the warning fallback for ignored output paths.
- Added `run_scan_rejects_output_path_when_export_disabled`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_output_path_when_export_disabled
cargo test --lib run_scan_rejects_zero_limit
npm run check
```

Observed:

- Focused API export conflict test: PASS.
- Existing API zero-limit test: PASS.
- `npm run check`: PASS, Vite build passed, 17 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. API and CLI now reject the same scan export conflict instead of silently ignoring the output path.
