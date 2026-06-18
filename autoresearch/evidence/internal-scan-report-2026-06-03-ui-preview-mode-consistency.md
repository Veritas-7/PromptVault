# Internal Scan Report: UI Preview Mode Consistency

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `e5c8499`

Code commit: `1baaa07`

## Baseline

`filteredPrompts` used the current Latest/Weakest control state even after a
scan result was loaded. Switching the control after a scan could therefore
change the displayed prompt ordering without fetching a matching backend
preview, while the summary still described the old `ScanResult.preview_sort`.

## RED

```bash
node --experimental-transform-types --test tests/previewMode.test.ts
```

Observed failure before implementation:

- The helper module did not exist, so there was no tested separation between
  loaded-result display mode and pending next-scan mode.

## Change

- Added `src/previewMode.ts`.
- Added `tests/previewMode.test.ts`.
- `App.tsx` now displays loaded prompts according to `ScanResult.preview_sort`.
- The Latest/Weakest control still determines the next scan request.
- `npm run check` now runs the UI helper test before the build and Rust gates.

## Verification

```bash
npm run test:ui
npm run check
```

Observed:

- UI helper tests: PASS, 3 tests.
- Full check: PASS, UI helper tests, Vite build, 31 library tests, 13 CLI
  tests, and strict clippy passed.

## Decision

Keep. The UI no longer changes loaded prompt ordering when the user changes the
pending preview control before running another scan.
