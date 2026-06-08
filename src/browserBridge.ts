export const BROWSER_BRIDGE_URL = "http://127.0.0.1:5174";
export const BROWSER_BRIDGE_URL_STORAGE_KEY = "promptvault.browserBridgeUrl";

export const BROWSER_BRIDGE_COMMAND = browserBridgeCommandForUrl(BROWSER_BRIDGE_URL);

export const BROWSER_BRIDGE_NOTICE =
  "브라우저 브리지 모드: Tauri IPC를 사용할 수 없어 로컬 PromptVault 브리지를 호출하고 실제 파싱 프롬프트를 SQLite에 저장합니다.";

export interface BrowserBridgeHealth {
  database_path: string;
  ok: boolean;
}

export type BrowserBridgeStatus = "native" | "checking" | "connected" | "disconnected";

export function browserBridgeUnavailableMessage(): string {
  return `브라우저 브리지가 실행 중이 아닙니다. 터미널에서 다음 명령을 실행한 뒤 브리지 다시 확인을 누르세요: ${browserBridgeCommand()}`;
}

export function browserBridgeHttpErrorMessage(status: number): string {
  return `PromptVault 브라우저 브리지가 HTTP ${status}를 반환했습니다.`;
}

export function browserBridgeStatusText(
  status: BrowserBridgeStatus,
  databasePath: string | null,
  failureText: string | null,
): string | null {
  if (status === "checking") return "브라우저 브리지 연결을 확인하는 중입니다.";
  if (status === "connected") {
    return `${BROWSER_BRIDGE_NOTICE}${databasePath ? ` 데이터베이스: ${databasePath}` : ""}`;
  }
  if (status === "disconnected") return failureText?.trim() || browserBridgeUnavailableMessage();
  return null;
}

export function hasTauriInvoke(): boolean {
  if (typeof window === "undefined") return false;
  const internals = (window as typeof window & { __TAURI_INTERNALS__?: { invoke?: unknown } })
    .__TAURI_INTERNALS__;
  return typeof internals?.invoke === "function";
}

export function bridgeEndpoint(path: string): string {
  return `${browserBridgeUrl()}${path}`;
}

export function browserBridgeUrl(): string {
  return storedBrowserBridgeUrl() ?? BROWSER_BRIDGE_URL;
}

export function browserBridgeCommand(): string {
  return browserBridgeCommandForUrl(browserBridgeUrl());
}

function browserBridgeCommandForUrl(url: string): string {
  const parsed = new URL(url);
  return `cd src-tauri && cargo run --bin promptvault-cli -- serve --addr ${parsed.hostname}:${parsed.port}`;
}

function storedBrowserBridgeUrl(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return normalizeLocalBrowserBridgeUrl(window.localStorage?.getItem(BROWSER_BRIDGE_URL_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

function normalizeLocalBrowserBridgeUrl(value: string | null): string | null {
  const rawValue = value?.trim();
  if (!rawValue) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:") return null;
  if (parsed.port.trim() === "") return null;
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname)) return null;

  return parsed.origin;
}

function parseBrowserBridgeHealth(text: string): BrowserBridgeHealth {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("PromptVault 브라우저 브리지 상태 응답을 JSON으로 해석하지 못했습니다.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("PromptVault 브라우저 브리지 상태 응답 형식이 올바르지 않습니다.");
  }

  const health = parsed as Partial<BrowserBridgeHealth>;
  if (health.ok !== true) {
    throw new Error("PromptVault 브라우저 브리지가 정상 상태를 보고하지 않았습니다.");
  }
  if (typeof health.database_path !== "string" || health.database_path.trim() === "") {
    throw new Error("PromptVault 브라우저 브리지 상태 응답 형식이 올바르지 않습니다.");
  }

  return {
    database_path: health.database_path,
    ok: true,
  };
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

    if (!response.ok) {
      throw new Error(browserBridgeHttpErrorMessage(response.status));
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new Error("PromptVault 브라우저 브리지 상태 응답을 읽지 못했습니다.");
    }

    return parseBrowserBridgeHealth(text);
  } finally {
    window.clearTimeout(timer);
  }
}
