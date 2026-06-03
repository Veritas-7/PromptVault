# AutoResearch Iteration: CLI Preview Sort Conflict

Date: 2026-06-03

## Objective

Make duplicate preview sort selectors fail closed.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-preview-sort-conflict.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-preview-sort-conflict.md`

Observed issue:

- `--weakest-first --preview-sort latest` exited `0`.
- `--preview-sort quality-desc --weakest-first` exited `0`.
- The final `preview_sort` depended on which selector appeared last.

## Change

- Added `set_preview_sort`.
- `--preview-sort` and `--weakest-first` now share one conflict check.
- Added a CLI unit test for duplicate sort selectors.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli set_preview_sort_rejects_multiple_sort_options
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --weakest-first --preview-sort latest --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --preview-sort quality-desc --weakest-first --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --weakest-first --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Duplicate sort unit test: PASS.
- Both conflicting sort orders: PASS, exited `1`.
- Single `--weakest-first`: PASS, exited `0` with `preview_sort: quality_asc`.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 12 CLI tests passed, and strict clippy passed.

## Decision

Keep. Preview sort intent is no longer order-dependent.
