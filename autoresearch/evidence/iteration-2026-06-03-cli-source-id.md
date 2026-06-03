# AutoResearch Iteration: CLI Source ID

Date: 2026-06-03

## Objective

Make `promptvault-cli` reject unknown explicit `--source` ids.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-source-id.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-source-id.md`

Observed issue:

- `scan --source missing-source` exited `0`.
- `repair --source missing-source` exited `0`.
- Both commands returned empty successful JSON and only surfaced the mistake as a warning.

## Change

- `parse_source_ids_arg` now validates ids against `source_specs`.
- Unknown ids return `unknown source id: ...` before scanning.
- The existing syntax checks for missing, empty, and flag-like source values remain.
- The parser test now uses the real `claude-code-projects` id and covers unknown source rejection.

## Evidence

```bash
cargo fmt --all
cargo test --bin promptvault-cli parse_source_ids_rejects_empty_values
cargo run --quiet --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --source missing-source --limit 1 --count 0 --json
cargo run --quiet --bin promptvault-cli -- scan --source codex --limit 1 --preview-limit 0 --no-export --json
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Targeted CLI unit test: PASS.
- Invalid scan source: PASS, exited `1` with `unknown source id: missing-source`.
- Invalid repair source: PASS, exited `1` with `unknown source id: missing-source`.
- Valid `codex` source scan: PASS, exited `0`.
- First full `npm run check`: FAIL on clippy `manual_contains`.
- After changing membership check to `contains`, final `npm run check`: PASS, Vite build passed, 14 library tests plus 9 CLI tests passed, and strict clippy passed.

## Decision

Keep. CLI source filters now fail closed on typos while the library-level warning behavior remains available for API callers.
