# AutoResearch Iteration: README Repair Count

Date: 2026-06-03

## Objective

Align README repair count wording with current CLI validation.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-readme-repair-count.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-readme-repair-count.md`

Observed issue:

- README used `repair --json --count N`.
- Current CLI requires `--count N>0`.
- README already documented the 10-record cap.

## Change

- Updated README to `repair --json --count N>0`.

## Evidence

```bash
rg -n "repair --json --count N>0|capped at 10" README.md docs/CLI.md
git diff --check
```

Observed:

- README and CLI docs repair count search: PASS.
- Whitespace diff check: PASS.

Note:

- An intermediate ripgrep command with lookahead failed because default ripgrep regex does not support look-around; it was replaced with simple searches.

## Decision

Keep. README now matches the current repair count contract.
