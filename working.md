# PromptVault Working Log

Updated: 2026-06-06 20:17 KST

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
- Continued with the next thin slice: separate stored prompt loading state
  from scan state.
- `runLoadStored` now uses a dedicated `storedLoadState` instead of
  `scanState`, so stored-vault loading no longer enters the scan-running UI
  state.
- The `Load Stored` button now shows `Loading Stored` during the request and
  disables conflicting scan, plan, import, reset, refresh, and queued import
  controls while stored prompts are loading.
- This prevents stored prompt loads from showing the active scan progress
  notice.
- `npm run check` passed after the stored-load state slice: UI tests 24 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reused `surface:9` and did not create another browser.
  - Loaded the new Vite build `index-Cq25Slp4.js` with a cache-busted
    PromptVault URL.
  - Clicked `Load Stored` and waited for stored vault text
    `stored 1,690`.
  - Verified `[data-scan-progress="true"]` count was `0`, so no scan progress
    notice appeared during stored prompt loading.
  - Verified browser console returned `No console entries`, browser errors
    returned `No browser errors`, and bridge `/api/prompt-facets` still
    reported vault count `1690`.
- Attempts to force a delayed `/api/prompts` response for exact intermediate
  button-label capture hit cmux JavaScript-result timeouts. Those attempts are
  recorded as cmux diagnostic limitations, not as successful UI evidence.
- Continued with the next thin slice: lock import write actions while a scan
  is running or canceling.
- Found a UI state gap: after the Import Plan panel was already open, active
  scans disabled top-level `Scan`, `Load Stored`, and `Plan`, but did not lock
  the per-source import buttons, source checkboxes, or `Run Selected` queue
  button.
- Added shared action-lock helpers and focused UI tests so import write actions
  are locked by scan, import, and stored-load work.
- Added stable QA selectors for `Scan`, `Plan`, and `Limit` so cmux can drive
  the core flow with CSS selectors instead of brittle text selectors.
- `npm run test:ui` passed with 26 tests, including the new action-lock cases.
- Final `npm run check` passed after the import-lock slice: UI tests 26 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Confirmed `workspace:5` still had exactly one PromptVault browser surface
    and did not create another browser.
  - Loaded the new Vite build `index-_ilfamsz.js` with a cache-busted
    PromptVault URL.
  - Clicked `Plan`, observed `Import Plan`, filled Limit `100000`, clicked
    `Scan`, and observed `Scanning` plus `Stop`.
  - While scan progress was visible, enabled counts were all `0` for:
    `button[data-import-source-id]:enabled`,
    `button[data-import-continuous-source-id]:enabled`,
    `input[data-select-source-id]:enabled`, and
    `button[data-import-selected="true"]:enabled`.
  - Clicked `Stop`, observed `Canceled scan was not stored in the vault.`, and
    verified browser console returned `No console entries` and browser errors
    returned `No browser errors`.
- Computer Use still showed the ambient `working.md`/Worklog workspace after
  cmux CLI selected `workspace:5`, so Computer Use was not used as proof for
  this PromptVault slice. The reliable proof came from cmux CLI against the
  explicit `surface:9` browser.
- Continued with the next thin slice: lock request-shaping controls during
  active work.
- Found a related UI consistency gap: active scan/import/stored-load work
  locked action buttons, but users could still change preview mode, scan limit,
  and Stored Vault filter inputs while an in-flight request was using the old
  values.
- Preview mode buttons, the Limit input, and all four Stored Vault filter
  inputs are now disabled while top-level work is active.
- `npm run check` passed after this control-lock slice: UI tests 26 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused the single
    PromptVault browser surface.
  - Loaded the new Vite build `index-CiX2uBAs.js`, clicked `Plan`, filled Limit
    `100000`, clicked `Scan`, and waited for scan progress.
  - While scan progress was visible, enabled counts were all `0` for preview
    mode buttons, `[data-scan-limit="true"]`, and `.stored-filter-panel input`.
  - Clicked `Stop`, observed `Canceled scan was not stored in the vault.`, and
    verified browser console returned `No console entries` and browser errors
    returned `No browser errors`.
- Continued with the next thin slice: lock remaining side-effect controls
  during active scan/import/stored-load work.
- Found remaining overlap controls: Saved Import Progress refresh, Recent
  Import Activity refresh, and `Improve` could still be clicked while a scan
  was active.
- These buttons now use the same top-level action lock, and the Improve button
  has a stable `data-run-improve` selector for cmux QA.
- `npm run check` passed after this side-effect lock slice: UI tests 26 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reused the single PromptVault browser and loaded build `index-BQK3hnM1.js`.
  - A stale wait for `stored 1,690` timed out because the live persisted vault
    count is now `88,378`; `/api/prompt-facets` confirmed `88378`.
  - Started a new scan with Limit `100000` and waited for scan progress.
  - While scan progress was visible, enabled counts were all `0` for
    `[data-refresh-import-states="true"]`,
    `[data-refresh-import-events="true"]`, and `[data-run-improve="true"]`.
  - Clicked `Stop`, observed `Canceled scan was not stored in the vault.`, and
    verified browser console returned `No console entries` and browser errors
    returned `No browser errors`.
- Continued with the next thin slice: lock all other long-running actions while
  an Improve request is active.
- Found the remaining overlap gap: `Improve` disabled itself while running, but
  Scan, Load Stored, Plan, preview/limit controls, and import write controls
  were still governed only by scan/import/stored-load state.
- `src/actionLocks.ts` now includes `improvementRunning` in the shared
  top-level lock, and import write locks reuse that same top-level predicate.
- `src/App.tsx` now passes the active `improving` state into the shared lock.
- `tests/actionLocks.test.ts` now covers improvement-driven locks for both
  top-level actions and import write actions.
