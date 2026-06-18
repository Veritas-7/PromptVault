# Internal Scan Report: NPM Check

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `74aa789`

## Current Weakness

The project had passing local gates, but no single repo-level command to run the common frontend and Rust checks together.

## Selected Candidate

Add `npm run check`.

The script runs:

- `npm run build`
- `cargo test`
- `cargo clippy --all-targets --all-features -- -D warnings`

## Success Metric

```bash
npm run check
```

Expected:

- Vite production build passes.
- Rust tests pass.
- Strict clippy passes.
