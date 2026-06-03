# AutoResearch Iteration: Risky Preview Redaction

Date: 2026-06-03

## Change

- Added a CLI regression test proving JSON prompt previews redact long token-like text.
- Added `redact_sensitive_text` in the library and used it for cloned CLI JSON preview records.
- Kept prompt bodies omitted by default; redaction applies only to the opt-in preview records.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-risky-preview-redaction.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-risky-preview-redaction.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test json_prompt_preview_redacts_long_token_text` failed before the implementation.
- GREEN: `cargo test json_prompt_preview_redacts_long_token_text` passed.
- Full gate: `npm run check` passed.
- Post-fix smoke: Claude history preview returned `containsRawSkToken=false` and `containsRedaction=true`.

## Result

CLI prompt previews no longer print risky token-like text verbatim when `--include-prompts` is used.
