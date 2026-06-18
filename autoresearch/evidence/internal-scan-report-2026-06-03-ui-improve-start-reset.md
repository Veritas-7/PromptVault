# Internal Scan Report: UI Improve Start Reset

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `fc370ab`

Code commit: `77ffa32`

## Baseline

`runImprove` did not clear the previous recommendation when a new improvement
request started. While the request was in flight, or if it failed, the panel
could keep showing stale output for the same prompt.

## RED

```bash
npm run test:ui
```

Observed failure before implementation:

- The new improvement-start reset test failed because
  `improvementRequestStarted` was not exported.

## Change

- Added `improvementRequestStarted`.
- `runImprove` now clears `improvement` and records the request prompt id before
  invoking the backend.

## Verification

```bash
npm run test:ui
npm run check
```

Observed:

- UI helper tests: PASS, 10 tests.
- Full check: PASS, 10 quiet UI helper tests, Vite build, 32 library tests, 13
  CLI tests, and strict clippy passed.

## Decision

Keep. Starting an improvement no longer leaves stale recommendation output
visible during the request.
