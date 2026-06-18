# Internal Scan Report: API Scan Output Conflict

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `d8b7788`

## Baseline

After the CLI export conflict guard, source inspection showed that `run_scan` itself still accepted `ScanOptions { output_path: Some(...), write_markdown: Some(false), ... }`.

The RED test confirmed the behavior:

```bash
cargo test --lib run_scan_rejects_output_path_when_export_disabled
```

Observed before implementation:

- The test failed.
- `run_scan` returned `Ok(ScanResult { output_path: None, ... })`.
- Warnings included `Output path ignored because Markdown export was disabled.`

## Selected Candidate

Reject `output_path` at the `run_scan` API boundary when Markdown export is disabled.

## Success Metric

```bash
cargo test --lib run_scan_rejects_output_path_when_export_disabled
npm run check
```

Expected:

- `run_scan` returns an error for the conflicting API options.
- Full local check passes.
