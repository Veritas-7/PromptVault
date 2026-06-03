# Internal Scan Report: UI Warning Visibility

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `915c089`

Code commit: `c96108f`

## Baseline

The backend returns `ScanResult.warnings` for actionable scan status, such as
configured-limit stops. The UI displayed the scan output path and preview count
but did not render warnings, leaving those messages hidden.

## Change

- Added a warning notice that renders `result.warnings`.
- Reused the existing `notice` layout and added a `warning` color variant.

## Verification

```bash
rg -n "notice warning|result\\.warnings|warnings\\.join" src/App.tsx src/App.css
npm run check
git diff --check
```

Observed:

- Warning rendering search: PASS.
- Full check: PASS, Vite build, 24 library tests, 13 CLI tests, and strict
  clippy passed.
- Whitespace diff check: PASS.

## Decision

Keep. Scan warnings now reach the user without changing backend behavior or the
existing dashboard layout.
