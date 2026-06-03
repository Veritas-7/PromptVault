# AutoResearch Iteration: UI Filtered Selection

Date: 2026-06-03

## Objective

Keep selected prompt details aligned with the active filtered prompt list.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-filtered-selection.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-filtered-selection.md`

Observed issue:

- The detail panel could keep showing a previously selected prompt that was no
  longer visible after applying a search filter.

## Change

- Added a pure selection helper.
- Added three Node UI helper tests.
- Routed selected detail lookup through the filtered prompt list.

## Evidence

```bash
npm run test:ui
npm run check
```

Observed:

- RED before implementation: missing selection helper module.
- GREEN after implementation: selection is preserved only when still visible,
  falls back to the first visible prompt, and returns empty for no matches.
- Full check: PASS.

## Decision

Keep. The selected detail panel now reflects the current filtered list.
