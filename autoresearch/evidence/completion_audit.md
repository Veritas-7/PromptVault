# PromptVault Completion Audit

Date: 2026-06-03

## Requirement Map

| Requirement | Evidence | Status |
|---|---|---|
| Tauri + TypeScript web app | `src/App.tsx`, `src/App.css`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json` | PASS |
| Source folder under `10_Projects` | `/Users/wj/Ai/System/10_Projects/PromptVault` | PASS |
| Own source repo boundary | Nested `.git` initialized in PromptVault | PASS |
| Private GitHub repo 1:1 | `https://github.com/Veritas-7/PromptVault`, verified private with `gh repo view` | PASS |
| Find Claude Code, Antigravity, Codex session stores | `docs/SOURCE_DISCOVERY.md`; CLI `sources --json` returned all configured roots | PASS |
| Sources command argument safety | `sources` accepts `--json` and rejects unknown extra args with non-zero exit | PASS |
| Extract only user prompts | Parsers filter user-role/user-input records; Codex injected `AGENTS.md` and `<environment_context>` blocks are stripped | PASS |
| Antigravity conversation DB parser | `AntigravityConversationSqlite`; read-only SQLite `steps.step_type=14`; protobuf string extraction fixture | PASS |
| Single Markdown export | `/tmp/promptvault-antigravity-db-full.md` and prior `/Users/wj/Documents/PromptVault/promptvault-export-2026-06-03-152155.md` | PASS |
| Full local session scan | Current release CLI exported 155,484 prompts from 27,608 files in 1m45s | PASS |
| Frequency views | `ScanStats.top_words`, `top_phrases`, `repeated_prompts`; UI Frequency panel | PASS |
| Large-history UI safety | `ScanOptions.preview_limit`, `include_markdown`; UI requests latest 1,000 prompts and omits Markdown over IPC | PASS |
| Scan warning visibility | `ScanResult.warnings`; UI renders backend scan warnings as a warning notice instead of hiding them | PASS |
| Markdown warning preservation | Markdown exports include `ScanResult.warnings` so limited or partial scans remain self-describing | PASS |
| Source-specific smoke scans | `ScanOptions.source_ids`; CLI `scan --source ID`; Antigravity DB source smoke scans 2 prompts without full-history scan | PASS |
| JSONL read error safety | `jsonl_lines`; invalid UTF-8/read errors propagate instead of silently truncating a source file | PASS |
| Partial source warning safety | File-level parse notes promote the source to `partial` and surface as scan warnings | PASS |
| Numeric option safety | invalid `--limit`, `--preview-limit`, and repair `--count` exit non-zero instead of silently removing/defaulting caps | PASS |
| Required option value safety | missing values and empty source ID components exit non-zero instead of widening/defaulting scope | PASS |
| No-export stats scan | `ScanOptions.write_markdown`; CLI `scan --no-export`; full no-export scan writes no Markdown file | PASS |
| Weak-first repair queue | `ScanOptions.preview_sort`; CLI `--weakest-first`; UI `Weakest` mode; bounded preview can return lowest-quality prompts first; loaded UI prompt order follows the backend preview sort until a new scan runs | PASS |
| Source-level quality triage | `SourceSummary.average_quality`, `weak_prompt_count`; CLI JSON, Markdown source table, and UI source panel expose source quality | PASS |
| Explicit stdout prompt preview | CLI `--include-prompts`; prompt bodies remain omitted by default and opt-in stdout previews are capped at 25 records | PASS |
| Prompt quality scoring | `PromptQuality`, `ScanStats.average_quality`, `weak_prompt_count`, `top_quality_gaps`; UI quality metrics and suggestions | PASS |
| Prompt improvement app | UI selected-prompt panel plus `improve_prompt` Tauri command; selected detail stays within the active filtered prompt list; recommendations display only for the prompt that produced them | PASS |
| Measurable improvement delta | `QualityDelta`; CLI/UI expose before score, after score, score delta, resolved gaps, and remaining gaps | PASS |
| Improve prompt value safety | CLI `improve` rejects empty `--prompt`, flag-like `--prompt`, empty stdin, and no-arg stdin EOF with non-zero exit | PASS |
| Deterministic local improve | `ImproveRequest.force_local`; CLI `improve --local`; bypasses GLM and returns local-rules without warnings | PASS |
| Deterministic batch repair | CLI `repair --json`; weakest-first scan plus local-rules recommendations; no Markdown export; capped at 10 repairs | PASS |
| Rust lint gate | `cargo clippy --all-targets --all-features -- -D warnings` passes with no warnings | PASS |
| One-command local quality gate | `npm run check` runs quiet UI helper tests, frontend build, Rust tests, and strict clippy | PASS |
| GLM from `secrets.env` as fallback-capable AI path | Reads `GLM_API_KEY`/`GLM_API_KEY_2`, `GLM_CODING_ENDPOINT`, `GLM_CODING_MODEL`; ignores blank API key values; defaults blank model values; normalizes base/blank endpoints; falls back locally on 429 or invalid empty `revised_prompt` content | PASS |
| Codex SDK considered | `research/external_sources.json` and strategy doc cite official Codex SDK README and defer direct SDK invocation for safety | PASS_WITH_NOTE |
| CLI-Anything-inspired strong CLI | `promptvault-cli` supports `sources`, `scan`, `improve`, and `--json` summaries | PASS |
| CLI unknown command safety | explicit help exits 0; unknown commands exit non-zero with an error | PASS |
| Prompt best practices docs | `docs/PROMPT_BEST_PRACTICES.md` | PASS |
| Detailed research saved | `research/` plus archive copy in `/Users/wj/Ai/System/12_Research/PromptVault_2026-06-03/` | PASS |

