# AutoResearch Iteration: Deduped Limit Counting

Date: 2026-06-03

## Objective

Prevent limited scans from returning too few unique prompts when duplicate
records appear before later unique records.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-dedup-limit-count.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-dedup-limit-count.md`

Observed issue:

- `collect_from_source` stopped on raw parsed record count.
- `run_scan` deduplicated after collection, so early duplicates could consume
  the configured limit.

## Change

- Added `collect_from_source_applies_limit_after_deduping_prompts`.
- Deduped same-source records inside `collect_from_source` before applying the
  remaining prompt limit.

## Evidence

```bash
cargo test --lib collect_from_source_applies_limit_after_deduping_prompts
cargo test --lib collect_from_source_stops_file_walk_after_limit
npm run check
```

Observed:

- RED before implementation: the second unique prompt was not collected.
- GREEN after implementation: both targeted tests passed.
- Full check: PASS, 24 library tests plus 13 CLI tests and strict clippy passed.

## Decision

Keep. The scan limit now counts unique prompt records for a source while
preserving early file-walk stopping.
