# AutoResearch Iteration: UI Limit Validation

Date: 2026-06-03

## Objective

Validate the scan limit in the UI before invoking the Tauri scan command.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-limit-validation.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-limit-validation.md`

Observed issue:

- `runScan` used `Number(limit)` directly.
- Invalid, decimal, or out-of-range values could reach IPC and produce lower-quality errors.
- The UI `min` did not match the backend's positive limit semantics.

## Change

- Added `parseLimitInput`.
- Empty limit remains valid and maps to `undefined`.
- Non-digit, non-safe-integer, zero, negative, and over-maximum values now produce a local UI error.
- Added `errorText` so UI errors do not show the `Error:` prefix.
- Updated the input `min` to `1` and reused `MAX_SCAN_LIMIT`.

## Evidence

```bash
npm run build
npm run check
```

Observed:

- `npm run build`: PASS.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 10 CLI tests passed, and strict clippy passed.

## Decision

Keep. The UI now fails fast on invalid scan limits before crossing the Tauri boundary.
