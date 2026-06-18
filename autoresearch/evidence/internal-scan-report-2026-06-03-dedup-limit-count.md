# Internal Scan Report: Deduped Limit Counting

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `775ed86`

Code commit: `ea20e93`

## Baseline

Limited scans stopped after the raw parsed prompt count reached the configured
limit. Deduplication happened later. If duplicate same-source prompt records
appeared before a later unique prompt, a limited scan could stop early and
return fewer unique prompts than requested.

## RED

```bash
cargo test --lib collect_from_source_applies_limit_after_deduping_prompts
```

Observed failure before implementation:

- The test did not collect the second unique prompt path.
- The source stopped after the duplicate records in the first file.

## Change

- Added a regression test with duplicate Codex records in `001.jsonl` and a
  unique prompt in `002.jsonl`.
- Updated `collect_from_source` to track `(source, hash)` keys and count only
  unique prompt records toward the remaining prompt limit.

## Verification

```bash
cargo fmt --all
cargo test --lib collect_from_source_applies_limit_after_deduping_prompts
cargo test --lib collect_from_source_stops_file_walk_after_limit
npm run check
find /tmp -maxdepth 1 -type d \( -name 'promptvault-dedup-limit-*' -o -name 'promptvault-limit-walk-*' \) -print
```

Observed:

- New dedup-limit test: PASS.
- Existing file-walk limit test: PASS.
- Full check: PASS, Vite build, 24 library tests, 13 CLI tests, and strict
  clippy passed.
- Temp cleanup check: PASS, no matching temp directories remained.

## Decision

Keep. Limited scans now stop after collecting the requested number of unique
same-source prompts instead of stopping on duplicate raw records.
