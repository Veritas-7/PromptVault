# Internal Scan Report: Repair Redaction Docs

Generated: 2026-06-03T21:26:27+0900

## Candidate

README and CLI docs still described repair JSON as returning prompt/recommendation pairs without saying the prompt records are redacted. That left the operator-facing safety contract behind the implementation.

## Change

- Documented redacted stdout prompt previews in README and `docs/CLI.md`.
- Documented redacted repair prompt/recommendation pairs in README and `docs/CLI.md`.
- Preserved the distinction that Markdown exports are explicit disk outputs and may contain prompt bodies.

## Verification

Commands:

```bash
rg -n "Stdout prompt previews are capped at 25 records and redacted|deterministic redacted prompt/recommendation pairs" README.md
rg -n "Stdout prompt records are redacted|returns redacted prompt/recommendation pairs" docs/CLI.md
git diff --check
```

Result: PASS. The expected documentation wording is present and the diff whitespace check passed.

## Base Commit

Base commit: `3360cfaab7189df7c3a803b97f5132f60f91584e`
