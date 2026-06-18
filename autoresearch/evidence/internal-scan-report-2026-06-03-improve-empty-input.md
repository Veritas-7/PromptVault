# Internal Scan Report: Improve Empty Input

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `26519b2`

## Baseline

These commands all exited `0` and printed JSON:

```bash
cargo run --quiet --bin promptvault-cli -- improve --json
printf "" | cargo run --quiet --bin promptvault-cli -- improve --json
cargo run --quiet --bin promptvault-cli -- improve --json --prompt ""
```

## Current Weakness

`improve` could look successful even when no prompt body was supplied. For agent automation, that is a bad signal because the requested prompt repair did not actually have input.

## Selected Candidate

Reject empty prompt input:

- Read prompt from `--prompt` or stdin as before.
- Trim-check the collected prompt.
- Return `improve requires a non-empty prompt` for empty or whitespace-only input.
- Keep non-empty prompt behavior unchanged.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- improve --json --prompt ""
printf "" | cargo run --quiet --bin promptvault-cli -- improve --json
cargo run --quiet --bin promptvault-cli -- improve --local --json --prompt "make better"
```

Expected:

- Empty `--prompt` exits non-zero.
- Empty stdin exits non-zero.
- Non-empty local improve exits `0`.
