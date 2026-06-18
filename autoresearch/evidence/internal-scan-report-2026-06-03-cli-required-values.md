# Internal Scan Report: CLI Required Values

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `bc56e61`

## Baseline

Missing value-taking options exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --source
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --output
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --preview-sort
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count 1 --json --source
```

Observed:

- Missing `--source` widened the scan to default sources.
- Missing `--output` was ignored.
- Missing `--preview-sort` defaulted to `latest`.
- Missing repair `--source` widened repair scope.

## Selected Candidate

Add required-value parsing:

- `--source`
- `--output`
- `--preview-sort`

`--source` also rejects comma-only empty values.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --source
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --output
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --preview-sort
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count 1 --json --source
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
```

Expected:

- Missing values exit non-zero.
- Valid source scan exits `0`.
