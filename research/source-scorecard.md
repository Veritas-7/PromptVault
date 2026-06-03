# Source Scorecard

Date: 2026-06-03

| Source | Confidence | Evidence | Parser status |
|---|---:|---|---|
| Codex `~/.codex/sessions` | High | Official SDK README says threads persist in `~/.codex/sessions`; local JSONL schema confirmed | Implemented |
| Codex CX `~/.codex-cx/sessions` | Medium | Local profile mirrors Codex session layout | Implemented |
| Claude `~/.claude/projects` | High | Local JSONL schema confirmed; official docs describe `~/.claude` app data | Implemented |
| Claude `~/.claude/transcripts` | High | Official docs mention transcripts; local JSONL schema confirmed | Implemented |
| Claude `~/.claude/history.jsonl` | High | Official docs mention prompt history; local JSONL schema confirmed | Implemented |
| Antigravity `.gemini/antigravity-cli/brain` | High | Local transcript schema confirmed | Implemented |
| Antigravity `.gemini/antigravity/brain` | High | Local transcript schema confirmed | Implemented |
| Antigravity `.gemini/antigravity-ide/brain` | High | Local transcript schema confirmed | Implemented |
| Antigravity `.gemini/antigravity-cli/history.jsonl` | High | Local history schema confirmed | Implemented |
| Gemini tmp chats | Medium | Local JSON chat files confirmed | Implemented |
| Antigravity conversations SQLite | Low | Tables found, but prompt payload is encoded/protobuf-like | Deferred |
