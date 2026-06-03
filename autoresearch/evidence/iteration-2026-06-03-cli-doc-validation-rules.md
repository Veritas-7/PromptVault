# AutoResearch Iteration: CLI Doc Validation Rules

Date: 2026-06-03

## Objective

Refresh `docs/CLI.md` after CLI and API validation hardening.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-doc-validation-rules.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-doc-validation-rules.md`

Observed issue:

- `docs/CLI.md` described old generic numeric arguments.
- Current CLI help exposes `--limit N>0`, `--preview-limit N>=0`, and `--count N>0`.
- Current validation also rejects unknown source ids, `--output` with `--no-export`, and duplicate preview sort selectors.

## Change

- Updated command syntax in `docs/CLI.md`.
- Replaced the generic non-negative numeric rule with positive `--limit`/`--count` and non-negative `--preview-limit`.
- Added source-id fail-closed, output/no-export conflict, and preview sort exclusivity notes.
- Added verification commands for the newly documented failure modes.

## Evidence

```bash
cargo run --quiet --bin promptvault-cli -- --help
cargo test --bin promptvault-cli
git diff --check
```

Observed:

- Current CLI help: PASS, printed the hardened validation rules.
- CLI tests: PASS, 13 tests passed.
- Whitespace diff check: PASS.

Note:

- An intermediate attempt to pass multiple test names to `cargo test` failed due to cargo argument syntax, then the full CLI test suite was rerun and passed.

## Decision

Keep. The CLI guide now matches current validation behavior.
