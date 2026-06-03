# AutoResearch Iteration: Improve Prompt Doc Alignment

Date: 2026-06-03

## Objective

Align current docs with the new `improve --prompt` required-value validation.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-prompt-doc-alignment.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-prompt-doc-alignment.md`

Observed issue:

- CLI docs did not explicitly include `improve --prompt` in the non-flag value
  rule.
- Aggregate audit command history did not show the flag-like prompt smoke.

## Change

- Added `improve --prompt` to the CLI required-value rule.
- Added the `improve --prompt --bogus` smoke command to the aggregate audit.

## Evidence

```bash
rg -n -- "flag-like|improve --prompt|--prompt --bogus|Improve prompt value safety|explicit non-flag" docs/CLI.md autoresearch/evidence/completion_audit.md
git diff --check
```

Observed:

- Documentation search: PASS.
- Whitespace diff check: PASS.

## Decision

Keep. The user-facing CLI guide and aggregate audit now describe the same
prompt-value validation contract.
