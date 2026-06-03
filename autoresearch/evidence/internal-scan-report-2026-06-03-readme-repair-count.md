# Internal Scan Report: README Repair Count

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `c84b0ce`

## Baseline

`README.md` described deterministic repair as `repair --json --count N`.

The current CLI contract is stricter:

- `--count` must be positive.
- Repair batches are capped at 10 records.

## Selected Candidate

Update README wording to `repair --json --count N>0` while preserving the cap note.

## Success Metric

```bash
rg -n "repair --json --count N>0|capped at 10" README.md docs/CLI.md
git diff --check
```

Expected:

- README uses `N>0`.
- README and CLI docs still mention the cap.
- Diff whitespace check passes.
