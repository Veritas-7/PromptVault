# Internal Scan Report: CLI Prompt Preview

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `d65921b`

## Current Strengths

- PromptVault can sort bounded previews by weakest prompt quality.
- CLI scan JSON omits prompt bodies by default.
- The scan result already contains bounded `PromptRecord` previews internally.

## Current Weakness

The CLI could report `preview_sort=quality_asc`, but agents could not inspect the selected weak prompts from stdout. That made `--weakest-first` useful as a count-level smoke but not enough for a direct repair queue.

## Selected Candidate

Add explicit bounded stdout prompt preview:

- Add `scan --include-prompts`.
- Keep prompt bodies omitted by default.
- Cap stdout prompt previews at 25 records.
- Preserve `--no-export` compatibility so agents can inspect a small repair queue without creating a Markdown export.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
```

Expected:

- `prompt_stdout_count=5`
- `preview_sort=quality_asc`
- first prompt has quality band `weak`
- `markdown_written=false`
- `output_path=null`
