# AutoResearch Iteration: Key-Value Redaction

Date: 2026-06-03

## Change

- Added a Rust regression test proving key/value secret text redacts both key prefix and value.
- Extended the `possible_api_key` regex to include an optional non-whitespace value segment.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-key-value-redaction.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-key-value-redaction.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test redact_sensitive_text_redacts_key_value_pairs` failed before the regex change.
- GREEN: `cargo test redact_sensitive_text_redacts_key_value_pairs` passed.
- Full gate: `npm run check` passed.
- Staged gate: `git diff --cached --check` and `gitleaks protect --staged --verbose` passed for the code commit.

## Result

Prompt preview redaction now covers shorter key/value secrets, not only long token-like values.
