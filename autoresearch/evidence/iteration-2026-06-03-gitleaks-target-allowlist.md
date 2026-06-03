# AutoResearch Iteration: Gitleaks Target Allowlist

Date: 2026-06-03

## Objective

Make full-directory `gitleaks` verification reproducible after Tauri/Rust builds
without hiding source files or weakening commit-range checks.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-gitleaks-target-allowlist.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-gitleaks-target-allowlist.md`

Observed issue:

- Full-dir `gitleaks` failed only on ignored generated `libmuda*.rmeta`
  metadata files under `src-tauri/target/`.

## Change

- Added `.gitleaks.toml`.
- Extended default gitleaks rules.
- Allowlisted only generated `src-tauri/target/(debug|release)/deps/libmuda-*.rmeta`.

## Evidence

```bash
gitleaks dir . --no-banner --redact --config /tmp/promptvault-gitleaks-test.toml
gitleaks dir . --no-banner --redact
npm run check
```

Observed:

- Temporary config scan found no leaks.
- In-repo config scan found no leaks.
- Full project check passed.

## Decision

Keep. Full-dir secret scanning is now reproducible after Tauri/Rust builds
while commit-range scanning remains mandatory before GitHub pushes.
