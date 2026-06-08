import assert from "node:assert/strict";
import test from "node:test";
import {
  BROWSER_BRIDGE_COMMAND,
  BROWSER_BRIDGE_URL,
  bridgeEndpoint,
  browserBridgeStatusText,
  browserBridgeUnavailableMessage,
  checkBrowserBridgeHealth,
} from "../src/browserBridge.ts";

const BRIDGE_URL_STORAGE_KEY = "promptvault.browserBridgeUrl";

function withLocalStorageValue<T>(value: string | null, callback: () => T): T {
  const globalWithWindow = globalThis as typeof globalThis & {
    window?: {
      localStorage?: {
        getItem: (key: string) => string | null;
      };
    };
  };
  const originalWindow = globalWithWindow.window;

  globalWithWindow.window = {
    ...(originalWindow ?? {}),
    localStorage: {
      getItem: (key: string) => (key === BRIDGE_URL_STORAGE_KEY ? value : null),
    },
  };

  try {
    return callback();
  } finally {
    if (originalWindow === undefined) {
      delete globalWithWindow.window;
    } else {
      globalWithWindow.window = originalWindow;
    }
  }
}

test("bridge endpoint builds local browser bridge URLs", () => {
  assert.equal(bridgeEndpoint("/api/scan"), `${BROWSER_BRIDGE_URL}/api/scan`);
});

test("bridge endpoint uses a validated local browser bridge URL override", () => {
  withLocalStorageValue("http://127.0.0.1:5176/", () => {
    assert.equal(bridgeEndpoint("/api/health"), "http://127.0.0.1:5176/api/health");
  });
});

test("bridge unavailable message uses the validated local bridge URL override command", () => {
  withLocalStorageValue("http://localhost:5176", () => {
    const message = browserBridgeUnavailableMessage();

    assert.match(message, /--addr localhost:5176/);
    assert.doesNotMatch(message, /--addr 127\.0\.0\.1:5174/);
  });
});

test("bridge URL override ignores non-local or malformed values", () => {
  for (const value of [
    "https://127.0.0.1:5176",
    "http://example.com:5176",
    "http://127.0.0.1",
    "not a url",
  ]) {
    withLocalStorageValue(value, () => {
      assert.equal(bridgeEndpoint("/api/health"), `${BROWSER_BRIDGE_URL}/api/health`);
      assert.match(browserBridgeUnavailableMessage(), new RegExp(BROWSER_BRIDGE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    });
  }
});

test("bridge unavailable message gives the recovery command without raw fetch errors", () => {
  const message = browserBridgeUnavailableMessage();

  assert.match(message, /브라우저 브리지가 실행 중이 아닙니다/);
  assert.match(message, new RegExp(BROWSER_BRIDGE_COMMAND.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(message, /Load failed|Failed to fetch|NetworkError/);
});

test("bridge status text preserves sanitized check failure details", () => {
  assert.equal(
    browserBridgeStatusText("disconnected", null, "PromptVault 브라우저 브리지가 HTTP 500를 반환했습니다."),
    "PromptVault 브라우저 브리지가 HTTP 500를 반환했습니다.",
  );
  assert.doesNotMatch(
    browserBridgeStatusText("disconnected", null, "PromptVault 브라우저 브리지가 HTTP 500를 반환했습니다.") ?? "",
    /TypeError|Cannot read properties|undefined/,
  );
});

test("bridge status text falls back to recovery copy for network disconnects", () => {
  assert.match(browserBridgeStatusText("disconnected", null, null) ?? "", /브라우저 브리지가 실행 중이 아닙니다/);
});

test("bridge status text includes database context when connected", () => {
  assert.match(
    browserBridgeStatusText("connected", "/tmp/promptvault.sqlite", null) ?? "",
    /데이터베이스: \/tmp\/promptvault\.sqlite/,
  );
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

test("bridge health reports unreadable response bodies without raw stream errors", async (t) => {
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
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => {
      throw new Error("body stream failure");
    },
  } as Response);

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
      assert.match(error.message, /브라우저 브리지 상태 응답을 읽지 못했습니다/);
      assert.doesNotMatch(error.message, /body stream failure|TypeError/);
      return true;
    },
  );
});

test("bridge health HTTP errors omit raw response bodies", async (t) => {
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
  globalThis.fetch = async () => new Response(
    "TypeError: Cannot read properties of undefined\n    at health",
    { status: 500 },
  );

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
      assert.match(error.message, /브라우저 브리지가 HTTP 500를 반환했습니다/);
      assert.doesNotMatch(error.message, /TypeError|Cannot read properties|undefined|at health/);
      return true;
    },
  );
});

test("bridge health rejects unhealthy responses before marking the bridge connected", async (t) => {
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
  globalThis.fetch = async () => new Response(
    JSON.stringify({ database_path: "/tmp/promptvault.sqlite", ok: false }),
    { status: 200 },
  );

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
      assert.match(error.message, /브라우저 브리지가 정상 상태를 보고하지 않았습니다/);
      return true;
    },
  );
});

test("bridge health rejects malformed successful health payloads", async (t) => {
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
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

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
      assert.match(error.message, /브라우저 브리지 상태 응답 형식이 올바르지 않습니다/);
      return true;
    },
  );
});
