# Internal Scan Report: GLM Empty Revised Prompt

Date: 2026-06-03

Repo: `/Users/example/Ai/System/10_Projects/PromptVault`

Head before this iteration: `2a22c22`

Code commit: `bf29761`

## Baseline

The GLM success path trusted parsed JSON too loosely. If a model returned
`{"revised_prompt":"   "}`, PromptVault could return an empty recommendation
with `used_ai=true` instead of using the local fallback.

## RED

```bash
cargo test --lib glm_content_parser_rejects_empty_revised_prompt
```

Observed failure before implementation:

- The parser helper did not exist, and empty `revised_prompt` was not covered as
  an invalid GLM result.

## Change

- Extracted `glm_improvement_from_content`.
- JSON GLM content must include a non-empty `revised_prompt`.
- Empty or missing `revised_prompt` returns `None`, and `improve_prompt_inner`
  uses local fallback with a warning.
- Non-empty non-JSON GLM text is still preserved as before.

## Verification

```bash
cargo fmt --all
cargo test --lib glm_content_parser_rejects_empty_revised_prompt
cargo test --lib local_improvement_reports_quality_delta
npm run check
```

Observed:

- GLM parser test: PASS.
- Local fallback quality-delta test: PASS.
- Full check: PASS, Vite build, 28 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. Empty GLM recommendations now fail closed into the deterministic fallback.
