# Internal Scan Report: CLI Source ID

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `0b6f1a5`

## Baseline

Unknown source ids exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source missing-source --limit 1 --count 0 --json
```

Observed:

- `scan` returned empty JSON with warning `Unknown source id requested: missing-source`.
- `repair` returned empty JSON with warning `Unknown source id requested: missing-source`.

Valid source id smoke:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
```

Observed:

- Exit code: `0`
- Source summary included `id: codex`.

## Selected Candidate

Validate CLI `--source` values against the existing `source_specs` registry before calling `run_scan`.

## Success Metric

```bash
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
cargo run --quiet --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source missing-source --limit 1 --count 0 --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Expected:

- Unknown `scan --source` exits non-zero.
- Unknown `repair --source` exits non-zero.
- Valid `codex` source scan still exits `0`.
- Full local check passes.
