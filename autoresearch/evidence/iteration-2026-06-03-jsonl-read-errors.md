# AutoResearch Iteration: JSONL Read Errors

Date: 2026-06-03

## Objective

Propagate JSONL line read errors instead of silently accepting partial files.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-jsonl-read-errors.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-jsonl-read-errors.md`

Observed issue:

- `map_while(Result::ok)` hid read errors by stopping iteration.
- Invalid UTF-8 could truncate a source file without a warning.

## Change

- Replaced silent iterator filtering with explicit `line?` propagation.
- Added invalid UTF-8 coverage.

## Evidence

```bash
cargo test --lib jsonl_lines_propagates_read_errors
npm run check
```

Observed:

- RED before implementation: invalid UTF-8 returned `Ok`.
- GREEN after implementation: targeted test passed.
- Full check: PASS.

## Decision

Keep. Corrupt JSONL input now fails closed into the existing source warning path.
