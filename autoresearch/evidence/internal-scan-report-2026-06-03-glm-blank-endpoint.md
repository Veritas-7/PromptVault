# Internal Scan Report: GLM Blank Endpoint

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `f4d1b98`

Code commit: `819db5e`

## Baseline

If `GLM_CODING_ENDPOINT` existed but was blank, `normalize_chat_endpoint`
returned `/chat/completions`. That would produce a malformed request instead of
using the default BigModel chat completions endpoint.

## RED

```bash
cargo test --lib normalizes_glm_base_endpoint
```

Observed failure before implementation:

- Blank input normalized to `/chat/completions`.

## Change

- Added `DEFAULT_GLM_CHAT_ENDPOINT`.
- `normalize_chat_endpoint` now returns the default endpoint for blank input.
- The existing base endpoint and full endpoint normalization behavior remains
  covered.

## Verification

```bash
cargo fmt --all
cargo test --lib normalizes_glm_base_endpoint
cargo test --lib glm_content_parser_rejects_empty_revised_prompt
npm run check
```

Observed:

- Endpoint normalization test: PASS.
- GLM content parser regression test: PASS.
- Full check: PASS, Vite build, 29 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Blank GLM endpoint configuration now falls back to the known default
instead of constructing a relative URL.
