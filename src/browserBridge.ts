export const BROWSER_BRIDGE_URL = "http://127.0.0.1:5174";

export const BROWSER_BRIDGE_COMMAND =
  "cd src-tauri && cargo run --bin promptvault-cli -- serve --addr 127.0.0.1:5174";

export const BROWSER_BRIDGE_NOTICE =
  "브라우저 브리지 모드: Tauri IPC를 사용할 수 없어 로컬 PromptVault 브리지를 호출하고 실제 파싱 프롬프트를 SQLite에 저장합니다.";

export interface BrowserBridgeHealth {
  database_path: string;
  ok: boolean;
}

export function browserBridgeUnavailableMessage(): string {
  return `브라우저 브리지가 실행 중이 아닙니다. 터미널에서 다음 명령을 실행한 뒤 브리지 다시 확인을 누르세요: ${BROWSER_BRIDGE_COMMAND}`;
}

export function hasTauriInvoke(): boolean {
  if (typeof window === "undefined") return false;
  const internals = (window as typeof window & { __TAURI_INTERNALS__?: { invoke?: unknown } })
    .__TAURI_INTERNALS__;
  return typeof internals?.invoke === "function";
}

export function bridgeEndpoint(path: string): string {
  return `${BROWSER_BRIDGE_URL}${path}`;
}

export async function checkBrowserBridgeHealth(timeoutMs = 1200): Promise<BrowserBridgeHealth> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(bridgeEndpoint("/api/health"), {
        method: "GET",
        signal: controller.signal,
      });
    } catch {
      throw new Error(browserBridgeUnavailableMessage());
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new Error("PromptVault 브라우저 브리지 상태 응답을 읽지 못했습니다.");
    }

    if (!response.ok) {
      throw new Error(text || `PromptVault 브라우저 브리지가 HTTP ${response.status}를 반환했습니다.`);
    }
    try {
      return JSON.parse(text) as BrowserBridgeHealth;
    } catch {
      throw new Error("PromptVault 브라우저 브리지 상태 응답을 JSON으로 해석하지 못했습니다.");
    }
  } finally {
    window.clearTimeout(timer);
  }
}
