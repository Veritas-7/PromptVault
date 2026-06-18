# Internal Scan Report: API Source ID

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `fb2d4be`

## Baseline

After the CLI source-id guard, source inspection showed that `run_scan` itself still accepted unknown source ids.

The RED test confirmed the behavior:

```bash
cargo test --lib run_scan_rejects_unknown_source_ids
```

Observed before implementation:

- The test failed.
- `run_scan` returned `Ok(ScanResult { total_prompts: 0, ... })`.
- Warnings included `Unknown source id requested: missing-source`.

## Selected Candidate

Add a `run_scan` source-id validation guard while preserving the existing `selected_source_specs` helper behavior for its direct unit test.

## Success Metric

```bash
cargo test --lib run_scan_rejects_unknown_source_ids
cargo test --lib selects_requested_sources_and_warns_for_unknown_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
npm run check
```

Expected:

- Unknown API source ids fail closed.
- Existing source selection helper behavior remains covered.
- CLI source-id parser test remains green.
- Full local check passes.
