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
- `~/.gemini/antigravity-cli/conversations`
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
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
cargo run --bin promptvault-cli -- improve --prompt "Fix the failing parser test and verify it."
cargo run --bin promptvault-cli -- improve --json --prompt "make better"
cargo run --bin promptvault-cli -- improve --local --json --prompt "make better"
cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3
```

Omit `--limit` for a full scan. Use `--source ID` to verify one source without scanning the whole history. Use `--no-export` when an agent only needs JSON stats and should not create a large Markdown file. Use `--weakest-first` or `--preview-sort quality-asc` when the preview should prioritize the weakest prompts for repair. Source summaries include average prompt quality and weak-prompt counts so agents can prioritize noisy stores first. The scan command writes prompt bodies to the Markdown output path by default and prints only summary metadata to stdout. CLI scans return zero prompt bodies by default; use `--preview-limit N --include-prompts` only when an agent or test needs a bounded prompt preview in the JSON result. Stdout prompt previews are capped at 25 records.

The Tauri UI runs full exports but receives only a latest-prompt preview over IPC, so the large Markdown file remains on disk instead of being serialized into the frontend.

## AI Recommendation Path

PromptVault reads non-public GLM configuration from:

```text
/Users/wj/Ai/System/70_Governance/🔐 Secrets/secrets.env
```

Used keys:

- `GLM_API_KEY` or `GLM_API_KEY_2`
- `GLM_CODING_ENDPOINT`
- `GLM_CODING_MODEL`

If GLM is missing, rate-limited, or unavailable, PromptVault falls back to local prompt-improvement rules. Use `improve --local` when automation needs deterministic offline recommendations. Use `repair --json --count N` to scan weakest prompts and return deterministic prompt/recommendation pairs; repair batches are capped at 10 records. Both GLM and local recommendations report prompt-quality before/after scores, score delta, resolved gaps, and remaining gaps.

## Verification

```bash
npm run build
npm run check
cd src-tauri
cargo check
cargo test
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
```

## Docs

- [docs/PROMPT_BEST_PRACTICES.md](docs/PROMPT_BEST_PRACTICES.md)
- [docs/SOURCE_DISCOVERY.md](docs/SOURCE_DISCOVERY.md)
- [docs/CLI.md](docs/CLI.md)
- [research/prompt-improvement-strategy-2026-06-03.md](research/prompt-improvement-strategy-2026-06-03.md)
