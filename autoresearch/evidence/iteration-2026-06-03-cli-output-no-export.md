# AutoResearch Iteration: CLI Output No-Export

Date: 2026-06-03

## Objective

Make `promptvault-cli scan --output ... --no-export` fail closed.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-output-no-export.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-output-no-export.md`

Observed issue:

- `scan --output /tmp/file.md --no-export` exited `0`.
- The command ignored the output path and only reported a warning.
- This could make automation believe a requested markdown export was written.

## Change

- Added `validate_scan_output_options`.
- `scan` now rejects `--output` when `--no-export` is also set.
- Added a CLI unit test for the conflict.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli validate_scan_output_options_rejects_no_export_output
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --output /tmp/promptvault-no-export.md --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --output /tmp/promptvault-valid-export.md --preview-limit 0 --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Output/no-export unit test: PASS.
- Conflicting options: PASS, exited `1` with `--output cannot be used with --no-export`.
- Valid output export: PASS, exited `0` with `markdown_written: true`.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 11 CLI tests passed, and strict clippy passed.

## Decision

Keep. The CLI no longer silently ignores a requested output file when export is disabled.
