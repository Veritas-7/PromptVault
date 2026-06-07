# PromptVault

PromptVault is a local-first Tauri + React + TypeScript workbench for collecting user prompts from local Claude Code, Google Antigravity, Codex CLI, and Codex app/session stores.

It extracts user-authored prompts, strips known injected context blocks, persists prompts to a permanent SQLite database, writes Markdown exports, shows daily/source/frequency/quality analytics, and recommends stronger development-agent prompts through GLM when available or a deterministic local fallback.

## Source Roots

- `~/.codex/sessions`
- `~/.codex-cx/sessions`
- `~/.claude/projects`
- `~/.claude/transcripts`
- `~/.claude/history.jsonl`
- `~/.gemini/antigravity-cli/brain`
- `~/.gemini/antigravity/brain`
- `~/.gemini/antigravity-ide/brain`
- `~/.gemini/antigravity-cli/history.jsonl`
- `~/.gemini/antigravity-cli/conversations`
- `~/.gemini/tmp/wj/chats`

See [docs/SOURCE_DISCOVERY.md](docs/SOURCE_DISCOVERY.md) for parser details.

## Permanent Database

Scans persist by default to:

```text
~/Documents/PromptVault/promptvault.sqlite
```

The database stores scan runs, prompt records, source summaries, first/last seen timestamps, quality scores, and ISO prompt dates. Re-running a scan upserts by stable prompt ID, so existing prompt records are updated instead of duplicated.

## Development

```bash
npm install
npm run dev
```

Tauri dev mode:

```bash
npm run tauri dev
```

## Agent Quickstart

Use these steps when an LLM or coding agent needs to install, run, and verify
PromptVault from a fresh checkout:

```bash
cd /Users/wj/Ai/System/10_Projects/PromptVault
npm install
npm run test:ui
npm run build
cd src-tauri
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

For browser-based QA without occupying an external browser window, run the Vite
frontend and the local PromptVault bridge, then open the app in the cmux
in-app browser:

```bash
cd /Users/wj/Ai/System/10_Projects/PromptVault
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
cd src-tauri
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174
curl -sS http://127.0.0.1:5174/api/health
```

The default permanent vault is:

```text
~/Documents/PromptVault/promptvault.sqlite
```

Recommended agent workflow:

1. Run `cargo run --bin promptvault-cli -- sources --json` to confirm source
   roots for Codex app/CLI, Claude, Antigravity, and Gemini stores.
2. Run `cargo run --bin promptvault-cli -- plan --json` before a full import.
   This inventories matching files without reading prompt bodies.
3. Use `cargo run --bin promptvault-cli -- import-batch --source SOURCE_ID
   --files N --json` for resumable incremental imports. The cursor is stored in
   SQLite and the UI refresh buttons read the same cursor/state tables.
4. Use `cargo run --bin promptvault-cli -- scan --no-export --json` only when
   the agent needs aggregate stats without creating a Markdown export.
5. Use `cargo run --bin promptvault-cli -- scan --preview-limit 5
   --include-prompts --no-export --json` only when a bounded prompt-body sample
   is necessary for verification.
6. Use `cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3`
   to test deterministic weakest-prompt recommendations.

By default, CLI stdout does not print prompt bodies. Prompt previews require
`--include-prompts`, are capped, and are redacted for token/key/private-key
risk patterns.

## CLI

```bash
cd src-tauri
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan --source codex --json
cargo run --bin promptvault-cli -- import-batch --source antigravity-ide-transcripts --files 1 --reset --json
cargo run --bin promptvault-cli -- scan --output ~/Documents/PromptVault/all-prompts.md
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-ide-conversation-db --output /tmp/promptvault-antigravity-ide-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
cargo run --bin promptvault-cli -- improve --prompt "Fix the failing parser test and verify it."
cargo run --bin promptvault-cli -- improve --json --prompt "make better"
cargo run --bin promptvault-cli -- improve --local --json --prompt "make better"
cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174
```

Run `plan` before an unrestricted scan on large stores. It inventories matching source files, total bytes, large-file counts, and warnings without reading prompt bodies. Use `import-batch --source ID --files N` to persist one resumable source slice, advance that source's DB cursor in `import_states`, and append an audit row to `import_events`. The browser UI can run one source continuously from the plan table, queue selected sources in order, and stop after the current batch without losing the saved cursor. Stored-prompt loading can be narrowed by text query, exact source label, prompt date, and workspace path so the permanent vault can be reviewed without re-scanning source files. Omit `--limit` for a full scan. Use `--source ID` to verify one source without scanning the whole history. In limited scans, `total_files` and source `files_seen` count visited files only, not every matching file in the source root. Use `--no-export` when an agent only needs JSON stats and should not create a large Markdown file. Use `--weakest-first` or `--preview-sort quality-asc` when the preview should prioritize the weakest prompts for repair. Source summaries include average prompt quality and weak-prompt counts so agents can prioritize noisy stores first. The scan command writes prompt bodies to the Markdown output path by default and prints only summary metadata to stdout. CLI scans return zero prompt bodies by default; use `--preview-limit N --include-prompts` only when an agent or test needs a bounded prompt preview in the JSON result. Stdout prompt previews are capped at 25 records and redacted for token/key/private-key risk patterns.

The Tauri UI runs full exports but receives only a latest-prompt preview over IPC, so the large Markdown file remains on disk instead of being serialized into the frontend.

For browser-only QA, run the local bridge alongside Vite:

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
cd src-tauri
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174
```

The browser bridge exposes local-only `/api/health`, `/api/scan`, `/api/scan/cancel`, `/api/scan/progress`, `/api/prompts`, `/api/prompt-facets`, `/api/improve`, `/api/plan`, `/api/import-batch`, `/api/import-states`, and `/api/import-events` endpoints so cmux or another in-app browser can exercise the same scan, scan cancellation, active scan progress with discovery counts, stored-prompt loading, stored facet summaries, planning, improvement, resumable import, saved cursor, and import activity code paths without Tauri IPC. The browser Stop control returns partial scan results for review but does not write canceled partial scans into the permanent SQLite vault; completed browser scans still persist normally.

## AI Recommendation Path

PromptVault reads non-public GLM configuration from:

```text
/Users/wj/Ai/System/70_Governance/🔐 Secrets/secrets.env
```

Used keys:

- `GLM_API_KEY` or `GLM_API_KEY_2`
- `GLM_CODING_ENDPOINT`
- `GLM_CODING_MODEL`

If GLM is missing, rate-limited, or unavailable, PromptVault falls back to local prompt-improvement rules. Use `improve --local` when automation needs deterministic offline recommendations. Use `repair --json --count N>0` to scan weakest prompts and return deterministic redacted prompt/recommendation pairs; repair batches are capped at 10 records. Both GLM and local recommendations report prompt-quality before/after scores, score delta, resolved gaps, and remaining gaps.

## Verification

```bash
npm run build
npm run check
cd src-tauri
cargo check
cargo test
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan --source codex --json
cargo run --bin promptvault-cli -- import-batch --source antigravity-ide-transcripts --files 1 --reset --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-ide-conversation-db --output /tmp/promptvault-antigravity-ide-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
curl http://127.0.0.1:5174/api/health
```

## Docs

- [docs/PROMPT_BEST_PRACTICES.md](docs/PROMPT_BEST_PRACTICES.md)
- [docs/SOURCE_DISCOVERY.md](docs/SOURCE_DISCOVERY.md)
- [docs/CLI.md](docs/CLI.md)
- [research/prompt-improvement-strategy-2026-06-03.md](research/prompt-improvement-strategy-2026-06-03.md)
