# AutoResearch Iteration: CLI Numeric Options

Date: 2026-06-03

## Objective

Make numeric CLI caps fail closed when malformed.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-numeric-options.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-cli-numeric-options.md`

Observed issue:

- Invalid `--limit` was silently ignored.
- Invalid `--preview-limit` silently removed the intended preview cap.
- Invalid repair `--count` silently used the default batch size.

## Change

- Added `parse_usize_arg`.
- `scan --limit` now requires a non-negative integer.
- `scan --preview-limit` now requires a non-negative integer.
- `repair --limit` and `repair --count` now require non-negative integers.
- Added a CLI unit test for valid, missing, and invalid numeric values.
- Updated CLI docs and completion audit.

## Evidence

```bash
cargo fmt --all
npm run check
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count nope --json
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit 0 --no-export --json
```

Observed:

- `cargo fmt --all`: PASS.
- `npm run check`: PASS, Vite build passed, 14 library tests plus 5 CLI tests passed, and strict clippy passed.
- Invalid `--limit`: PASS, exited `1` with `--limit requires a non-negative integer`.
- Invalid `--preview-limit`: PASS, exited `1` with `--preview-limit requires a non-negative integer`.
- Invalid repair `--count`: PASS, exited `1` with `--count requires a non-negative integer`.
- Valid numeric scan: PASS, exited `0` with `total_prompts=10` and `returned_prompt_count=0`.

## Decision

Keep. CLI numeric caps now fail closed instead of silently changing scan or repair scope.
