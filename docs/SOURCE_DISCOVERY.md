# PromptVault Source Discovery

Checked: 2026-06-18

PromptVault is local-first. It reads local session files from Claude Code, Google Antigravity, Codex, and Hermes, extracts user-authored prompt text, and writes a consolidated Markdown export plus a permanent SQLite vault. It does not delete, rename, or mutate source session files.

## Sources

| Tool | Source path | Parser |
|---|---|---|
| Codex | `~/.codex/sessions/**/*.jsonl` | JSONL rows where `type=response_item` and `payload.role=user` |
| Codex CX | `~/.codex-cx/sessions/**/*.jsonl` | Same as Codex |
| Claude Code projects | `~/.claude/projects/**/*.jsonl` | JSONL rows where `type=user` and `message.role=user` |
| Claude transcripts | `~/.claude/transcripts/*.jsonl` | JSONL rows with `type=human`, `user`, or `prompt` |
| Claude prompt history | `~/.claude/history.jsonl` | `display` field plus project/session metadata |
| Hermes CLI sessions | `~/.hermes/sessions/**/*.json` and `**/*.jsonl` | `messages[]`, `request.body.messages[]`, or top-level rows where `role=user` |
| Hermes profile sessions | `~/.hermes/profiles/**/*.json` and `**/*.jsonl` | same Hermes session parser, with profile name preserved as workspace metadata when no cwd is present |
| Hermes app storage | `~/Library/Application Support/Hermes/**/*.json` and `**/*.jsonl` | same Hermes parser for session/request dump files, while Chromium cache/LevelDB folders are skipped |
| Antigravity CLI transcripts | `~/.gemini/antigravity-cli/brain/**/.system_generated/logs/transcript*.jsonl` | rows with `source=USER_EXPLICIT` or `type=USER_INPUT` |
| Antigravity IDE transcripts | `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript*.jsonl` | same transcript parser |
| Antigravity IDE alt transcripts | `~/.gemini/antigravity-ide/brain/**/.system_generated/logs/transcript*.jsonl` | same transcript parser |
| Antigravity prompt history | `~/.gemini/antigravity-cli/history.jsonl` | `display` field plus workspace/conversation metadata |
| Antigravity CLI conversation DB | `~/.gemini/antigravity-cli/conversations/*.db` | read-only SQLite `steps` rows where `step_type=14`; protobuf payload strings filtered for user prompts |
| Antigravity IDE conversation DB | `~/.gemini/antigravity/conversations/*.db` | same read-only SQLite `steps` parser as the CLI conversation DB |
| Gemini temporary chats | `~/.gemini/tmp/*/chats/*.json` | `messages[]` entries where `type=user` or `human` |

## Cleaning Rules

Codex session storage can include injected `AGENTS.md` and `<environment_context>` blocks inside user-role rows. PromptVault strips leading injected policy/environment blocks before counting words, computing frequencies, or writing prompt text. Empty records after stripping are discarded.

Hermes app storage may include Electron/Chromium cache directories. PromptVault only descends into session-like JSON/JSONL files and skips cache, storage, runtime, backup, `.git`, and dependency folders.

## Export

The default export path is:

```text
~/Documents/PromptVault/promptvault-export-YYYY-MM-DD-HHMMSS.md
```

The Markdown contains source coverage, frequent words, frequent prompt-start phrases, repeated prompts, prompts by date, prompts by project, a prompt-improvement checklist, and grouped prompt records with session/workspace/source-file metadata.

## Source Notes

- Claude's official directory documentation states that `~/.claude` stores transcripts, prompt history, file snapshots, caches, and logs.
- The Codex SDK README states that Codex threads are persisted in `~/.codex/sessions`.
- Hermes support covers the observed CLI session shape under `~/.hermes/sessions`, profile request dumps under `~/.hermes/profiles`, and app-side session/request JSON below `~/Library/Application Support/Hermes`.
- Antigravity stores agent transcript material under `.gemini/antigravity*` brain folders on this machine. PromptVault now also reads CLI and IDE conversation SQLite databases when the `steps` schema is present and extracts only `step_type=14` user-input payloads.
- Gemini temporary chats are discovered below every `~/.gemini/tmp/*/chats` namespace instead of a machine-specific username folder, so different macOS account names keep working without source edits.
- Antigravity raw `.pb` conversation files remain evidence-only until a stable schema or stronger local A/B fixture distinguishes user prompts from model/tool output without heuristics.
