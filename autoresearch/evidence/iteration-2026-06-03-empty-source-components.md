# AutoResearch Iteration: Empty Source Components

Date: 2026-06-03

## Objective

Reject empty source ID components instead of silently dropping them.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-empty-source-components.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-empty-source-components.md`

Observed issue:

- CLI comma parsing allowed `--source codex,`.
- API source validation allowed mixed empty values.

## Change

- Added API validation coverage for mixed empty source IDs.
- Extended CLI source parser coverage for trailing and doubled commas.
- Rejected empty components in both paths.

## Evidence

```bash
cargo test --lib validate_source_ids_rejects_mixed_empty_source_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
cargo run --quiet --bin promptvault-cli -- scan --source codex, --limit 1 --no-export --json
npm run check
```

Observed:

- RED before implementation: both targeted tests failed.
- GREEN after implementation: both targeted tests passed.
- CLI smoke: PASS, exited 1 with `--source cannot include empty values`.
- Full check: PASS.

## Decision

Keep. Source filter parsing now treats empty components as invalid scope input.
