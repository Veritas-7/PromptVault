import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { redactSensitiveDisplayText, sourceLabelDisplayText } from "./promptRowA11y.ts";

function normalizedSourceStatus(status: string): string {
  return status.trim().toLowerCase();
}

function sourceStatusName(status: string): string {
  const normalized = normalizedSourceStatus(status);
  switch (normalized) {
    case "ok":
      return "사용 가능";
    case "empty":
      return "비어 있음";
    case "missing":
      return "누락됨";
    case "partial":
      return "부분 처리";
    case "stored":
      return "저장됨";
    default:
      return compactSourceStatus(redactSensitiveDisplayText(status.trim())) || "알 수 없음";
  }
}

function compactSourceStatus(status: string): string {
  return status.replace(/\s+/g, " ").trim();
}

const SOURCE_STATUS_CLASSES: Record<string, string> = {
  empty: "empty",
  missing: "missing",
  ok: "ok",
  partial: "partial",
  stored: "stored",
};

export function sourceStatusClass(status: string): string {
  const normalized = normalizedSourceStatus(status);
  return SOURCE_STATUS_CLASSES[normalized] ?? "unknown";
}

export function isSourceStatusOk(status: string): boolean {
  const normalized = normalizedSourceStatus(status);
  return normalized === "ok" || normalized === "stored";
}

function countLabel(count: number, singular: string): string {
  return `${count.toLocaleString()}개 ${singular}`;
}

function appendSentence(text: string, sentence: string): string {
  const trimmed = text.trim();
  const separator = /[.!?。！？]$/.test(trimmed) ? " " : ". ";
  return `${trimmed}${separator}${sentence}`;
}

export function planSourceStatusLabel(
  sourceLabel: string,
  status: string,
  fileCount: number,
  byteText: string,
  notes: string[] = [],
): string {
  const displaySourceLabel = sourceLabelDisplayText(sourceLabel);
  const noteText = notes.length ? `. ${notes.join(" ")}` : "";
  return `${displaySourceLabel} 소스 ${sourceStatusName(status)}: ${countLabel(fileCount, "파일")}, ${byteText}${noteText}`;
}

export function planSourceSelectionLabel(
  sourceLabel: string,
  status: string,
  fileCount: number,
  byteText: string,
  notes: string[] = [],
  lockState?: ActionLockState,
): string {
  const sourceContext = planSourceStatusLabel(
    sourceLabel,
    status,
    fileCount,
    byteText,
    notes,
  );
  if (fileCount === 0) {
    return appendSentence(sourceContext, "파일이 없어 가져오기 대기열에 선택할 수 없습니다");
  }
  const actionLockReason = fileCount > 0 && lockState ? activeActionLockReason(lockState) : null;
  if (actionLockReason) {
    return `${actionLockReason}에는 ${sourceContext}의 가져오기 대기열 선택을 바꿀 수 없습니다`;
  }
  return `${sourceContext} 가져오기 대기열 선택`;
}

export type PlanSourceAction = "batch" | "continuous";

function planSourceActionText(action: PlanSourceAction): string {
  return action === "batch" ? "한 배치 가져오기" : "끝까지 가져오기";
}

export function planSourceActionLabel(
  action: PlanSourceAction,
  sourceLabel: string,
  status: string,
  fileCount: number,
  byteText: string,
  notes: string[] = [],
  lockState?: ActionLockState,
): string {
  const actionText = planSourceActionText(action);
  const sourceContext = planSourceStatusLabel(sourceLabel, status, fileCount, byteText, notes);
  if (fileCount === 0) return appendSentence(sourceContext, `파일이 없어 ${actionText}를 실행할 수 없습니다`);
  const actionLockReason = lockState ? activeActionLockReason(lockState) : null;
  if (actionLockReason) return `${actionLockReason}에는 ${sourceContext}의 ${actionText}를 실행할 수 없습니다`;
  return `${sourceContext} ${actionText}`;
}

export function sourceSummaryStatusLabel(
  sourceLabel: string,
  status: string,
  promptCount: number,
): string {
  const displaySourceLabel = sourceLabelDisplayText(sourceLabel);
  return `${displaySourceLabel} 소스 ${sourceStatusName(status)}: ${countLabel(promptCount, "프롬프트")} 발견`;
}
