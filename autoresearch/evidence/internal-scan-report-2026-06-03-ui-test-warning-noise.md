# Internal Scan Report: UI Test Warning Noise

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `1e32d33`

Code commit: `d26df46`

## Baseline

`npm run test:ui` emitted Node `ExperimentalWarning` lines every time the UI
helper tests ran because they use `--experimental-transform-types`.

## Change

- Added `--disable-warning=ExperimentalWarning` to the `test:ui` script.
- Kept the same Node transformer and test glob.

## Verification

```bash
npm run test:ui
npm run check
```

Observed:

- UI helper tests: PASS, 9 tests, no `ExperimentalWarning` output.
- Full check: PASS, 9 quiet UI helper tests, Vite build, 31 library tests, 13
  CLI tests, and strict clippy passed.

## Decision

Keep. The check output is cleaner without reducing UI helper coverage.
