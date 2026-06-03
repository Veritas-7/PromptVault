# AutoResearch Iteration: Improve Prompt Required Value

Date: 2026-06-03

## Objective

Make `improve --prompt` reject flag-like missing values instead of treating them
as prompt text.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-prompt-required-value.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-improve-prompt-required-value.md`

Observed issue:

- `--prompt` did not reuse the existing required-value parser.
- A typo such as `improve --prompt --bogus` could be silently interpreted as
  prompt text.

## Change

- `collect_prompt_arg` now calls `parse_required_arg` for `--prompt`.
- The prompt parser unit test now covers flag-like prompt values.

## Evidence

```bash
cargo test --bin promptvault-cli collect_prompt_arg_rejects_empty_prompt_flag
cargo run --quiet --bin promptvault-cli -- improve --prompt --bogus
npm run check
```

Observed:

- RED before implementation: flag-like `--prompt` value was accepted.
- GREEN after implementation: targeted test passed.
- CLI smoke: PASS, exited 1 with `--prompt requires a value`.
- Full check: PASS.

## Decision

Keep. The improve command now fails closed for missing or flag-like prompt
values while stdin remains available for arbitrary prompt text.