- `npm run test:ui` passed after this Improve-lock slice with 26 tests.
- `npm run check` passed after this Improve-lock slice: UI tests 26 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?improve-lock=20260606b`.
  - Clicked `Load Stored`, waited for prompt rows, clicked `Plan`, waited for
    import action rows, selected the first prompt, then clicked `Improve`.
  - Installed a page-local `/api/improve` fetch delay so the in-flight
    `Improving` state could be measured; reloaded the page afterward to remove
    the test-only monkeypatch.
  - While `Improving` was visible, enabled counts were all `0` for Scan, Load
    Stored, Plan, Improve, preview mode buttons, Limit, Run Selected, Import
    Batch, Run Until Done, and source checkboxes.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: add a function-level exclusive action
  claim for long-running user actions.
- Found that the UI disabled controls after state updates, but the async
  handlers themselves did not synchronously reject same-render duplicate starts
  from double clicks or delayed events.
- Added `claimExclusiveAction` and `releaseExclusiveAction` helpers for
  synchronous in-flight claims.
- Wired the claim guard into user-started long-running handlers: Plan, Scan,
  Load Stored, single/continuous import, selected import queue, and Improve.
  Stop Scan and Stop Import remain outside this claim so cancellation stays
  available while work is active.
- `npm run test:ui` passed after this exclusive-claim slice with 27 tests.
- `npm run check` passed after this exclusive-claim slice: UI tests 27 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?exclusive-claim=20260606b`.
  - Installed a page-local `/api/plan` fetch counter, then triggered
    `button.click(); button.click();` against `[data-run-plan="true"]` in the
    same render turn.
  - Observed `planCalls: 1`, `.plan-panel: 1`, and `planRows: 11`, proving the
    second immediate start was rejected while the first Plan completed.
  - Reloaded the same surface afterward to remove the test-only fetch counter.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: add endpoint-level duplicate refresh
  claims for secondary refresh controls.
- Found that manual Saved Import Progress and Recent Import Activity refreshes
  were disabled after React state updates, but same-render duplicate clicks
  could still start duplicate `/api/import-states` or `/api/import-events`
  requests. Stored facet refresh also now uses the same endpoint-level guard for
  quiet automatic refreshes.
- Added independent refresh claim refs for stored facets, import states, and
  import events. Each refresh function now synchronously rejects overlapping
  calls to its own endpoint and releases the claim in `finally`.
- `npm run test:ui` passed after this refresh-claim slice with 27 tests.
- `npm run check` passed after this refresh-claim slice: UI tests 27 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?refresh-claim=20260606a`.
  - Installed a page-local fetch counter for `/api/import-states` and
    `/api/import-events`, opened Plan, then triggered each refresh button twice
    in the same render turn.
  - Observed `counts: { states: 1, events: 1 }`, proving the duplicate manual
    refresh starts were rejected per endpoint while both first refreshes
    completed.
  - Reloaded the same surface afterward to remove the test-only fetch counter.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make Stored Vault filters directly
  actionable from their own panel.
- Found a UX gap: users could edit Stored Vault filters but had to use the
  distant top-bar `Load Stored` button to apply them. The first cmux check also
  showed that the original form submit path did not trigger through the
  `Return` key name on this WKWebView surface.
- Converted the Stored Vault filter grid into a submit form, added a local
  `Apply` button, stable data selectors for all four filter inputs, and an
  explicit Enter key handler that calls `runLoadStored`.
- `npm run test:ui` passed after this filter-apply slice with 27 tests.
- `npm run check` passed after this filter-apply slice: UI tests 27 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?stored-filter-apply=20260606b`.
  - Installed a page-local `/api/prompts` fetch counter, filled the Stored Vault
    Text filter with `cmux`, focused the input, and pressed `Enter`.
  - Observed `/api/prompts` call count `1`; after the request completed, the
    prompt list showed `200` rows and the query value remained `cmux`.
  - Clicked Reset and Apply, then re-ran an Apply-only completion check with a
    response-completion counter. Observed completed prompt loads `1`, rows
    `200`, and Apply enabled again after completion.
  - Reloaded the same surface afterward to remove test-only fetch counters.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: explain prompt-list empty states when the
  local prompt filter hides all loaded prompts.
- Added prompt empty-state copy helpers and UI coverage for loaded-empty versus
  filter-miss states.
- `npm run test:ui` passed after this empty-state slice with 32 tests.
- `npm run check` passed after this empty-state slice: UI tests 32 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?prompt-empty=20260606a`.
  - Clicked the Stored Vault `Apply` button and waited until stored prompt rows
    rendered.
  - Filled the prompt filter with `zzzz-no-prompt-match-20260606`.
  - Observed rows `0`, prompt-list empty text
    `No prompts match the current filter.`, selected-panel empty text
    `No prompt is visible with the current filter.`, and the filter value
    preserved.
  - Cleared the filter afterward and observed rows return to `200`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make the Recommendation panel's empty
  copy match the current prompt selection/filter state.
- Found that the Recommendation panel still said
  `Select a prompt and run improvement.` even when a prompt was already
  selected, and it did not explain filter-hidden prompts.
- Added recommendation empty-state copy coverage for selected prompt,
  filter-hidden prompt, and no-data states.
- `npm run test:ui` passed after this recommendation-empty slice with 35 tests.
- `npm run check` passed after this recommendation-empty slice: UI tests 35
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?recommendation-empty=20260606a`.
  - Clicked Stored Vault `Apply` and waited until stored prompt rows rendered.
  - Observed rows `200` and Recommendation empty text
    `Run improvement for the selected prompt.`.
  - Filled the prompt filter with `zzzz-no-recommendation-match-20260606`.
  - Observed rows `0`, prompt-list empty text
    `No prompts match the current filter.`, selected-panel empty text
    `No prompt is visible with the current filter.`, and Recommendation empty
    text `Clear the prompt filter or select a visible prompt before improving.`.
  - Cleared the filter afterward and observed rows return to `200`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make Source and Frequency secondary
  panels explain the pre-load empty state instead of rendering a blank source
  body or generic `No data` frequency labels.
- Added analysis empty-state copy coverage for source summaries and frequency
  columns before load and after an empty loaded result.
