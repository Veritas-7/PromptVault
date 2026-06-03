# AutoResearch Iteration: Nested Message Content

Date: 2026-06-03

## Change

- Added a focused Rust regression test for object-shaped nested prompt payloads.
- Updated `text_from_value` to extract `message.content` when a whole object contains a nested message object.

## Evidence

- `autoresearch/evidence/internal-scan-report-2026-06-03-nested-message-content.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-nested-message-content.md`
- `autoresearch/evidence/completion_audit.md`

## Verification

- RED: `cargo test text_from_value_extracts_nested_message_content_object` failed with an empty extracted prompt.
- GREEN: `cargo test text_from_value_extracts_nested_message_content_object` passed.
- Full gate: `npm run check` passed.

## Result

Prompt extraction now covers direct string fields, array item `message.content`, and object-shaped `message.content` without broadening source scope.
