# AutoResearch Iteration: CLI Help Validation

Date: 2026-06-03

## Objective

Align `promptvault-cli --help` with the stricter CLI parser behavior.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-help-validation.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-help-validation.md`

Observed issue:

- Parser behavior had become stricter across limits, counts, export flags, source ids, and preview sort selectors.
- Help still described generic `N` values and omitted key conflict rules.

## Change

- Added `help_text`.
- `print_help` now prints the testable help string.
- Help now documents positive scan/repair limits, non-negative preview limits, source-list syntax, output/no-export conflict, and preview sort exclusivity.
- Added a CLI unit test for help rule coverage.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
cargo run --quiet --bin promptvault-cli -- --help
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Help text unit test: PASS.
- `--help`: PASS, printed updated validation rules.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. The CLI help now matches the validated command surface.