- `npm run test:ui` passed after this analysis-empty slice with 39 tests.
- `npm run check` passed after this analysis-empty slice: UI tests 39 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?analysis-empty=20260606a`.
  - Observed source rows `0`, source empty text
    `Run a scan or load stored prompts to see source coverage.`, five frequency
    empty columns, and frequency empty text
    `Run a scan or load stored prompts to see frequency data.`.
  - Clicked Stored Vault `Apply` and waited for source and frequency data.
  - Observed source rows `5`, source empty cleared, frequency items `50`,
    frequency empty count `0`, and prompt rows `200`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make import progress/activity refresh
  failures visible inside their own panels.
- Found that `refreshImportStates` and `refreshImportEvents` set their state to
  `failed`, but the panels only rendered for existing results or loading state.
  When prior data existed, the panel body stayed stale without an in-panel
  warning; when no prior data existed, the panel could disappear.
- Added import refresh failure copy coverage and connected it to Saved Import
  Progress and Recent Import Activity panels.
- `npm run test:ui` passed after this import-refresh-failure slice with 41
  tests.
- `npm run check` passed after this import-refresh-failure slice: UI tests 41
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?import-refresh-failure=20260606a`.
  - Confirmed normal import panels first: saved import rows `3`, import
    activity rows `1`.
  - Installed a page-local fetch monkeypatch that rejected only
    `/api/import-states` and `/api/import-events`, then clicked both Refresh
    buttons.
  - Observed in-panel warnings:
    `Could not refresh saved import progress. Existing data may be stale.` and
    `Could not refresh import activity. Existing data may be stale.`
  - Confirmed prior data stayed visible: saved import rows `3`, import activity
    rows `1`.
  - Reloaded the same surface at
    `http://127.0.0.1:5173/?import-refresh-failure=20260606b` to remove the
    test-only fetch monkeypatch.
  - Confirmed warnings cleared, saved import rows `3`, import activity rows
    `1`, and top-level error cleared.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make Stored Vault facet refresh failures
  visible inside the Stored Vault panel.
- Found that `refreshStoredFacets` could set the facet state to `failed`
  without an in-panel warning. If no facet result existed, the header could
  fall back to normal stored-filter summary copy, masking unavailable facet
  suggestions.
- Added stored facet status copy coverage for failed refreshes, loading state,
  filtered failed state, and successful loaded facet summaries.
- `npm run test:ui` passed after this stored-facet-failure slice with 44 tests.
- `npm run check` passed after this stored-facet-failure slice: UI tests 44
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?stored-facets-failure=20260606a`.
  - Confirmed normal Stored Vault facet state first:
    `88,378 stored, 10 sources, 50 dates, 50 workspaces`, no warning, and
    `Refresh Facets` button rendered.
  - Installed a page-local fetch monkeypatch that rejected only
    `/api/prompt-facets`, then clicked `Refresh Facets`.
  - Observed the in-panel warning
    `Could not refresh stored facets. Filter suggestions may be stale.`
  - Confirmed the refresh button re-enabled and the prior facet summary stayed
    visible instead of reverting to misleading normal fallback copy.
  - Reloaded the same surface at
    `http://127.0.0.1:5173/?stored-facets-failure=20260606b` to remove the
    test-only fetch monkeypatch.
  - Confirmed the warning and top-level error cleared, the facet summary
    repopulated, and the button text returned to `Refresh Facets`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: keep the Incremental Import panel visible
  when an import batch fails before the first batch result exists.
- Found that a first-request `importBatch` failure set `importState` to
  `failed`, but the panel render condition only included `importResult` or an
  active import. That left only the global error notice and hid the active
  source, progress, and failed status context.
- Added import-run failure copy coverage for failed source-specific imports,
  failed unknown-source imports, and non-failed states.
- `npm run test:ui` passed after this import-run-failure slice with 45 tests.
- `npm run check` passed after this import-run-failure slice: UI tests 45
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?import-run-failure=20260606a`.
  - Clicked `Plan` and waited for import source actions.
  - Installed a page-local fetch monkeypatch that rejected only
    `/api/import-batch`, then clicked the first `Import Batch` action.
  - Observed the failed no-result import panel stayed visible for `Codex` with
    progress `0%`, `Status Failed`, and in-panel copy:
    `Could not import Codex. Check the error above and retry from the import plan.`
  - Reloaded the same surface at
    `http://127.0.0.1:5173/?import-run-failure=20260606b` to remove the
    test-only fetch monkeypatch.
  - Confirmed the warning and top-level error cleared, the import panel was no
    longer shown on the fresh page, and final diagnostics were clean.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: keep the Import Plan panel visible when
  plan creation fails before any plan data exists.
- Found that a first-request `planScan` failure set `planState` to `failed`,
  but the Import Plan panel only rendered when `plan` existed. That left only
  the global bridge error and hid retry-oriented plan context.
- Added plan status copy coverage for missing-plan failures, stale-plan
  failures, loading text, failed unavailable text, and idle guidance.
- `npm run test:ui` passed after this plan-failure slice with 47 tests.
- `npm run check` passed after this plan-failure slice: UI tests 47 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?plan-failure=20260606a`.
  - Installed a page-local fetch monkeypatch that rejected only `/api/plan`,
    then clicked `Plan`.
  - Observed the no-plan failure panel stayed visible with status `failed`,
    `Retry Plan`, empty text `Import plan is unavailable. Use Plan to retry.`,
    and in-panel copy:
    `Could not create an import plan. Check the error above and use Plan to retry.`
  - Restored the original fetch in the same page and clicked the panel-level
    `Retry Plan` button.
  - Observed a real plan recover in-place with `11` source rows, first source
    `Codex`, no plan warning, no global error, and the panel button changed to
    `Refresh Plan`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make Stored Vault prompt-load failures
  visible inside the Stored Vault panel.
- Found that `/api/prompts` failures from the top-level `Load Stored` or Stored
  Vault `Apply` path set `storedLoadState` to `failed`, but the Stored Vault
  panel had no load-specific warning. The user only saw the global bridge
  error.
- Added stored-load failure copy coverage for no-filter failures, active-filter
  failures, and non-failed states.
- `npm run test:ui` passed after this stored-load-failure slice with 49 tests.
- `npm run check` passed after this stored-load-failure slice: UI tests 49
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?stored-load-failure=20260606a`.
  - Installed a page-local fetch monkeypatch that rejected only `/api/prompts`,
    then clicked Stored Vault `Apply`.
  - Observed the no-filter Stored Vault warning
    `Could not load stored prompts. Check the error above and retry.`
  - Reloaded the same surface at
    `http://127.0.0.1:5173/?stored-load-failure=20260606b`, set the Stored
    Vault text filter to `cmux`, installed the same `/api/prompts` monkeypatch,
    and clicked `Apply`.
  - Observed the filter-aware Stored Vault warning
    `Could not load stored prompts with the current filters. Check the error above, adjust filters, or retry.`
    with the `cmux` filter value preserved and Apply re-enabled.
  - Restored the original fetch in the same page and clicked `Apply` again.
  - Observed recovery in-place: the warning and global error cleared, the
    `cmux` filter remained, 200 prompt rows loaded, and the DB notice showed
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 88,378 · new 0 · updated 0`.
  - Browser console and error diagnostics timed out once after recovery, then a
    retry returned `No console entries` and `No browser errors`.
- Continued with the next thin slice: make failed Recommendation/Improve runs
  visible inside the Recommendation panel.
- Found that `/api/improve` failures left the Recommendation panel on the
  generic selected-prompt empty state while only the global bridge error
  explained the failure.
- Added improvement failure copy coverage scoped to the selected prompt so
  changing the visible prompt does not show a stale warning for another row.
- `npm run test:ui` passed after this improve-failure slice with 50 tests.
- `npm run check` passed after this improve-failure slice: UI tests 50 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?improve-failure=20260606a`.
  - Clicked `Load Stored` and waited for 200 prompt rows.
  - Installed a page-local fetch monkeypatch that rejected only `/api/improve`,
    then clicked `Improve`.
  - Observed the Recommendation panel warning
    `Could not improve this prompt. Check the error above and retry.` while
    the selected prompt and Improve button remained usable.
  - Restored the original fetch in the same page and clicked `Improve` again.
  - Observed recovery in-place: the warning and global error cleared, a
    `local-rules` recommendation rendered, and the visible quality delta was
    `56 -> 100 +44`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make scan failures visible as a
  top-level retry notice instead of relying only on the global error.
