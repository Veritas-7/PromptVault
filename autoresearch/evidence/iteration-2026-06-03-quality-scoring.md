# AutoResearch Iteration: Prompt Quality Scoring

Date: 2026-06-03

## Objective

Make PromptVault more useful for prompt improvement by ranking prompt quality and surfacing the most frequent structural gaps.

## External Intake

Sources checked:

- OpenAI Help Center prompt engineering best practices
- Microsoft indirect prompt-injection defense guidance
- ACL 2025/arXiv survey on automatic prompt optimization with heuristic search
- Existing prompt-management research in `research/external_sources.json`

Transferable claims:

- Clear instructions, context separation, specificity, and explicit output format are useful static prompt-quality dimensions.
- Prompt improvement should be iterative and measurable rather than intuition-only.
- Safety must include risk evaluation and defense-in-depth, not just better wording.

## Change

- Added `PromptQuality` to every `PromptRecord`.
- Added `average_quality`, `weak_prompt_count`, and `top_quality_gaps` to `ScanStats`.
- Added local scoring for goal specificity, action verb, context, constraints, verification, output format, overlong prompts, and sensitive-content risk.
- Added quality metrics and gap columns to the UI.
- Added quality score/band/suggestions to selected prompt details.
- Added quality metadata to Markdown exports.

## Evidence

```bash
cargo test
cargo check
npm run build
cargo run --quiet --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --output /tmp/promptvault-quality-smoke.md --json
cargo build --release --bin promptvault-cli
./target/release/promptvault-cli scan --output /tmp/promptvault-full-quality.md --json > /tmp/promptvault-full-quality.json
npm run tauri build
```

Observed:

- `cargo test`: 7 tests passed.
- Quality smoke scan: average quality `71.6`, weak prompt count `16`.
- Top gaps in the 100-prompt smoke: constraints, verification, output_format, action_verb, context.
- Full release quality scan: exported 155,481 prompts from 27,606 files to `/tmp/promptvault-full-quality.md`.
- Full release quality distribution: average quality `66.49`, weak prompt count `61,242`, top gaps constraints, verification, output_format, action_verb, context.
- Tauri production build: produced `promptvault.app` and `promptvault_0.1.0_aarch64.dmg`.

## Decision

Keep. The scoring is deterministic, local, and aligned with the app's purpose: helping the user identify prompts that need better context, constraints, verification, output formatting, or secret hygiene before reuse.
