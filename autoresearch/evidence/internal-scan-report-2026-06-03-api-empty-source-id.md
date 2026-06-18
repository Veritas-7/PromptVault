# Internal Scan Report: API Empty Source ID

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `77ed664`

## Baseline

After unknown source ids were rejected at the API boundary, source inspection showed that explicit empty API selections were still accepted.

The RED test confirmed the behavior:

```bash
cargo test --lib run_scan_rejects_empty_source_ids
```

Observed before implementation:

- The test failed.
- `run_scan` returned `Ok(ScanResult { total_prompts: 1, ... })`.
- Even with `limit: Some(1)`, the baseline touched Codex session files because the empty source list was interpreted like "all sources".

## Selected Candidate

Make `validate_source_ids` reject `source_ids: Some([])` and blank-only source id lists.

## Success Metric

```bash
cargo test --lib run_scan_rejects_empty_source_ids
cargo test --lib run_scan_rejects_unknown_source_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
npm run check
```

Expected:

- Empty API source selections fail closed before source traversal.
- Unknown source validation remains green.
- CLI empty-source parser test remains green.
- Full local check passes.
