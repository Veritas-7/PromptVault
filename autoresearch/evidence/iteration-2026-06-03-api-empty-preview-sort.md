# AutoResearch Iteration: API Empty Preview Sort

Date: 2026-06-03

## Objective

Make the API preview-sort parser reject explicit blank values.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-preview-sort.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-api-empty-preview-sort.md`

Observed issue:

- CLI empty preview-sort values failed closed.
- `PreviewSort::from_option(Some("  "))` still returned `Latest`.
- This made an omitted value and an explicitly blank invalid value indistinguishable.

## RED

```bash
cargo test --lib preview_sort_rejects_empty_values
```

Observed:

- FAILED before implementation.
- Failure showed `PreviewSort::from_option(Some("  "))` returned `Latest`.

## Change

- Split `None` handling from `Some(value)` handling in `PreviewSort::from_option`.
- Kept `None -> Latest`.
- Added `Some(blank) -> error`.
- Added `preview_sort_rejects_empty_values`.

## Evidence

```bash
cargo fmt --all
cargo test --lib preview_sort_rejects_empty_values
cargo test --lib run_scan_rejects_unknown_preview_sort
npm run check
```

Observed:

- Focused empty preview-sort parser test: PASS.
- Focused unknown preview-sort API test: PASS.
- `npm run check`: PASS, Vite build passed, 21 library tests plus 13 CLI tests passed, and strict clippy passed.

## Decision

Keep. Explicit blank API preview-sort values now fail closed while omitted preview sort still defaults to latest.
