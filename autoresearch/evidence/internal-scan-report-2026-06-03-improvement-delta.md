# Internal Scan Report: Improvement Delta

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `128a740`

## Current Strengths

- PromptVault already gives scanned prompts deterministic quality scores, bands, missing criteria, and suggestions.
- The recommendation path is shared by the Tauri UI and `promptvault-cli improve`.
- The local fallback is deterministic enough for a reliable same-sample smoke test.

## Current Weakness

`ImproveResult` returned a revised prompt, rationale, checklist, and warnings, but did not report whether the revised prompt improved the same quality metric used elsewhere in the app. That left the next prompt-optimizer/A-B lane without a small local measurement surface.

## Selected Candidate

Add a measurable improvement delta:

- `before`: quality score and gaps for the original prompt.
- `after`: quality score and gaps for the revised prompt.
- `score_delta`: signed score difference.
- `resolved_gaps`: missing criteria present before but absent after.
- `remaining_gaps`: criteria still missing after the rewrite.

## Success Metric

The CLI JSON output for a weak prompt includes `quality_delta`, and the local fallback reports a positive score delta with resolved gaps:

```bash
cargo run --quiet --bin promptvault-cli -- improve --json --prompt "make better"
```
