# AutoResearch Iteration: Source-Filtered Scans

Date: 2026-06-03

## Objective

Make PromptVault easier to verify source-by-source without running a full 155k-prompt export every time.

## Trigger

While validating the Antigravity conversation DB parser, `scan --limit 500` stopped in the first Codex source and never reached later Antigravity sources. That made targeted parser validation require a full scan.

## Change

- Added `ScanOptions.source_ids`.
- Added source selection in `run_scan`.
- Added CLI `scan --source ID`, supporting repeated or comma-separated source IDs.
- Added warning output for unknown source IDs.
- Updated README and CLI docs with source-filtered smoke examples.

## Evidence

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --preview-limit 0 --output /tmp/promptvault-source-filter-antigravity-db.md --json > /tmp/promptvault-source-filter-antigravity-db.json
cargo run --quiet --bin promptvault-cli -- scan --source missing-source --preview-limit 0 --output /tmp/promptvault-source-filter-missing.md --json > /tmp/promptvault-source-filter-missing.json
npm run tauri build
```

Observed:

- `cargo test`: 9 tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- `scan --source antigravity-cli-conversation-db`: `total_prompts=2`, `total_files=2`, source summary contains only `antigravity-cli-conversation-db`, `warnings=[]`, export size `4.0K`.
- `scan --source missing-source`: `total_prompts=0`, `source_summaries=[]`, warning `Unknown source id requested: missing-source`.
- `npm run tauri build`: produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.

## Decision

Keep. This improves the self-improvement loop itself: future parser work can validate one source quickly, with explicit warnings for invalid source IDs, instead of relying on expensive full scans.
