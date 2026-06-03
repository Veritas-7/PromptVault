# AutoResearch Iteration: Partial Source Notes

Date: 2026-06-03

## Objective

Surface skipped-file notes as partial source status and scan warnings.

## Internal Intake

See:

- `autoresearch/evidence/internal-scan-report-2026-06-03-partial-source-notes.json`
- `autoresearch/evidence/internal-scan-report-2026-06-03-partial-source-notes.md`

Observed issue:

- File-level parse errors were retained as notes but not promoted into status or
  warning surfaces.

## Change

- Added source-note warning promotion.
- Preserved valid prompts while marking affected source summaries as `partial`.

## Evidence

```bash
cargo test --lib source_notes_are_promoted_to_partial_warning
npm run check
```

Observed:

- RED before implementation: promotion helper was absent.
- GREEN after implementation: source notes become partial warning evidence.
- Full check: PASS.

## Decision

Keep. Partial source degradation is now visible instead of hidden in notes only.
