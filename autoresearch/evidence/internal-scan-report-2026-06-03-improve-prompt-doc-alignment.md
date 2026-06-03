# Internal Scan Report: Improve Prompt Doc Alignment

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `bf95f1e`

## Baseline

After `improve --prompt` began rejecting flag-like values, two current-state
documents needed alignment:

- `docs/CLI.md` did not name `improve --prompt` in the required-value rule.
- `completion_audit.md` mentioned the result but did not list the
  `improve --prompt --bogus` smoke command.

## Change

- Updated `docs/CLI.md` to define explicit non-flag values for `improve --prompt`.
- Updated `completion_audit.md` to rename the improve safety row and list the
  flag-like prompt smoke command.

## Verification

```bash
rg -n -- "flag-like|improve --prompt|--prompt --bogus|Improve prompt value safety|explicit non-flag" docs/CLI.md autoresearch/evidence/completion_audit.md
git diff --check
```

Observed:

- Documentation search: PASS.
- Whitespace diff check: PASS.

## Decision

Keep. Current docs now match the prompt parser validation behavior and the
aggregate audit lists the corresponding smoke command.
