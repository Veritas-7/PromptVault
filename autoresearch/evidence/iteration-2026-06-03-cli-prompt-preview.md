# AutoResearch Iteration: Explicit CLI Prompt Preview

Date: 2026-06-03

## Objective

Make the weak-first repair queue directly usable by agents while keeping prompt bodies out of stdout by default.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-prompt-preview.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-prompt-preview.md`

Observed issue:

- `--weakest-first` selected the correct bounded preview order.
- CLI JSON still omitted prompt records, so agents could not inspect the selected weak prompts without reading a Markdown export.
- Printing prompt bodies by default would violate the conservative stdout contract.

## Change

- Added CLI `scan --include-prompts`.
- Added `prompt_stdout_count` to CLI JSON summaries.
- Kept `prompts: []` by default unless `--include-prompts` is passed.
- Capped stdout prompt previews at 25 records.
- Added a CLI unit test for opt-in and cap behavior.
- Updated README, CLI docs, best-practices guidance, and completion audit.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 30 --weakest-first --include-prompts --no-export --json
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
```

Observed:

- `cargo test`: PASS, 11 library tests plus 1 CLI test passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- Explicit prompt stdout smoke: PASS, returned `preview_sort=quality_asc`, `returned_prompt_count=5`, `prompt_stdout_count=5`, `markdown_written=false`, `output_path=null`.
- First stdout prompt quality: `36 · weak`.
- First stdout prompt gaps: `specific_goal`, `context`, `constraints`, `verification`, `output_format`.
- Default safety smoke: PASS, the same scan without `--include-prompts` returned `prompt_stdout_count=0` and `prompts_len=0`.
- Stdout cap smoke: PASS, `--preview-limit 30 --include-prompts` returned `returned_prompt_count=30`, `prompt_stdout_count=25`, `prompts_len=25`, and one cap warning.
- Tauri production build: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned `HTTP/1.1 200 OK`.

## Decision

Keep. Agents can now inspect a small weak-first prompt repair queue through an explicit opt-in flag, while default CLI JSON remains summary-only and prompt stdout previews stay capped.
