export type PreviewMode = "latest" | "weakest";

export function previewSortForMode(mode: PreviewMode): string {
  return mode === "weakest" ? "quality_asc" : "latest";
}

function previewModeFromResult(previewSort: string | null | undefined): PreviewMode | null {
  if (previewSort === "quality_asc") return "weakest";
  if (previewSort === "latest") return "latest";
  return null;
}

export function effectivePromptListMode(
  resultPreviewSort: string | null | undefined,
  pendingMode: PreviewMode,
): PreviewMode {
  return previewModeFromResult(resultPreviewSort) ?? pendingMode;
}
