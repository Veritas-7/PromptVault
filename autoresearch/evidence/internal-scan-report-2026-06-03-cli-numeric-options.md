# Internal Scan Report: CLI Numeric Options

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `39ece52`

## Baseline

Invalid numeric options exited `0`:

```bash
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count nope --json
```

Observed:

- Invalid `--limit` scanned prompts and returned no warning.
- Invalid `--preview-limit` returned a preview count different from the intended cap.
- Invalid repair `--count` silently used the default count.

## Selected Candidate

Add strict numeric parsing for CLI caps:

- `--limit`
- `--preview-limit`
- repair `--count`

## Success Metric

```bash
cargo run --quiet --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit nope --no-export --json
cargo run --quiet --bin promptvault-cli -- repair --limit 10 --count nope --json
cargo run --quiet --bin promptvault-cli -- scan --limit 10 --preview-limit 0 --no-export --json
```

Expected:

- Invalid numeric values exit non-zero.
- Valid numeric scan exits `0`.
