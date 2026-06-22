# AGENTS.md - PromptVault

## Scope
Applies to this project repository only. Parent workspace policy still applies.

## Git Boundary
- Resolve the repo before changes: `git rev-parse --show-toplevel`, `git status --short --branch`, and `git remote -v`.
- Stage explicit paths only. Do not use parent `/Users/wj/Ai` aggregate git for this project source.
- Run `gitleaks dir . --no-banner --redact` before any GitHub-bound push.
- `origin` is https://github.com/Veritas-7/PromptVault.git.
- `nas-backup` is the private recovery mirror when configured.

## Publication
- Public GitHub repos must contain public source only.
- Private source, local runtime state, credentials, and ignored evidence must stay out of GitHub and belong only in private/NAS backup surfaces.
