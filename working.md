# PromptVault Working Log

Updated: 2026-06-06 17:18 KST

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
- Continued with the next thin slice: selected-source import queue.
- Added source checkboxes in the import plan and a `Run Selected` queue action
  that runs checked sources sequentially through the same resumable
  stop-after-current-batch loop.
- During real cmux checkbox testing on `surface:11`, found a React event bug:
  reading `event.currentTarget.checked` inside the deferred state updater could
  throw `TypeError: null is not an object`. Fixed it by capturing `checked`
  before calling `setSelectedImportSourceIds`.
- Real cmux queue click QA on the same `surface:11` after rebuilding `dist`:
  - Reset `antigravity-ide-transcripts` to `1 / 3`.
  - Reset `antigravity-cli-conversation-db` to `1 / 10`.
  - Reloaded `http://127.0.0.1:5173/`, clicked `Plan`, clicked both source
    checkboxes, then clicked `Run Selected`.
  - Observed `Incremental Import` showing `100%`, source
    `Antigravity conversation DB`, `Processed 10 / 10`, `Queue 2 / 2`,
    `Status Complete`, and the persisted DB notice.
  - Verified DB cursors:
    `antigravity-cli-conversation-db|10|10|10|1` and
    `antigravity-ide-transcripts|3|3|12|1`.
  - Browser console returned `No console entries`.
  - Browser error collector returned `No browser errors`.
- Continued with the next thin slice: saved import cursor visibility on initial
  app load.
- Added a backend import-state snapshot API that reads every persisted SQLite
  cursor from `import_states`, aggregates source/file/prompt totals, and exposes
  it through Tauri and browser bridge `/api/import-states`.
- Added a `Saved Import Progress` UI panel that loads on app start, shows the
  database path, completed source count, processed file totals, imported prompt
  totals, per-source progress bars, and resumable/complete labels.
- The saved cursor panel refreshes after import-batch, continuous import, and
  selected-source queue runs. It also has a direct `Refresh` button.
- Real bridge evidence after rebuilding `promptvault-cli` and restarting the
  existing `promptvault-bridge` tmux session:
  - `curl http://127.0.0.1:5174/api/health` returned
    `{"database_path":"/Users/wj/Documents/PromptVault/promptvault.sqlite","ok":true}`.
  - `POST /api/import-states` returned `sources 3`, `completed 2`,
    `processed 89`, `total 157`, with `gemini-tmp-chat` resumable at `76 / 144`
    and two Antigravity sources complete.
- Real cmux click QA on the same `surface:11` after rebuilding `dist`:
  - Reloaded `http://127.0.0.1:5173/`.
  - Observed `Saved Import Progress`, `Sources 2 / 3`, `Files 89 / 157`,
    `Imported Prompts 99`, DB path
    `/Users/wj/Documents/PromptVault/promptvault.sqlite`, `Gemini temporary
    chats 76 / 144 · resumable`, and two complete Antigravity rows.
  - Clicked `Refresh`; observed the button enter `Loading` and then return to
    `Refresh` with the same persisted cursor totals.
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
- `src/importQueue.ts`: added selected-source queue helper logic.
- `tests/importQueue.test.ts`: added coverage that source selection avoids
  duplicates and queue execution keeps selected order while skipping empty
  sources.
- `src/App.tsx` and `src/App.css`: added source checkboxes, selected-source
  queue action, queue progress display, and queue-aware stop/status handling.
- `README.md`: documented selected-source browser queue imports.
- `src-tauri/src/lib.rs`: added `ImportStatesResult`, `ImportStatesOptions`,
  `run_list_import_states`, all-cursor DB query helpers, Tauri
  `list_import_states`, and tests for empty/summarized cursor snapshots.
- `src-tauri/src/bin/promptvault-cli.rs`: added bridge payload and route for
  `/api/import-states`, and updated CLI help text for saved cursor endpoints.
- `src/promptVaultApi.ts` and `src/types.ts`: added `listImportStates` API and
  `ImportStatesResult` type.
- `src/App.tsx` and `src/App.css`: added saved import progress panel, startup
  import-state load, direct refresh, and post-import snapshot refresh.
- `README.md` and `docs/CLI.md`: documented `/api/import-states`.
- `src-tauri/src/lib.rs`: extended stored prompt loading with optional text,
  source, date, and workspace filters; added Rust coverage for combined
  source/date/workspace filtering.
- `src/promptVaultApi.ts`: added stored prompt filter fields to the API
  request type.
- `src/storedFilters.ts` and `tests/storedFilters.test.ts`: added tested
  option normalization for stored prompt loads.
- `src/App.tsx` and `src/App.css`: added the stored-vault filter panel, reset
  control, source/date suggestions from loaded results, and responsive layout.
