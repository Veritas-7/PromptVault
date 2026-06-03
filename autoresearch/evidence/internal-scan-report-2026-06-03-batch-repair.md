# Internal Scan Report: Batch Repair

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `1dca96c`

## Current Strengths

- PromptVault can request weakest-first bounded previews.
- CLI scan can explicitly include a capped prompt stdout preview.
- CLI improve can force deterministic local-rules recommendations.

## Current Weakness

The repair queue still required callers to manually pipe scan results into separate improve calls. That was workable, but it left the self-improvement loop without a single deterministic command that selects weak prompts and returns repair suggestions.

## Selected Candidate

Add deterministic batch repair:

- Add CLI `repair`.
- Use weakest-first scan internally.
- Disable Markdown export.
- Use deterministic local-rules recommendations.
- Cap repair batches at 10 records.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- repair --json --limit 100 --count 3
```

Expected:

- `provider=local-rules`
- `preview_sort=quality_asc`
- `repair_count=3`
- `markdown_written=false`
- `output_path=null`
- first repair prompt has quality band `weak`
