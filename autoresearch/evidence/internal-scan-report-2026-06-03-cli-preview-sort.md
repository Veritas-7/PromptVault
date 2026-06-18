# Internal Scan Report: CLI Preview Sort

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `066e27f`

## Baseline

Invalid `--preview-sort` exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort nonsense --preview-limit 0 --no-export --json
```

Observed:

- Exit code: `0`
- `preview_sort`: `latest`
- Warning: `Unknown preview sort requested: nonsense; used latest.`

The valid underscore alias still exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort quality_asc --preview-limit 1 --no-export --json
```

## Selected Candidate

Reject unknown CLI `--preview-sort` values before calling `run_scan`, while preserving accepted aliases for compatibility.

## Success Metric

```bash
cargo test --bin promptvault-cli parse_preview_sort_rejects_unknown_values
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort nonsense --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-sort quality_asc --preview-limit 1 --no-export --json
npm run check
```

Expected:

- Unknown preview sort exits non-zero.
- `quality_asc` remains accepted and returns `preview_sort: quality_asc`.
- Full local check passes.
