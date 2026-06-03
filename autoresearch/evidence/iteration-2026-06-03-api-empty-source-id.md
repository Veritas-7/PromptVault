# AutoResearch Iteration: API Empty Source ID

Date: 2026-06-03

## Objective

Make `run_scan` reject explicit empty source selections at the API boundary.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-source-id.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-source-id.md`

Observed issue:

- CLI `--source ,` failed closed.
- Direct `run_scan` API callers could still pass `source_ids: Some([])` or blank-only ids.
- The API interpreted that explicit empty selection like all sources.

## RED

```bash
cargo test --lib run_scan_rejects_empty_source_ids
```

Observed:

- FAILED before implementation.
- Failure showed `run_scan` returned a successful scan.
- The bounded RED test still touched Codex session files, confirming the accidental full-source behavior.

## Change

- Updated `validate_source_ids` to reject empty explicit source slices.
- Updated `validate_source_ids` to reject blank-only source id lists.
- Added `run_scan_rejects_empty_source_ids`.

## Evidence

```bash
cargo fmt --all
cargo test --lib run_scan_rejects_empty_source_ids
cargo test --lib run_scan_rejects_unknown_source_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
npm run check
```

Observed:

- Focused API empty source-id test: PASS.
- Focused API unknown source-id test: PASS.
- Focused CLI source-id parser test: PASS.
- `npm run check`: PASS, Vite build passed, 20 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Explicit empty API source selections now fail closed instead of triggering an accidental all-source scan.
