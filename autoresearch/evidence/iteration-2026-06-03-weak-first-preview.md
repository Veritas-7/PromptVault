# AutoResearch Iteration: Weak-First Preview Triage

Date: 2026-06-03

## Objective

Turn prompt quality scoring into an operational repair queue by letting users and agents load the weakest prompts first.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-weak-first-preview.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-weak-first-preview.md`

Observed issue:

- Prompt quality scoring and improvement deltas existed.
- The bounded preview still returned latest prompts only.
- Weak prompts could be outside the UI/agent preview even when scan stats showed many weak prompts.

## Change

- Added `ScanOptions.preview_sort` and `ScanResult.preview_sort`.
- Added preview ordering modes: `latest`, `quality_asc`, and `quality_desc`.
- Added CLI `--preview-sort latest|quality-asc|quality-desc` and shortcut `--weakest-first`.
- Added UI `Latest`/`Weakest` segmented mode.
- Added regression coverage for weakest-first preview ordering.
- Updated README, CLI docs, best-practices guidance, and completion audit.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
```

Observed:

- `cargo test`: PASS, 11 tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- Weak-first preview smoke: PASS, returned `preview_sort=quality_asc`, `returned_prompt_count=5`, `markdown_written=false`, `markdown_included=false`, and `output_path=null`.
- Smoke warning: expected bounded-scan warning `Scan stopped at configured limit of 100 prompts.`
- Tauri production build: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned `HTTP/1.1 200 OK`.
- Playwright render smoke: PASS, `Latest` and `Weakest` controls rendered, clicking `Weakest` activated that mode, and `bodyWidth=viewportWidth=1440`.

## Decision

Keep. The app can now prioritize the lowest-quality prompt preview without weakening the safe no-export/preview payload behavior or changing full Markdown export defaults.
