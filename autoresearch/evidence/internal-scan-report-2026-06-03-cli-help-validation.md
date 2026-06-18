# Internal Scan Report: CLI Help Validation

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `24f1d06`

## Baseline

Help output lagged behind validation changes:

```bash
cargo run --quiet --bin promptvault-cli -- --help
```

Observed:

- `scan` still showed `--limit N`.
- `repair` still showed `--count N`.
- No rules described `--output` versus `--no-export`.
- No rules described `--preview-sort` versus `--weakest-first`.

## Selected Candidate

Factor help text into `help_text()` and document the new validation rules.

## Success Metric

```bash
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
cargo run --quiet --bin promptvault-cli -- --help
npm run check
```

Expected:

- Help unit test passes.
- Help output includes `N>0`, `N>=0`, output/no-export conflict, and preview sort exclusivity.
- Full local check passes.
