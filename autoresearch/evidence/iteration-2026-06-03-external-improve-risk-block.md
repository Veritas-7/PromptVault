# AutoResearch Iteration: External Improve Risk Block

Date: 2026-06-03

## Objective

Avoid sending risky prompt or context text to the external GLM improve path.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-external-improve-risk-block.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-external-improve-risk-block.md`

Observed issue:

- Existing redaction protected stdout previews and local recommendation text,
  but external improve routing needed an explicit fail-closed guard before any
  GLM request construction.

## Change

- Added prompt/context risk preflight for external improve.
- Kept fallback local and non-networked when risk is detected.
- Redacted risky context in deterministic local output.

## Evidence

```bash
cargo test "risky_"
npm run check
```

Observed:

- Focused guard and local-output tests passed.
- Full check passed with 45 Rust library tests and 15 CLI tests.

## Decision

Keep. The external GLM boundary now matches the safer stdout/local-redaction
contract from the previous iterations.
