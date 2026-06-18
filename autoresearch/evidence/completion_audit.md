# PromptVault Public Completion Audit

Last updated: 2026-06-18

This audit is public-safe. It intentionally avoids local account names, private
session identifiers, prompt bodies, local database dumps, and machine-specific
absolute paths.

## Current Release Posture

| Area | Evidence | Status |
|---|---|---|
| Public source safety | Source tree contains no committed prompt database or raw source-session dump | PASS |
| GitHub visibility | `Veritas-7/PromptVault` is public | PASS |
| Secret scan | `gitleaks dir . --no-banner --redact` and full-history `gitleaks detect --source . --log-opts --all --redact 100 --no-banner` | PASS |
| Local-first architecture | Source discovery resolves from the current user's home directory | PASS |
| Incremental imports | `import-batch` stores cursors and per-file ledgers, then processes only new/changed/error/missing files after completion | PASS |
| Hermes support | Hermes CLI/profile/app source specs and JSON/JSONL user-message parsing are implemented | PASS |
| Vault deletion audit | `vault-audit` checks SQLite integrity, completed cursors, source-path coverage, per-file ledger status, live source-file presence, and parser/hash errors | PASS |
| Live source deletion detection | `vault_audit_detects_live_deleted_files_without_import_refresh` covers deletion before a later import refresh | PASS |
| Browser bridge audit path | `/api/vault-audit` shares the same DB-backed audit path as CLI/Tauri | PASS |
| Stored search/facets | Stored prompts can be filtered by source/date/project/workspace/text and summarized by facets | PASS |
| Prompt-improvement safety | External AI routes are optional and risk-pattern prompt/context text is blocked or redacted before external routing | PASS |
| Work-management boundary | Project/date work views keep prompts as supporting evidence, not the core product boundary | PASS |

## Verification Commands

```bash
cargo fmt --check
cargo test --lib vault_audit --quiet
cargo test --lib import_batch_marks_missing_stored_paths --quiet
cargo test --bin promptvault-cli bridge_ --quiet
npm run check
npm run qa:browser-bridge
git diff --check
gitleaks dir . --no-banner --redact
gitleaks detect --source . --log-opts --all --redact 100 --no-banner
```

## Public Data Boundary

The repository contains source code, tests, docs, and public-safe audit notes.
It does not include:

- `~/Documents/PromptVault/promptvault.sqlite`
- raw Claude/Codex/Hermes/Antigravity/Gemini session stores
- API keys or provider credential files
- exported Markdown prompt corpora
- private local work-session identifiers

## Residual Operator Boundary

PromptVault can prove whether its SQLite vault is ready to replace raw source
logs, but it does not delete originals. Operators must run `vault-audit` and
review `deletion_ready`, `strict_source_backed_ready`, blockers, warnings, and
missing-file classification before deleting or archiving source logs.
