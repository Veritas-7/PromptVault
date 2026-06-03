# AutoResearch Iteration: API Scan Limit Zero

Date: 2026-06-03

## Objective

Make `run_scan` reject zero scan limits at the backend API boundary.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-scan-limit-zero.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-scan-limit-zero.md`

Observed issue:

- CLI `--limit 0` now failed closed.
- UI limit parsing now failed closed.
- `run_scan` itself still lacked a `Some(0)` guard.

## Change

- Added an early `run_scan` guard for `options.limit == Some(0)`.
- Added `run_scan_rejects_zero_limit`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_zero_limit
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- `run_scan` zero-limit unit test: PASS.
- `npm run check`: PASS, Vite build passed, 16 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Zero scan limit is now rejected consistently at CLI, UI, and backend API boundaries.
