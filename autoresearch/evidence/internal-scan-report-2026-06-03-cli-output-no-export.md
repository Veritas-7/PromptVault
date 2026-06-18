# Internal Scan Report: CLI Output No-Export

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `726ff8a`

## Baseline

Contradictory output options exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --output /tmp/promptvault-no-export.md --no-export --json
```

Observed:

- `output_path`: `null`
- `markdown_written`: `false`
- Warning: `Output path ignored because Markdown export was disabled.`

## Selected Candidate

Reject `--output` together with `--no-export` in the CLI before calling `run_scan`.

## Success Metric

```bash
cargo test --bin promptvault-cli validate_scan_output_options_rejects_no_export_output
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --output /tmp/promptvault-no-export.md --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --output /tmp/promptvault-valid-export.md --preview-limit 0 --json
npm run check
```

Expected:

- Contradictory options exit non-zero.
- Valid output export still exits `0` with `markdown_written: true`.
- Full local check passes.
