# Internal Scan Report: Empty Source Components

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `c8a0b7e`

Code commit: `e968658`

## Baseline

Source filters are scope controls. Empty source values should fail closed instead
of being ignored. Two gaps remained:

- CLI `--source codex,` filtered the empty component and scanned `codex`.
- API `source_ids=["codex", " "]` filtered the empty entry and accepted the
  request.

## RED

```bash
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
cargo test --lib validate_source_ids_rejects_mixed_empty_source_ids
```

Observed failures before implementation:

- CLI parser accepted `codex,`.
- API validation accepted a mixed empty source ID list.

## Change

- CLI source parsing now rejects any empty comma-separated component.
- API source validation now rejects mixed empty values while preserving the
  existing all-empty error.

## Verification

```bash
cargo fmt --all
cargo test --lib validate_source_ids_rejects_mixed_empty_source_ids
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
cargo run --quiet --bin promptvault-cli -- scan --source codex, --limit 1 --no-export --json
npm run check
```

Observed:

- Targeted library test: PASS.
- Targeted CLI parser test: PASS.
- CLI smoke: PASS, exited 1 with `--source cannot include empty values`.
- Full check: PASS, Vite build, 25 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Empty source components now fail closed in both CLI and API paths.
