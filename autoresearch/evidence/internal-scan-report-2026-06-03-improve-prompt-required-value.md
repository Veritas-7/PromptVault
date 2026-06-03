# Internal Scan Report: Improve Prompt Required Value

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `2080cc5`

Code commit: `58da57a`

## Baseline

Other value-taking CLI options reject missing, empty, or flag-like values.
`improve --prompt` was looser: `improve --prompt --bogus` treated `--bogus` as
prompt text instead of reporting a missing prompt value.

## RED

```bash
cargo test --bin promptvault-cli collect_prompt_arg_rejects_empty_prompt_flag
```

Observed failure before implementation:

- `collect_prompt_arg(["--prompt", "--bogus"])` returned `Ok`.

## Change

- Reused `parse_required_arg` for `--prompt` values.
- Extended the existing prompt-value test to reject flag-like values.

## Verification

```bash
cargo fmt --all
cargo test --bin promptvault-cli collect_prompt_arg_rejects_empty_prompt_flag
cargo run --quiet --bin promptvault-cli -- improve --prompt --bogus
npm run check
```

Observed:

- Targeted CLI parser test: PASS.
- CLI smoke: PASS, exited 1 with `--prompt requires a value`.
- Full check: PASS, Vite build, 24 library tests, 13 CLI tests, and strict
  clippy passed.

## Decision

Keep. `improve --prompt` now follows the same fail-closed required-value
contract as the rest of the CLI.
