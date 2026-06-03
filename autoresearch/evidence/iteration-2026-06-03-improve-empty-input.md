# AutoResearch Iteration: Improve Empty Input

Date: 2026-06-03

## Objective

Make `promptvault-cli improve` fail closed when no prompt body is supplied.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-empty-input.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-empty-input.md`

Observed issue:

- Empty `--prompt` exited `0`.
- Empty stdin exited `0`.
- No-argument stdin EOF exited `0`.

## Change

- `collect_prompt_arg` now validates the collected prompt after reading from args or stdin.
- Empty and whitespace-only prompts return `improve requires a non-empty prompt`.
- Added a CLI unit test for empty prompt flag rejection and non-empty prompt acceptance.
- Updated CLI docs and completion audit.

## Evidence

```bash
cargo fmt --all
npm run check
cargo run --quiet --bin promptvault-cli -- improve --json --prompt ""
printf "" | cargo run --quiet --bin promptvault-cli -- improve --json
cargo run --quiet --bin promptvault-cli -- improve --json
cargo run --quiet --bin promptvault-cli -- improve --local --json --prompt "make better"
```

Observed:

- `cargo fmt --all`: PASS.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 4 CLI tests passed, and strict clippy passed.
- Empty `--prompt`: PASS, exited `1` with `promptvault-cli error: improve requires a non-empty prompt`.
- Empty stdin: PASS, exited `1` with `promptvault-cli error: improve requires a non-empty prompt`.
- No-arg stdin EOF: PASS, exited `1` with `promptvault-cli error: improve requires a non-empty prompt`.
- Non-empty local improve: PASS, exited `0` and printed JSON.

## Decision

Keep. CLI improve now fails closed when automation omits the prompt body.
