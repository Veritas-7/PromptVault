# Internal Scan Report

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `624662c`

## Current Strengths

- Source repo is clean and pushed to private `origin/main`.
- PromptVault can scan Claude, Codex, Antigravity, Gemini temp chats, and the confirmed Antigravity SQLite DB lane.
- CLI source filtering now enables targeted parser smoke tests.
- The Tauri UI avoids returning full Markdown over IPC by default.

## Current Weakness

Full scans still render and write a large Markdown export even when the operator only needs JSON summary stats. The latest verified full export was `364M`, which is appropriate for archival export but wasteful for fast autoresearch loops and parser validation.

## Selected Candidate

Add a no-export scan mode:

- Preserve full Markdown export as the default.
- Add CLI `scan --no-export`.
- Add `ScanOptions.write_markdown` for Tauri/CLI callers.
- Skip Markdown rendering entirely when `write_markdown=false` and `include_markdown=false`.
- Report `markdown_written=false` in `ScanResult` and CLI JSON.

## Success Metric

A full JSON scan can complete without writing a Markdown file:

```bash
./target/release/promptvault-cli scan --no-export --json > /tmp/promptvault-no-export-full.json
```

Expected evidence:

- `markdown_written=false`
- `markdown_included=false`
- `output_path=null`
- no large Markdown file created for the run
