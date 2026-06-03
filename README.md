# PromptVault

PromptVault is a local-first Tauri + React + TypeScript workbench for collecting user prompts from local Claude Code, Google Antigravity, and Codex chat/session stores.

It extracts user-authored prompts, strips known injected context blocks, writes one Markdown export, shows frequent words/phrases/repeated prompt starts, and recommends stronger development-agent prompts through GLM when available or a deterministic local fallback.

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
- `~/.gemini/tmp/wj/chats`

See [docs/SOURCE_DISCOVERY.md](docs/SOURCE_DISCOVERY.md) for parser details.

## Development

```bash
npm install
npm run dev
```

Tauri dev mode:

```bash
npm run tauri dev
```

## CLI

```bash
cd src-tauri
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan --output ~/Documents/PromptVault/all-prompts.md
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md --json
cargo run --bin promptvault-cli -- improve --prompt "Fix the failing parser test and verify it."
```

Omit `--limit` for a full scan. The scan command writes prompt bodies to the Markdown output path and prints only summary metadata to stdout.

## AI Recommendation Path

PromptVault reads non-public GLM configuration from:

```text
/Users/wj/Ai/System/70_Governance/🔐 Secrets/secrets.env
```

Used keys:

- `GLM_API_KEY` or `GLM_API_KEY_2`
- `GLM_CODING_ENDPOINT`
- `GLM_CODING_MODEL`

If GLM is missing, rate-limited, or unavailable, PromptVault falls back to local prompt-improvement rules.

## Verification

```bash
npm run build
cd src-tauri
cargo check
cargo test
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md --json
```

## Docs

- [docs/PROMPT_BEST_PRACTICES.md](docs/PROMPT_BEST_PRACTICES.md)
- [docs/SOURCE_DISCOVERY.md](docs/SOURCE_DISCOVERY.md)
- [docs/CLI.md](docs/CLI.md)
- [research/prompt-improvement-strategy-2026-06-03.md](research/prompt-improvement-strategy-2026-06-03.md)
