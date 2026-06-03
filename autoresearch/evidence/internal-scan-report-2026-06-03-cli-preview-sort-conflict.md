# Internal Scan Report: CLI Preview Sort Conflict

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `f8dcd59`

## Baseline

Multiple sort selectors exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --weakest-first --preview-sort latest --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --preview-sort quality-desc --weakest-first --json
```

Observed:

- First command returned `preview_sort: latest`.
- Second command returned `preview_sort: quality_asc`.
- The result depended on argument order.

## Selected Candidate

Track the first preview sort selector and reject any second selector.

## Success Metric

```bash
cargo test --bin promptvault-cli set_preview_sort_rejects_multiple_sort_options
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --weakest-first --preview-sort latest --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --preview-sort quality-desc --weakest-first --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --weakest-first --json
npm run check
```

Expected:

- Duplicate sort selectors exit non-zero in both orders.
- Single `--weakest-first` remains valid.
- Full local check passes.
