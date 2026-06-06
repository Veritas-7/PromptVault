import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";

function sourceStatusName(status: string): string {
  switch (status) {
    case "ok":
      return "available";
    case "empty":
      return "empty";
    case "missing":
      return "missing";
    case "partial":
      return "partial";
    case "stored":
      return "stored";
    default:
      return status || "unknown";
  }
}

export function planSourceStatusLabel(
  sourceLabel: string,
  status: string,
  fileCount: number,
  byteText: string,
  notes: string[] = [],
): string {
  const noteText = notes.length ? `. ${notes.join(" ")}` : "";
  return `${sourceLabel} source ${sourceStatusName(status)}: ${fileCount.toLocaleString()} files, ${byteText}${noteText}`;
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
  const actionLockReason = fileCount > 0 && lockState ? activeActionLockReason(lockState) : null;
  if (actionLockReason) {
    return `Cannot change import queue selection for ${sourceContext} while ${actionLockReason}`;
  }
  return `Import queue selection for ${sourceContext}`;
}

export type PlanSourceAction = "batch" | "continuous";

function planSourceActionText(action: PlanSourceAction): string {
  return action === "batch" ? "import one batch" : "run import until done";
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
  if (fileCount === 0) return `Cannot ${actionText} for ${sourceContext}`;
  const actionLockReason = lockState ? activeActionLockReason(lockState) : null;
  if (actionLockReason) return `Cannot ${actionText} for ${sourceContext} while ${actionLockReason}`;
  return `${actionText[0].toUpperCase()}${actionText.slice(1)} for ${sourceContext}`;
}

export function sourceSummaryStatusLabel(
  sourceLabel: string,
  status: string,
  promptCount: number,
): string {
  return `${sourceLabel} source ${sourceStatusName(status)}: ${promptCount.toLocaleString()} prompts found`;
}
