# AutoResearch Iteration: Deterministic Local Improve

Date: 2026-06-03

## Objective

Make prompt repair evaluation reproducible by allowing CLI callers to force the deterministic local improvement provider.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-local-improve.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-local-improve.md`

Observed issue:

- `improve` preferred GLM when credentials were available.
- Live GLM smoke could return `429` before falling back.
- Batch repair queue automation needs deterministic recommendations without depending on model availability.

## Change

- Added `ImproveRequest.force_local`.
- Added CLI `improve --local`.
- Kept UI recommendation behavior unchanged.
- Added a Rust async regression test for forced local provider behavior.
- Updated README, CLI docs, best-practices guidance, and completion audit.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- improve --local --json --prompt "make better"
npm run tauri build
curl -I --max-time 5 http://localhost:5174/
```

Observed:

- `cargo test`: PASS, 12 library tests plus 1 CLI test passed.
- `cargo check`: PASS.
- `npm run build`: PASS.
- Local improve smoke: PASS, returned `provider=local-rules`, `used_ai=false`, `warnings=[]`, `quality_delta.before.score=36`, `quality_delta.after.score=100`, and `quality_delta.score_delta=64`.
- Tauri production build: PASS, produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.
- Dev server smoke: PASS, `http://localhost:5174/` returned `HTTP/1.1 200 OK`.

## Decision

Keep. Agents can now run prompt repair evaluation through a deterministic local provider while retaining the GLM path for normal recommendation use.
