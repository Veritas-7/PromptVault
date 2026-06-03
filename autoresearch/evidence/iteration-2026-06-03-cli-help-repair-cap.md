# AutoResearch Iteration: CLI Help Repair Cap

Date: 2026-06-03

## Objective

Make CLI help disclose the existing repair batch count cap.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-help-repair-cap.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-help-repair-cap.md`

Observed issue:

- `repair --count` is capped at `10` by `bounded_count`.
- CLI help only said `--count N>0`.
- The cap was visible only after requesting a larger batch and reading the warning.

## RED

```bash
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
```

Observed:

- FAILED before implementation.
- Failure showed help text did not include the repair count cap rule.

## Change

- Added `repair --count is capped at 10.` to CLI help Rules.
- Strengthened `help_text_documents_cli_validation_rules`.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
cargo test --bin promptvault-cli bounded_count_caps_repair_batches
npm run check
```

Observed:

- Focused CLI help test: PASS.
- Focused repair cap test: PASS.
- `npm run check`: PASS, Vite build passed, 22 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Help now documents the existing repair count safety cap without changing command behavior.