- Added scan failure copy coverage for no-result failures, stale-result
  refresh failures, and non-failed states.
- `npm run test:ui` passed after this scan-failure slice with 53 tests.
- `npm run check` passed after this scan-failure slice: UI tests 53 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?scan-failure=20260606a`.
  - Clicked `Scan` with an empty limit and observed the no-result scan warning:
    `Could not scan prompts. Check the error above, adjust the limit, or retry.`
  - Clicked `Load Stored`, waited for 200 prompt rows, and confirmed the scan
    warning and global error cleared.
  - Set Limit to `1`, installed a page-local fetch monkeypatch that rejected
    only `/api/scan`, and clicked `Scan`.
  - Observed the stale-result scan warning:
    `Could not refresh scan results. Existing results are still shown. Check the error above, adjust the limit, or retry.`
    while the 200 stored prompt rows remained visible.
  - Restored the original fetch in the same page and clicked `Scan` again.
  - Observed recovery in-place: the warning and global error cleared, a real
    limit-1 result loaded with 1 prompt row, and the DB notice showed
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 88,378 · new 0 · updated 1`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make failed scan Stop requests visible
  and retry-safe.
- Found that `requestStopScan` failures only set the global error and left the
  scan in `canceling`, which disabled the Stop button even though the scan was
  still pending.
- Added scan Stop failure copy coverage for failed cancel requests and missing
  active-run responses.
- Updated the Stop failure handler to show a scoped warning and return the UI
  to `scanning` so Stop can be retried.
- During the first cmux QA pass, the scoped warning cleared when the delayed
  scan completed, but the global cancel error remained visible. Fixed the scan
  success path to clear transient stop errors before setting the successful
  result.
- `npm run test:ui` passed after this scan-stop-failure slice with 54 tests.
- `npm run check` passed after this scan-stop-failure slice: UI tests 54
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?scan-stop-failure=20260606b`.
  - Set Limit to `1`, installed a page-local fetch monkeypatch that delayed
    `/api/scan` resolution and rejected only `/api/scan/cancel`, clicked
    `Scan`, then clicked `Stop`.
  - Observed the scoped Stop warning
    `Could not stop the active scan. It is still running; check the error above or try Stop again.`
    with `Stop` re-enabled and the scan still showing `Scanning`.
  - Restored the original fetch and released the delayed scan response.
  - Observed recovery in-place: the Stop warning and global error cleared, a
    real limit-1 result loaded with 1 prompt row, and the DB notice showed
    `/Users/wj/Documents/PromptVault/promptvault.sqlite · stored 88,378 · new 0 · updated 1`.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: fix the import queue Stop/completion
  edge case.
- Found that a Stop request made while the final queued source was still
  in-flight could mark the queue as `Stopped` and undercount completed sources,
  even when that final source completed in the current batch.
- Added queue finalization coverage for stop-after-final-completion, early
  stopped queues, and bounded completed-source counts.
- `npm run test:ui` passed after this queue-stop-completion slice with 57
  tests.
- `npm run check` passed after this queue-stop-completion slice: UI tests 57
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?import-queue-stop-complete=20260606a`.
  - Clicked `Plan`, selected only `antigravity-ide-transcripts`, installed a
    page-local fetch monkeypatch that delayed only `/api/import-batch`, clicked
    `Run Selected`, then clicked `Stop` while the batch was pending.
  - Observed the pending state: `Status Stopping after current batch`,
    `Queue 1 / 1`, and `Stop` changed to `Stopping`.
  - Restored the original fetch and released the delayed batch response.
  - Observed the final state: `Status Complete`, `Queue 1 / 1`,
    `Processed 3 / 3`, no import warning, and no global error.
  - Browser console returned `No console entries` and browser errors returned
    `No browser errors`.
- Continued with the next thin slice: make intentional partial import stops
  explain how to resume.
- Added Incremental Import stopped-state copy for continuous and queued import
  runs so a user sees that the stop was intentional and resumable, not a hard
  failure.
