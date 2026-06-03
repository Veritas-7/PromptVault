# Internal Scan Report: API Preview Sort

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `c454a12`

## Baseline

After the CLI preview-sort guard, source inspection showed that `run_scan` itself still accepted unknown preview sort values.

The RED test confirmed the behavior:

```bash
cargo test --lib run_scan_rejects_unknown_preview_sort
```

Observed before implementation:

- The test failed.
- `run_scan` returned `Ok(ScanResult { preview_sort: "latest", ... })`.
- Warnings included `Unknown preview sort requested: nonsense; used latest.`

## Selected Candidate

Make `PreviewSort::from_option` return an error for unknown values and propagate that error through `run_scan`.

## Success Metric

```bash
cargo test --lib run_scan_rejects_unknown_preview_sort
cargo test --bin promptvault-cli parse_preview_sort_rejects_unknown_values
npm run check
```

Expected:

- Unknown API preview sort values fail closed.
- Valid CLI preview-sort aliases remain accepted.
- Full local check passes.
