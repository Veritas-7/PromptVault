# AutoResearch Iteration: Local Recommendation Redaction

Date: 2026-06-03

## Change

- Added a Rust regression test proving deterministic recommendations do not copy risky original prompt text into `revised_prompt`.
- Changed `local_improvement` to derive its goal line from redacted prompt text.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-local-recommendation-redaction.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-local-recommendation-redaction.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test local_improvement_redacts_risky_original_sentence` failed before the implementation change.
- GREEN: `cargo test local_improvement_redacts_risky_original_sentence` passed.
- Full gate: `npm run check` passed.
- Staged gate: `git diff --cached --check` and `gitleaks protect --staged --verbose` passed for the code commit.

## Result

Local recommendations now avoid echoing risky prompt text through the copied goal line.