- `npm run test:ui` passed after this import-stop-notice slice with 60 tests.
- `npm run check` passed after this import-stop-notice slice: UI tests 60
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?import-stop-notice=20260606a`.
  - Clicked `Plan`, installed a page-local fetch monkeypatch that delayed only
    `/api/import-batch` and then returned a partial, non-complete Codex batch.
  - Clicked the Codex `Run Until Done` action, clicked `Stop` while the batch
    was pending, and observed `Status Stopping after current batch`.
  - Released the delayed batch and observed final `Status Stopped`,
    `Processed 5 / 100`, no import-run failure warning, no global error, and
    the new warning
    `Stopped importing Codex after the current batch. Run Until Done again to resume from the saved cursor.`
  - Restored the original fetch, reloaded the same `surface:9`, and confirmed
    the Plan button rendered with `No console entries` and `No browser errors`.
- Continued with the next thin slice: clear stale global errors after successful
  manual secondary-panel refreshes.
- Found that stored facets, saved import progress, and recent import activity
  refresh helpers could recover their panel state but leave a previous
  user-visible global error in place after a successful manual retry.
- Added refresh success policy coverage so manual refresh success clears stale
  global errors, while quiet background refreshes preserve any existing error
  from the main action that triggered them.
- `npm run test:ui` passed after this refresh-error-clear slice with 62 tests.
- `npm run check` passed after this refresh-error-clear slice: UI tests 62
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?refresh-error-clear=20260606a`.
  - Installed a page-local fetch monkeypatch that failed only
    `/api/prompt-facets`, then clicked `Refresh Facets`.
  - Observed both the Stored Vault panel warning
    `Could not refresh stored facets. Filter suggestions may be stale.` and
    the global error `forced facets failure`.
  - Restored the original fetch and clicked `Refresh Facets` again.
  - Observed recovery in-place: `88,378 stored, 10 sources, 50 dates, 50 workspaces`,
    no Stored Vault panel warning, no global error, and button text
    `Refresh Facets`.
  - Reloaded the same `surface:9` to
    `http://127.0.0.1:5173/?refresh-error-clear-clean=20260606a` and confirmed
    `No console entries` and `No browser errors`.
- Continued with the next thin slice: clear matching Improve-origin global
  errors when the user switches prompt selection.
- Found that a failed Improve request left its top-level bridge error visible
  even after the user selected a different prompt, while the selected-prompt
  inline warning disappeared.
- Added selection-change policy coverage so only the global error produced by
  that Improve failure is cleared on prompt change; unrelated global errors are
  preserved.
- `npm run test:ui` passed after this improve-selection-clear slice with 64
  tests.
- `npm run check` passed after this improve-selection-clear slice: UI tests 64
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real QA on the existing cmux `surface:9`:
  - Selected `workspace:5`, focused existing `pane:10`, and reused only the
    single PromptVault browser surface.
  - Loaded `http://127.0.0.1:5173/?improve-select-clear=20260606a`, clicked
    `Load Stored`, and installed a page-local fetch monkeypatch that rejected
    only `/api/improve` with `forced improve failure`.
  - Clicked `Improve` and observed the top-level `forced improve failure`
    banner plus the selected-prompt warning
    `Could not improve this prompt. Check the error above and retry.`
  - Clicking the second stored prompt row through the existing visible cmux
    browser selected the new prompt and removed the matching top-level
    `forced improve failure` banner.
  - Reloaded the same `surface:9` with the toolbar refresh button to clear the
    page-local monkeypatch; the page returned to the clean initial state with
    no top-level failure and no Improve warning.
  - After re-focusing the existing PromptVault workspace, final diagnostics
    returned `No console entries` and `No browser errors`.
- Continued with the next thin slice: extend Improve failure cleanup to prompt
  context changes that do not involve directly clicking a prompt row.
- Found that prompt filtering and preview mode switching can change the
  effective selected prompt, but before this slice they did not reuse the
  matching Improve-origin global-error cleanup.
- Added a shared prompt-context cleanup path for prompt row clicks, prompt
  filter changes, and Latest/Weakest preview mode changes.
- `npm run test:ui` passed after this improve-context-clear slice with 65
  tests.
- `npm run check` passed after this improve-context-clear slice: UI tests 65
  passed, TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reused the same PromptVault browser surface and loaded
    `http://127.0.0.1:5173/?improve-context-clear=20260606a`.
  - Clicked `Load Stored`, installed a page-local fetch monkeypatch that
    rejected only `/api/improve` with `forced improve context failure`, clicked
    `Improve`, and observed the top-level bridge error plus the selected-prompt
    warning.
  - Set the prompt filter to `6ba9` using the native input setter plus an
    `input` event; the visible list narrowed to one prompt, the matching
    top-level Improve error cleared, the inline warning cleared, and
    Recommendation returned to `Run improvement for the selected prompt.`
  - Cleared the filter, triggered another forced Improve failure, then clicked
    the `Weakest` preview toggle; the matching top-level Improve error cleared,
    the inline warning cleared, and the `Weakest` button became active.
  - Reloaded the same `surface:9` to clear the page-local monkeypatch and
    confirmed `No console entries` and `No browser errors`.
- Continued with the next thin slice: make Stored Vault `Reset` apply the
  unfiltered stored prompt reload immediately.
- Found that Stored Vault `Reset` previously cleared the filter fields only;
  after filtering stored prompts, the user still had to click `Apply` to see
  unfiltered results again.
- Added an empty stored-filter factory and wired Reset to clear filters and
  call the stored prompt loader with the explicit empty filter object, avoiding
  React state timing races.
- First full `npm run check` in this slice failed at TypeScript because
  `onClick={runLoadStored}` could pass a click event as the optional filters
  argument. The Load Stored button now wraps the handler as
  `() => runLoadStored()`.
- `npm run test:ui` passed after this stored-reset slice with 66 tests.
- `npm run check` passed after the handler fix: UI tests 66 passed,
  TypeScript and Vite build passed, Rust lib 64 passed, CLI 15 passed,
  doc-tests passed, and clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reused the existing PromptVault workspace 5 browser pane only; no second
    browser was opened.
  - Loaded stored prompts and observed the baseline state:
    `1,000 loaded · latest preview`, 200 rendered rows, empty Source field,
    Reset disabled, and no top-level error.
  - Set Source to `Antigravity conversation DB` using the native input setter
    plus an `input` event, clicked `Apply`, and observed `10 loaded`,
    10 rows, Source preserved, Reset enabled, and no warning/error.
  - Clicked `Reset` once and observed Source cleared, Reset disabled,
    `1,000 loaded · latest preview`, 200 rendered rows, no Stored Load warning,
    and no top-level error.
  - Final diagnostics on the same `surface:9` returned `No console entries`
    and `No browser errors`.
- Continued with the next thin slice: clear stale Stored Load failure warnings
  when the user edits Stored Vault filters after a failed load.
- Found that a failed stored prompt load could leave the panel warning and
  matching top-level bridge error visible even after the user changed the
  filter input to recover.
