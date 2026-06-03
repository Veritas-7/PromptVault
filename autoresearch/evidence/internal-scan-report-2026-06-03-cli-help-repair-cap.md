# Internal Scan Report: CLI Help Repair Cap

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `a63e95e`

## Baseline

Source inspection showed `repair --count` uses `bounded_count(count, MAX_REPAIR_COUNT, ...)` where `MAX_REPAIR_COUNT` is `10`.

The help text only documented `--count N>0`, so operators could not see the cap until they triggered the warning at runtime.

The RED test confirmed the documentation gap:

```bash
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
```

Observed before implementation:

- The test failed.
- `help_text` did not contain `repair --count is capped at 10`.

## Selected Candidate

Add the repair count cap to the CLI help Rules section and keep existing cap behavior unchanged.

## Success Metric

```bash
cargo test --bin promptvault-cli help_text_documents_cli_validation_rules
cargo test --bin promptvault-cli bounded_count_caps_repair_batches
npm run check
```

Expected:

- Help text documents the cap.
- Existing repair cap test remains green.
- Full local check passes.
