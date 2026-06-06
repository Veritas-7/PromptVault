# PromptVault Working Log

Updated: 2026-06-06 10:18 KST

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
- Final post-commit cmux check on the same `surface:11`:
  - Browser title: `PromptVault`.
  - URL: `http://127.0.0.1:5173/`.
  - Ran limit `10` scan from the UI.
  - Observed DB notice:
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 362 · new 0 · updated 10`.
  - Observed export:
    `/Users/wj/Documents/PromptVault/promptvault-export-2026-06-06-094325.md`.
  - Observed metrics: `Prompts 10`, `Files 8`, `Quality 64.4`,
    `Weak 6`, `DB Stored 362`, `Dates 18`.
  - Console still only showed Vite connection logs.
  - Browser error collector returned `No browser errors`.
- Code slice committed and pushed:
  `6fb14662d6627c507b5af458554b8656a0eae3d9`
  (`feat: persist prompt scans to sqlite`).
- After push, `git rev-list --left-right --count HEAD...origin/main` returned
  `0 0`.
- Continued with the next thin slice: scan planning before unrestricted
  historical imports.
- Added a metadata-only import plan path that inventories matching source files
  and bytes without reading prompt bodies.
- Real Codex CLI plan evidence:
  `cargo run --bin promptvault-cli -- plan --source codex --json`
  returned `25,097` matching files, `34,710,445,142` bytes (`32.3 GiB`),
  `81` large files, and explicit warnings to use a prompt limit or incremental
  import slices before an unrestricted scan.
- Added browser bridge `/api/plan` and verified it with curl against the live
  local bridge.
- Real cmux click QA on the same `surface:11`:
  - Reloaded `http://127.0.0.1:5173/`.
  - Confirmed the new `Plan` button rendered.
  - Clicked `Plan`.
  - Observed `Import Plan` panel with `Sources 11 / 11`, `Files 27,977`,
    `Size 33.2 GiB`, and `Large Files 85`.
  - Observed source rows including `Codex 25,097 · 32.3 GiB`, `Claude Code
    projects 1,722 · 714.2 MiB`, and the empty Antigravity alt source note.
  - Console output only showed Vite connection logs.
  - Browser error collector returned `No browser errors`.
- Continued with the next thin slice: resumable per-source import batches.
- Added a SQLite `import_states` cursor table and `import-batch` flow that
  imports one source in file-count slices and advances `next_file_index`.
- Real CLI import-batch evidence:
  `cargo run --bin promptvault-cli -- import-batch --source antigravity-ide-transcripts --files 1 --reset --json`
  returned `processed 1 / total 3`, `batch_files 1`, `batch_prompts 2`, and
  `completed false`.
- Verified DB cursor after CLI batch:
  `antigravity-ide-transcripts|1|3|2|0`.
- Added browser bridge `/api/import-batch`, restarted the bridge, and verified
  the endpoint through the UI.
- Real cmux click QA on the same `surface:11`:
  - Reloaded `http://127.0.0.1:5173/`.
  - Clicked `Plan`.
  - Clicked the `Import Batch` button for `antigravity-ide-transcripts`.
  - Observed `Incremental Import` panel showing `Processed 3 / 3`,
    `2 files · 10 prompts`, and `Status Complete`.
  - Observed DB notice:
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 362 · new 0 · updated 10`.
  - Browser console returned `No console entries`.
  - Browser error collector returned `No browser errors`.
- Verified DB cursor after UI batch:
  `antigravity-ide-transcripts|3|3|12|1`.
- Continued with the next thin slice: continuous per-source import progress and
  stop controls.
- Added `Run Until Done` next to each source in the import plan, plus an
  immediate `Stop` control in the `Incremental Import` panel for continuous
  runs. Stop requests are honored after the current backend batch so the saved
  SQLite cursor remains valid.
- Added progress percentage, running/stopping/stopped/complete status labels,
  and current-source fallback state so a continuous run shows the selected
  source immediately before the first batch response returns.
- Real cmux click QA on the same `surface:11` after rebuilding `dist`:
  - Reloaded `http://127.0.0.1:5173/`.
  - Clicked `Plan`.
  - Reset `antigravity-ide-transcripts` to `1 / 3` with the CLI, then clicked
    `Run Until Done` in the UI.
  - Observed `Incremental Import` showing `100%`, `Processed 3 / 3`,
    `2 files · 10 prompts`, `Status Complete`, and the persisted DB notice.
  - Verified DB cursor:
    `antigravity-ide-transcripts|3|3|12|1`.
  - Reset `gemini-tmp-chat` to `1 / 144` with the CLI, clicked
    `Run Until Done`, then clicked `Stop`.
  - Observed `Incremental Import` showing `53%`, `Processed 76 / 144`,
    `5 files · 5 prompts`, `Status Stopped`, and the persisted DB notice.
  - Verified DB cursor:
    `gemini-tmp-chat|76|144|77|0`.
  - Browser console returned `No console entries`.
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
- `src-tauri/src/lib.rs`: added `ScanPlan`/`SourcePlan`, metadata-only source
  inventory, large-source warnings, Tauri `plan_scan`, and plan tests.
