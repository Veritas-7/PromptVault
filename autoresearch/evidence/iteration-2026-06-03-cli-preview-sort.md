# AutoResearch Iteration: CLI Preview Sort

Date: 2026-06-03

## Objective

Make `promptvault-cli scan --preview-sort` reject unknown values instead of silently falling back to `latest`.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-preview-sort.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-preview-sort.md`

Observed issue:

- `scan --preview-sort nonsense` exited `0`.
- The command returned JSON with `preview_sort: latest`.
- The only signal was a warning, which is too easy for automation to ignore when the user explicitly supplied an invalid option.

## Change

- Added `parse_preview_sort_arg`.
- `scan --preview-sort` now rejects unknown values in the CLI parser.
- Existing `quality_asc`, `quality_desc`, `weakest`, and `strongest` aliases remain accepted and normalize to documented hyphenated values before `run_scan`.
- Added a CLI unit test for preview sort parsing.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli parse_preview_sort_rejects_unknown_values
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort nonsense --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort quality_asc --preview-limit 1 --no-export --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Targeted CLI unit test: PASS.
- Invalid `--preview-sort nonsense`: PASS, exited `1` with `--preview-sort must be one of latest, quality-asc, quality-desc; got nonsense`.
- Valid `--preview-sort quality_asc`: PASS, exited `0` with `preview_sort: quality_asc`.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 9 CLI tests passed, and strict clippy passed.

## Decision

Keep. The CLI now fails closed on misspelled preview sort values without changing the more tolerant library/API fallback behavior.
