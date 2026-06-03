# Internal Scan Report: External Improve Risk Block

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Resumed thread: `019e8bcb-66b7-7443-a79d-46fd3686eadc`

Head before code commit: `17640f1a28535bb18c20c380cb7503e32c3e6d8d`

Code commit: `cf5e34394a93b478d44524546d6052d6eb21996f`

## Baseline

Earlier slices made stdout previews, repair JSON prompts, key/value text,
private-key blocks, and deterministic local recommendation goal lines safer.
The remaining boundary was external improve routing: risky prompt or context
text could still proceed toward the GLM request path before local fallback.

## Change

- Added `external_improve_block_reason`.
- Wired `improve_prompt_inner` to check prompt/context risk flags before GLM
  configuration is read.
- Returned local fallback with warning labels only, not secret text.
- Redacted context before `local_improvement` includes it in the revised prompt.

## Verification

```bash
cargo test "risky_"
npm run check
git diff --cached --check
gitleaks protect --staged --no-banner --redact
```

Observed:

- Focused tests: PASS, 4 tests.
- Full gate: PASS, 10 UI helper tests, Vite build, 45 Rust library tests,
  15 CLI tests, doc-tests, and strict clippy.
- Staged code checks: PASS before `cf5e343`.

## Decision

Keep. PromptVault now fails closed before external GLM improve when prompt or
context text contains risk-pattern content.
