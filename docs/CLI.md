# PromptVault CLI

PromptVault ships a Rust CLI binary for agent-native use. It is intentionally non-destructive: commands read source sessions and write an explicit Markdown export.

## Commands

```bash
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export]
cargo run --bin promptvault-cli -- scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export] --json
cargo run --bin promptvault-cli -- improve [--local] --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] --json --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] < prompt.txt
cargo run --bin promptvault-cli -- repair [--source ID] [--limit N] [--count N] --json
```

## Contract

- `sources` prints discovered source IDs, labels, status, and paths.
- `help`, `--help`, and no-argument invocation print help and exit 0.
- Unknown commands print help plus an error and exit non-zero.
- `scan` writes a Markdown export and prints only summary metadata, not prompt bodies.
- `scan --limit N` is for smoke tests; omit `--limit` for a full scan.
- Numeric options such as `--limit`, `--preview-limit`, and `--count` require non-negative integers and exit non-zero for invalid values.
- `scan --source ID` restricts scanning to one source ID from `sources`; repeat it or pass comma-separated IDs for multi-source smoke tests.
- Scan JSON and Markdown source summaries include `average_quality` and `weak_prompt_count` for each source.
- `scan --no-export` skips Markdown rendering/writing when `--include-markdown` is not set; use it for fast JSON-only stats.
- `scan --preview-sort quality-asc` returns the weakest bounded preview first; `--weakest-first` is the same shortcut.
- `--json` prints machine-readable summaries for agents. `scan --json` still writes prompt bodies to the Markdown output path rather than dumping them to stdout.
- CLI scan results return zero prompt bodies by default. Use `--preview-limit N --include-prompts` for an explicit bounded prompt preview in stdout JSON.
- `--include-prompts` is capped at 25 prompt records in stdout even if `--preview-limit` is higher.
- `--include-markdown` includes the Markdown body in the returned `ScanResult`; omit it for safer/leaner agent automation.
- `improve` reads one prompt and returns provider, revised prompt, rationale, quality before/after delta, resolved gaps, remaining gaps, and warnings.
- `improve` requires a non-empty prompt from `--prompt` or stdin and exits non-zero for empty input.
- `improve --local` bypasses GLM and uses deterministic local prompt-improvement rules for reproducible smoke tests and offline repair queues.
- `repair` scans weakest prompts, runs deterministic local improvement for each one, writes no Markdown export, and returns prompt/recommendation pairs. Repair batches are capped at 10 records.

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
cargo check
npm run build
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.json.md --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
cargo run --bin promptvault-cli -- improve --json --prompt "make better"
cargo run --bin promptvault-cli -- improve --local --json --prompt "make better"
set +e; cargo run --bin promptvault-cli -- improve --json --prompt ""; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3
set +e; cargo run --bin promptvault-cli -- scan --limit nope --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scna; test "$?" -ne 0; set -e
```