## Verification Commands

```bash
npm run build
npm run test:ui
npm run check
cargo check
cargo test
cargo run --quiet --bin promptvault-cli -- sources --json
set +e; cargo run --quiet --bin promptvault-cli -- sources --bogus; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- sources --json --bogus; test "$?" -ne 0; set -e
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-json-smoke.md --json
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --preview-limit 0 --output /tmp/promptvault-source-filter-antigravity-db.md --json
set +e; cargo run --quiet --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json; test "$?" -ne 0; set -e
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview-five.md --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --output /tmp/promptvault-quality-smoke.md --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 0 --no-export --json > /tmp/promptvault-source-quality.json
cargo run --quiet --bin promptvault-cli -- improve --json --prompt "make better"
set +e; cargo run --quiet --bin promptvault-cli -- improve --json --prompt ""; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- improve --prompt --bogus; test "$?" -ne 0; set -e
set +e; printf "" | cargo run --quiet --bin promptvault-cli -- improve --json; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- improve --json; test "$?" -ne 0; set -e
cargo run --quiet --bin promptvault-cli -- improve --local --json --prompt "make better"
cargo run --quiet --bin promptvault-cli -- repair --json --limit 100 --count 3
cargo run --quiet --bin promptvault-cli -- repair --json --limit 100 --count 99
set +e; cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --limit nope --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit nope --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count nope --json; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --source; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- scan --source codex, --limit 1 --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --output; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- scan --limit 10 --no-export --json --preview-sort; test "$?" -ne 0; set -e
set +e; cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count 1 --json --source; test "$?" -ne 0; set -e
cargo clippy --all-targets --all-features -- -D warnings
cargo build --release --bin promptvault-cli
./target/release/promptvault-cli scan --no-export --json > /tmp/promptvault-no-export-full.json
./target/release/promptvault-cli scan --output /tmp/promptvault-antigravity-db-full.md --json
npm run tauri build
VITE_PORT=5174 VITE_HMR_PORT=5175 npm run dev
curl -I --max-time 5 http://localhost:5174/
git diff --check
set +e; cargo run --quiet --bin promptvault-cli -- scna; test "$?" -ne 0; set -e
cargo run --quiet --bin promptvault-cli -- --help
```

## Observed Results