- Added scoped Stored Load failure-error tracking so filter edits clear only the
  matching Stored Load global error, preserve unrelated global errors, and
  return the Stored Load state to `ready` when prior prompt results are still
  visible.
- `npm run test:ui` passed after this stored-load-edit-clear slice with 69
  tests.
- `npm run check` passed after this slice: UI tests 69 passed, TypeScript and
  Vite build passed, Rust lib 64 passed, CLI 15 passed, doc-tests passed, and
  clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reloaded `http://127.0.0.1:5173/?stored-load-edit-clear=20260606a` on the
    same PromptVault browser surface.
  - Clicked `Load Stored` and observed the prior unfiltered result
    `1,000 loaded · latest preview`.
  - Installed a page-local fetch monkeypatch that rejected only `/api/prompts`
    with `forced stored load edit failure`.
  - Set Source to `Antigravity conversation DB`, clicked `Apply`, and observed
    the Stored Load panel warning plus the matching top-level bridge error
    while the prior `1,000 loaded · latest preview` result stayed visible.
  - Edited Source to `Antigravity conversation DB edited`; the Source value
    changed, Reset stayed enabled, the prior result stayed visible, and both
    the panel warning and matching top-level error cleared immediately.
  - Restored `window.fetch`, reloaded the same `surface:9`, and confirmed
    `No console entries` and `No browser errors`.
- Continued with the next thin slice: clear stale Scan failure warnings when
  the user edits the Limit field after a failed scan attempt.
- Found that clicking `Scan` with an empty Limit showed the correct top-level
  limit error and scan warning, but editing Limit did not clear that stale
  recovery copy until another action ran.
- Added scoped scan failure-error tracking so Limit edits clear only the
  matching scan failure error, preserve unrelated global errors, and return the
  scan state to `ready` when previous scan results are still visible or `idle`
  when no result has been loaded.
- `npm run test:ui` passed after this scan-limit-edit-clear slice with 72
  tests.
- `npm run check` passed after this slice: UI tests 72 passed, TypeScript and
  Vite build passed, Rust lib 64 passed, CLI 15 passed, doc-tests passed, and
  clippy passed with `-D warnings`.
- Real cmux QA on the existing `surface:9`:
  - Reused the existing PromptVault browser surface at
    `http://127.0.0.1:5173/?scan-limit-edit-clear=20260606a`.
  - Clicked `Scan` with an empty Limit and observed the top-level error
    `Enter a scan limit before scanning...`, the scan warning
    `Could not scan prompts...`, and `Prompts` still `not loaded`.
  - Edited Limit to `10` using the native input setter plus an `input` event;
    the Limit field updated, the top-level error cleared, the scan warning
    cleared, and `Prompts` remained `not loaded` without starting a scan.
  - Reloaded the same `surface:9` and confirmed `No console entries` and
    `No browser errors`.

## Changes

- `src/actionLocks.ts`: added shared top-level and import-action busy lock
  helpers.
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
- `src/App.tsx`: separated stored prompt loading into `storedLoadState`, updated
  `Load Stored` loading text, and guarded scan, plan, import, reset, refresh,
  and queued import controls while stored prompts are loading.
- `src/App.tsx`: now uses shared action-lock helpers, disables import write
  actions while a scan is running or canceling, and exposes stable cmux QA
  selectors for `Scan`, `Plan`, and `Limit`.
- `src/App.tsx`: disables preview mode, Limit, and Stored Vault filter inputs
  while top-level scan/import/stored-load work is active.
- `src/App.tsx`: disables saved import refresh, recent import activity refresh,
  and Improve while top-level scan/import/stored-load work is active.
- `src/App.tsx`: now feeds `improving` into the shared action-lock state so
  other long-running actions are disabled while Improve is in flight.
- `src/App.tsx`: adds a function-level exclusive action claim around
  user-started long-running handlers so duplicate starts are rejected before
  React rerenders disabled states.
- `src/App.tsx`: adds endpoint-level refresh claims for stored facets, saved
  import progress, and recent import activity refresh calls.
- `src/App.tsx`: makes the Stored Vault filter panel a form with a local Apply
  action, Enter key handling, and stable filter QA selectors.
- `src/App.tsx`: adds a stable prompt-filter QA selector and shows distinct
  prompt-list and selected-panel empty states when local filtering hides all
  loaded prompts.
- `src/App.css`: gives the prompt-list empty row the same padded list rhythm as
  prompt rows, and now pads the Source panel's compact empty row.
- `src/analysisEmptyState.ts`: adds small copy helpers for Source and Frequency
  secondary-panel empty states.
- `src/App.tsx`: shows an explicit Source panel empty row before scan/load, and
  passes explicit empty text into each Frequency column.
- `src/importRefreshState.ts`: adds copy helpers for import refresh failure and
  unavailable states.
- `src/App.tsx`: keeps Saved Import Progress and Recent Import Activity panels
  visible on failed refreshes, shows in-panel stale-data warnings, and gives a
  retry-oriented empty state when no prior import data exists.
- `src/App.css`: adds a small panel notice reset for warning notices inside
  panels.
- `src/storedFacetStatus.ts`: adds stored facet refresh failure and summary copy
  helpers.
- `src/App.tsx`: adds a Stored Vault `Refresh Facets` action, stable facet
  summary selector, and in-panel stale facet warning.
- `src/App.css`: adds a compact panel-heading action layout for a summary plus
  retry button.
- `tests/storedFacetStatus.test.ts`: covers stored facet failure text and
  summary copy for loaded, loading, and failed states.
- `src/promptEmptyState.ts`: adds small copy helpers for loaded-empty and
  filter-miss prompt states; it now also provides Recommendation empty-state
  copy for selected, filter-hidden, and no-data prompt states.
- `src/actionLocks.ts`: includes `improvementRunning` in top-level and import
  write locks, and now exposes small exclusive action claim helpers.
- `tests/actionLocks.test.ts`: added coverage for top-level locks and import
  action locks, including active-scan and active-improvement cases, plus
  exclusive action claim/release behavior.
- `tests/promptEmptyState.test.ts`: covers prompt-list and selected-panel empty
  copy for not-loaded, loaded-empty, and filter-miss states, plus
  Recommendation empty-state copy for selected, filter-hidden, and no-data
  states.
- `tests/analysisEmptyState.test.ts`: covers source-summary and frequency
  empty-state copy before load and for empty loaded results.
