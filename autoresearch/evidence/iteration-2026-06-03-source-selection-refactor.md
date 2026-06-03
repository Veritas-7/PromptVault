# AutoResearch Iteration: Source Selection Refactor

Date: 2026-06-03

## Objective

Consolidate source-id validation responsibility after the API source-id hardening slices.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-source-selection-refactor.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-source-selection-refactor.md`

Observed issue:

- `validate_source_ids` now owns source-id rejection.
- `selected_source_specs` still returned warning strings for unknown ids.
- In `run_scan`, those warnings were unreachable after validation.

## Change

- Changed `selected_source_specs` to return only `Vec<SourceSpec>`.
- Removed `source_warnings` handling from `run_scan`.
- Updated the helper unit test to cover known source selection only.

## Evidence

```bash
cargo fmt --all
cargo test --lib selects_requested_sources
cargo test --lib run_scan_rejects_unknown_source_ids
npm run check
```

Observed:

- Focused source selection helper test: PASS.
- Focused unknown source API guard test: PASS.
- `npm run check`: PASS, Vite build passed, 22 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Source validation and source selection now have separate responsibilities.
