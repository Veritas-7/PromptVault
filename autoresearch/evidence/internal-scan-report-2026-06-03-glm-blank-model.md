# Internal Scan Report: GLM Blank Model

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `23459d9`

Code commit: `a9e7273`

## Baseline

`improve_prompt_inner` used `GLM_CODING_MODEL` directly when the variable was
present. If it existed as whitespace, the request body would use a blank model
string instead of the intended default `glm-4.6`.

## RED

```bash
cargo test --lib glm_model_selection_ignores_blank_model
```

Observed failure before implementation:

- `glm_model_from_env` was missing, proving the code had no tested path for
  blank model fallback.

## Change

- Added `DEFAULT_GLM_MODEL`.
- Added `glm_model_from_env`.
- Switched `improve_prompt_inner` to use the helper.
- Added a regression test for blank `GLM_CODING_MODEL`.

## Verification

```bash
cargo fmt --all
cargo test --lib glm_model_selection_ignores_blank_model
cargo test --lib glm_api_key_selection_ignores_blank_primary_key
cargo test --lib normalizes_glm_base_endpoint
npm run check
```

Observed:

- GLM model selection test: PASS.
- GLM API key selection regression test: PASS.
- GLM endpoint normalization regression test: PASS.
- Full check: PASS, Vite build, 31 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Blank GLM model configuration now resolves to `glm-4.6` instead of
sending an empty model string.
