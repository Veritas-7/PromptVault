# Internal Scan Report: Sources Extra Args

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `b160858`

## Baseline

Unknown `sources` arguments exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- sources --bogus
cargo run --quiet --bin promptvault-cli -- sources --json --bogus
```

Observed:

- `sources --bogus` printed source rows.
- `sources --json --bogus` printed JSON source rows.

## Selected Candidate

Reject unknown extra arguments for the `sources` command while preserving `sources --json`.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- sources --bogus
cargo run --quiet --bin promptvault-cli -- sources --json --bogus
cargo run --quiet --bin promptvault-cli -- sources --json
```

Expected:

- Bogus args exit non-zero.
- Valid JSON sources exits `0` and returns 11 roots.
