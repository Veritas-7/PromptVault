import assert from "node:assert/strict";
import test from "node:test";
import {
  BROWSER_BRIDGE_COMMAND,
  BROWSER_BRIDGE_URL,
  bridgeEndpoint,
  browserBridgeUnavailableMessage,
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
