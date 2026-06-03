# AutoResearch Iteration: API Empty Improve

Date: 2026-06-03

## Objective

Make the backend improvement API reject empty prompts instead of returning a successful checklist response.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-improve.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-improve.md`

Observed issue:

- `promptvault-cli improve` now rejects empty input.
- `improve_prompt_inner` still returned `Ok(local_improvement(...))` for empty input.
- This left the Tauri/API layer less strict than the CLI.

## Change

- `improve_prompt_inner` now returns `Err("improve requires a non-empty prompt")` for empty or whitespace-only prompts.
- Added `improve_prompt_inner_rejects_empty_prompt`.
- Rechecked the existing non-empty force-local provider path.

## Evidence

```bash
cargo fmt --all
cargo test --lib improve_prompt_inner_rejects_empty_prompt
cargo test --lib improve_prompt_inner_can_force_local_provider
npm run check
```

Observed:

- `cargo fmt --all`: PASS.
- Empty prompt API test: PASS.
- Force-local non-empty API test: PASS.
- `npm run check`: PASS, Vite build passed, 15 library tests plus 9 CLI tests passed, and strict clippy passed.

## Decision

Keep. Empty improve input now fails closed at both CLI and backend API boundaries.
