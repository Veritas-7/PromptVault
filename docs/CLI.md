# PromptVault CLI

PromptVault ships a Rust CLI binary for agent-native use. It is intentionally non-destructive: commands read source sessions, persist prompt records to the default SQLite database, and optionally write an explicit Markdown export.

## Commands

```bash
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan [--source ID[,ID...]] --json
cargo run --bin promptvault-cli -- import-batch --source ID [--files N>0] [--reset] --json
cargo run --bin promptvault-cli -- scan [--source ID[,ID...]] [--limit N>0] [--output PATH] [--preview-limit N>=0] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export]
cargo run --bin promptvault-cli -- scan [--source ID[,ID...]] [--limit N>0] [--output PATH] [--preview-limit N>=0] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export] --json
cargo run --bin promptvault-cli -- improve [--local] --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] --json --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] < prompt.txt
cargo run --bin promptvault-cli -- repair [--source ID[,ID...]] [--limit N>0] [--count N>0] --json
cargo run --bin promptvault-cli -- serve [--addr 127.0.0.1:5174] [--database PATH]
```

## Contract

- `sources` prints discovered source IDs, labels, status, and paths.
- `sources` accepts only `--json`; unknown extra arguments exit non-zero.
- `plan` inventories matching source files, byte totals, large-file counts, and newest modified timestamps without reading prompt bodies.
- `plan --source ID` restricts planning to one source ID from `sources`; repeat it or pass comma-separated IDs for multiple sources.
- `import-batch --source ID` reads the next resumable file slice for one source, persists prompts, stores that source's cursor in SQLite `import_states`, and appends a persistent activity row to `import_events`.
- `import-batch --reset` restarts the cursor for that source before importing the requested slice.
- `help`, `--help`, and no-argument invocation print help and exit 0.
- Unknown commands print help plus an error and exit non-zero.
- `scan` persists prompt records to `~/Documents/PromptVault/promptvault.sqlite` by default.
- `scan` writes a Markdown export and prints only summary metadata, not prompt bodies.
- `scan --limit N>0` is for smoke tests; omit `--limit` for a full scan.
- In limited scans, `total_files` and each source `files_seen` count visited files only; they are not an inventory of every matching file in the source root.
- `--limit` and `repair --count` require positive integers. `--preview-limit` accepts non-negative integers so `0` can suppress previews.
- Value-taking options such as `--source`, `--output`, `--preview-sort`, and `improve --prompt` require explicit non-flag values and exit non-zero when missing.
- `scan --source ID` restricts scanning to one source ID from `sources`; repeat it or pass comma-separated IDs for multi-source smoke tests. Unknown or empty explicit source IDs exit non-zero.
- Scan JSON and Markdown source summaries include `average_quality` and `weak_prompt_count` for each source.
- `scan --no-export` skips Markdown rendering/writing when `--include-markdown` is not set; use it for fast JSON-only stats. `--output` cannot be combined with `--no-export`.
- `scan --preview-sort quality-asc` returns the weakest bounded preview first; `--weakest-first` is the same shortcut. Use only one preview sort selector per scan.
- `--json` prints machine-readable summaries for agents. `scan --json` still writes prompt bodies to the Markdown output path rather than dumping them to stdout.
- CLI scan results return zero prompt bodies by default. Use `--preview-limit N --include-prompts` for an explicit bounded prompt preview in stdout JSON.
- `--include-prompts` is capped at 25 prompt records in stdout even if `--preview-limit` is higher.
- Stdout prompt records are redacted for token/key/private-key risk patterns when prompt text is explicitly included.
- `--include-markdown` includes the Markdown body in the returned `ScanResult`; omit it for safer/leaner agent automation.
- `improve` reads one prompt and returns provider, revised prompt, rationale, quality before/after delta, resolved gaps, remaining gaps, and warnings.
- `improve` requires a non-empty prompt from `--prompt` or stdin and exits non-zero for empty or flag-like `--prompt` values.
- `improve --local` bypasses OpenAI/GLM and uses deterministic local prompt-improvement rules for reproducible smoke tests and offline repair queues.
- `repair` scans weakest prompts, runs deterministic local improvement for each one, writes no Markdown export, and returns redacted prompt/recommendation pairs. Repair batches are capped at 10 records.
- `serve` starts a local browser bridge for cmux/in-app browser QA. It exposes `/api/health`, `/api/scan`, `/api/scan/cancel`, `/api/scan/progress`, `/api/prompts`, `/api/prompt-facets`, `/api/improve`, `/api/plan`, `/api/import-batch`, `/api/import-states`, and `/api/import-events` on the requested local address.
- `serve --database PATH` makes browser-bridge persistence use the supplied SQLite file by default, so full click QA can exercise save/import flows without touching the permanent vault. Per-request `database_path` payload fields still take precedence.

## Agent-Native Design Notes

CLI-Anything's useful lesson for PromptVault is not to wrap everything in a GUI-only flow. The CLI must be:

- Discoverable through help text.
- Scriptable with stable arguments.
- Conservative about stdout so private prompt bodies are not printed accidentally.
- Explicit about generated file paths.
- Backed by the same code path as the Tauri app.

## Verification Commands

```bash
npm run check
npm run qa:browser-bridge
cargo check
npm run build
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan --source codex --json
cargo run --bin promptvault-cli -- import-batch --source antigravity-ide-transcripts --files 1 --reset --json
set +e; cargo run --bin promptvault-cli -- sources --bogus; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-ide-conversation-db --output /tmp/promptvault-antigravity-ide-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.json.md --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
cargo run --bin promptvault-cli -- improve --json --prompt "make better"
cargo run --bin promptvault-cli -- improve --local --json --prompt "make better"
set +e; cargo run --bin promptvault-cli -- improve --json --prompt ""; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174 --database /tmp/promptvault-browser-qa.sqlite
curl http://127.0.0.1:5174/api/health
set +e; cargo run --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit nope --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 0 --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- repair --limit 10 --count 0 --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --no-export --json --source; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --no-export --json --output /tmp/promptvault-no-export.md; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --preview-sort latest --weakest-first --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scna; test "$?" -ne 0; set -e
```
