# AutoResearch Iteration: CLI Required Values

Date: 2026-06-03

## Objective

Make value-taking CLI options fail closed when their value is missing.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-required-values.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-required-values.md`

Observed issue:

- Missing scan `--source` silently scanned default sources.
- Missing scan `--output` was ignored.
- Missing scan `--preview-sort` defaulted to `latest`.
- Missing repair `--source` silently repaired from default sources.

## Change

- Added `parse_required_arg`.
- Added `parse_source_ids_arg`.
- Scan `--source`, `--output`, and `--preview-sort` now require values.
- Repair `--source` now requires a value.
- Source values must contain at least one non-empty source ID.
- Added CLI unit tests for required values and source ID parsing.
- Updated CLI docs and completion audit.

## Evidence

```bash
cargo fmt --all
npm run check
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --source
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --output
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --preview-sort
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count 1 --json --source
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
```

Observed:

- `cargo fmt --all`: PASS.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 7 CLI tests passed, and strict clippy passed.
- Missing scan `--source`: PASS, exited `1` with `--source requires a value`.
- Missing scan `--output`: PASS, exited `1` with `--output requires a value`.
- Missing scan `--preview-sort`: PASS, exited `1` with `--preview-sort requires a value`.
- Missing repair `--source`: PASS, exited `1` with `--source requires a value`.
- Valid source scan: PASS, exited `0` with `total_prompts=1`.

## Decision

Keep. Value-taking CLI options now fail closed instead of silently widening or defaulting scope.
