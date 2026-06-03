# AutoResearch Iteration: Sources Extra Args

Date: 2026-06-03

## Objective

Make `promptvault-cli sources` reject unknown extra arguments.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-sources-extra-args.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-sources-extra-args.md`

Observed issue:

- `sources --bogus` exited `0`.
- `sources --json --bogus` exited `0`.
- The CLI had fail-closed parsing for scan, repair, improve, and unknown commands, but not for extra `sources` args.

## Change

- Added `reject_extra_args`.
- `sources` now accepts only `--json`.
- Added a CLI unit test for extra-arg rejection.
- Updated CLI docs and completion audit.

## Evidence

```bash
cargo fmt --all
npm run check
cargo run --quiet --bin promptvault-cli -- sources --bogus
cargo run --quiet --bin promptvault-cli -- sources --json --bogus
cargo run --quiet --bin promptvault-cli -- sources --json
```

Observed:

- `cargo fmt --all`: PASS.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 8 CLI tests passed, and strict clippy passed.
- `sources --bogus`: PASS, exited `1` with `unknown sources argument: --bogus`.
- `sources --json --bogus`: PASS, exited `1` with `unknown sources argument: --bogus`.
- `sources --json`: PASS, exited `0` and returned 11 roots.

## Decision

Keep. All major CLI command surfaces now reject unexpected arguments instead of silently ignoring them.
