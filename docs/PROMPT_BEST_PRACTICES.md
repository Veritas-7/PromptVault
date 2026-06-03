# Prompt Best Practices for Development Agents

Checked: 2026-06-03

These rules are optimized for coding agents such as Codex, Claude Code, and Antigravity. They combine local workflow constraints with current prompt-engineering guidance from OpenAI, Anthropic, Azure OpenAI, and prompt-management research.

## Core Template

```text
Goal:
- State the exact artifact or behavioral outcome.

Context:
- Repo/path, current failure, related files, prior attempts, and constraints.

Scope:
- Read-only, edit-ready, test-ready, deploy-ready, commit/push-ready.
- Explicitly name forbidden paths or actions.

Requirements:
- Functional behavior.
- Edge cases.
- Security/privacy constraints.
- Source-integrity constraints.

Verification:
- Exact commands to run.
- PASS/FAIL criteria.
- What evidence to report.

Completion report:
- Changed paths.
- Verification results.
- Residual risks or blocked items.
```

## Principles

1. Prefer explicit task contracts over clever wording. The best prompt fixes usually come from specifying inputs, outputs, constraints, and verification.
2. Separate permissions. Research, code edits, test execution, deployment, git staging, commit, and push are different authorities.
3. Name source boundaries. Tell the agent which source tree is authoritative and which generated or public-export surfaces are secondary.
4. Ask for evidence, not confidence. Require exact commands, output summaries, screenshots, or file paths.
5. Use examples only when they constrain format or quality. Good examples reduce ambiguity; vague examples add noise.
6. For large tasks, require a completion audit that maps every requirement to an artifact or command result.
7. For prompt-management work, track duplication, formatting consistency, readability, spelling, and source metadata.
8. For external facts, require source URLs and checked dates.

## Anti-Patterns

| Weak prompt | Better prompt |
|---|---|
| "Fix the app." | "In `/path`, reproduce the failing login test, patch only the auth flow, run `npm test -- auth`, and report changed files." |
| "Make it better." | "Improve layout density on mobile and desktop, preserve existing colors/components, verify with screenshots at 390px and 1440px." |
| "Research this." | "Find 5 primary/current sources, save notes to `research/`, and separate confirmed facts from assumptions." |
| "Deploy it." | "Build, run smoke QA against production URL, write the worklog, then ask before commit/push." |

## PromptVault Recommendation Heuristic

PromptVault's local fallback rewrites prompts into:

- Goal
- Context
- Requirements
- Verification
- Completion report

The GLM-backed AI path uses the same rubric and asks for strict JSON with `revised_prompt`, `rationale`, and `checklist`.

## PromptVault Quality Score

PromptVault also computes a local structural quality score for each extracted prompt. The score is not a model-performance benchmark; it is a fast triage signal for which prompts are likely to need clearer instructions before reuse.

| Dimension | Why it matters |
|---|---|
| Specific goal | Prevents vague "make it better" tasks |
| Action verb | Makes the agent's first step unambiguous |
| Context | Provides repo/path/current state/error inputs |
| Constraints | Separates allowed actions from forbidden actions |
| Verification | Forces command-level PASS/FAIL evidence |
| Output format | Makes results parseable and reviewable |
| Sensitive-content risk | Flags token/key/secret-like prompt text |

Bands:

- `strong`: 80-100
- `workable`: 60-79
- `weak`: 0-59

Use the quality gaps as a repair queue: add missing context, constraints, verification commands, and output format before asking an agent to execute a complex task. In the app, scan with `Weakest` mode to load the lowest-scoring prompt preview first; in the CLI, use `scan --weakest-first --include-prompts` for an explicit bounded repair queue.

## Research Basis

- The Prompt Report surveys prompting terminology and techniques and argues for structured, task-specific prompting rather than universal magic phrases.
- Automatic Prompt Optimization literature treats prompt improvement as iterative and measurable.
- Prompt-management research over GitHub repositories identifies formatting inconsistency, duplication, readability, and spelling as maintainability risks.
- OpenAI and Anthropic guidance both emphasize clear instructions, examples when useful, structured outputs, and evaluation.
- Microsoft prompt-injection guidance supports treating safety as layered risk evaluation rather than prompt text alone.
