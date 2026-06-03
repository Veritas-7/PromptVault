# Internal Scan Report: API Empty Output Path

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `4f268a0`

## Baseline

After the API export conflict guard, source inspection showed that explicit blank output paths were not validated at the API boundary.

The RED test confirmed the behavior:

```bash
cargo test --lib run_scan_rejects_empty_output_path
```

Observed before implementation:

- The test failed.
- `run_scan` did not return the expected `output path requires a non-empty value` error.

## Selected Candidate

Reject blank `output_path` values before export conflict checks, preview sort parsing, source validation, source traversal, and filesystem writes.

## Success Metric

```bash
cargo test --lib run_scan_rejects_empty_output_path
cargo test --lib run_scan_rejects_output_path_when_export_disabled
cargo test --bin promptvault-cli parse_required_args_reject_missing_flag_like_or_empty_values
npm run check
```

Expected:

- Empty API output paths fail closed.
- Existing output-path export conflict validation remains green.
- CLI required-value parser test remains green.
- Full local check passes.
