export const BROWSER_BRIDGE_URL = "http://127.0.0.1:5174";

export const BROWSER_BRIDGE_NOTICE =
  "브라우저 브리지 모드: Tauri IPC를 사용할 수 없어 로컬 PromptVault 브리지를 호출하고 실제 파싱 프롬프트를 SQLite에 저장합니다.";

export function hasTauriInvoke(): boolean {
  if (typeof window === "undefined") return false;
  const internals = (window as typeof window & { __TAURI_INTERNALS__?: { invoke?: unknown } })
    .__TAURI_INTERNALS__;
  return typeof internals?.invoke === "function";
}

export function bridgeEndpoint(path: string): string {
  return `${BROWSER_BRIDGE_URL}${path}`;
}
