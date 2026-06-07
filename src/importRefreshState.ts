export type ImportRefreshState = "idle" | "loading" | "ready" | "failed";

export function importRefreshFailureText(state: ImportRefreshState, label: string): string | null {
  if (state !== "failed") return null;
  return `${label} 새로고침에 실패했습니다. 기존 데이터가 오래되었을 수 있습니다.`;
}

function sentenceStart(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "데이터";
  return trimmed;
}

export function importRefreshUnavailableText(state: ImportRefreshState, label: string): string {
  const target = sentenceStart(label);
  if (state === "failed") {
    const objectParticle = target === "데이터" ? "를" : "을";
    return `${target}${objectParticle} 사용할 수 없습니다. 새로고침으로 다시 시도하세요.`;
  }
  return `${label}을 불러오는 중입니다.`;
}
