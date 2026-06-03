# Internal Scan Report: Key-Value Redaction

Generated: 2026-06-03T21:12:41+0900

## Candidate

`redact_sensitive_text` reused the existing risk regexes. The `possible_api_key` pattern matched only the key name and delimiter, so a short key/value secret could leave the value visible after the redaction marker.

## RED

Command:

```bash
cargo test redact_sensitive_text_redacts_key_value_pairs
```

Result: FAIL as expected. The value remained after `[REDACTED_POSSIBLE_API_KEY]`.

## GREEN

Command:

```bash
cargo test redact_sensitive_text_redacts_key_value_pairs
```

Result: PASS after the regex included the optional non-whitespace value segment.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 40 Rust library tests, 14 CLI tests, doc-tests, and strict clippy.

## Commit

Code commit: `4b2e67ef54a2a4698209cf7a900f768d114f6460`
