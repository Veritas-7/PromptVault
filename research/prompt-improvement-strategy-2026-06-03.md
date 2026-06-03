# PromptVault Prompt Improvement Strategy

Date: 2026-06-03

## Objective

Build a local-first prompt manager that extracts user prompts from Claude Code, Antigravity, and Codex sessions, ranks frequent words/phrases/prompts, and recommends better prompts for development-agent work.

## Findings

1. Prompt management is now a software maintenance problem. The GitHub prompt-management study analyzed 24,800 prompts and found formatting inconsistency, duplication, readability, and spelling issues as recurring risks.
2. Prompt engineering should be structured and task-specific. The Prompt Report surveys many techniques, but the durable app-level guidance is to make objective, context, constraints, examples, and output format explicit.
3. Automatic Prompt Optimization is useful when tied to measurable outcomes. PromptVault v0.1 does not claim benchmark optimization; it prepares the data layer for future A/B scoring by preserving source, timestamp, and repeated-prompt frequency.
4. Coding-agent prompts need source-integrity guardrails. The app's recommendations should ask agents to preserve existing user files, separate read/edit/test/deploy/git authority, and verify with concrete commands.
5. Agent-native CLIs need stable text contracts. CLI-Anything's model supports discoverable commands and structured outputs; PromptVault adopts this with `sources`, `scan`, and `improve`.

## Implemented Strategy

- Extract only user-role prompt text from local source files.
- Strip leading Codex injected `AGENTS.md` and environment blocks before analysis.
- Compute top words, frequent phrase starts, and repeated prompt starts.
- Write one Markdown export with source coverage and grouped prompts.
- Provide local prompt-improvement rules when no model provider is available.
- Use `GLM_API_KEY` or `GLM_API_KEY_2` plus `GLM_CODING_ENDPOINT` and `GLM_CODING_MODEL` from `secrets.env` when available.
- Keep Codex SDK integration documented but not default for prompt rewriting, because the official SDK wraps an agent/CLI designed for coding workflows and thread state, while prompt rewrite is safer through a narrow chat-completion call.

## Prompt Scoring Rubric

| Dimension | Signal | Suggested repair |
|---|---|---|
| Goal clarity | Missing exact output or decision | Add a one-line target outcome |
| Context | Missing repo/path/current state | Add paths, prior attempts, and known constraints |
| Scope | Ambiguous authority | Split read, edit, test, deploy, commit, push |
| Verification | No PASS/FAIL gate | Name commands and expected evidence |
| Safety | No source/privacy constraint | Preserve user source and avoid printing secrets |
| Maintainability | Repeated vague prompt | Convert to reusable template |

## Sources

- https://github.com/openai/codex/blob/main/sdk/typescript/README.md
- https://code.claude.com/docs/en/claude-directory
- https://antigravity.google/docs/ide-settings
- https://github.com/HKUDS/CLI-Anything
- https://arxiv.org/abs/2509.12421
- https://arxiv.org/abs/2406.06608
- https://arxiv.org/abs/2502.16923
- https://platform.openai.com/docs/guides/prompt-engineering
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
