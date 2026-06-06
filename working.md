# PromptVault Working Log

Updated: 2026-06-06 09:37 KST

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Resumed from Codex thread: `019e8bcb-66b7-7443-a79d-46fd3686eadc`

## Previous Slice

External improve risk block.

The prior Codex CLI session stopped while focused risky-output tests were
running. Fresh resume state showed:

- `origin`: `https://github.com/Veritas-7/PromptVault.git`
- Branch: `main`
- Head before this slice: `17640f1a28535bb18c20c380cb7503e32c3e6d8d`
- Uncommitted file at resume: `src-tauri/src/lib.rs`

## Completed In This Resume

- Verified the interrupted focused test with `cargo test "risky_"`.
- Verified the full project gate with `npm run check`.
- Created code commit:
  `cf5e34394a93b478d44524546d6052d6eb21996f`
  (`fix: block risky external improve prompts`).
- Added evidence files for the external improve risk block.
- Updated `autoresearch/evidence/completion_audit.md`.

## Verification Evidence

```bash
cargo test "risky_"
npm run check
git diff --cached --check
gitleaks protect --staged --no-banner --redact
```

Observed:

- Focused tests: 4 passed.
- Full check: UI 10 passed, Vite build passed, Rust lib 45 passed, CLI 15
  passed, doc-tests passed, clippy passed.
- Code staged whitespace and gitleaks checks passed before commit `cf5e343`.

## Resume Instructions

If interrupted again:

1. Run `git status --short --branch`.
2. Read this file and
   `autoresearch/evidence/internal-scan-report-2026-06-03-external-improve-risk-block.md`.
3. Re-run `npm run check` before claiming completion.
4. Before pushing, verify private GitHub remote and run gitleaks on the intended
   push surface.

## Remaining

The external improve risk block slice was committed and pushed at:

- `cf5e34394a93b478d44524546d6052d6eb21996f`
- `2c925efd34210b5963189bb6cb4c6b290657b4d0`

## Current Slice

Full-dir gitleaks generated-artifact hygiene.

Fresh status before this slice:

- Branch: `main`
- Local/remote: clean at `2c925efd34210b5963189bb6cb4c6b290657b4d0`
- Baseline issue: `gitleaks dir . --no-banner --redact` failed only on ignored
  generated `src-tauri/target/**/libmuda*.rmeta` metadata files.

Change in progress:

- Add `.gitleaks.toml` extending default rules.
- Allowlist only generated `src-tauri/target/(debug|release)/deps/libmuda-*.rmeta`.
- Add evidence under `autoresearch/evidence/`.
- Update `completion_audit.md`.

Verification so far:

- Temporary config scan:
  `gitleaks dir . --no-banner --redact --config /tmp/promptvault-gitleaks-test.toml`
  scanned about 839 MB and found no leaks.
- In-repo config scan:
  `gitleaks dir . --no-banner --redact`
  scanned about 839 MB and found no leaks.
- Full project check:
  `npm run check`
  passed UI 10, Vite build, Rust lib 45, CLI 15, doc-tests, and clippy.

Resume state:

- If `git status` still shows `.gitleaks.toml`, evidence, audit, or this
  `working.md` update as uncommitted, stage only those paths, run staged
  whitespace and gitleaks checks, then commit/push the docs/config slice.
- If the worktree is clean and `HEAD...origin/main` returns `0 0`, this slice
  has no remaining work.

---

## Current Goal

2026-06-06 KST: Continue as the autonomous PromptVault app development agent.
Use one cmux in-app browser only, opened in the current session, to click-test
the app's core user flows. Fix issues found in functionality, UI/UX,
stability, performance, and maintainability, then record evidence here.

## Context

- Project root: `/Users/wj/Ai/System/10_Projects/PromptVault`
- Git repo root: `/Users/wj/Ai/System/10_Projects/PromptVault`
- Branch: `main`
- Remote: `origin https://github.com/Veritas-7/PromptVault.git`
- App stack: Tauri 2 + React 19 + TypeScript + Vite, with Rust CLI/backend.
- No project-local `AGENTS.md`, `CLAUDE.md`, `design.md`, or `DESIGN.md` was
  found at resume. Workspace policy comes from `/Users/wj/Ai/CLAUDE.md`,
  `/Users/wj/Ai/System/CLAUDE.md`, and `/Users/wj/Ai/AGENTS.md`.
- Existing `working.md` and `Working.md` resolve to the same root progress file
  on this filesystem.
- Prior memory says the reliable cmux browser commands are
  `cmux browser open <url>` and `cmux new-pane --type browser --url <url>`.
  Prefer read-only cmux checks such as identify/title/snapshot/console before
  optional screenshots.

## Progress

- Loaded workspace policy and relevant QA/testing skills:
  `veritas-ai-workspace-context`, `gstack-qa`, and `webapp-testing`.
- Confirmed fresh git boundary and remote.
- Read `README.md`, `package.json`, app entry files, and the existing
  `Working.md` resume state.
- Implemented permanent SQLite persistence for scan results at
  `/Users/wj/Documents/PromptVault/promptvault.sqlite`.
