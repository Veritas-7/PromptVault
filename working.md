# PromptVault Working Log

Last updated: 2026-06-18

This file is intentionally public-safe. It records the current release posture
without local account names, private session identifiers, source prompt bodies,
or machine-specific database contents.

## Current Status

- Repository: public GitHub source repo.
- App type: local-first Tauri + React + TypeScript prompt/work-history vault.
- Default database: `~/Documents/PromptVault/promptvault.sqlite`.
- Raw prompt/session source files and generated SQLite databases are not
  committed to this repository.
- Source discovery is home-relative and should resolve against each user's own
  macOS home directory.

## Current Public-Safe Completion State

- Incremental import stores per-file byte count, modified time, SHA-256,
  prompt count, parser status, parse timestamp, and missing-source state.
- Completed import sources detect new, changed, missing, and previously errored
  files instead of reparsing every source file.
- Hermes CLI/profile/app sources are supported alongside Codex, Codex CX,
  Claude, Antigravity, Gemini, and project progress logs.
- Stored prompt search supports source, date, project, workspace, quality, and
  prompt text filtering. SQLite FTS5 is used for stored text search when
  available, with regular SQLite filtering as a fallback.
- Timestamp fallback now covers explicit source timestamps, epoch-millis file
  names, compact `YYYYMMDD_HHMMSS` file names, and source file modified time.
  This reduces `unknown-date` rows for Hermes and Antigravity conversation
  sources that do not always store explicit timestamps.
- Prompt improvement can use configured OpenAI/GLM providers, with deterministic
  local fallback when providers are unavailable. The local fallback preserves
  short multi-clause user requests instead of truncating at the first question
  mark.
- Work-management views group evidence by project/date and keep prompt-like
  text as supporting evidence rather than the product boundary.

## Deletion-Readiness Boundary

PromptVault does not delete original source files. Before deleting or archiving
source logs, run:

```bash
cd src-tauri
cargo run --bin promptvault-cli -- vault-audit --json
```

Strict mode requires SQLite integrity, completed import cursors, per-file
ledger coverage, no parser/hash errors, and live source-file presence.

After intentional deletion/archival, run:

```bash
cd src-tauri
cargo run --bin promptvault-cli -- vault-audit --allow-source-file-deletion --json
```

This accepts missing files only when they already have sealed `ok` byte/hash
ledger rows. Use `--allow-legacy-missing` only when explicitly accepting files
that were already missing before PromptVault could hash them.

Audit output includes `deletion_readiness_status` so operators can distinguish
strict readiness from policy-accepted states such as sealed missing files or
explicitly accepted legacy missing files.

## Verification Gates

Use these before a public push:

```bash
cargo fmt --check
cargo test --lib vault_audit --quiet
npm run check
npm run qa:browser-bridge
git diff --check
gitleaks dir . --no-banner --redact
gitleaks detect --source . --log-opts --all --redact 100 --no-banner
```

`npm run check:release` remains the broad local release preflight, including
frontend/Rust checks, browser bridge QA, gitleaks, and Tauri production
packaging.
