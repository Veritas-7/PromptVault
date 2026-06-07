import assert from "node:assert/strict";
import test from "node:test";
import {
  BROWSER_BRIDGE_COMMAND,
  BROWSER_BRIDGE_URL,
  bridgeEndpoint,
  browserBridgeUnavailableMessage,
  checkBrowserBridgeHealth,
} from "../src/browserBridge.ts";

test("bridge endpoint builds local browser bridge URLs", () => {
  assert.equal(bridgeEndpoint("/api/scan"), `${BROWSER_BRIDGE_URL}/api/scan`);
});

test("bridge unavailable message gives the recovery command without raw fetch errors", () => {
  const message = browserBridgeUnavailableMessage();

  assert.match(message, /브라우저 브리지가 실행 중이 아닙니다/);
  assert.match(message, new RegExp(BROWSER_BRIDGE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(message, /Load failed|Failed to fetch|NetworkError/);
});

test("bridge health reports malformed JSON without raw parser errors", async (t) => {
  const originalFetch = globalThis.fetch;
  const globalWithWindow = globalThis as typeof globalThis & {
    window?: {
      clearTimeout: typeof clearTimeout;
      setTimeout: typeof setTimeout;
    };
  };
  const originalWindow = globalWithWindow.window;

  globalWithWindow.window = {
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
  };
  globalThis.fetch = async () => new Response("not json", { status: 200 });

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete globalWithWindow.window;
    } else {
      globalWithWindow.window = originalWindow;
    }
  });

  await assert.rejects(
    () => checkBrowserBridgeHealth(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지 상태 응답을 JSON으로 해석하지 못했습니다/);
      assert.doesNotMatch(error.message, /Unexpected token|SyntaxError/);
      return true;
    },
  );
});

test("bridge health reports network failures without raw fetch errors", async (t) => {
  const originalFetch = globalThis.fetch;
  const globalWithWindow = globalThis as typeof globalThis & {
    window?: {
      clearTimeout: typeof clearTimeout;
      setTimeout: typeof setTimeout;
    };
  };
  const originalWindow = globalWithWindow.window;

  globalWithWindow.window = {
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
  };
  globalThis.fetch = async () => {
    throw new Error("Failed to fetch");
  };

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) {
      delete globalWithWindow.window;
    } else {
      globalWithWindow.window = originalWindow;
    }
  });

  await assert.rejects(
    () => checkBrowserBridgeHealth(),
    (error) => {
      assert(error instanceof Error);
      assert.match(error.message, /브라우저 브리지가 실행 중이 아닙니다/);
      assert.match(error.message, new RegExp(BROWSER_BRIDGE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.doesNotMatch(error.message, /Failed to fetch|Load failed|NetworkError/);
      return true;
    },
  );
});