- Added source/date persistence stats to the scan result and UI.
- Added a local browser bridge server so the cmux in-app browser can exercise
  scan and improve flows without Tauri IPC.
- Confirmed the current cmux workspace `workspace:5` has the active browser
  `surface:11`; used only that surface for manual QA.
- Started Vite on `http://127.0.0.1:5173/` and the PromptVault bridge on
  `http://127.0.0.1:5174/`.
- Verified bridge health:
  `{"database_path":"/Users/wj/Documents/PromptVault/promptvault.sqlite","ok":true}`.
- Ran source-specific real parser/persistence checks. Current DB summary after
  those scans:
  `362 prompts`, `10 sources`, `18 dates`, first date `2026-03-11`.
- Source-specific persistence evidence:
  - `Codex`: 200 stored prompts.
  - `Codex CX`: 20 stored prompts.
  - `Claude Code projects`: 20 stored prompts.
  - `Claude transcripts`: 20 stored prompts.
  - `Claude prompt history`: 20 stored prompts.
  - `Antigravity CLI transcripts`: 20 stored prompts.
  - `Antigravity IDE transcripts`: 12 stored prompts.
  - `Antigravity conversation DB`: 10 stored prompts.
  - `Antigravity prompt history`: 20 stored prompts.
  - `Gemini temporary chats`: 20 stored prompts.
- Real cmux click QA on `surface:11`:
  - Set scan limit to `100`.
  - Clicked the primary Scan button.
  - Observed UI persisted to
    `/Users/wj/Documents/PromptVault/promptvault.sqlite` with
    `stored 362 · new 0 · updated 100`.
  - Observed Markdown export
    `/Users/wj/Documents/PromptVault/promptvault-export-2026-06-06-093438.md`.
  - Observed metrics: `Prompts 100`, `Preview 100`, `Files 46`,
    `Words 35789`, `Quality 67.3`, `Weak 58`, `DB Stored 362`, `Dates 18`.
  - Observed recent prompt dates: `2026-06-06 3`, `2026-06-05 27`,
    `2026-06-04 60`, `2026-06-03 10`.
  - Searched for `cmux` through the UI search box and confirmed filtered
    prompt results.
  - Clicked Improve on a selected prompt. GLM returned HTTP 429, then the app
    used the deterministic local fallback and produced `68 -> 100`, `+32`,
    with resolved gaps `context, constraints, output_format`.
- Browser diagnostics after QA:
  - Console output only showed Vite connection logs.
  - Browser error collector returned `No browser errors`.

## Changes

- `Working.md`: started the 2026-06-06 cmux in-app browser QA slice and added
  explicit current-goal sections for future resume.
- `src-tauri/src/lib.rs`: added persistence schema, scan-run/prompt/source
  upserts, date aggregation, default DB path, latest-file ordering, and tests.
- `src-tauri/src/bin/promptvault-cli.rs`: added persistent scan output fields
  and `serve --addr` browser bridge endpoints.
- `src/browserBridge.ts` and `src/promptVaultApi.ts`: added Tauri/bridge API
  selection for browser QA.
- `src/App.tsx`, `src/App.css`, and `src/types.ts`: surfaced browser bridge
  mode, DB persistence notices, date metrics, and scan/improve results.
- `README.md`, `docs/CLI.md`, and `index.html`: documented persistence,
  browser bridge usage, and replaced the default Vite title.

## Tests

- `npm run test:ui`: 10 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- `cd src-tauri && cargo test`: Rust lib 47 tests passed; CLI 15 tests
  passed.
- `cd src-tauri && cargo test persist_scan_result_upserts_prompt_records`:
  passed.
- `cd src-tauri && cargo test prompts_by_date_counts_iso_dates`: passed.
- `cd src-tauri && cargo run --bin promptvault-cli -- sources --json`: source
  discovery returned available prompt stores.
- `cd src-tauri && cargo run --bin promptvault-cli -- scan --limit 100
  --preview-limit 5 --weakest-first --no-export --json`: persisted 100 Codex
  prompts into the SQLite DB.
- Source-specific limited scans verified Codex CX, Claude, Antigravity, and
  Gemini temporary chat parsers against real local session files.
- `npm run check`: passed after final source/doc updates. This covered UI tests
  10 passed, TypeScript/Vite build, Rust lib 47 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.

## Issues

- Unlimited full scan over `~/.codex/sessions` is not yet practical. The
  directory is about `32G`; a full scan over 28,517 candidate files was killed
  after more than three minutes. Future work should add incremental indexing,
  progress reporting, and a first-class full-import queue before claiming
  exhaustive historical ingestion of the entire Codex store.
- Several limited source scans intentionally stopped at the configured prompt
  limit and reported the expected limit warning.
- GLM improvement path hit HTTP 429 during manual QA; local fallback worked.
- `antigravity-ide-alt-transcripts` had zero matching files on this machine.

## Research

- No new external web research was needed. This slice used local repo state,
  real local prompt stores, the SQLite DB, cmux browser diagnostics, and
  existing project tests.

## Next Steps

1. Stage only explicit changed paths, run staged whitespace/secret checks, then
   commit and push this slice.
2. Add an incremental/full-import planner for the 32G Codex session store.
3. Add UI progress/cancel state for long scans.