- `README.md`: documented filtered stored-prompt loading.
- `src-tauri/src/lib.rs`: added `StoredPromptFacetsResult`,
  `StoredPromptFacetsOptions`, `run_list_stored_prompt_facets`, the Tauri
  `list_stored_prompt_facets` command, SQL facet aggregation helpers, and
  focused Rust coverage for source/date/workspace facets.
- `src-tauri/src/bin/promptvault-cli.rs`: added bridge payload and route for
  `/api/prompt-facets`, and updated CLI help text.
- `src/promptVaultApi.ts` and `src/types.ts`: added stored prompt facet
  API/types.
- `src/App.tsx`: added startup facet loading, source/date/workspace datalists
  backed by facet aggregates, Stored Vault facet summary text, workspace
  suggestions, and quiet facet refreshes after scan/import completion.
- `README.md` and `docs/CLI.md`: documented `/api/prompt-facets`.
- `src/scanLimit.ts`: moved browser scan-limit validation into a tested helper
  and made browser Scan require an explicit positive limit before calling the
  backend.
- `tests/scanLimit.test.ts`: added coverage for blank, valid, invalid, and
  oversized scan limits.
- `src/App.tsx`: replaced the old inline scan-limit parser with the required
  scan-limit helper and changed the Limit placeholder from `All` to `Required`
  to prevent accidental full-store scans from the browser UI.
- `src-tauri/src/lib.rs`: added scan run cancellation registry helpers,
  `CancelScanOptions`/`CancelScanResult`, `cancel_scan`, cancel-aware source
  collection, cancel-aware file walking, and focused cancellation tests.
- `src-tauri/src/bin/promptvault-cli.rs`: added `/api/scan/cancel` bridge route,
  bridge payload parsing, and help text for scan cancellation.
- `src/promptVaultApi.ts` and `src/types.ts`: added scan `run_id` support and
  typed `cancelScan` API.
- `src/App.tsx`: added per-scan run IDs, canceling state, Stop button UI, and
  scan/load/plan disabling while a scan stop request is in flight.
- `README.md` and `docs/CLI.md`: documented `/api/scan/cancel`.
- `src-tauri/src/lib.rs`: added `persist_on_cancel` scan policy handling,
  skipped persistence for canceled scans when requested, and added a focused
  unit test for the canceled-scan persistence decision.
- `src/promptVaultApi.ts`: exposed `persist_on_cancel` on browser scan options.
- `src/App.tsx`: sends `persist_on_cancel:false` for browser scans and falls
  back to stored facet counts when a non-writing scan returns
  `persistence:null`, so DB Stored does not misleadingly display `0`.
- `README.md`: documented that browser Stop returns partial results without
  writing canceled partial scans to the permanent vault.

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
- Continuous import slice committed and pushed:
  `cba9922c9130da55cccd254836b38676235067fe`
  (`feat: add continuous import controls`).
- After push, `git rev-list --left-right --count HEAD...origin/main` returned
  `0 0`.
- Final runtime checks after push:
  `curl -I http://127.0.0.1:5173/` returned `HTTP/1.0 200 OK`;
  bridge health returned
  `{"database_path":"/Users/wj/Documents/PromptVault/promptvault.sqlite","ok":true}`;
  `surface:11` title remained `PromptVault` at `http://127.0.0.1:5173/`;
  browser diagnostics still returned `No console entries` and
  `No browser errors`.
- `npm run test:ui`: 16 tests passed after adding import queue helpers.
- `npm run build`: TypeScript and Vite production build passed after adding
  selected-source queue UI.
- Real cmux checkbox QA initially failed with
  `TypeError: null is not an object (evaluating '...currentTarget.checked')`;
  fixed and retested on the same `surface:11`.
- Real cmux selected-source queue flow on `surface:11`: passed with both
  selected sources completed and DB cursors persisted.
- Browser diagnostics after queue QA: console returned `No console entries`;
  errors returned `No browser errors`.
- `npm run check`: passed after the selected-source queue slice. This covered
  UI tests 16 passed, TypeScript/Vite build, Rust lib 50 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- Selected-source queue slice committed and pushed:
  `2a2b87c2429fd59dd5fa6b80980b2991b2d32f4d`
  (`feat: add selected import queue`).
- After push, `git rev-list --left-right --count HEAD...origin/main` returned
  `0 0`.
- Final queue-slice runtime checks after push:
  `curl -I http://127.0.0.1:5173/` returned `HTTP/1.0 200 OK`;
  bridge health returned
  `{"database_path":"/Users/wj/Documents/PromptVault/promptvault.sqlite","ok":true}`;
  `surface:11` title/URL remained `PromptVault` and
  `http://127.0.0.1:5173/`;
  browser console returned `No console entries`;
  browser errors returned `No browser errors`.
