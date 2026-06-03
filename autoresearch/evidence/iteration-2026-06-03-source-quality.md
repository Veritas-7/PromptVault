# AutoResearch Iteration: Source Quality

Date: 2026-06-03

## Objective

Make source summaries actionable by showing quality priority per prompt store.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-source-quality.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-source-quality.md`

Observed issue:

- Global quality and weak-prompt counts existed.
- Source summaries only showed file and prompt counts.
- Agents still had to inspect prompt previews to decide which source store was the noisiest.

## Change

- Added `average_quality` and `weak_prompt_count` to `SourceSummary`.
- Populated source-level quality metrics during scan collection.
- Added source quality columns to Markdown source coverage.
- Added source quality text to the UI source panel.
- Updated TypeScript scan result types and docs.
- Added a Rust unit test for source summary quality triage.

## Evidence

```bash
cargo fmt --all
cargo test
npm run build
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 0 --no-export --json
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
playwright mocked source-quality render smoke
```

Observed:

- `cargo fmt --all`: PASS.
- `cargo test`: PASS, 13 library tests plus 2 CLI tests passed.
- `npm run build`: PASS.
- Source quality smoke: PASS, 100-prompt no-export scan returned first source `average_quality=71.6`, `weak_prompt_count=16`, and all source summaries included both fields.
- `npm run tauri build`: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned HTTP 200.
- Source-quality render smoke: PASS, mocked scan rendered `Q 55.5 · Weak 1` in the source panel and `bodyWidth=viewportWidth=1440`.

## Decision

Keep. PromptVault can now identify noisy source stores directly from CLI JSON, Markdown exports, and the UI source panel without exposing extra prompt bodies.
