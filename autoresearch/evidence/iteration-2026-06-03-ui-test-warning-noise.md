# AutoResearch Iteration: UI Test Warning Noise

Date: 2026-06-03

## Objective

Keep UI helper test output readable during the full check gate.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-test-warning-noise.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-ui-test-warning-noise.md`

Observed issue:

- The UI helper tests passed but printed repeated Node `ExperimentalWarning`
  lines during every `npm run check`.

## Change

- Suppressed the specific `ExperimentalWarning` class in the `test:ui` command.
- Kept the same test files and transform mode.

## Evidence

```bash
npm run test:ui
npm run check
```

Observed:

- UI helper tests: PASS, 9 tests, no warning noise.
- Full check: PASS.

## Decision

Keep. The quality gate now reports the meaningful test results more cleanly.