- `tests/importRefreshState.test.ts`: covers import refresh failure and
  unavailable-state copy.
- `src/importProgress.ts`: adds import-run failure copy for failed imports that
  have no first batch result yet.
- `src/App.tsx`: keeps the Incremental Import panel visible on failed no-result
  imports and shows in-panel retry guidance with the active source label.
- `tests/importProgress.test.ts`: covers import-run failure copy for named,
  unknown, and non-failed states.
- `src/planStatus.ts`: adds plan failure and unavailable-state copy helpers.
- `src/App.tsx`: keeps the Import Plan panel visible while planning or after a
  no-data plan failure, and adds a panel-level retry/refresh Plan action.
- `tests/planStatus.test.ts`: covers plan failure and unavailable-state copy.
- `src/storedLoadStatus.ts`: adds Stored Vault load failure copy for filtered
  and unfiltered load failures.
- `src/App.tsx`: shows a Stored Vault in-panel warning when stored prompt loads
  fail.
- `tests/storedLoadStatus.test.ts`: covers stored-load failure copy.
- `src/improvementSelection.ts`: adds selected-prompt scoped improve failure
  copy.
- `src/App.tsx`: shows a Recommendation in-panel warning when the selected
  prompt's improve request fails and clears it on scan, stored-load, retry, or
  successful improvement.
- `tests/improvementSelection.test.ts`: covers improve failure copy scoping.
- `src/improvementSelection.ts`: adds an improve selection-change helper that
  clears the matching Improve-origin global error while preserving unrelated
  global errors.
- `src/App.tsx`: tracks the last Improve failure error text and clears that
  scoped error when the user selects another prompt.
- `tests/improvementSelection.test.ts`: covers selection-change cleanup and
  unrelated global error preservation.
- `src/App.tsx`: now reuses the same Improve prompt-context cleanup when the
  user changes the prompt filter or switches Latest/Weakest preview mode.
- `tests/improvementSelection.test.ts`: covers preserving global errors when
  there is no tracked Improve failure error to clear.
- `src/storedFilters.ts`: adds `emptyStoredPromptFilters()` so the full
  unfiltered Stored Vault filter shape has one shared source of truth.
- `src/App.tsx`: initializes Stored Vault filters from the helper, lets
  `runLoadStored` accept explicit filters, applies Reset by clearing fields and
  immediately loading with the empty filters, and wraps the Load Stored click
  handler to avoid passing mouse events as filter input.
- `tests/storedFilters.test.ts`: covers the empty stored filter shape.
- `src/storedLoadStatus.ts`: adds a helper for clearing failed Stored Load
  state after the user edits filters, scoped to the matching failure error.
- `src/App.tsx`: tracks the Stored Load failure error text and clears the
  matching panel/global failure when filters change after a failed load.
- `tests/storedLoadStatus.test.ts`: covers matching-error cleanup, unrelated
  error preservation, and no-prior-result fallback to idle.
- `src/scanStatus.ts`: adds a helper for clearing failed Scan state after the
  user edits Limit, scoped to the matching failure error.
- `src/App.tsx`: tracks the Scan failure error text and clears the matching
  scan failure warning/global error when Limit changes after a failed scan.
- `tests/scanStatus.test.ts`: covers matching-error cleanup, unrelated error
  preservation, and no-prior-result fallback to idle.
- `src/scanStatus.ts`: adds scan failure copy for first-run and stale-results
  failures, plus scan Stop failure copy.
- `src/App.tsx`: shows a scan retry warning when a scan fails and clears stale
  scan failure state when stored prompts are loaded; it now also shows a scoped
  scan Stop warning, re-enables Stop after failed cancel requests, and clears
  transient cancel errors after a successful scan result arrives.
- `tests/scanStatus.test.ts`: covers scan failure and Stop failure copy.
- `src/importQueue.ts`: adds a queue final-state helper that distinguishes
  completed queues from early-stopped queues.
- `src/App.tsx`: tracks completed import queue sources explicitly so Stop
  requests made during the final source do not force a completed queue into
  `Stopped`.
- `tests/importQueue.test.ts`: covers queue final-state completion and stopped
  edge cases.
- `src/importProgress.ts`: adds stopped import notice copy for continuous and
  queued partial stops.
- `src/App.tsx`: shows the stopped import notice inside the Incremental Import
  panel without treating it as a failed import.
- `tests/importProgress.test.ts`: covers continuous, queue, and non-stopped
  import stop notice cases.
- `src/panelRefresh.ts`: adds a small refresh-success error policy helper for
  manual versus quiet panel refreshes.
- `src/App.tsx`: clears stale global errors on successful manual Stored Facets,
  Saved Import Progress, and Recent Import Activity refreshes without clearing
  errors during quiet background refreshes.
- `tests/panelRefresh.test.ts`: covers manual refresh success clearing stale
  global errors and quiet refresh success preserving existing errors.
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
- During stored-load state QA, longer cmux `eval` scripts and one chained
  button-text query hit JavaScript-result timeouts. The reliable evidence came
  from the same existing `surface:9` click flow, stored vault completion text,
  scan-progress count `0`, clean console/errors, and bridge vault count `1690`.
- During import-lock QA, `cmux browser get value` timed out, and an early
  text-selector click using `button:has-text("Plan")` raised a selector-engine
  JS exception. The stable path was to select `workspace:5`, focus existing
  `pane:10`, and use explicit data selectors on `surface:9`.
- Stored vault count evidence changed during later real browser QA; the live
  `/api/prompt-facets` count is now `88,378`, so future QA should avoid fixed
  old count assertions and should read the current facet count before comparing
  persistence behavior.
- During Improve-lock QA, a page-local fetch monkeypatch delayed only
  `/api/improve` to make the in-flight state observable. The same `surface:9`
  page was reloaded after the QA run so the test delay would not leak into
  later manual testing.
- During exclusive-claim QA, `cmux browser dblclick` returned `OK` but did not
  trigger the Plan button on this WKWebView surface (`/api/plan` count stayed
  `0`). The reliable same-surface proof used direct DOM `button.click()` twice,
  which exercised the app handler in one render turn and measured one
  `/api/plan` call.
- During refresh-claim QA, direct DOM `button.click()` twice was again the
  reliable way to exercise same-render duplicate starts on `surface:9`; the
  measured counters showed one request per refresh endpoint.
