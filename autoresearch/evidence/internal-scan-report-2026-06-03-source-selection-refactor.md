# Internal Scan Report: Source Selection Refactor

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `a0d5e66`

## Baseline

After `run_scan` began rejecting unknown source ids through `validate_source_ids`, the `selected_source_specs` helper still returned unknown-source warnings.

That made validation responsibility split across two helpers even though `run_scan` now fails before selection on invalid source ids.

## Selected Candidate

Refactor `selected_source_specs` to return only selected `SourceSpec` values and keep invalid-id handling in `validate_source_ids`.

## Success Metric

```bash
cargo test --lib selects_requested_sources
cargo test --lib run_scan_rejects_unknown_source_ids
npm run check
```

Expected:

- Source selection helper still returns requested known sources.
- Unknown source API guard remains green.
- Full local check passes.
