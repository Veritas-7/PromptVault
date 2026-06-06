export const BROWSER_BRIDGE_URL = "http://127.0.0.1:5174";

export const BROWSER_BRIDGE_NOTICE =
  "Browser bridge mode: Tauri IPC is unavailable, so this page calls the local PromptVault bridge and persists real parsed prompts to SQLite.";

export function hasTauriInvoke(): boolean {
  if (typeof window === "undefined") return false;
  const internals = (window as typeof window & { __TAURI_INTERNALS__?: { invoke?: unknown } })
    .__TAURI_INTERNALS__;
  return typeof internals?.invoke === "function";
}

export function bridgeEndpoint(path: string): string {
  return `${BROWSER_BRIDGE_URL}${path}`;
}
