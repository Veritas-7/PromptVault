# Internal Scan Report: Gitleaks Target Allowlist

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before iteration: `2c925efd34210b5963189bb6cb4c6b290657b4d0`

## Baseline

`gitleaks dir . --no-banner --redact` failed with three findings. Redacted
report inspection showed all findings were in ignored generated build metadata:

- `src-tauri/target/debug/deps/libmuda-*.rmeta`
- `src-tauri/target/release/deps/libmuda-*.rmeta`

The files were not tracked and matched `src-tauri/.gitignore`.

## Change

Add `.gitleaks.toml` that extends the default rules and allowlists only:

```text
^src-tauri/target/(debug|release)/deps/libmuda-[a-f0-9]+\.rmeta$
```

## Verification

```bash
gitleaks dir . --no-banner --redact --config /tmp/promptvault-gitleaks-test.toml
gitleaks dir . --no-banner --redact
npm run check
```

Observed:

- Temporary config scan: PASS, scanned about 839 MB and found no leaks.
- In-repo config scan: PASS, scanned about 839 MB and found no leaks.
- Full project check: PASS, 10 UI tests, Vite build, 45 Rust library tests,
  15 CLI tests, doc-tests, and strict clippy.

## Decision

Keep. This addresses generated metadata false positives without allowing
arbitrary `target/` content or weakening commit-range scans.
