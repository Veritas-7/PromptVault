# Internal Scan Report: Local Improve

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `1665864`

## Current Strengths

- PromptVault reports quality deltas for both GLM and local recommendations.
- The weak-first CLI repair queue can expose bounded prompt bodies through explicit `--include-prompts`.
- The local fallback is deterministic and testable.

## Current Weakness

`promptvault-cli improve` still preferred GLM whenever keys were present. Previous live smoke observed a `429` followed by fallback, which proved fallback but made deterministic evaluation depend on external failure. Repair queue automation needs an explicit local provider path.

## Selected Candidate

Add deterministic local improve:

- Add optional `ImproveRequest.force_local`.
- Add CLI `improve --local`.
- Keep Tauri UI behavior unchanged.
- Bypass GLM entirely when local mode is requested.

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- improve --local --json --prompt "make better"
```

Expected:

- `provider=local-rules`
- `used_ai=false`
- `warnings=[]`
- positive `quality_delta.score_delta`
