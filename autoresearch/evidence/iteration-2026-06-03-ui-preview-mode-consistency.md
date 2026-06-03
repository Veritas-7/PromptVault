# AutoResearch Iteration: UI Preview Mode Consistency

Date: 2026-06-03

## Objective

Keep loaded prompt ordering consistent with the backend preview result.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-preview-mode-consistency.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-preview-mode-consistency.md`

Observed issue:

- Changing the Latest/Weakest control after a scan changed the client-side
  display mode without fetching a new matching backend preview.

## Change

- Added a pure preview-mode helper.
- Added a Node UI helper test without adding dependencies.
- Wired loaded prompt display mode to `ScanResult.preview_sort`.
- Kept scan requests tied to the pending control.

## Evidence

```bash
npm run test:ui
npm run check
```

Observed:

- RED before implementation: missing helper module.
- GREEN after implementation: loaded display mode follows the backend result,
  pending control still controls the next scan request.
- Full check: PASS.

## Decision

Keep. The prompt list and scan summary now stay aligned until a new scan runs.
