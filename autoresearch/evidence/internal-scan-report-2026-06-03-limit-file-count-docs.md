# Internal Scan Report: Limited Scan File-Count Docs

Date: 2026-06-03

Repo: `/Users/wj/Ai/System/10_Projects/PromptVault`

Head before this iteration: `2463fdf`

## Baseline

After the lazy file-walk change, limited scans stop once the configured prompt
limit is reached. That makes `total_files` and source `files_seen` report
visited files for limited scans rather than every matching file under the source
root.

The aggregate completion audit already recorded the new smoke result, but
operator-facing docs did not define this counter meaning.

## Selected Candidate

Document limited-scan file counters in:

- `README.md`
- `docs/CLI.md`

## Success Metric

```bash
rg -n "visited files only|not every matching file" README.md docs/CLI.md
git diff --check
```

Expected:

- README and CLI docs both define limited-scan counters as visited-file counts.
- No whitespace errors.

## Result

- README: PASS, quick usage paragraph now defines limited-scan `total_files` and
  `files_seen`.
- CLI docs: PASS, behavior list now defines limited-scan `total_files` and
  source `files_seen`.
- Diff whitespace check: PASS.
