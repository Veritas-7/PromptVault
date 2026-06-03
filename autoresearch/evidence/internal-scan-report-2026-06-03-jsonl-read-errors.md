# Internal Scan Report: JSONL Read Errors

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `56c176b`

Code commit: `88743df`

## Baseline

`jsonl_lines` used `map_while(Result::ok)`. If `BufRead::lines` encountered a
read error, such as invalid UTF-8, iteration stopped and returned the preceding
valid lines as though the file were complete.

## RED

```bash
cargo test --lib jsonl_lines_propagates_read_errors
```

Observed failure before implementation:

- The invalid UTF-8 fixture returned `Ok(["..."])` instead of an error.

## Change

- Replaced the iterator chain with an explicit line-reading loop.
- `line?` now propagates read errors to the caller.
- Added `jsonl_lines_propagates_read_errors`.

## Verification

```bash
cargo fmt --all
cargo test --lib jsonl_lines_propagates_read_errors
find /tmp -maxdepth 1 -type f -name 'promptvault-invalid-jsonl-*.jsonl' -print
npm run check
```

Observed:

- Targeted read-error test: PASS.
- Temp cleanup check: PASS, no invalid JSONL fixtures remained.
- Full check: PASS, Vite build, 27 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. JSONL read errors now surface as source parse errors instead of silently
truncating input.
