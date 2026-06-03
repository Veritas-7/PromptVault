# PromptVault CLI

PromptVault ships a Rust CLI binary for agent-native use. It is intentionally non-destructive: commands read source sessions and write an explicit Markdown export.

## Commands

```bash
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan [--limit N] [--output PATH]
cargo run --bin promptvault-cli -- scan [--limit N] [--output PATH] --json
cargo run --bin promptvault-cli -- improve --prompt "TEXT"
cargo run --bin promptvault-cli -- improve --json --prompt "TEXT"
cargo run --bin promptvault-cli -- improve < prompt.txt
```

## Contract

- `sources` prints discovered source IDs, labels, status, and paths.
- `scan` writes a Markdown export and prints only summary metadata, not prompt bodies.
- `scan --limit N` is for smoke tests; omit `--limit` for a full scan.
- `--json` prints machine-readable summaries for agents. `scan --json` still writes prompt bodies to the Markdown output path rather than dumping them to stdout.
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
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.json.md --json
```
