# Internal Scan Report: Nested Message Content

Generated: 2026-06-03T20:37:04+0900

## Candidate

`text_from_value` already extracted `message.content` when that nested object appeared inside an array item. The object branch only accepted direct string values for `text`, `content`, `display`, `message`, or `prompt`, so a whole object shaped as `{ "message": { "content": "..." } }` produced an empty string.

## RED

Command:

```bash
cargo test text_from_value_extracts_nested_message_content_object
```

Result: FAIL as expected. The test saw `left: ""` and the expected nested message prompt on the right.

## GREEN

Command:

```bash
cargo test text_from_value_extracts_nested_message_content_object
```

Result: PASS after the object branch extracted nested `message.content`.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 33 Rust library tests, 13 CLI tests, doc-tests, and strict clippy.

## Commit

Code commit: `9eb6d06b5996e5445d20dfd84d6542a9720658c2`
