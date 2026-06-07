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
  return mode === "weakest" ? "개선 우선" : "최신순";
}

function previewModeDescription(mode: PreviewMode): string {
  return mode === "weakest" ? "개선 우선" : "최신순";
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
  )} 미리보기가 선택되었습니다. 불러온 프롬프트 목록을 갱신하려면 스캔 또는 저장소 불러오기를 실행하세요. 현재 목록은 아직 ${previewModeDescription(
    loadedMode,
  )} 미리보기입니다.`;
}