- `npm run test:ui`: 16 tests passed after adding saved import panel UI.
- `npm run build`: TypeScript and Vite production build passed after adding the
  saved import panel.
- `cd src-tauri && cargo test list_import_states`: 2 focused tests passed.
- `npm run check`: passed after the saved import-state slice. This covered UI
  tests 16 passed, TypeScript/Vite build, Rust lib 52 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before restarting
  the browser bridge.
- Restarted only the existing `promptvault-bridge` tmux session; the static
  server remained the existing `promptvault-static` session.
- Real bridge `/api/import-states` smoke: passed and returned 3 saved source
  cursors.
- Real cmux saved import progress load/refresh flow on `surface:11`: passed
  with no console entries or browser errors.
- Continued with the next thin slice: persistent import activity audit log.
- Added a SQLite `import_events` table. Every `import-batch` now appends an
  audit row with source, root path, batch start, files processed, prompts found,
  total progress, completion state, and warnings.
- Added Tauri command and browser bridge route `/api/import-events`.
- Added browser UI `Recent Import Activity` panel that loads from the
  persistent DB on app startup and refreshes after single, continuous, or queued
  imports.
- `npm run test:ui`: 18 tests passed after adding import event helpers.
- `cd src-tauri && cargo test import_events`: 2 focused tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run check`: passed after the import activity slice. This covered UI
  tests 18 passed, TypeScript/Vite build, Rust lib 54 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before restarting
  the browser bridge.
- Restarted `promptvault-bridge` on `127.0.0.1:5174`; `promptvault-static`
  stayed on `127.0.0.1:5173`.
- Real bridge `/api/import-events` smoke before UI import returned
  `events: []` and `total_events: 0`.
- Real cmux UI test on the existing PromptVault browser surface:
  - Used the visible cmux app browser at `http://127.0.0.1:5173/`.
  - Confirmed `Recent Import Activity` initially showed `Total Events 0`.
  - Clicked `Plan`.
  - Clicked `Gemini temporary chats` -> `Import Batch`.
  - Observed saved cursor progress update from `76 / 144` to `81 / 144`.
  - Observed import summary `5 files · 5 prompts`, `Status Resumable`,
    DB stored `459`, new `0`, updated `5`.
  - Observed `Recent Import Activity` update to `Total Events 1` with
    `Gemini temporary chats`, `5 files · 5 prompts`, `81 / 144 · resumable`,
    and `no warnings`.
- Real bridge `/api/import-states` after UI click returned processed files
  `94 / 157`, imported prompts `104`, and Gemini cursor `81 / 144`.
- Real bridge `/api/import-events` after UI click returned one event:
  `id=1`, `source_id=gemini-tmp-chat`, `batch_start_index=76`,
  `batch_file_count=5`, `batch_prompt_count=5`, `processed_files=81`,
  `total_files=144`, `completed=false`, `warnings=[]`.
- Continued with the next thin slice: load stored prompts from the permanent
  SQLite DB without re-scanning source files.
- Added Tauri command and browser bridge route `/api/prompts`.
- Added `Load Stored` button in the browser UI. It loads persisted prompts into
  the existing prompt list, metrics, sources, frequency, date, repeated-prompt,
  quality-gap, selection, and Improve flows.
- `cd src-tauri && cargo test load_stored_prompts`: 2 focused tests passed.
- `npm run check`: passed after the stored prompt loader slice. This covered UI
  tests 18 passed, TypeScript/Vite build, Rust lib 56 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before restarting
  the browser bridge.
- Real bridge `/api/prompts` smoke returned persisted prompt data from
  `/Users/wj/Documents/PromptVault/promptvault.sqlite`: `stored_prompt_count`
  `459`, `date_count` `20`, and a latest prompt preview.
