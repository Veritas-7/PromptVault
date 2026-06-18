# Internal Scan Report: CLI Limit Zero

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `8eda37d`

## Baseline

Zero scan limits exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 0 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 0 --count 1 --json
```

Observed:

- `scan --limit 0` returned empty JSON with warning `Scan stopped at configured limit of 0 prompts.`
- `repair --limit 0` returned empty JSON with the same warning.

## Selected Candidate

Require positive integers for `--limit` while leaving non-negative parsing for `--preview-limit` and `--count`.

## Success Metric

```bash
cargo test --bin promptvault-cli parse_positive_usize_arg_rejects_zero
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 0 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 0 --count 0 --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Expected:

- `scan --limit 0` exits non-zero.
- `repair --limit 0` exits non-zero.
- Valid scan with `--preview-limit 0` still exits `0`.
- Full local check passes.
