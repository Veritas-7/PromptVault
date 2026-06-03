# Internal Scan Report: UI Limit Validation

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `b878f67`

## Baseline

Source inspection showed that `runScan` parsed the scan limit with direct numeric coercion:

```ts
const parsedLimit = limit.trim() ? Number(limit) : undefined;
```

The input had `min={100}` and `max={100000}`, but click-time validation did not enforce positive whole-number bounds before IPC.

## Selected Candidate

Add a small UI parser that accepts an empty field or a positive whole number within the configured maximum, then surface invalid input as a local error before calling `scan_prompts`.

## Success Metric

```bash
npm run build
npm run check
```

Expected:

- TypeScript/Vite build passes.
- Full local check passes.
- Backend/CLI tests remain green.
