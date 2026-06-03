# PromptVault CLI

PromptVault ships a Rust CLI binary for agent-native use. It is intentionally non-destructive: commands read source sessions and write an explicit Markdown export.

## Commands

```bash
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--include-markdown] [--no-export]
cargo run --bin promptvault-cli -- scan [--source ID] [--limit N] [--output PATH] [--preview-limit N] [--include-markdown] [--no-export] --json
cargo run --bin promptvault-cli -- improve --prompt "TEXT"
cargo run --bin promptvault-cli -- improve --json --prompt "TEXT"
cargo run --bin promptvault-cli -- improve < prompt.txt
```

## Contract

- `sources` prints discovered source IDs, labels, status, and paths.
- `scan` writes a Markdown export and prints only summary metadata, not prompt bodies.
- `scan --limit N` is for smoke tests; omit `--limit` for a full scan.
- `scan --source ID` restricts scanning to one source ID from `sources`; repeat it or pass comma-separated IDs for multi-source smoke tests.
- `scan --no-export` skips Markdown rendering/writing when `--include-markdown` is not set; use it for fast JSON-only stats.
- `--json` prints machine-readable summaries for agents. `scan --json` still writes prompt bodies to the Markdown output path rather than dumping them to stdout.
- CLI scan results return zero prompt bodies by default. Use `--preview-limit N` for a bounded latest-prompt preview.
- `--include-markdown` includes the Markdown body in the returned `ScanResult`; omit it for safer/leaner agent automation.
- `improve` reads one prompt and returns provider, revised prompt, rationale, and warnings.

## Agent-Native Design Notes

CLI-Anything's useful lesson for PromptVault is not to wrap everything in a GUI-only flow. The CLI must be:

- Discoverable through help text.
- Scriptable with stable arguments.
- Conservative about stdout so private prompt bodies are not printed accidentally.
- Explicit about generated file paths.
- Backed by the same code path as the Tauri app.

## Verification Commands

```bash
cargo check
npm run build
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.json.md --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
```
