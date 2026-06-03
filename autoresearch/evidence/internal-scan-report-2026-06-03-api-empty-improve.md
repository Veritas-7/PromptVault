# Internal Scan Report: API Empty Improve

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `595f6c0`

## Baseline

Source inspection showed that `improve_prompt_inner` accepted an empty prompt:

```rust
if prompt.is_empty() {
    return Ok(local_improvement(
        "",
        request.context.as_deref(),
        vec![
            "Empty prompt; local fallback returned the improvement checklist only.".to_string(),
        ],
    ));
}
```

The CLI had already added a guard before this path, but the Tauri/backend API boundary still returned a successful `ImproveResult`.

## Selected Candidate

Return an error from `improve_prompt_inner` when the trimmed prompt is empty.

## Success Metric

```bash
cargo test --lib improve_prompt_inner_rejects_empty_prompt
cargo test --lib improve_prompt_inner_can_force_local_provider
npm run check
```

Expected:

- Empty prompt test passes with an error.
- Non-empty force-local improvement still passes.
- Full local check passes.
