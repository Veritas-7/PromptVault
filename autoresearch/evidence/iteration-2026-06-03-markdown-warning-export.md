# AutoResearch Iteration: Markdown Warning Export

Date: 2026-06-03

## Objective

Preserve scan warnings inside saved Markdown exports.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-markdown-warning-export.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-markdown-warning-export.md`

Observed issue:

- `ScanResult.warnings` were visible in JSON/stdout/UI.
- Markdown exports omitted those warnings, so saved limited-scan files were not
  self-describing.

## Change

- Added warning support to `render_markdown`.
- Added a warning export unit test.

## Evidence

```bash
cargo test --lib markdown_export_includes_scan_warnings
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --output /tmp/promptvault-warning-export.md --json
npm run check
```

Observed:

- RED before implementation: renderer had no warning contract.
- GREEN after implementation: warning export test passed.
- Real Markdown smoke: PASS, file contained the configured-limit warning.
- Full check: PASS.

## Decision

Keep. Markdown scan artifacts now preserve warning context.