- Real cmux UI test on the existing PromptVault browser surface:
  - Reloaded `http://127.0.0.1:5173/`.
  - Confirmed the new `Load Stored` button rendered.
  - Clicked `Load Stored`.
  - Observed DB notice:
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 459 · new 0 · updated 0`.
  - Observed metrics from the persistent DB: `Prompts 459`, `Preview 459`,
    `Files 307`, `Words 92314`, `Quality 74.9`, `Weak 126`,
    `DB Stored 459`, `Dates 20`.
  - Observed source summaries from the vault, including `Codex 200`,
    `Gemini temporary chats 117`, `Claude prompt history 20`, and
    `Antigravity conversation DB 10`.
  - Observed prompt list rows loaded from persisted DB, including weak Codex and
    Claude prompt rows, ready for selection and improvement.
- `npm run test:ui`: 21 tests passed after adding stored filter helpers.
- `npm run build`: TypeScript and Vite production build passed after adding the
  stored-vault filter UI.
- `cd src-tauri && cargo test load_stored_prompts`: 3 focused tests passed,
  including combined source/date/workspace filtering.
- `npm run check`: passed after the stored filter slice. This covered UI tests
  21 passed, TypeScript/Vite build, Rust lib 57 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before
  restarting the browser bridge.
- Continued with the next thin slice: source/date/workspace filters for the
  permanent stored prompt vault.
- Confirmed the current cmux workspace `workspace:5` has exactly one
  PromptVault browser surface, now `surface:9`, at `http://127.0.0.1:5173/`.
  Did not create another browser; avoided the separate WriteFlow browser in the
  `블로그` workspace when Computer Use showed it as the active window.
- Added stored-vault filter controls for text, exact source label, prompt date,
  and workspace path. These filters are applied by `Load Stored`, so users can
  review the permanent SQLite vault without re-scanning source files.
- Restarted only the `promptvault-bridge` tmux session after rebuilding
  `promptvault-cli`; left the existing `promptvault-static` server and cmux app
  running.
- Real bridge smoke before browser QA:
  `/api/prompts` with `source=Codex`, `date=2026-06-06`, and
  `workspace=/Users/wj` returned `3` prompts from `459` stored prompts.
- Real cmux click/DOM QA on the same `surface:9`:
  - Reloaded/navigated the existing PromptVault browser with a cache-busting
    query and confirmed `.stored-filter-panel` rendered.
  - Filled Source `Codex`, Date `2026-06-06`, Workspace `/Users/wj`, then
    clicked `Load Stored`.
  - Observed metrics `Prompts 3`, `Preview 3`, `Files 2`, `Quality 80.0`,
    `Weak 0`, `DB Stored 459`, `Dates 20`; source list showed only `Codex`,
    and Dates showed `2026-06-06: 3`.
  - Clicked `Improve` on the selected filtered prompt. GLM returned HTTP 429,
    the local fallback produced a recommendation with `100 -> 100`, `+0`,
    and `Remaining: none`.
  - Clicked `Reset`; confirmed Source/Date/Workspace inputs cleared and the
    stored-vault header returned to `all stored prompts`.
  - Clicked `Load Stored` after reset and observed `Prompts 459`.
  - Filled Workspace `definitely-not-a-workspace`, clicked `Load Stored`, and
    observed the empty-state path: `Prompts 0`, `Preview 0`, `DB Stored 459`,
    selected panel prompt `Run a scan or load stored prompts.`, and
    recommendation prompt `Select a prompt and run improvement.`
  - Browser diagnostics after the empty-state test returned `No console
    entries` and `No browser errors`.
- Continued with the next thin slice: pre-load stored vault facets for source,
  date, and workspace suggestions before the first unfiltered stored load.
- Added Tauri command and browser bridge route `/api/prompt-facets`. The route
  reads only aggregate counts from SQLite, not prompt bodies.
- Added startup facet loading in the Stored Vault panel and quiet facet
  refreshes after scan/import flows that can change the persisted vault.
- Real bridge `/api/prompt-facets` smoke returned `total_prompts 459`, sources
  including `Codex 200` and `Gemini temporary chats 117`, dates including
  `2026-06-04 84` and `2026-04-20 63`, and workspaces including
  `/Users/wj 134`.
- Confirmed the current cmux workspace `workspace:5` still has exactly one
  PromptVault browser, `surface:9`, at `http://127.0.0.1:5173/`.
- Real cmux facet QA on the same `surface:9`:
  - Reloaded the existing PromptVault browser after rebuilding the frontend.
  - Observed Stored Vault header
    `459 stored, 10 sources, 20 dates, 10 workspaces` before clicking
    `Load Stored`.
  - Confirmed pre-load datalists contained source suggestions, dates including
    `2026-04-20`, and workspaces including `/Users/wj`.
  - Filled Source `Gemini temporary chats` and Date `2026-04-20`, clicked
    `Load Stored`, and observed metrics `Prompts 63`, `Preview 63`,
    `Files 63`, `DB Stored 459`, `Dates 20`; the source panel showed only
    `Gemini temporary chats`.
  - Clicked `Reset`, clicked `Load Stored`, and observed the full vault again:
    `Prompts 459`, `Preview 459`, `Files 307`, `Words 92314`,
    `Quality 74.9`, `Weak 126`, `DB Stored 459`, `Dates 20`.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- Post-rebuild browser smoke on `surface:9` still showed
  `459 stored, 10 sources, 20 dates, 10 workspaces` with no console entries or
  browser errors.
