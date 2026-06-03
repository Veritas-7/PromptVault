# AutoResearch Iteration: UI Improve Start Reset

Date: 2026-06-03

## Objective

Clear stale recommendation output when a new improvement starts.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-improve-start-reset.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-improve-start-reset.md`

Observed issue:

- The previous recommendation stayed visible while a new improvement request was
  in flight.

## Change

- Added an improvement request-start helper.
- Cleared the visible recommendation at the beginning of `runImprove`.
- Preserved prompt ownership tracking for the in-flight request.

## Evidence

```bash
npm run test:ui
npm run check
```

Observed:

- RED before implementation: missing request-start helper export.
- GREEN after implementation: request start clears stale recommendation state.
- Full check: PASS.

## Decision

Keep. Recommendation output is now reset before each improvement request.
