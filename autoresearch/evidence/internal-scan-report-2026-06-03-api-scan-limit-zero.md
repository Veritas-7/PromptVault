# Internal Scan Report: API Scan Limit Zero

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `d132140`

## Baseline

After the CLI and UI zero-limit guards, source inspection showed that `run_scan` itself still accepted `ScanOptions { limit: Some(0), ... }`.

## Selected Candidate

Reject `limit: Some(0)` at the `run_scan` API boundary before source traversal.

## Success Metric

```bash
cargo test --lib run_scan_rejects_zero_limit
npm run check
```

Expected:

- `run_scan` returns an error for zero limit.
- Full local check passes.