- `npm run test:ui`: 21 tests passed after adding stored facet UI wiring.
- `npm run build`: TypeScript and Vite production build passed after adding
  the stored facet UI.
- `cd src-tauri && cargo test stored_prompt_facets`: focused facet aggregation
  test passed.
- `npm run check`: passed after the stored facet slice. This covered UI tests
  21 passed, TypeScript/Vite build, Rust lib 58 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before restarting
  the browser bridge.
- Restarted only the `promptvault-bridge` tmux session on
  `127.0.0.1:5174`; did not stop, restart, or replace cmux.
- Real bridge `/api/prompt-facets` smoke passed and returned the expected
  459-prompt aggregate facet summary.
- Real cmux stored facet pre-load and filtered/unfiltered Load Stored QA on
  `surface:9`: passed with no console entries or browser errors.
- Re-ran `npm run check` after adding quiet facet refresh hooks; it passed
  again with UI tests 21 passed, TypeScript/Vite build, Rust lib 58 passed,
  CLI 15 passed, doc-tests, and clippy with `-D warnings`.
- Post-rebuild cmux smoke on `surface:9`: `.stored-filter-panel` rendered,
  header showed `459 stored, 10 sources, 20 dates, 10 workspaces`, console
  returned `No console entries`, and errors returned `No browser errors`.
- Continued with the next thin slice: browser UI guard against accidental
  unrestricted scans.
- `npm run test:ui`: 24 tests passed after adding scan-limit helper coverage.
- `npm run build`: TypeScript and Vite production build passed after replacing
  the inline App scan parser.
