# PromptVault CLI

PromptVault ships a Rust CLI binary for agent-native use. It is intentionally non-destructive: commands read source sessions, persist prompt records to the default SQLite database, and optionally write an explicit Markdown export.

## Commands

```bash
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan [--source ID[,ID...]] --json
cargo run --bin promptvault-cli -- import-batch --source ID [--files N>0] [--reset] --json
cargo run --bin promptvault-cli -- vault-audit [--database PATH] --json
cargo run --bin promptvault-cli -- scan [--source ID[,ID...]] [--limit N>0] [--output PATH] [--preview-limit N>=0] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export]
cargo run --bin promptvault-cli -- scan [--source ID[,ID...]] [--limit N>0] [--output PATH] [--preview-limit N>=0] [--preview-sort latest|quality-asc|quality-desc] [--weakest-first] [--include-prompts] [--include-markdown] [--no-export] --json
cargo run --bin promptvault-cli -- improve [--local] --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] --json --prompt "TEXT"
cargo run --bin promptvault-cli -- improve [--local] < prompt.txt
cargo run --bin promptvault-cli -- repair [--source ID[,ID...]] [--limit N>0] [--count N>0] --json
cargo run --bin promptvault-cli -- work-status-export [--limit N>0] [--offset N>=0] [--row-filter FILTER] [--session-limit N>0|--full-session-index] [--database PATH] [--refresh-session-index] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-candidates [--limit N>0] [--row-filter FILTER] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--needs-title-normalization] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-nearby --project NAME --date YYYY-MM-DD [--limit N>0] [--query TEXT] [--database PATH] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-source-search --source-path PATH --query TEXT [--limit N>0] [--max-lines N>0] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-source-proposals --candidate-id ID --source-path PATH --query TEXT [--limit N>0] [--max-lines N>0] [--database PATH] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-proposals [--limit N>0] [--row-filter FILTER] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--needs-title-normalization] [--ai] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-review-queue [--limit N>0] [--row-filter FILTER] [--session-limit N>0] [--database PATH] [--sync-candidates] [--refresh-session-index] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-review-queue-update --candidate-id ID --state approved|deferred|rejected [--reason TEXT] [--source-review-json JSON|--source-review-file PATH] [--limit N>0] [--database PATH] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-review-apply [--limit N>0] [--database PATH] [--json]
cargo run --bin promptvault-cli -- work-session-evidence-reviewed-items [--limit N>0] [--database PATH] [--date YYYY-MM-DD] [--project NAME] [--json]
cargo run --bin promptvault-cli -- work-ai-provider-status [--json]
cargo run --bin promptvault-cli -- work-log-normalization-candidates [--limit N>0] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--needs-title-normalization] [--json]
cargo run --bin promptvault-cli -- work-log-normalization-proposals [--limit N>0] [--session-limit N>0] [--database PATH] [--refresh-session-index] [--needs-title-normalization] [--ai] [--json]
cargo run --bin promptvault-cli -- work-log-normalization-review-queue [--limit N>0] [--session-limit N>0] [--database PATH] [--sync-proposals] [--refresh-session-index] [--ai] [--json]
cargo run --bin promptvault-cli -- work-log-normalization-apply [--limit N>0] [--database PATH] [--json]
cargo run --bin promptvault-cli -- work-session-index [--limit N>0] [--batch-files 1..500] [--max-batches N>0] [--until-complete] [--confirm-long-run] [--database PATH] [--reset] [--json]
cargo run --bin promptvault-cli -- serve [--addr 127.0.0.1:5174] [--database PATH]
```

## Contract

