# AutoResearch Iteration: CLI Limit Zero

Date: 2026-06-03

## Objective

Make `promptvault-cli scan|repair --limit 0` fail closed.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-limit-zero.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-limit-zero.md`

Observed issue:

- `scan --limit 0` exited `0` and returned an empty scan.
- `repair --limit 0` exited `0` and returned an empty repair list.
- Both were successful no-op commands.

## Change

- Added `parse_positive_usize_arg`.
- `scan --limit` and `repair --limit` now require positive integers.
- `--preview-limit` and `--count` still use the existing non-negative parser.
- Added a CLI unit test for zero rejection.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli parse_positive_usize_arg_rejects_zero
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 0 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 0 --count 0 --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Positive limit parser test: PASS.
- `scan --limit 0`: PASS, exited `1` with `--limit requires a positive integer`.
- `repair --limit 0`: PASS, exited `1` with `--limit requires a positive integer`.
- Valid scan with `--preview-limit 0`: PASS, exited `0`.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 10 CLI tests passed, and strict clippy passed.

## Decision

Keep. Limit zero no longer produces misleading successful no-op scans or repairs.