- `npm run check`: passed after the scan guard slice. This covered UI tests
  24 passed, TypeScript/Vite build, Rust lib 58 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- Real cmux scan guard QA on the existing PromptVault `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reloaded the existing browser after the production build.
  - Confirmed the Limit placeholder was `Required` and the value was blank.
  - Clicked `Scan` with blank Limit and observed the error notice
    `Enter a scan limit before scanning. Use Plan or resumable imports for large historical stores.`
    while the button stayed `Scan`, proving the scan-running state was not
    entered.
  - Filled Limit `10`, clicked `Scan`, and observed metrics `Prompts 10`,
    `Preview 10`, `Files 8`, `DB Stored 459`, `Dates 20`.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- `cd src-tauri && cargo test cancel_scan`: 2 focused cancellation registry
  tests passed.
- `cd src-tauri && cargo test collect_from_source_stops_when_scan_cancel_requested`:
  focused collection cancellation test passed.
- `cd src-tauri && cargo test help_text_documents_cli_validation_rules`: CLI
  help text test passed after documenting scan cancellation.
- `npm run test:ui`: 24 tests passed.
- `npm run build`: TypeScript and Vite production build passed.
- `npm run check`: passed after the scan cancellation slice. This covered UI
  tests 24 passed, TypeScript/Vite build, Rust lib 61 passed, CLI 15 passed,
  doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before
  restarting the browser bridge.
- `POST /api/scan/cancel` missing-run bridge smoke returned
  `{"run_id":"missing-run","canceled":false}`.
- Real bridge cancellation smoke with persistence and markdown disabled:
  cancel returned `canceled:true`; scan returned partial results with
  `Scan canceled by user request; returning partial results.`, `prompts: 0`,
  `files_seen: 0`, `markdown_written: false`, and `persistence: null`.
- Real cmux Stop-button QA on existing `surface:9`: passed with the
  cancellation warning visible, partial UI metrics rendered, Stop hidden after
  completion, `No console entries`, and `No browser errors`.
- Initial combined `cargo test should_persist_scan_result_honors_canceled_scan_policy cancel_scan collect_from_source_stops_when_scan_cancel_requested`
  command was invalid because Cargo accepts one test-name filter; reran the
  focused Rust tests separately.
- `cd src-tauri && cargo test should_persist_scan_result_honors_canceled_scan_policy`:
  passed.
- `cd src-tauri && cargo test cancel_scan`: 2 focused cancellation registry
  tests passed.
- `cd src-tauri && cargo test collect_from_source_stops_when_scan_cancel_requested`:
  focused collection cancellation test passed.
- `npm run test:ui`: 24 tests passed after adding the scan option.
- First `npm run check` after the persistence-policy backend/API change passed:
  UI tests 24 passed, TypeScript/Vite build, Rust lib 62 passed, CLI 15
  passed, doc-tests, and clippy with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before
  restarting the browser bridge.
- Real bridge `persist_on_cancel:false` cancellation smoke passed with stored
  count unchanged at `1690`.
- Real cmux Stop-button QA found the `DB Stored 0` fallback display issue for
  `persistence:null`; fixed it in `src/App.tsx`.
- Final `npm run check` after the display fix passed again: UI tests 24 passed,
  TypeScript/Vite build, Rust lib 62 passed, CLI 15 passed, doc-tests, and
  clippy with `-D warnings`.
- Final real cmux Stop-button QA on existing `surface:9` passed: stopped scan
  returned the not-stored warning, DB notice and metric showed stored `1,690`,
  bridge `/api/prompt-facets` stayed at `1690`, console returned
  `No console entries`, and errors returned `No browser errors`.
- Continued with the next thin slice: real backend scan cancellation for
  explicit limited scans.
- Added scan run IDs, a Rust cancellation registry, a Tauri `cancel_scan`
  command, and browser bridge `/api/scan/cancel` so an active scan can be
  stopped from the UI.
- Made scan collection cancellation-aware across source iteration, file walks,
  and file reads. Canceled scans return partial results with one warning:
  `Scan canceled by user request; returning partial results.`
- Added a browser `Stop` button that appears only while a scan is running or
  canceling. It disables repeat scan/load/plan actions during cancellation and
  sends the active run ID to the backend.
- Rebuilt and restarted only the existing `promptvault-bridge` tmux session
  after the Rust CLI change. Did not stop, restart, or replace cmux.
- Bridge cancellation smoke:
  - `/api/health` returned the expected SQLite DB path and `ok: true`.
  - `/api/scan/cancel` for missing run `missing-run` returned
    `{"run_id":"missing-run","canceled":false}`.
  - A real bridge scan with `persist:false`, `write_markdown:false`,
    `include_markdown:false`, source `codex`, and a large limit was canceled
    immediately. Cancel returned `canceled:true`; the scan returned partial
    results with the cancellation warning, no markdown, and no persistence.
- Real cmux Stop-button QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reloaded the existing browser and filled Limit `100000`.
  - Clicked `Scan`, waited for `[data-stop-scan="true"]`, clicked `Stop`, and
    observed the backend cancellation warning in the UI.
  - Observed final metrics after the partial canceled scan: `Prompts 1331`,
    `Preview 1000`, `Files 53`, `Words 556831`, `Quality 78.2`, `Weak 323`,
    `DB Stored 1690`, and `Dates 29`.
  - Confirmed the Stop button disappeared after completion.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- Continued with the next thin slice: canceled browser scan persistence policy.
- Added `persist_on_cancel:false` to browser scan requests. Completed browser
  scans still persist normally, but stopped scans now return partial results
  without writing those partial results into
  `/Users/wj/Documents/PromptVault/promptvault.sqlite`.
- Real bridge policy smoke:
  - Before count from `/api/prompt-facets`: `1690`.
  - Started a large Codex scan with `persist_on_cancel:false`, canceled it via
    `/api/scan/cancel`, and observed `canceled:true`.
  - Scan returned `persistence:null` and warnings
    `Scan canceled by user request; returning partial results.` plus
    `Canceled scan was not stored in the vault.`
  - After count from `/api/prompt-facets`: `1690`.
- Real cmux Stop-button policy QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reloaded the existing browser after `npm run build`.
  - Filled Limit `100000`, clicked `Scan`, waited for
    `[data-stop-scan="true"]`, clicked `Stop`, and observed the not-stored
    warning.
  - Verified the persistent vault count stayed `1690`.
  - Found and fixed a UI display issue where `persistence:null` initially made
    the DB Stored metric display `0`; the UI now falls back to stored facet
    totals.
  - Final HTML evidence showed DB notice
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 1,690 · new 0 · updated 0`,
    warning `Scan canceled by user request; returning partial results. Canceled
    scan was not stored in the vault.`, metric `DB Stored 1690`, and
    `Dates 29`.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- Continued with the next thin slice: active scan progress telemetry.
- Added a Rust in-memory scan progress registry keyed by run ID. Active scans
  now report source position, current source label, total/current files when
  known, prompts found, configured limit, active/canceled state, and update
  time.
- Added Tauri `scan_progress` and browser bridge `/api/scan/progress`.
- Added UI polling while a scan is running and a compact
  `[data-scan-progress="true"]` notice, for example:
  `Codex: discovering files · 0 prompts · source 1 / 11 · limit 100,000`.
- Documented `/api/scan/progress` in `README.md` and `docs/CLI.md`.
- `cd src-tauri && cargo test scan_progress_run_reports_active_progress_and_missing_runs`:
  passed.
- `cd src-tauri && cargo test help_text_documents_cli_validation_rules`:
  passed.