- `npm run build`: PASS, Vite production build completed.
- `npm run test:ui`: PASS, 9 Node UI helper tests passed without `ExperimentalWarning` output.
- `npm run check`: PASS, 9 quiet UI helper tests passed, Vite production build completed, 31 library tests plus 13 CLI tests passed, and strict clippy passed.
- UI warning notice: PASS, `ScanResult.warnings` renders through the existing notice pattern with a warning variant.
- `cargo check`: PASS.
- `cargo test`: PASS, 31 library tests plus 13 CLI tests passed.
- CLI unit tests: PASS, 13 CLI tests passed including explicit help command recognition, empty and flag-like prompt rejection, numeric argument validation, required value validation, empty source component rejection, repair count cap documentation, and sources extra-arg rejection.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- `sources --json`: PASS, 11 source roots reported, including `antigravity-cli-conversation-db`.
- Sources extra-arg smoke: PASS, `sources --bogus` and `sources --json --bogus` both exited 1 with `unknown sources argument: --bogus`; valid `sources --json` still returned 11 roots.
- Smoke scan: PASS, 100 prompts from 92 visited files, no injected-context markers, with the configured-limit warning.
- Markdown warning smoke: PASS, limited `--source codex --limit 1` export wrote `## Warnings` and `Scan stopped at configured limit of 1 prompts.` to `/tmp/promptvault-warning-export.md`.
- Source-filter smoke: PASS, `--source antigravity-cli-conversation-db` scanned only that source and returned `total_prompts=2`, `total_files=2`, source summary status `ok`, and `warnings=[]`.
- Unknown-source smoke: PASS, `--source missing-source` exited 1 with `unknown source id: missing-source`.
- Numeric option smoke: PASS, invalid `--limit`, `--preview-limit`, and repair `--count` each exited 1 with the expected non-negative integer error; valid `--limit 10 --preview-limit 0` scan exited 0.
- Required value smoke: PASS, missing scan `--source`, `--output`, `--preview-sort`, empty source component `--source codex,`, repair `--source`, and flag-like improve `--prompt` values each exited 1; valid `--source codex --limit 1` scan exited 0.
- No-export full scan: PASS, current release CLI scanned 155,484 prompts from 27,608 files in 1m31s with `output_path=null`, `markdown_written=false`, `markdown_included=false`, `warnings=[]`, and no `/tmp/promptvault-no-export-full.md` file created.
- Preview-payload scan: PASS, default CLI JSON returned `returned_prompt_count=0`, bounded preview returned `returned_prompt_count=5`.
- Weak-first preview smoke: PASS, `scan --limit 100 --preview-limit 5 --weakest-first --no-export --json` returned `preview_sort=quality_asc`, `returned_prompt_count=5`, `markdown_written=false`, and `output_path=null`.
- UI preview-mode consistency test: PASS, loaded prompt display mode follows `ScanResult.preview_sort` while scan requests still follow the pending Latest/Weakest control.
- UI filtered-selection consistency test: PASS, selected detail falls back to the first visible filtered prompt when the previous selection is hidden by search.
- UI recommendation ownership test: PASS, recommendation output is hidden when the current selection no longer matches the prompt that produced the improvement.
- Source-level quality smoke: PASS, `scan --limit 100 --preview-limit 0 --no-export --json` returned first source `average_quality=71.6`, `weak_prompt_count=16`, and all source summaries included both fields.
- Markdown source-quality contract test: PASS, source coverage export includes `Avg Quality` and `Weak` columns plus source row quality values.
- Explicit prompt stdout smoke: PASS, `scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json` returned `prompt_stdout_count=5`; first prompt quality was `36 · weak` with gaps `specific_goal`, `context`, `constraints`, `verification`, `output_format`.
- Default stdout safety smoke: PASS, the same scan without `--include-prompts` returned `prompt_stdout_count=0` and `prompts_len=0`.
- Stdout cap smoke: PASS, `--preview-limit 30 --include-prompts` returned `returned_prompt_count=30`, `prompt_stdout_count=25`, `prompts_len=25`, and one cap warning.
- Prompt quality smoke: PASS, 100-prompt smoke reported `average_quality=71.6`, `weak_prompt_count=16`, and top quality gaps `constraints`, `verification`, `output_format`, `action_verb`, `context`.
- Improvement delta smoke: PASS, `improve --json --prompt "make better"` returned `quality_delta.score_delta=64`, `before.score=36`, `after.score=100`, and resolved gaps `specific_goal`, `context`, `constraints`, `verification`, `output_format`.
- Empty improve smoke: PASS, empty `--prompt`, empty stdin, and no-arg stdin EOF all exited 1 with `promptvault-cli error: improve requires a non-empty prompt`.
- Deterministic local improve smoke: PASS, `improve --local --json --prompt "make better"` returned `provider=local-rules`, `used_ai=false`, `warnings=[]`, and `quality_delta.score_delta=64`.
- Batch repair smoke: PASS, `repair --json --limit 100 --count 3` returned `provider=local-rules`, `preview_sort=quality_asc`, `scanned_prompt_count=100`, `returned_prompt_count=3`, `repair_count=3`, `markdown_written=false`, `output_path=null`, and first repair prompt was `36 · weak` with `score_delta=64`.
- Batch repair cap smoke: PASS, `repair --json --limit 100 --count 99` returned `returned_prompt_count=10`, `repair_count=10`, `markdown_written=false`, `output_path=null`, and one cap warning.
- CLI unknown-command smoke: PASS, `scna` exited 1, printed help, and wrote `promptvault-cli error: unknown command: scna` to stderr.
- CLI help smoke: PASS, `--help` exited 0, printed help, and wrote no stderr.
- Antigravity DB source: PASS, full release scan reported `files_seen=2`, `prompts_found=2`, status `ok`, notes `[]`.
- Full release scan: PASS, current code exported 155,484 prompts from 27,608 files to `/tmp/promptvault-antigravity-db-full.md`, output `364M`, UTF-8 Markdown text.
- Full release scan response payload: PASS, `returned_prompt_count=0`, `prompts_truncated=true`, `markdown_included=false`.
- Full release quality distribution: PASS, `average_quality=66.49`, `weak_prompt_count=61,243`, and top quality gaps `constraints`, `verification`, `output_format`, `action_verb`, `context`.
- Tauri production build: PASS, produced `src-tauri/target/release/bundle/macos/promptvault.app` and `src-tauri/target/release/bundle/dmg/promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned HTTP 200. Existing CareVault server occupied default port 1420, so PromptVault was started with `VITE_PORT=5174`.
- Diff whitespace gate: PASS, `git diff --check`.
- Playwright render smoke: PASS, `Agent prompt intelligence` loaded, `Recommendation` panel rendered, 5 panels were present, and `bodyWidth=viewportWidth=1440`.
- Weakest-mode render smoke: PASS, `Latest` and `Weakest` controls rendered, clicking `Weakest` activated that mode, and `bodyWidth=viewportWidth=1440`.
- Source-quality render smoke: PASS, mocked scan rendered `Q 55.5 · Weak 1` in the source panel and `bodyWidth=viewportWidth=1440`.
- GitHub remote: PASS, `origin/main` pushed to private repo `Veritas-7/PromptVault`.
- GLM improve smoke: fallback path PASS; live GLM returned `429 Too Many Requests`, then local rules returned a recommendation.
- GLM content parser: PASS, JSON content with empty `revised_prompt` is rejected so the caller can use local fallback.
- GLM endpoint normalization: PASS, blank `GLM_CODING_ENDPOINT` resolves to the default BigModel chat completions endpoint.
- GLM API key selection: PASS, blank `GLM_API_KEY` is ignored and `GLM_API_KEY_2` is selected when available.
- GLM model selection: PASS, blank `GLM_CODING_MODEL` resolves to the default `glm-4.6` model.

## Residual Risks

- The full Markdown export is large (`364M`) on this machine. The default release CLI export completes, the Tauri UI receives only a latest-prompt preview over IPC, and CLI automation can now use `--no-export` for stats-only scans.
- Antigravity raw `.pb` conversation files are still deferred because no stable local schema has been verified for separating user prompts from model/tool output. SQLite `conversations/*.db` is implemented only for the confirmed `steps.step_type=14` user-input lane.
- Direct Codex SDK prompt rewriting is documented but not enabled by default, because the official SDK is agent/workflow oriented and prompt rewriting is safer through a narrow chat-completion path.
