# AutoResearch Iteration: Repair Redaction Docs

Date: 2026-06-03

## Change

- Updated README to state stdout prompt previews are capped and redacted for token/key/private-key risk patterns.
- Updated README to describe repair JSON as deterministic redacted prompt/recommendation pairs.
- Updated `docs/CLI.md` with the same stdout and repair JSON safety contract.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-repair-redaction-docs.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-repair-redaction-docs.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- `rg -n "Stdout prompt previews are capped at 25 records and redacted|deterministic redacted prompt/recommendation pairs" README.md` passed.
- `rg -n "Stdout prompt records are redacted|returns redacted prompt/recommendation pairs" docs/CLI.md` passed.
- `git diff --check` passed.

## Result

The CLI documentation now matches the redacted stdout and repair JSON behavior.
