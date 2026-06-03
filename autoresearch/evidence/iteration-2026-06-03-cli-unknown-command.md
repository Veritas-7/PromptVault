# AutoResearch Iteration: CLI Unknown Command

Date: 2026-06-03

## Objective

Make the PromptVault CLI fail closed when automation passes an unknown command.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-unknown-command.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-unknown-command.md`

Observed issue:

- `scna` printed help and exited `0`.
- `--help` also printed help and exited `0`.
- Unknown-command behavior needed to differ from explicit help behavior.

## Change

- Added explicit help command detection for `help`, `-h`, and `--help`.
- Changed unknown commands to print help and return `unknown command: <name>`.
- Added a CLI unit test for explicit help command recognition.
- Updated CLI docs and completion audit.

## Evidence

```bash
cargo fmt --all
npm run check
cargo run --quiet --bin promptvault-cli -- scna
cargo run --quiet --bin promptvault-cli -- --help
```

Observed:

- `cargo fmt --all`: PASS.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 3 CLI tests passed, and strict clippy passed.
- Unknown-command smoke: PASS, `scna` exited `1`, printed help, and wrote `promptvault-cli error: unknown command: scna` to stderr.
- Help smoke: PASS, `--help` exited `0`, printed help, and wrote no stderr.

## Decision

Keep. CLI automation now fails closed for typo commands while preserving explicit help behavior.
