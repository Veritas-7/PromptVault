# AutoResearch Iteration: Batch Repair Command

Date: 2026-06-03

## Objective

Turn the weak-first prompt repair queue into a single deterministic CLI command that returns prompt/recommendation pairs.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-batch-repair.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-batch-repair.md`

Observed issue:

- Weakest-first scan and local deterministic improve existed separately.
- Agents still had to manually pipe selected prompts into separate improve calls.
- Batch output needed a hard cap because it returns prompt bodies and revised prompts.

## Change

- Added CLI `repair`.
- `repair` scans weakest prompts with `preview_sort=quality-asc`.
- `repair` disables Markdown export and returns prompt/recommendation pairs.
- `repair` always uses deterministic `local-rules`.
- Repair batches are capped at 10 records.
- Added a CLI unit test for repair count capping.
- Updated README, CLI docs, best-practices guidance, and completion audit.

## Evidence

```bash
cargo test
cargo check
npm run build
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
cargo run --quiet --bin promptvault-cli -- repair --json --limit 100 --count 3
cargo run --quiet --bin promptvault-cli -- repair --json --limit 100 --count 99
git diff --check
```

Observed:

- `cargo test`: PASS, 12 library tests plus 2 CLI tests passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- `npm run tauri build`: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned HTTP 200.
- Batch repair smoke: PASS, returned `provider=local-rules`, `preview_sort=quality_asc`, `scanned_prompt_count=100`, `returned_prompt_count=3`, `repair_count=3`, `markdown_written=false`, and `output_path=null`.
- First repair smoke item: prompt quality `36 · weak`, recommendation provider `local-rules`, `score_delta=64`.
- Repair cap smoke: PASS, `--count 99` returned `repair_count=10` and one cap warning.
- `git diff --check`: PASS.

## Decision

Keep. The self-improvement loop now has a single deterministic no-export command that selects weak prompts and returns bounded repair suggestions without depending on GLM availability.
