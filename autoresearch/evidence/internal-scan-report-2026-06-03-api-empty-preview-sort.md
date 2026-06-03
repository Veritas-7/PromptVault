# Internal Scan Report: API Empty Preview Sort

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `5bde8c9`

## Baseline

After unknown preview-sort values were rejected at the API boundary, source inspection showed that explicit blank values were still accepted.

The RED test confirmed the behavior:

```bash
cargo test --lib preview_sort_rejects_empty_values
```

Observed before implementation:

- The test failed.
- `PreviewSort::from_option(Some("  "))` returned `Ok(Latest)`.

## Selected Candidate

Make `PreviewSort::from_option` treat `None` as default `latest`, but reject `Some(blank)` as invalid input.

## Success Metric

```bash
cargo test --lib preview_sort_rejects_empty_values
cargo test --lib run_scan_rejects_unknown_preview_sort
npm run check
```

Expected:

- Explicit blank preview-sort values fail closed.
- Unknown preview-sort validation remains green.
- Full local check passes.
