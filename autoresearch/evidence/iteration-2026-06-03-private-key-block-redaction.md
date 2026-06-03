# AutoResearch Iteration: Private-Key Block Redaction

Date: 2026-06-03

## Change

- Added a Rust regression test proving private-key block redaction removes the whole block.
- Extended the `private_key` regex to include body and footer text instead of matching only the header.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-private-key-block-redaction.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-private-key-block-redaction.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test redact_sensitive_text_redacts_private_key_blocks` failed before the regex change.
- GREEN: `cargo test redact_sensitive_text_redacts_private_key_blocks` passed.
- Full gate: `npm run check` passed.
- Staged gate: `git diff --cached --check` and `gitleaks protect --staged --verbose` passed for the code commit.

## Result

Prompt preview redaction now covers complete private-key blocks, not only their opening header.