- During filter-apply QA, `cmux browser press ... Return` did not trigger the
  new Enter handler on this WKWebView surface, while `press ... Enter` did.
  Future keyboard QA should use `Enter` for this surface.
- During prompt-empty QA, the stable `surface:9` path remained reliable:
  `goto`, `wait --selector`, `click`, `fill`, short `eval`, console list, and
  errors list all completed without needing a second browser.
- During recommendation-empty QA, the same `surface:9` path worked but most
  cmux browser commands took a few seconds to return. Waiting on each command
  was enough; no cmux restart or second browser was needed.
- During analysis-empty QA, the same `surface:9` path stayed reliable for
  `goto`, short `eval`, Stored Vault `Apply`, console list, and errors list.
- During import-refresh-failure QA, the page-local fetch monkeypatch affected
  only the current `surface:9` page and was cleared by reloading the same
  surface. Do not leave monkeypatches active across manual QA slices.
- During stored-facet-failure QA, `cmux tree` and the diagnostics clear RPCs
  timed out, but selecting `workspace:5`, focusing `pane:10`, and using short
  surface-specific `goto`/`wait`/`eval` commands on `surface:9` remained
  reliable. The page-local `/api/prompt-facets` monkeypatch was cleared by
  reloading the same surface, and final console/errors diagnostics returned
  clean. Do not restart cmux or open a second browser as a workaround.
- During import-run-failure QA, the page-local fetch monkeypatch affected only
  `/api/import-batch` on the current `surface:9` page and was cleared by
  reloading the same surface. The forced failure intentionally produced both a
  global bridge error and the new in-panel import failure guidance; the recovery
  reload had no warning, no top-level error, no console entries, and no browser
  errors.
- During plan-failure QA, the page-local fetch monkeypatch affected only
  `/api/plan` on the current `surface:9` page. Restoring `window.fetch` and
  clicking the new panel-level `Retry Plan` button recovered the plan in-place
  without a page reload or a second browser.
- During stored-load-failure QA, the page-local fetch monkeypatch affected only
  `/api/prompts` on the current `surface:9` page. Directly setting an input
  `.value` did not update React state; using the native input setter plus an
  `input` event preserved the `cmux` filter for the filtered-failure proof.
  Console/errors diagnostics timed out once after recovery, then succeeded on
  retry with clean results.
- During improve-failure QA, the page-local fetch monkeypatch affected only
  `/api/improve` on the current `surface:9` page. Restoring `window.fetch` and
  clicking `Improve` again recovered in-place without a page reload, and final
  diagnostics returned `No console entries` and `No browser errors`.
- During scan-failure QA, the page-local fetch monkeypatch affected only
  `/api/scan` on the current `surface:9` page. A first retry wait command
  failed because of shell quoting for `cmux browser wait --function`; the real
  scan click had already fired, and the corrected wait command verified warning
  cleanup and the limit-1 result. Final diagnostics returned clean.
- During scan-stop-failure QA, the page-local fetch monkeypatch delayed only
  `/api/scan` resolution and rejected only `/api/scan/cancel` on the current
  `surface:9` page. The first pass exposed a real stale global-error bug after
  scan completion; after clearing errors on successful scan result, the retest
  showed both scoped Stop warning and global error clearing correctly.
- During import-queue-stop-completion QA, the page-local fetch monkeypatch
  delayed only `/api/import-batch` on the current `surface:9` page and was
  restored before releasing the delayed response. The selected source was
  already complete in the SQLite cursor, so the released batch returned
  `Processed 3 / 3` and proved the one-source queue finishes as `Complete`
  despite a pending Stop request.
- During import-stop-notice QA, the page-local fetch monkeypatch delayed only
  `/api/import-batch` on the current `surface:9` page and returned a fake
  partial Codex batch to avoid mutating the durable SQLite cursor. The original
  fetch was restored and the same surface was reloaded before final diagnostics.
- During refresh-error-clear QA, the page-local fetch monkeypatch affected only
  `/api/prompt-facets` on the current `surface:9` page. The same surface was
  restored and reloaded before final diagnostics, and final console/browser
  diagnostics were clean.
- During improve-selection-clear QA, the page-local fetch monkeypatch affected
  only `/api/improve` on the current `surface:9` page. After a direct DOM click
  command timed out, Computer Use on the already-open cmux window confirmed the
  same visible `surface:9` state: the second prompt row selected and the
  matching top-level `forced improve failure` banner cleared. The same surface
  was reloaded to clear the monkeypatch. Initial `cmux browser console list`
  and `cmux browser errors list` commands timed out after reload, then succeeded
  after re-focusing the existing PromptVault workspace and returned clean.
- During improve-context-clear QA, `cmux workspace select workspace:5`,
  `cmux focus-pane --workspace workspace:5 --pane pane:10`, and the first
  `surface:9` `goto` timed out. Computer Use confirmed the same visible
  PromptVault `surface:9` had loaded the target URL, and short
  surface-specific `wait`/`click`/`eval` commands then worked. The page-local
  `/api/improve` monkeypatch was cleared by reloading the same surface, and
  final console/errors diagnostics returned clean.
- During stored-reset QA, the active visible cmux workspace was initially
  `working.md` rather than PromptVault. Computer Use selected the existing
  `프롬프트` workspace 5 row, revealing the already-open PromptVault browser
  at `http://127.0.0.1:5173/?stored-reset-apply=20260606b`; all later actions
  used the existing `surface:9` and diagnostics returned clean.
- During stored-load-edit-clear QA, the page-local fetch monkeypatch affected
  only `/api/prompts` on the current `surface:9` page and was restored before a
  clean same-surface reload. Final diagnostics returned clean.
- During scan-limit-edit-clear QA, the first combined `goto && wait` command
  on `surface:9` timed out while cmux was visibly focused on workspace 2.
  Computer Use selected the existing `프롬프트` workspace 5 row, revealing that
  the existing PromptVault browser had loaded the target URL. All verification
  then used the existing `surface:9`; the clean reload and final diagnostics
  returned clean.

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
4. Continue looking for remaining request-overlap or double-click hazards in
   secondary UI flows before moving to larger background indexing work.
5. Continue reviewing remaining empty and failure states in secondary panels,
   especially recovery paths that still need scoped cleanup for global errors.