- `npm run test:ui`: 24 tests passed.
- First `npm run check` after the telemetry patch failed on
  `src/App.tsx(237,45)` because the progress poller passed a nullable run ID
  into `scanProgress`. Fixed by capturing a non-null `activeRunId` before the
  async poll function.
- Final `npm run check` passed after the fix: UI tests 24 passed, TypeScript
  and Vite production build passed, Rust lib 63 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Integration review found that progress records should use the same normalized
  run ID as cancellation and cleanup. Patched the Rust scan path, reran
  `cargo fmt`, reran the focused progress test, and reran `npm run check`;
  all passed.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before
  restarting the bridge after the final Rust patch.
- Restarted only the `promptvault-bridge` tmux session on
  `127.0.0.1:5174`; did not stop, restart, or replace cmux.
- Final bridge health after restart returned
  `{"database_path":"/Users/wj/Documents/PromptVault/promptvault.sqlite","ok":true}`.
- Real bridge progress smoke passed:
  - Started a large Codex scan with `run_id` and `persist_on_cancel:false`.
  - `/api/scan/progress` returned an active progress record with source
    `Codex`, `source 1 / 1`, limit `100000`, and active `true`.
  - `/api/scan/cancel` returned `canceled:true`.
  - The scan returned `Canceled scan was not stored in the vault.`
  - A later progress poll for the same run returned inactive default progress.
- Real cmux progress QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reused `surface:9` with a cache-busted PromptVault URL.
  - Set Limit `100000`, clicked `Scan`, observed the progress notice
    `Codex: discovering files · 0 prompts · source 1 / 11 · limit 100,000`,
    clicked `Stop`, and observed the not-stored cancellation warning.
  - Verified the stored vault count stayed `1690` through
    `/api/prompt-facets` after cancellation.
  - The visible UI still showed Stored Vault `1,690`, saved import progress,
    the DB notice with `stored 1,690 · new 0 · updated 0`, and the canceled
    scan warnings.
- Continued with the next thin slice: file discovery counts inside scan
  progress telemetry.
- Added `source_files_discovered` to the Rust/TypeScript scan progress
  contract so active scans can report matching files as `WalkDir` discovers
  them, before `source_file_count` is finalized.
- Updated the UI progress notice to show discovery movement while file totals
  are still unknown, for example:
  `Codex: discovering files · 10 found · 0 prompts · source 1 / 11 · limit 100,000`.
- Updated `README.md` to describe active scan progress with discovery counts.
- Added focused Rust coverage:
  - `cargo test scan_progress_run_reports_active_progress_and_missing_runs`
  - `cargo test collect_from_source_reports_discovered_files_in_progress`
- `npm run check` passed after the discovery telemetry slice: UI tests
  24 passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI
  15 passed, doc-tests passed, and clippy passed with `-D warnings`.
- `cd src-tauri && cargo build --bin promptvault-cli`: passed before bridge
  restart.
- Restarted only the `promptvault-bridge` tmux session on
  `127.0.0.1:5174`; did not stop, restart, or replace cmux. Static server and
  existing cmux browser stayed in place.
- Real bridge discovery progress smoke passed:
  - Started a large Codex scan with `persist_on_cancel:false`.
  - `/api/scan/progress` returned active progress with
    `source_files_discovered: 1550`, `source_file_count:null`, source
    `Codex`, and limit `100000`.
  - `/api/scan/cancel` returned `canceled:true`.
  - The scan returned `Canceled scan was not stored in the vault.`
  - A later progress poll returned inactive progress with
    `source_files_discovered: 0`.
- Real cmux discovery progress QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reused `surface:9` with a cache-busted PromptVault URL.
  - Set Limit `100000`, clicked `Scan`, observed the progress notice
    `Codex: discovering files · 10 found · 0 prompts · source 1 / 11 · limit 100,000`,
    clicked `Stop`, and observed the not-stored cancellation warning.
  - Verified the stored vault count stayed `1690` through
    `/api/prompt-facets` after cancellation.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- Continued with the next thin slice: scan progress polling race hardening.
- Fixed a frontend polling race where an early inactive
  `/api/scan/progress` response could stop the polling loop while the scan
  request was still starting. The UI now keeps polling at a slower interval
  while the scan state is still running, even if the current progress response
  is inactive.
- `npm run check` passed after the polling race patch: UI tests 24 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Reused `surface:9` with a cache-busted PromptVault URL and verified it
    loaded the new Vite build.
  - Set Limit `100000`, clicked `Scan`, observed progress advance to
    `Codex: discovering files · 3,350 found · 0 prompts · source 1 / 11 · limit 100,000`,
    clicked `Stop`, and observed the not-stored cancellation warning.
  - Verified the stored vault count stayed `1690` through
    `/api/prompt-facets` after cancellation.
  - Browser console returned `No console entries`; browser errors returned
    `No browser errors`.
