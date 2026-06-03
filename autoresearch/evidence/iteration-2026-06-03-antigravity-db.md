# AutoResearch Iteration: Antigravity Conversation DB Intake

Date: 2026-06-03

## Objective

Remove the deferred Antigravity SQLite gap when local evidence can distinguish user prompts from model/tool output.

## External Intake

Sources checked:

- Google Antigravity hooks documentation
- Antigravity Lab chat-history recovery guide
- Existing Antigravity source discovery and source scorecard

Transferable claims:

- Official hook metadata exposes `transcriptPath`, so transcript JSONL remains the primary stable source.
- Antigravity chat history can live in SQLite-like local state and can fail to load in the UI even when rows remain on disk.
- Database and protobuf-like payloads must stay read-only and fail-closed unless local fixtures prove user-prompt extraction.

## Local Evidence

- Found two local Antigravity CLI conversation SQLite files under `~/.gemini/antigravity-cli/conversations`.
- Schema includes `steps(idx, step_type, step_payload, ...)`.
- Raw protobuf inspection showed `step_type=14` contains the user input; `step_type=15` contains model output; `step_type=23` repeats task summary/original prompt.
- Adopted only `step_type=14` to avoid duplicate model/task records.

## Change

- Added `AntigravityConversationSqlite` source kind.
- Added read-only `rusqlite` parser for `~/.gemini/antigravity-cli/conversations/*.db`.
- Added bounded protobuf wire-string extraction without requiring Antigravity schema files.
- Added candidate filtering to skip UUIDs, paths, bot ids, permission strings, and model-output rows.
- Added a SQLite fixture test proving that only `step_type=14` user steps are collected.

## Evidence

```bash
cargo fmt --manifest-path src-tauri/Cargo.toml --all
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- sources --json
cargo build --release --bin promptvault-cli
./target/release/promptvault-cli scan --output /tmp/promptvault-antigravity-db-full.md --json > /tmp/promptvault-antigravity-db-full.json
```

Observed:

- `cargo test`: 8 tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- `sources --json`: 11 source roots, including `antigravity-cli-conversation-db`.
- Full release scan: exported 155,484 prompts from 27,608 files to `/tmp/promptvault-antigravity-db-full.md`.
- Antigravity DB source summary: `files_seen=2`, `prompts_found=2`, status `ok`, notes `[]`.
- Full release scan response payload: `returned_prompt_count=0`, `prompts_truncated=true`, `markdown_included=false`.

## Decision

Keep. The change closes the confirmed SQLite gap while leaving raw `.pb` files fail-closed until there is stronger schema evidence for user-vs-model separation.