- `sources` prints discovered source IDs, labels, status, and paths.
- `sources` accepts only `--json`; unknown extra arguments exit non-zero.
- `plan` inventories matching source files, byte totals, large-file counts, and newest modified timestamps without reading prompt bodies.
- `plan --source ID` restricts planning to one source ID from `sources`; repeat it or pass comma-separated IDs for multiple sources.
- `import-batch --source ID` reads the next resumable file slice for one source, persists prompts, stores that source's cursor in SQLite `import_states`, stores per-file byte/mtime/hash/status in `source_file_states`, and appends a persistent activity row to `import_events`.
- After a source has completed, `import-batch` still detects new, changed, and previously errored files without reparsing every file; changed files reconcile stale prompt rows for that file.
- `import-batch --reset` restarts the cursor for that source before importing the requested slice.
- `vault-audit --json` is the pre-delete gate for raw source logs. It prints no prompt bodies and reports `deletion_ready=false` unless SQLite integrity, completed import cursors, source-path coverage, and per-file `source_file_states` hash/status ledger checks pass.
- Treat `deletion_ready=false` as a hard stop before deleting or archiving original source files. PromptVault never deletes originals automatically.
- `help`, `--help`, and no-argument invocation print help and exit 0.
- Unknown commands print help plus an error and exit non-zero.
- `scan` persists prompt records to `~/Documents/PromptVault/promptvault.sqlite` by default.
- `scan` writes a Markdown export and prints only summary metadata, not prompt bodies.
- `scan --limit N>0` is for smoke tests; omit `--limit` for a full scan.
- In limited scans, `total_files` and each source `files_seen` count visited files only; they are not an inventory of every matching file in the source root.
- `--limit` and `repair --count` require positive integers. `--preview-limit` accepts non-negative integers so `0` can suppress previews.
- Value-taking options such as `--source`, `--output`, `--preview-sort`, and `improve --prompt` require explicit non-flag values and exit non-zero when missing.
- `scan --source ID` restricts scanning to one source ID from `sources`; repeat it or pass comma-separated IDs for multi-source smoke tests. Unknown or empty explicit source IDs exit non-zero.
- Scan JSON and Markdown source summaries include `average_quality` and `weak_prompt_count` for each source.
- `scan --no-export` skips Markdown rendering/writing when `--include-markdown` is not set; use it for fast JSON-only stats. `--output` cannot be combined with `--no-export`.
- `scan --preview-sort quality-asc` returns the weakest bounded preview first; `--weakest-first` is the same shortcut. Use only one preview sort selector per scan.
- `--json` prints machine-readable summaries for agents. `scan --json` still writes prompt bodies to the Markdown output path rather than dumping them to stdout.
- CLI scan results return zero prompt bodies by default. Use `--preview-limit N --include-prompts` for an explicit bounded prompt preview in stdout JSON.
- `--include-prompts` is capped at 25 prompt records in stdout even if `--preview-limit` is higher.
- Stdout prompt records are redacted for token/key/private-key risk patterns when prompt text is explicitly included.
- `--include-markdown` includes the Markdown body in the returned `ScanResult`; omit it for safer/leaner agent automation.
- `improve` reads one prompt and returns provider, revised prompt, rationale, quality before/after delta, resolved gaps, remaining gaps, and warnings.
- `improve` requires a non-empty prompt from `--prompt` or stdin and exits non-zero for empty or flag-like `--prompt` values.
- `improve --local` bypasses OpenAI/GLM and uses deterministic local prompt-improvement rules for reproducible smoke tests and offline repair queues.
- `repair` scans weakest prompts, runs deterministic local improvement for each one, writes no Markdown export, and returns redacted prompt/recommendation pairs. Repair batches are capped at 10 records.
- `work-status-export` renders a compact project/day status Markdown table from the same project progress-log plus sanitized session-evidence report used by `work-report`.
- `work-status-export --json` returns grouped rows with source files, source artifact roles, top titles, item counts, session evidence counts, and review flags without raw session bodies.
- `work-status-export --json` separates the session index records used by the current `--session-limit` from the total sanitized records stored in SQLite, so long backfills stay visible even when the export is bounded.
- `work-status-export --full-session-index` uses the complete stored sanitized session index as the session scan limit, so operators can reproduce full-session project/day verification without first reading the stored count and copying it into `--session-limit`.
- `work-status-export --row-filter same-date-session-hint`, `--row-filter near-session-date-hint`, or `--row-filter stale-session-date-hint` narrows project/day rows before pagination, so operators can work same-day manual-link candidates before one-day nearby candidates and lower-confidence distant candidates. Other filters include `all`, `needs-session-evidence`, `bounded-session-limit`, `unresolved-session-evidence`, `needs-title-normalization`, `active`, `session-supported`, and `progress-log-only`.
- `work-status-export --offset N>=0` pages through later project/day rows when paired with `--limit`, avoiding an unbounded all-row render.
- `work-session-evidence-candidates` lists project/day rows that still have no matched session evidence after the selected session evidence index. When `--session-limit` is omitted it uses the full stored session index count by default. Candidate JSON includes `source_file_roles` and `latest_source_role` for project-local artifacts such as `working.md`, `workingd.md`, `WORKING_LOG.md`, `PROGRESS_LOG.md`, generated reports, and `PROJECT_STATUS.md`. It annotates same-project session-date hints and returns reviewable rows before title-cleanup rows, then prioritizes same-date and nearest other-date hints before no-same-project-session rows. Add `--row-filter same-date-session-hint` to focus same-day candidates, `--row-filter near-session-date-hint` for one-day same-project candidates, `--row-filter stale-session-date-hint` for farther hints, or `--needs-title-normalization` to focus only unresolved rows whose titles are too rough for review-complete decisions.
- `work-session-evidence-nearby --project NAME --date YYYY-MM-DD` lists nearby same-project sanitized session records for one unresolved project/day row. Without `--query`, rows are sorted by date distance. With `--query`, nearby rows are locally ranked by token overlap against sanitized session metadata, source path, session ID, and cwd. It is read-only navigation for manual/provider review: returned scores, matched terms, excerpts, source paths, and warnings do not create, approve, or attach session evidence.
- `work-session-evidence-source-search --source-path PATH --query TEXT` reads one known JSONL session source or Antigravity SQLite conversation DB in a bounded, redacted, read-only way. It returns matched user-prompt line/row numbers, scores, matched terms, and snippets for manual review context only; it never creates, approves, or attaches session evidence. Use `--max-lines` to widen the bounded scan when a long source file needs deeper inspection.
- `work-session-evidence-source-proposals --candidate-id ID --source-path PATH --query TEXT` reruns bounded source search for one unresolved candidate and converts copied source-search hit excerpts into review proposal rows. It validates same-project source membership, copied trace text, title-normalization blockers, and risk flags; `review_ready` is operator input only and never creates, approves, or attaches durable session evidence.
- `work-session-evidence-proposals` returns read-only source-traced OpenAI/GLM/Codex-opt-in/local proposals for unresolved full-index rows. It only accepts copied traces from candidate titles or sample evidence, reports accepted/rejected proposal counts, and never writes durable session evidence. Add `--row-filter same-date-session-hint` or `--row-filter near-session-date-hint` to narrow the read-only candidate pool before proposal generation, or `--needs-title-normalization` to generate title-first proposals for rows that need work-log title cleanup before session-evidence review.
- `work-session-evidence-review-queue --sync-candidates` persists the current unresolved full-index candidates into SQLite for operator review. It keeps review-complete/deferred/rejected rows stable across later syncs, marks disappeared pending rows stale only when the full candidate set was available, recomputes source artifact roles for existing queue rows, sorts pending rows by the same same-project session-date priority as the candidate list, and never writes or invents session evidence. `--row-filter same-date-session-hint`, `--row-filter near-session-date-hint`, or `--row-filter stale-session-date-hint` narrows read-only queue views before truncation without changing sync behavior; `--review-state deferred` shows rows intentionally held for manual inspection.
- `work-session-evidence-review-queue-update --state approved|deferred|rejected` records one operator decision with an audit reason. The `approved` API state means review-complete, not durable session-evidence creation, while `deferred` preserves manual-inspect rows without making them applyable. Stale rows cannot be approved until candidates are synced again, but they can be deferred or rejected for cleanup. Source-proposal approvals whose reason starts with `source_proposal_review_ready:` must pass the copied proposal object through exactly one of `--source-review-json` or `--source-review-file`, preserving source path, line number, hit id, and trace metadata for later durable reviewed-item reloads.
- `work-session-evidence-source-audit --json` is still read-only, but its result now includes `operator_plan`: candidate-id buckets for `review_ready`, `manual_defer`, `bulk_reject`, and `manual_inspect`. Treat this as planning evidence for the operator pass only. It does not approve, defer, reject, or apply any row; approvals still require copied source review metadata through `work-session-evidence-review-queue-update`.
- `work-session-evidence-review-apply` writes operator-approved session-evidence review decisions into the durable `project_work_session_evidence_reviewed_items` audit table with `INSERT OR IGNORE`. It records project/date/source-log context for management and idempotent re-runs, but it still does not create or invent matched session evidence links.
- `work-session-evidence-reviewed-items` reloads durable reviewed-decision audit rows from `project_work_session_evidence_reviewed_items`, with optional project/date filters for long-term project/day management views.
- `work-ai-provider-status` reports OpenAI, GLM, and local `codex exec` work-management provider readiness without exposing secret values. Configured OpenAI/GLM rows list the specific work-management capabilities they can attempt (`work-summary`, `work-log-extraction`, `work-log-normalization`, `session-evidence-proposals`). Codex detection is disabled by default; set `PROMPTVAULT_CODEX_WORK_PROVIDER=1` to expose the opt-in `work-summary`, `work-log-extraction`, `work-log-normalization`, and `session-evidence-proposals` capabilities. Those runners use `codex exec --sandbox read-only --ephemeral --output-schema`, validate copied evidence where applicable, and still require review-queue approval before durable writes. Set `PROMPTVAULT_CODEX_TIMEOUT_SECONDS` to override the default 90-second timeout, capped at 300 seconds.
- `work-log-normalization-candidates --needs-title-normalization` focuses project/day rows whose parsed titles are generic or rough, such as time-only `working.md` headings that block reliable session-evidence review.
- `work-log-normalization-proposals --needs-title-normalization` asks OpenAI/GLM/Codex-opt-in/local fallback only for those rough-title rows. It is read-only; use the normalization review queue and apply command for durable writes.
- `work-log-normalization-review-queue --sync-proposals` intentionally syncs the full proposal set, not a title-only subset, so existing pending queue rows are not marked stale by a filtered partial sync.
- `work-session-index` upserts sanitized Codex/Codex CX session records so progress-log work items can be linked to real session evidence without storing raw session bodies.
- `work-session-index --batch-files` is capped at `1..500`; short backfills up to `--max-batches 2` need no confirmation.
- `work-session-index --confirm-long-run` is required when the effective max batch count is above `2`, including `--until-complete` when no smaller `--max-batches` is supplied.
- `serve` starts a local browser bridge for cmux/in-app browser QA. It exposes `/api/health`, `/api/scan`, `/api/scan/cancel`, `/api/scan/progress`, `/api/prompts`, `/api/prompt-facets`, `/api/improve`, `/api/plan`, `/api/import-batch`, `/api/import-states`, `/api/import-events`, `/api/vault-audit`, `/api/work-summary`, `/api/work-status-export`, `/api/work-session-evidence-candidates`, `/api/work-session-evidence-nearby`, `/api/work-session-evidence-source-search`, `/api/work-session-evidence-source-proposals`, `/api/work-session-evidence-proposals`, `/api/work-session-evidence-review-queue`, `/api/work-session-evidence-review-queue/update`, `/api/work-session-evidence-review-apply`, `/api/work-session-evidence-reviewed-items`, `/api/work-ai-provider-status`, `/api/work-ai-provider-health`, `/api/work-log-normalization-candidates`, `/api/work-log-normalization-proposals`, `/api/work-log-normalization-review-queue`, `/api/work-log-normalization-review-queue/update`, `/api/work-log-normalization-apply`, `/api/work-summary-snapshots`, and `/api/work-session-index` on the requested local address.
- `serve --database PATH` makes browser-bridge persistence use the supplied SQLite file by default, so full click QA can exercise save/import flows without touching the permanent vault. Per-request `database_path` payload fields still take precedence.

