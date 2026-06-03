# AutoResearch Iteration: GLM Blank API Key

Date: 2026-06-03

## Objective

Make blank GLM API key configuration safe.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-api-key.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-api-key.md`

Observed issue:

- Blank `GLM_API_KEY` values prevented fallback to `GLM_API_KEY_2`.

## Change

- Added a non-empty environment value helper.
- Added GLM API key selection coverage.
- Routed GLM API key lookup through the helper.

## Evidence

```bash
cargo test --lib glm_api_key_selection_ignores_blank_primary_key
npm run check
```

Observed:

- RED before implementation: no dedicated key-selection helper or blank-value
  filtering existed.
- GREEN after implementation: blank `GLM_API_KEY` is ignored and
  `GLM_API_KEY_2` is selected.
- Full check: PASS.

## Decision

Keep. GLM API key selection is now safe for blank primary-key configuration.
