# Internal Scan Report: Weak-First Preview

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `6980520`

## Current Strengths

- PromptVault scores prompt quality and reports improvement deltas.
- The scan response already supports bounded previews for UI and CLI automation.
- The UI already shows prompt quality pills and selected-prompt suggestions.

## Current Weakness

Bounded previews were latest-first only. That kept large scan payloads safe, but it meant the weakest prompts could be outside the visible repair queue even though PromptVault already knew their quality scores.

## Selected Candidate

Add weak-first preview triage:

- Add `ScanOptions.preview_sort`.
- Keep `latest` as the default.
- Add `quality_asc` and `quality_desc` preview ordering.
- Add CLI `--preview-sort` and shortcut `--weakest-first`.
- Add UI `Latest`/`Weakest` mode controls.

## Success Metric

A bounded no-export smoke scan can request the weakest preview first:

```bash
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
```

Expected:

- `preview_sort=quality_asc`
- `returned_prompt_count=5`
- `markdown_written=false`
- `output_path=null`
