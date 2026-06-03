# AutoResearch Iteration: API Empty Output Path

Date: 2026-06-03

## Objective

Make `run_scan` reject explicit blank output paths at the API boundary.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-output-path.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-output-path.md`

Observed issue:

- CLI empty `--output` values failed closed.
- Direct `run_scan` API callers could still pass `output_path: Some("  ")`.
- The API did not validate the blank path before other option validation.

## RED

```bash
cargo test --lib run_scan_rejects_empty_output_path
```

Observed:

- FAILED before implementation.
- Failure showed `run_scan` did not return the expected empty-output-path error.

## Change

- Added an early blank `output_path` guard in `run_scan`.
- Added `run_scan_rejects_empty_output_path`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_empty_output_path
cargo test --lib run_scan_rejects_output_path_when_export_disabled
cargo test --bin promptvault-cli parse_required_args_reject_missing_flag_like_or_empty_values
npm run check
```

Observed:

- Focused empty output-path API test: PASS.
- Focused output export conflict API test: PASS.
- Focused CLI required-value parser test: PASS.
- `npm run check`: PASS, Vite build passed, 22 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Explicit blank API output paths now fail closed before source traversal or filesystem writes.
