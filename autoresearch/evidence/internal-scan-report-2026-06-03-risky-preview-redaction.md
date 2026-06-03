# Internal Scan Report: Risky Preview Redaction

Generated: 2026-06-03T21:02:27+0900

## Local Evidence

A small Claude history weakest scan showed that `--include-prompts` could print a long key-like token from prompt history into CLI JSON output. The app already tags risky text, but the stdout preview emitted the raw `text` field.

## RED

Command:

```bash
cargo test json_prompt_preview_redacts_long_token_text
```

Result: FAIL as expected. The focused test saw the synthetic long token instead of `[REDACTED_LONG_BASE64_LIKE_TOKEN]`.

## GREEN

Command:

```bash
cargo test json_prompt_preview_redacts_long_token_text
```

Result: PASS after CLI JSON prompt previews cloned records and redacted the `text` field.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 38 Rust library tests, 14 CLI tests, doc-tests, and strict clippy.

## Post-Fix Smoke

Command:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source claude-code-history --limit 60 --preview-limit 10 --weakest-first --include-prompts --no-export --json
```

Result: PASS. The summary returned `containsRawSkToken=false`, `containsRedaction=true`, and the expected configured-limit warning.

## Commit

Code commit: `1a9392cb61229f8c605d0606ed5fb20a594e9fbf`
