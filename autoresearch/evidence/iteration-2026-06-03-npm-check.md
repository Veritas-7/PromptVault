# AutoResearch Iteration: NPM Check

Date: 2026-06-03

## Objective

Create a single local quality gate for common PromptVault verification.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-npm-check.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-npm-check.md`

Observed issue:

- Build, Rust tests, and clippy were all passing.
- They were still separate commands in the local loop.
- Future iterations needed a shorter default gate.

## Change

- Added `npm run check`.
- The script runs frontend build, Rust tests, and strict clippy.
- Updated README verification commands.
- Updated completion audit.

## Evidence

```bash
npm run check
```

Observed:

- `npm run build`: PASS inside the check script.
- `cargo test`: PASS, 14 library tests plus 2 CLI tests passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.

## Decision

Keep. Future iterations can use `npm run check` as the fast repo-level gate before heavier Tauri packaging or full local prompt scans.
