# AutoResearch Iteration: Limited Scan File-Count Docs

Date: 2026-06-03

## Objective

Make limited-scan file counters unambiguous after scan limits began stopping the
file walk early.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-limit-file-count-docs.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-limit-file-count-docs.md`

Observed issue:

- `README.md` and `docs/CLI.md` explained `--limit`, but not how limited scans
  should interpret `total_files` and source `files_seen`.

## Change

- Added README guidance that limited scans report visited file counts.
- Added CLI behavior guidance that limited scans do not inventory every matching
  source file once the prompt limit is reached.

## Evidence

```bash
rg -n "visited files only|not every matching file" README.md docs/CLI.md
git diff --check
```

Observed:

- Documentation search: PASS, both docs contain the limited-scan counter rule.
- Whitespace diff check: PASS.

## Decision

Keep. The docs now match the current limited-scan behavior without rewriting
historical evidence.
