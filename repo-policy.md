# Repo Policy

`origin` is public. Push only sanitized public source; private working state must stay off GitHub.

- Use `nas-backup` for the private NAS mirror when present.
- Do not force push without explicit user instruction.
- Do not commit `.env`, keys, tokens, credentials, local caches, or private runtime outputs.
- For public repos, publish through the repo's public-source workflow only; do not mix private recovery state into public history.
