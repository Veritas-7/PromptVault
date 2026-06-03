# PromptVault Source Discovery

Checked: 2026-06-03

PromptVault is local-first. It reads local session files from Claude Code, Google Antigravity, and Codex, extracts user-authored prompt text, and writes a consolidated Markdown export. It does not delete, rename, or mutate source session files.

## Sources

| Tool | Source path | Parser |
|---|---|---|
| Codex | `~/.codex/sessions/**/*.jsonl` | JSONL rows where `type=response_item` and `payload.role=user` |
| Codex CX | `~/.codex-cx/sessions/**/*.jsonl` | Same as Codex |
| Claude Code projects | `~/.claude/projects/**/*.jsonl` | JSONL rows where `type=user` and `message.role=user` |
| Claude transcripts | `~/.claude/transcripts/*.jsonl` | JSONL rows with `type=human`, `user`, or `prompt` |
| Claude prompt history | `~/.claude/history.jsonl` | `display` field plus project/session metadata |
| Antigravity CLI transcripts | `~/.gemini/antigravity-cli/brain/**/.system_generated/logs/transcript*.jsonl` | rows with `source=USER_EXPLICIT` or `type=USER_INPUT` |
| Antigravity IDE transcripts | `~/.gemini/antigravity/brain/**/.system_generated/logs/transcript*.jsonl` | same transcript parser |
| Antigravity IDE alt transcripts | `~/.gemini/antigravity-ide/brain/**/.system_generated/logs/transcript*.jsonl` | same transcript parser |
| Antigravity prompt history | `~/.gemini/antigravity-cli/history.jsonl` | `display` field plus workspace/conversation metadata |
| Gemini temporary chats | `~/.gemini/tmp/wj/chats/*.json` | `messages[]` entries where `type=user` or `human` |

## Cleaning Rules

Codex session storage can include injected `AGENTS.md` and `<environment_context>` blocks inside user-role rows. PromptVault strips leading injected policy/environment blocks before counting words, computing frequencies, or writing prompt text. Empty records after stripping are discarded.

## Export

The default export path is:

```text
~/Documents/PromptVault/promptvault-export-YYYY-MM-DD-HHMMSS.md
```

The Markdown contains source coverage, frequent words, frequent prompt-start phrases, repeated prompts, a prompt-improvement checklist, and grouped prompt records with session/workspace/source-file metadata.

## Source Notes

- Claude's official directory documentation states that `~/.claude` stores transcripts, prompt history, file snapshots, caches, and logs.
- The Codex SDK README states that Codex threads are persisted in `~/.codex/sessions`.
- Antigravity stores agent transcript material under `.gemini/antigravity*` brain folders on this machine; PromptVault treats database blobs as future work and relies on decoded transcript/history files first.
