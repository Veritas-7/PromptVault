# AutoResearch Iteration: Preview-Only IPC Payloads

Date: 2026-06-03

## Objective

Reduce PromptVault's large-history UI risk without weakening the full Markdown export.

## Baseline Risk

The first full release scan proved the export path but produced a `352M` Markdown file from more than 155k prompts. The previous Tauri command returned full prompt bodies and the full Markdown string, which could make the UI/IPC path heavy on large histories.

## Change

- Added `ScanOptions.preview_limit`.
- Added `ScanOptions.include_markdown`.
- Added `ScanResult.returned_prompt_count`, `prompts_truncated`, and `markdown_included`.
- CLI scan now returns zero prompt bodies and no Markdown string by default.
- UI requests a latest-prompt preview of 1,000 records and omits Markdown over Tauri IPC.
- Added regression coverage for latest-record preview selection.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-preview-smoke.md --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview-five.md --json
cargo build --release --bin promptvault-cli
./target/release/promptvault-cli scan --output /tmp/promptvault-full-after-preview.md --json
npm run tauri build
```

Observed:

- `cargo test`: 6 tests passed.
- Default CLI JSON scan: `returned_prompt_count=0`, `markdown_included=false`.
- Bounded preview scan: `returned_prompt_count=5`, `markdown_included=true`.
- Full current release scan: 155,476 prompts, 27,602 files, `352M` UTF-8 Markdown.
- Tauri build produced the `.app` and `.dmg` bundles.

## Decision

Keep. This directly mitigates the largest residual risk from the previous completion audit while preserving the required full Markdown export.
