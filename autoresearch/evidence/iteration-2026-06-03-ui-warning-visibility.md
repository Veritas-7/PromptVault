# AutoResearch Iteration: UI Warning Visibility

Date: 2026-06-03

## Objective

Surface backend scan warnings in the PromptVault UI.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-warning-visibility.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-warning-visibility.md`

Observed issue:

- `ScanResult.warnings` existed in the frontend type but was not displayed.
- Limited-scan warning messages could be hidden even though the backend returned
  them.

## Change

- Added a warning notice below the scan output notice.
- Added `.notice.warning` styling consistent with the existing notice system.

## Evidence

```bash
rg -n "notice warning|result\\.warnings|warnings\\.join" src/App.tsx src/App.css
npm run check
```

Observed:

- Warning rendering search: PASS.
- Full check: PASS.

## Decision

Keep. UI now exposes scan warnings while preserving the existing layout.
