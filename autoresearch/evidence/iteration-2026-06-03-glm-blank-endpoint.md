# AutoResearch Iteration: GLM Blank Endpoint

Date: 2026-06-03

## Objective

Make blank GLM endpoint configuration safe.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-endpoint.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-glm-blank-endpoint.md`

Observed issue:

- Blank endpoint input normalized to `/chat/completions`.

## Change

- Added a default GLM chat endpoint constant.
- Blank endpoint strings now resolve to the default.

## Evidence

```bash
cargo test --lib normalizes_glm_base_endpoint
npm run check
```

Observed:

- RED before implementation: blank endpoint returned a relative URL.
- GREEN after implementation: blank endpoint returns the default chat
  completions URL.
- Full check: PASS.

## Decision

Keep. Endpoint normalization is now safe for blank configured values.
