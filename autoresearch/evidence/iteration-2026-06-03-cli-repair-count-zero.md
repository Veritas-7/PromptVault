# AutoResearch Iteration: CLI Repair Count Zero

Date: 2026-06-03

## Objective

Make `promptvault-cli repair --count 0` fail closed.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-repair-count-zero.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-repair-count-zero.md`

Observed issue:

- `repair --count 0` exited `0`.
- It scanned one prompt but returned zero repair suggestions.
- This is a successful no-op for a command whose purpose is to produce repair suggestions.

## Change

- `repair --count` now uses `parse_positive_usize_arg`.
- The existing max repair count cap remains unchanged.
- The positive parser test now explicitly covers `--count 0`.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli parse_positive_usize_arg_rejects_zero
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 0 --json
cargo run --quiet --bin promptvault-cli -- repair --source codex --limit 1 --count 1 --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Positive parser test: PASS.
- `repair --count 0`: PASS, exited `1` with `--count requires a positive integer`.
- `repair --count 1`: PASS, exited `0` with `repair_count: 1`.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 12 CLI tests passed, and strict clippy passed.

## Decision

Keep. Repair count zero no longer produces a misleading successful no-op.
