# Internal Scan Report: Private-Key Block Redaction

Generated: 2026-06-03T21:18:26+0900

## Candidate

`redact_sensitive_text` reused the existing risk regexes. The `private_key` pattern matched only the key block header, so body and footer text could remain visible after the redaction marker.

## RED

Command:

```bash
cargo test redact_sensitive_text_redacts_private_key_blocks
```

Result: FAIL as expected. The body and footer remained after `[REDACTED_PRIVATE_KEY]`.

## GREEN

Command:

```bash
cargo test redact_sensitive_text_redacts_private_key_blocks
```

Result: PASS after the regex matched the full BEGIN/body/END block.

## Full Verification

Command:

```bash
npm run check
```

Result: PASS. The run completed 10 UI helper tests, Vite production build, 41 Rust library tests, 14 CLI tests, doc-tests, and strict clippy.

## Commit

Code commit: `0c5b265267af574acd49cd71328b85555bf0902f`
