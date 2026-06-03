# Internal Scan Report: UI Recommendation Ownership

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `75a03a1`

Code commit: `f09a27a`

## Baseline

The recommendation panel rendered the last improvement result without tracking
which prompt produced it. If filtering changed the selected detail prompt, a
recommendation for the previous prompt could remain visible.

## RED

```bash
npm run test:ui
```

Observed failure before implementation:

- The new recommendation ownership test failed because
  `src/improvementSelection.ts` did not exist.

## Change

- Added `src/improvementSelection.ts`.
- Added `tests/improvementSelection.test.ts`.
- `App.tsx` now records `improvementPromptId`.
- Recommendation content renders only when it belongs to the currently selected
  prompt.

## Verification

```bash
npm run test:ui
npm run check
```

Observed:

- UI helper tests: PASS, 9 tests.
- Full check: PASS, 9 UI helper tests, Vite build, 31 library tests, 13 CLI
  tests, and strict clippy passed.

## Decision

Keep. Recommendation output now follows the selected prompt instead of showing
stale improvement results.
