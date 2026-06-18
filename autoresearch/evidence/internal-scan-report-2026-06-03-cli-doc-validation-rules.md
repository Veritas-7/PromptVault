# Internal Scan Report: CLI Doc Validation Rules

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `db7bc91`

## Baseline

`docs/CLI.md` lagged behind the current CLI validation rules:

- Command syntax still used generic `N` for `--limit`, `--preview-limit`, and `--count`.
- The contract said numeric options require non-negative integers, but current `--limit` and `repair --count` require positive integers.
- The guide did not document unknown source id failures, `--output` versus `--no-export`, or preview sort selector exclusivity.

## Selected Candidate

Refresh `docs/CLI.md` against current `promptvault-cli --help` output and the validation tests already in the CLI binary.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- --help
cargo test --bin promptvault-cli
git diff --check
```

Expected:

- CLI docs match current validation rules.
- CLI test suite remains green.
- Diff whitespace check passes.
