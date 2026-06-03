# AutoResearch Iteration: No-Export Stats Scan

Date: 2026-06-03

## Objective

Reduce PromptVault's heavy full-scan cost when the operator needs only JSON stats, not a Markdown archive.

## Internal Intake

`internal-scan-report.json` and `internal-scan-report.md` identify the current weakness: full scans still render and write a `364M` Markdown export even after the IPC payload was made safe.

## External Intake

Sources checked:

- HKUDS CLI-Anything GitHub repository
- Tauri IPC module documentation

Transferable claims:

- Agent-native CLIs should expose structured, machine-readable command contracts.
- Tauri command responses are IPC payloads, so large response bodies and unnecessary serialization should stay opt-in.

## Change

- Added `ScanOptions.write_markdown`.
- Added `ScanResult.markdown_written`.
- Changed `ScanResult.output_path` to nullable for no-export scans.
- Added CLI `scan --no-export`.
- Skipped Markdown rendering entirely when `write_markdown=false` and `include_markdown=false`.
- Updated README and CLI docs.

## Evidence

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all
cargo test
cargo check
npm run build
./target/release/promptvault-cli scan --no-export --json > /tmp/promptvault-no-export-full.json
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --no-export --output /tmp/promptvault-no-export-ignored.md --json > /tmp/promptvault-no-export-ignored.json
npm run tauri build
```

Observed:

- `cargo test`: 9 tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- Full no-export release scan: 155,484 prompts from 27,608 files in 1m31s.
- Full no-export response: `output_path=null`, `returned_prompt_count=0`, `prompts_truncated=true`, `markdown_included=false`, `markdown_written=false`, `warnings=[]`.
- File absence gate: `/tmp/promptvault-no-export-full.md` did not exist after the scan.
- Output-path edge gate: `--no-export --output /tmp/promptvault-no-export-ignored.md` returned warning `Output path ignored because Markdown export was disabled.` and did not create the file.
- `npm run tauri build`: produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.

## Decision

Keep. The default full Markdown export remains available, while agent automation can now run full-history stats without rendering or writing a large Markdown file.
