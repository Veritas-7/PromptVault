import { dateTimeDisplayText } from "./dateDisplay.ts";

export type PlanRunState = "idle" | "planning" | "ready" | "failed";

export function planPanelTimestampText(generatedAt: string | null | undefined, state: PlanRunState): string {
  if (generatedAt?.trim()) return dateTimeDisplayText(generatedAt);
  if (state === "planning") return "계획 중";
  if (state === "failed") return "실패";
  return "대기";
}

export function planFailureText(state: PlanRunState, hasPlan: boolean): string | null {
  if (state !== "failed") return null;
  return hasPlan
    ? "가져오기 계획을 새로고침하지 못했습니다. 기존 계획 데이터가 오래되었을 수 있습니다."
    : "가져오기 계획을 만들지 못했습니다. 위 오류를 확인한 뒤 계획을 다시 실행하세요.";
}

export function planUnavailableText(state: PlanRunState): string {
  if (state === "planning") return "소스 목록을 만드는 중입니다.";
  if (state === "failed") return "가져오기 계획을 사용할 수 없습니다. 계획을 다시 실행하세요.";
  return "사용 가능한 프롬프트 소스를 보려면 계획을 실행하세요.";
}
