# Internal Scan Report: CLI Repair Count Zero

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `ca894d6`

## Baseline

Zero repair count exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 0 --json
```

Observed:

- `scanned_prompt_count`: `1`
- `returned_prompt_count`: `0`
- `repair_count`: `0`

Valid repair count smoke:

```bash
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 1 --json
```

Observed:

- Exit code: `0`
- `repair_count`: `1`

## Selected Candidate

Use the positive integer parser for `repair --count`.

## Success Metric

```bash
cargo test --bin promptvault-cli parse_positive_usize_arg_rejects_zero
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 0 --json
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 1 --json
npm run check
```

Expected:

- `repair --count 0` exits non-zero.
- `repair --count 1` remains valid.
- Full local check passes.