- `src-tauri/src/bin/promptvault-cli.rs`: added `plan` command and bridge
  `/api/plan`.
- `src/promptVaultApi.ts` and `src/types.ts`: added plan API/types.
- `src/App.tsx` and `src/App.css`: added Plan button and Import Plan UI.
- `README.md` and `docs/CLI.md`: documented `plan`.
- `src-tauri/src/lib.rs`: added `ImportState`, `ImportBatchResult`,
  `ImportBatchOptions`, `run_import_batch`, `import_states` schema, and resume
  state tests.
- `src-tauri/src/bin/promptvault-cli.rs`: added `import-batch` command and
  bridge `/api/import-batch`.
- `src/promptVaultApi.ts` and `src/types.ts`: added import-batch API/types.
- `src/App.tsx` and `src/App.css`: added per-source `Import Batch` buttons and
  `Incremental Import` status panel.
- `README.md` and `docs/CLI.md`: documented `import-batch`.
- `src/importProgress.ts`: added import progress and status-label helpers.
- `tests/importProgress.test.ts`: added unit coverage for progress bounds,
  continuous stop messaging, stopped/complete status, and failed-state
  precedence.
- `src/App.tsx` and `src/App.css`: added continuous per-source import buttons,
  immediate stop control, progress bar, current-source fallback, and disabled
  Scan/Plan while an import run is active.
- `README.md` and `docs/CLI.md`: documented continuous browser-side imports
  and the full browser bridge endpoint set.

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
- `npm run build`: passed after adding Import Plan UI.
- `cd src-tauri && cargo test scan_plan`: 2 plan tests passed.
- `cd src-tauri && cargo test help_text_documents_cli_validation_rules`: CLI
  help test passed.
- `cargo run --bin promptvault-cli -- plan --source codex --json`: passed and
  produced the real Codex source volume warning.
- `curl -X POST http://127.0.0.1:5174/api/plan`: passed against the live
  bridge after restart.
- `npm run check`: passed after the plan slice. This covered UI tests 10
  passed, TypeScript/Vite build, Rust lib 49 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- Plan slice committed and pushed:
  `00b58158f3a17b0662897d3b6d13867ac769c3fb`
  (`feat: add scan import planner`).
- After push, `git rev-list --left-right --count HEAD...origin/main` returned
  `0 0`.
- `npm run build`: passed after adding the import-batch UI.
- `cd src-tauri && cargo test import_batch`: import state test passed.
- `cd src-tauri && cargo test help_text_documents_cli_validation_rules`: CLI
  help test passed.
- Real CLI `import-batch` smoke on `antigravity-ide-transcripts`: passed and
  wrote DB cursor state.
- Real cmux `Import Batch` click QA on `surface:11`: passed with no console or
  browser errors.
- `npm run check`: passed after the import-batch slice. This covered UI tests
  10 passed, TypeScript/Vite build, Rust lib 50 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- Import-batch slice committed and pushed:
  `e12da1f82b2ad4bf2308b543c62ce43d8ab36471`
  (`feat: add resumable import batches`).
- After push, `git rev-list --left-right --count HEAD...origin/main` returned
  `0 0`.
- `npm run test:ui`: 14 tests passed after adding import progress helpers.
- `npm run build`: TypeScript and Vite production build passed after adding
  continuous import UI.
- Real cmux completion flow on `surface:11`: `antigravity-ide-transcripts`
  continuous run completed from `1 / 3` to `3 / 3` with `Status Complete`.
- Real cmux stop flow on `surface:11`: `gemini-tmp-chat` continuous run stopped
  at `76 / 144` with `Status Stopped` and DB `completed=0`.
- Browser diagnostics after continuous import QA:
  `cmux browser --surface surface:11 console list` returned `No console entries`;
  `cmux browser --surface surface:11 errors list` returned `No browser errors`.
- `npm run check`: passed after the continuous import slice. This covered UI
  tests 14 passed, TypeScript/Vite build, Rust lib 50 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.

## Issues

- Unlimited full scan over `~/.codex/sessions` is not yet practical. The new
  plan path confirms the current Codex source alone has `25,097` matching files
  and about `32.3 GiB` of JSONL. Future work should add resumable incremental
  import slices and a background queue before claiming exhaustive historical
  ingestion of the entire Codex store.
- Import batching is now resumable per source, and the UI can run one source
  continuously with a stop-after-current-batch control. It does not yet have a
  multi-source scheduler or a durable background worker that continues after the
  browser tab is closed.
- Several limited source scans intentionally stopped at the configured prompt
  limit and reported the expected limit warning.
- GLM improvement path hit HTTP 429 during manual QA; local fallback worked.
- `antigravity-ide-alt-transcripts` had zero matching files on this machine.

## Research

- No new external web research was needed. This slice used local repo state,
  real local prompt stores, the SQLite DB, cmux browser diagnostics, and
  existing project tests.

## Next Steps

1. Add a multi-source scheduler so selected sources can be queued without
   manually starting each source.
2. Consider a durable background indexing worker so first-run historical import
   can continue after the browser tab is closed.
3. Add scan-run cancellation/progress for unrestricted full scans, separate
   from the safer resumable import-batch path.
