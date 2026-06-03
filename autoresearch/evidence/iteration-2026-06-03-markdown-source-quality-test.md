# AutoResearch Iteration: Markdown Source Quality Test

Date: 2026-06-03

## Objective

Lock the Markdown source-quality export contract with a focused regression test.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-markdown-source-quality-test.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-markdown-source-quality-test.md`

Observed issue:

- Source-level quality metrics were available.
- Markdown exports included the new quality columns.
- No unit test pinned the Markdown source coverage table format.

## Change

- Added `markdown_source_coverage_includes_quality_triage`.
- The test verifies the Markdown table header includes `Avg Quality` and `Weak`.
- The test verifies a synthetic source row includes average quality and weak-prompt count values.

## Evidence

```bash
cargo fmt --all
cargo test
cargo clippy --all-targets --all-features -- -D warnings
```

Observed:

- `cargo fmt --all`: PASS.
- `cargo test`: PASS, 14 library tests plus 2 CLI tests passed.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.

## Decision

Keep. Source-level quality is now guarded in the Markdown export contract, not just present in implementation and docs.