- Attempted to force the exact first-progress-inactive race in cmux by
  monkey-patching the current page's first `/api/scan/progress` fetch. The
  verification script itself hit cmux JavaScript-result timeouts, so it is not
  treated as successful evidence. After the timeout, the scan controls were no
  longer visible and the vault count remained `1690`.

## Changes

- `src-tauri/src/lib.rs`: added progress registry, progress command, active
  scan updates, discovery counts, and focused backend coverage.
- `src-tauri/src/bin/promptvault-cli.rs`: added bridge route
  `/api/scan/progress` and updated CLI help text.
- `src/types.ts` and `src/promptVaultApi.ts`: added scan progress types and
  frontend API wrapper; `src/types.ts` now includes discovery count data.
- `src/App.tsx` and `src/App.css`: added scan-progress polling and notice UI;
  the notice now reports discovered files while file totals are pending, and
  polling continues through an early inactive progress response while scan
  state is still running.
- `README.md` and `docs/CLI.md`: documented the new bridge endpoint and
  discovery-count behavior where applicable.
- `working.md`: recorded this slice and verification evidence.

## Issues

- Unlimited full scan over `~/.codex/sessions` is not practical from the
  browser UI. The plan path confirms the current Codex source alone has
  `25,097` matching files and about `32.3 GiB` of JSONL. The browser Scan
  button now requires an explicit positive limit before it calls the backend,
  and active limited scans can now be stopped. Future work should add resumable
  background indexing before claiming exhaustive historical ingestion of the
  entire Codex store.
- Import batching is now resumable per source. The UI can run one source
  continuously, queue selected sources, and stop after the current batch. It
  does not yet have a durable background worker that continues after the browser
  tab is closed.
- Several limited source scans intentionally stopped at the configured prompt
  limit and reported the expected limit warning.
- GLM improvement path hit HTTP 429 during manual QA; local fallback worked.
- `antigravity-ide-alt-transcripts` had zero matching files on this machine.
- During the import activity slice, `cmux browser surface:11 console list` and
  `cmux browser surface:11 errors list` timed out even after the page rendered.
  The visible cmux app browser and DB/API paths were verified directly; no stale
  helper process remained after cleanup.
- During the stored-filter slice, `cmux browser` diagnostics briefly timed out
  while the active visible cmux workspace was `블로그`/WriteFlow. After
  re-targeting the existing PromptVault `surface:9`, cmux browser CLI commands
  worked and diagnostics returned clean. Treat Computer Use app state as the
  currently focused cmux workspace, not proof of the target PromptVault surface.
- During the facet slice, `cmux browser --surface surface:9 get url` reported
  the correct PromptVault URL while `snapshot` briefly reported `about:blank`.
  `focus-webview` returned `invalid_state: WebView is not in a window`;
  focusing the existing browser pane `pane:10` in `workspace:5` restored
  reliable surface-specific DOM and click automation. Do not create a new
  browser as a workaround.
- GLM still rate-limits with HTTP 429 in browser Improve tests; the local
  fallback continues to produce a usable recommendation and warning.
- Browser Stop now returns partial scan results without writing canceled
  partial results into the permanent SQLite vault. Completed browser scans still
  persist normally. The prior partial-cancel QA already raised the vault to
  `1690`, so future tests should use `/api/prompt-facets` before/after counts
  when proving canceled scans do not grow the vault.
- Scan progress telemetry is currently active-run, in-memory state only. It is
  enough for a running browser scan notice, but it is not a durable background
  worker and does not survive process restart or browser tab closure.
- Discovery counts are best-effort active progress telemetry. They show matching
  files found during the current `WalkDir` pass, then reset to zero after the
  run is removed from the active progress registry.
- During the progress telemetry cmux QA, `goto -> wait -> eval` on `surface:9`
  was reliable, but separate `snapshot`, `fill`, `console list`, and
  `errors list` commands intermittently attached to `about:blank` or timed out
  even while `cmux tree` showed the correct PromptVault URL. The real UI flow,
  bridge count, and cancellation warning were verified on the existing
  `surface:9`; do not open a second browser as a workaround.

## Research

- No new external web research was needed. This slice used local repo state,
  real local prompt stores, the SQLite DB, cmux browser diagnostics, and
  existing project tests.

## Next Steps

1. Consider a durable background indexing worker so first-run historical import
   can continue after the browser tab is closed.
2. Recover or harden the cmux browser diagnostics workflow for cases where the
   active visible workspace differs from the target PromptVault surface.
3. Consider making progress telemetry durable enough to reconnect to an active
   background scan after browser reload.
