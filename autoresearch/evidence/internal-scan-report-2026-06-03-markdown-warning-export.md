# Internal Scan Report: Markdown Warning Export

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `91fac7b`

Code commit: `0f6a429`

## Baseline

`run_scan` returned warnings through JSON/stdout and the UI now displays them,
but saved Markdown exports did not include warnings. A limited export could
therefore be separated from the warning that it stopped at the configured prompt
limit.

## RED

```bash
cargo test --lib markdown_export_includes_scan_warnings
```

Observed failure before implementation:

- Compile failed because `render_markdown` accepted only generated time, stats,
  and prompts. Warnings were not part of the renderer contract.

## Change

- `render_markdown` now accepts `warnings: &[String]`.
- Markdown exports include a `## Warnings` section when warnings are present.
- Added `markdown_export_includes_scan_warnings`.

## Verification

```bash
cargo fmt --all
cargo test --lib markdown_export_includes_scan_warnings
cargo test --lib markdown_source_coverage_includes_quality_triage
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --output /tmp/promptvault-warning-export.md --json
rg -n "## Warnings|Scan stopped at configured limit of 1 prompts" /tmp/promptvault-warning-export.md
npm run check
```

Observed:

- New warning export test: PASS.
- Existing source coverage markdown test: PASS.
- Real limited Markdown smoke: PASS, warning section persisted in the file.
- Full check: PASS, Vite build, 26 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Markdown exports are now self-describing when scans produce warnings.
