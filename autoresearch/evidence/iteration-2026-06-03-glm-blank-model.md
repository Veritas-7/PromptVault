# AutoResearch Iteration: GLM Blank Model

Date: 2026-06-03

## Objective

Make blank GLM model configuration safe.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-model.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-model.md`

Observed issue:

- Blank `GLM_CODING_MODEL` values were preserved and would be sent in the GLM
  request body.

## Change

- Added a default GLM model constant.
- Added model selection coverage.
- Routed GLM model lookup through a non-empty-value helper.

## Evidence

```bash
cargo test --lib glm_model_selection_ignores_blank_model
npm run check
```

Observed:

- RED before implementation: no dedicated model-selection helper or blank-value
  fallback existed.
- GREEN after implementation: blank `GLM_CODING_MODEL` resolves to `glm-4.6`.
- Full check: PASS.

## Decision

Keep. GLM model selection is now safe for blank model configuration.
