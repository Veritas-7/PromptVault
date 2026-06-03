# Internal Scan Report: GLM Blank API Key

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `bbadc4a`

Code commit: `b032d65`

## Baseline

`improve_prompt_inner` selected `GLM_API_KEY` before checking whether its value
was blank. If `GLM_API_KEY` existed as whitespace and `GLM_API_KEY_2` contained
a usable secondary key, the GLM request would still use the blank primary value
instead of falling back safely.

## RED

```bash
cargo test --lib glm_api_key_selection_ignores_blank_primary_key
```

Observed failure before implementation:

- `glm_api_key_from_env` was missing, proving the current code had no tested
  selection path for ignoring blank primary keys.

## Change

- Added `non_empty_env_value`.
- Added `glm_api_key_from_env`.
- Switched `improve_prompt_inner` to select API keys through that helper.
- Added a regression test for blank primary key plus valid secondary key.

## Verification

```bash
cargo fmt --all
cargo test --lib glm_api_key_selection_ignores_blank_primary_key
cargo test --lib normalizes_glm_base_endpoint
npm run check
```

Observed:

- GLM API key selection test: PASS.
- GLM endpoint normalization regression test: PASS.
- Full check: PASS, Vite build, 30 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Blank GLM primary API key configuration now falls back to a valid
secondary key or, if no usable key exists, the existing local-rules fallback.
