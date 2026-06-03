# AutoResearch Iteration: Measurable Improvement Delta

Date: 2026-06-03

## Objective

Make prompt rewriting measurable by attaching quality before/after scores and gap resolution to every recommendation.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-improvement-delta.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-improvement-delta.md`

Observed issue:

- Prompt quality scoring existed for scanned prompts.
- Prompt recommendations did not include a local metric delta.
- This blocked clean A/B reporting for future prompt-optimizer experiments.

## Change

- Added `QualityDelta` to `ImproveResult`.
- Added `quality_delta(original, revised)` to compute before score, after score, signed delta, resolved gaps, and remaining gaps.
- Attached the same delta to GLM JSON output, GLM non-JSON output, and local fallback output.
- Added CLI plain-text quality summary for `improve`.
- Added UI recommendation-panel delta display.
- Added a Rust regression test for local fallback quality delta.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- improve --json --prompt "make better"
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
```

Observed:

- `cargo test`: PASS, 10 tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- CLI improve smoke: PASS, local fallback returned `quality_delta.before.score=36`, `quality_delta.after.score=100`, `quality_delta.score_delta=64`, `resolved_gaps=["specific_goal","context","constraints","verification","output_format"]`, and `remaining_gaps=[]`.
- Tauri production build: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned `HTTP/1.1 200 OK`.
- Playwright render smoke: PASS, `Agent prompt intelligence` loaded, `Recommendation` panel rendered, 5 panels were present, and `bodyWidth=viewportWidth=1440`.

## Decision

Keep. The recommendation surface now reports whether an improvement was measurable on the same deterministic metric used by the scan dashboard, without adding external-model dependency or changing source-ingest behavior.
