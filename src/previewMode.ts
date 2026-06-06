export type PreviewMode = "latest" | "weakest";
export type PromptResultOrigin = "scan" | "stored";

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

function previewModeTitle(mode: PreviewMode): string {
  return mode === "weakest" ? "Weakest" : "Latest";
}

function previewModeDescription(mode: PreviewMode): string {
  return mode === "weakest" ? "weakest" : "latest";
}

export function shouldReloadStoredPreview(
  resultOrigin: PromptResultOrigin | null,
  hasPromptResult: boolean,
  currentMode: PreviewMode,
  nextMode: PreviewMode,
): boolean {
  return resultOrigin === "stored" && hasPromptResult && currentMode !== nextMode;
}

export function pendingPreviewModeNotice(
  resultPreviewSort: string | null | undefined,
  pendingMode: PreviewMode,
  hasPromptResult: boolean,
): string | null {
  const loadedMode = previewModeFromResult(resultPreviewSort);
  if (!hasPromptResult || loadedMode === null || loadedMode === pendingMode) return null;
  return `${previewModeTitle(
    pendingMode,
  )} preview is selected. Run Scan or Load Stored to refresh the loaded prompt list; it is still showing the ${previewModeDescription(
    loadedMode,
  )} preview.`;
}
