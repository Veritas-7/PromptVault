# AutoResearch Iteration: GLM Empty Revised Prompt

Date: 2026-06-03

## Objective

Prevent empty GLM `revised_prompt` content from being returned as a successful
AI recommendation.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-empty-revised-prompt.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-empty-revised-prompt.md`

Observed issue:

- Parsed GLM JSON did not require a non-empty `revised_prompt`.

## Change

- Added a parser helper for GLM content.
- Empty JSON `revised_prompt` now returns `None`, triggering local fallback.

## Evidence

```bash
cargo test --lib glm_content_parser_rejects_empty_revised_prompt
npm run check
```

Observed:

- RED before implementation: no parser contract existed.
- GREEN after implementation: empty `revised_prompt` is rejected.
- Full check: PASS.

## Decision

Keep. GLM success responses now need a usable revised prompt.
