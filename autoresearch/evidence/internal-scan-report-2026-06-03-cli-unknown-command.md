# Internal Scan Report: CLI Unknown Command

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `2d2dbf2`

## Baseline

```bash
cargo run --quiet --bin promptvault-cli -- scna
```

Observed:

- Exit code: `0`
- Stdout first line: `PromptVault CLI`
- Stderr: empty

## Current Weakness

A misspelled command looked successful to shell automation. That is unsafe for agent-native use because a typo can silently skip the requested scan, repair, or improve workflow.

## Selected Candidate

Make unknown commands fail closed:

- Keep `help`, `-h`, and `--help` as explicit successful help commands.
- Keep no-argument invocation as successful help.
- Return an error for unknown commands after printing help.
- Add a unit test for explicit help command recognition.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- scna
cargo run --quiet --bin promptvault-cli -- --help
```

Expected:

- `scna` exits non-zero and writes `unknown command: scna` to stderr.
- `--help` exits 0 and writes no stderr.
