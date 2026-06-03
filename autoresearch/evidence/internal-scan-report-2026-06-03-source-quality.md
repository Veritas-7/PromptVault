# Internal Scan Report: Source Quality

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `ce76e57`

## Current Strengths

- Global quality metrics are available in scan stats.
- Weakest-first previews and deterministic repair are available.
- Source summaries already report files and prompt counts.

## Current Weakness

Source summaries did not explain which source had weaker prompt history. That made source-level repair prioritization harder, especially when a full scan spans Codex, Claude, Antigravity, and other local stores.

## Selected Candidate

Add source-level quality triage:

- Add `average_quality` to `SourceSummary`.
- Add `weak_prompt_count` to `SourceSummary`.
- Render both fields in Markdown source coverage.
- Render both fields in the UI source panel.
- Keep CLI smoke scans no-export and prompt-body free.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 0 --no-export --json
```

Expected:

- Every source summary includes `average_quality`.
- Every source summary includes `weak_prompt_count`.
- The first 100-prompt smoke reports `average_quality=71.6`.
- The first 100-prompt smoke reports `weak_prompt_count=16`.
- UI render smoke shows source text `Q 55.5 · Weak 1` from a mocked scan result.