## Agent-Native Design Notes

CLI-Anything's useful lesson for PromptVault is not to wrap everything in a GUI-only flow. The CLI must be:

- Discoverable through help text.
- Scriptable with stable arguments.
- Conservative about stdout so private prompt bodies are not printed accidentally.
- Explicit about generated file paths.
- Backed by the same code path as the Tauri app.

## Verification Commands

```bash
npm run check
npm run qa:browser-bridge
cargo check
npm run build
cargo run --bin promptvault-cli -- sources
cargo run --bin promptvault-cli -- sources --json
cargo run --bin promptvault-cli -- plan --source codex --json
cargo run --bin promptvault-cli -- import-batch --source antigravity-ide-transcripts --files 1 --reset --json
cargo run --bin promptvault-cli -- vault-audit --json
set +e; cargo run --bin promptvault-cli -- sources --bogus; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.md
cargo run --bin promptvault-cli -- scan --source antigravity-cli-conversation-db --output /tmp/promptvault-antigravity-db.md --json
cargo run --bin promptvault-cli -- scan --source antigravity-ide-conversation-db --output /tmp/promptvault-antigravity-ide-db.md --json
cargo run --bin promptvault-cli -- scan --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --weakest-first --include-prompts --no-export --json
cargo run --bin promptvault-cli -- scan --limit 100 --output /tmp/promptvault-smoke.json.md --json
cargo run --bin promptvault-cli -- scan --limit 100 --preview-limit 5 --include-markdown --output /tmp/promptvault-preview.md --json
cargo run --bin promptvault-cli -- improve --json --prompt "make better"
cargo run --bin promptvault-cli -- improve --local --json --prompt "make better"
set +e; cargo run --bin promptvault-cli -- improve --json --prompt ""; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- repair --json --limit 100 --count 3
cargo run --bin promptvault-cli -- work-status-export --limit 8 --session-limit 200
cargo run --bin promptvault-cli -- work-status-export --limit 8 --full-session-index
cargo run --bin promptvault-cli -- work-status-export --limit 8 --offset 8 --session-limit 200
cargo run --bin promptvault-cli -- work-status-export --row-filter same-date-session-hint --full-session-index --json
cargo run --bin promptvault-cli -- work-status-export --limit 3 --session-limit 200 --json
cargo run --bin promptvault-cli -- work-session-evidence-candidates --limit 20 --needs-title-normalization --json
cargo run --bin promptvault-cli -- work-session-evidence-candidates --row-filter same-date-session-hint --json
cargo run --bin promptvault-cli -- work-session-evidence-proposals --limit 20 --needs-title-normalization --ai --json
cargo run --bin promptvault-cli -- work-session-evidence-proposals --row-filter near-session-date-hint --limit 5 --json
cargo run --bin promptvault-cli -- work-session-evidence-review-queue --sync-candidates --limit 20 --json
cargo run --bin promptvault-cli -- work-session-evidence-review-queue --row-filter near-session-date-hint --json
cargo run --bin promptvault-cli -- work-session-evidence-review-apply --limit 20 --json
cargo run --bin promptvault-cli -- work-session-evidence-reviewed-items --limit 20 --json
cargo run --bin promptvault-cli -- work-ai-provider-status --json
cargo run --bin promptvault-cli -- work-log-normalization-candidates --limit 20 --needs-title-normalization --json
cargo run --bin promptvault-cli -- work-log-normalization-proposals --limit 20 --needs-title-normalization --ai --json
cargo run --bin promptvault-cli -- work-session-index --batch-files 25 --max-batches 2 --json
cargo run --bin promptvault-cli -- work-session-index --batch-files 25 --max-batches 10 --confirm-long-run --json
set +e; cargo run --bin promptvault-cli -- work-session-index --batch-files 1 --max-batches 3 --json; test "$?" -ne 0; set -e
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174
cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174 --database /tmp/promptvault-browser-qa.sqlite
curl http://127.0.0.1:5174/api/health
set +e; cargo run --bin promptvault-cli -- scan --source missing-source --limit 1 --preview-limit 0 --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit nope --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 0 --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- repair --limit 10 --count 0 --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --no-export --json --source; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --no-export --json --output /tmp/promptvault-no-export.md; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scan --limit 10 --preview-sort latest --weakest-first --no-export --json; test "$?" -ne 0; set -e
set +e; cargo run --bin promptvault-cli -- scna; test "$?" -ne 0; set -e
```
