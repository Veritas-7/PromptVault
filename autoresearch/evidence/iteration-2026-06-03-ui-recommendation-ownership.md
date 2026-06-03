# AutoResearch Iteration: UI Recommendation Ownership

Date: 2026-06-03

## Objective

Hide stale recommendations when the selected prompt changes.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-recommendation-ownership.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-recommendation-ownership.md`

Observed issue:

- The recommendation panel could keep showing the previous prompt's improvement
  after filtering changed the selected detail prompt.

## Change

- Added a pure recommendation ownership helper.
- Added three Node UI helper tests.
- Stored the prompt id that produced the current improvement.
- Rendered recommendation details only when the current selected prompt matches.

## Evidence

```bash
npm run test:ui
npm run check
```

Observed:

- RED before implementation: missing recommendation ownership helper module.
- GREEN after implementation: improvement output is active only for its owning
  selected prompt.
- Full check: PASS.

## Decision

Keep. The recommendation panel now stays aligned with current selection.
