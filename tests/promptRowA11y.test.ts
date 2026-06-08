import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  promptRowAriaLabel,
  promptRowPreviewText,
  selectedPromptDisplayText,
  selectedPromptMetaLabel,
} from "../src/promptRowA11y.ts";
import type { PromptRecord } from "../src/types.ts";

function promptRecord(overrides: Partial<PromptRecord> = {}): PromptRecord {
  return {
    id: "prompt-1",
    source: "Codex",
    session_id: "session-1",
    path: "/tmp/session.jsonl",
    timestamp: "2026-06-06T12:00:00Z",
    cwd: "/Users/wj",
    text: "Return exactly OK",
    word_count: 3,
    char_count: 17,
    hash: "abc123",
    risk_flags: [],
    quality: {
      score: 36,
      band: "weak",
      missing: [],
      suggestions: [],
    },
    ...overrides,
  };
}

function lockState(overrides: Partial<ActionLockState> = {}): ActionLockState {
  return {
    importRunning: false,
    improvementRunning: false,
    planRunning: false,
    scanRunning: false,
    storedLoadRunning: false,
    ...overrides,
  };
}

test("prompt row labels distinguish duplicate prompt text by list position", () => {
  const first = promptRowAriaLabel(promptRecord(), 0, 2);
  const second = promptRowAriaLabel(promptRecord({ id: "prompt-2" }), 1, 2);

  assert.notEqual(first, second);
  assert.match(first, /^프롬프트 1 \/ 2:/);
  assert.match(second, /^프롬프트 2 \/ 2:/);
  assert.match(first, /Return exactly OK$/);
});

test("prompt row labels compact whitespace and include quality metadata", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ text: "  Improve\n\nthis\tprompt  ", word_count: 3 }), 0, 1),
    "프롬프트 1 / 1: Codex, 2026-06-06T12:00:00Z, 3개 단어, 품질 36 약함, Improve this prompt",
  );
});

test("prompt row labels avoid unbounded prompt text", () => {
  const label = promptRowAriaLabel(promptRecord({ text: "x ".repeat(200), word_count: 200 }), 0, 1);

  assert.ok(label.endsWith("..."));
  assert.ok(label.length < 230);
});

test("selected prompt display redacts secrets without truncating safe context", () => {
  const apiFlag = ["--api", "key"].join("-");
  const secretValue = ["short", "secret", "value"].join("-");
  const safeTail = "Keep this detailed verification context visible. ".repeat(5);
  const text = `Run tool ${apiFlag} ${secretValue} --format json.\n${safeTail}`;

  const displayText = selectedPromptDisplayText(text);

  assert.match(displayText, /\[REDACTED_POSSIBLE_SECRET\]/);
  assert.match(displayText, /--format json/);
  assert.match(displayText, /Keep this detailed verification context visible/);
  assert.ok(displayText.length > 120);
  assert.doesNotMatch(displayText, new RegExp(`${apiFlag}|${secretValue}`));
});

test("prompt row previews redact secret-like tokens", () => {
  const syntheticToken = `tokenlike-${"A".repeat(56)}`;
  const text = `Store token ${syntheticToken} in secrets.env`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.doesNotMatch(preview, new RegExp(syntheticToken));
  assert.doesNotMatch(label, new RegExp(syntheticToken));
  assert.match(preview, /\[REDACTED_LONG_TOKEN\]/);
  assert.match(label, /\[REDACTED_LONG_TOKEN\]/);
});

test("prompt row previews redact compact JWT-like tokens", () => {
  const syntheticToken = `eyJ${"a".repeat(18)}.${"b".repeat(18)}.${"c".repeat(18)}`;
  const text = `Use ${syntheticToken} for the request.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_LONG_TOKEN] for the request.");
  assert.doesNotMatch(preview, new RegExp(syntheticToken.replaceAll(".", "\\.")));
  assert.doesNotMatch(label, new RegExp(syntheticToken.replaceAll(".", "\\.")));
  assert.match(label, /\[REDACTED_LONG_TOKEN\]/);
});

test("prompt row previews redact quoted secret assignments with spaces", () => {
  const text = `Use api_key="alpha beta gamma" only in local secrets.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_POSSIBLE_SECRET] only in local secrets.");
  assert.doesNotMatch(preview, /alpha|beta|gamma/);
  assert.doesNotMatch(label, /alpha|beta|gamma/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact space-separated api key assignments", () => {
  const text = "Use api key=short-secret-value only in local secrets.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_POSSIBLE_SECRET] only in local secrets.");
  assert.doesNotMatch(preview, /short-secret-value/);
  assert.doesNotMatch(label, /short-secret-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact prefixed token assignments", () => {
  const text = "Store access_token=short-secret-value only in local secrets.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Store [REDACTED_POSSIBLE_SECRET] only in local secrets.");
  assert.doesNotMatch(preview, /short-secret-value/);
  assert.doesNotMatch(label, /short-secret-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact prefixed api key assignments", () => {
  const text = "Store openai_api_key=short-secret-value only in local secrets.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Store [REDACTED_POSSIBLE_SECRET] only in local secrets.");
  assert.doesNotMatch(preview, /openai_api_key|short-secret-value/);
  assert.doesNotMatch(label, /openai_api_key|short-secret-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact generic prefixed secret assignments", () => {
  const text =
    "Store client_secret=short-secret-value, db_password=local-password, and github_token=short-token.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Store [REDACTED_POSSIBLE_SECRET] [REDACTED_POSSIBLE_SECRET] and [REDACTED_POSSIBLE_SECRET]",
  );
  assert.doesNotMatch(
    preview,
    /client_secret|db_password|github_token|short-secret-value|local-password|short-token/,
  );
  assert.doesNotMatch(
    label,
    /client_secret|db_password|github_token|short-secret-value|local-password|short-token/,
  );
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact long CLI secret options", () => {
  const apiFlag = ["--api", "key"].join("-");
  const accessTokenFlag = ["--access", "token"].join("-");
  const passwordFlag = ["--pass", "word"].join("");
  const secretFlag = ["--", "secret"].join("");
  const cases = [
    {
      text: `Run tool ${apiFlag} short-secret-value --format json.`,
      expected: "Run tool [REDACTED_POSSIBLE_SECRET] --format json.",
      leakPattern: new RegExp(`${apiFlag}|short-secret-value`),
    },
    {
      text: `Run tool ${accessTokenFlag}=short-token-value --limit 10.`,
      expected: "Run tool [REDACTED_POSSIBLE_SECRET] --limit 10.",
      leakPattern: new RegExp(`${accessTokenFlag}|short-token-value`),
    },
    {
      text: `Run tool ${passwordFlag} "short password" --mode safe.`,
      expected: "Run tool [REDACTED_POSSIBLE_SECRET] --mode safe.",
      leakPattern: new RegExp(`${passwordFlag}|short password`),
    },
    {
      text: `Run tool ${secretFlag} 'short secret' --verbose.`,
      expected: "Run tool [REDACTED_POSSIBLE_SECRET] --verbose.",
      leakPattern: new RegExp(`${secretFlag}|short secret`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
    assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
  }
});

test("prompt row previews redact JSON-style sensitive properties", () => {
  const apiKey = ["api", "key"].join("_");
  const accessToken = ["access", "token"].join("_");
  const cookieKey = ["cook", "ie"].join("");
  const cookieValue = ["session", "short", "cookie", "value"].join("-");
  const cases = [
    {
      text: `Use {"${apiKey}":"short-secret-value","format":"json"} locally.`,
      expected: 'Use {[REDACTED_POSSIBLE_SECRET],"format":"json"} locally.',
      leakPattern: new RegExp(`${apiKey}|short-secret-value`),
    },
    {
      text: `Use {'${accessToken}': 'short-token-value', 'limit': '10'} locally.`,
      expected: "Use {[REDACTED_POSSIBLE_SECRET], 'limit': '10'} locally.",
      leakPattern: new RegExp(`${accessToken}|short-token-value`),
    },
    {
      text: `Use {"${cookieKey}":"${cookieValue}","mode":"safe"} locally.`,
      expected: 'Use {[REDACTED_POSSIBLE_SECRET],"mode":"safe"} locally.',
      leakPattern: new RegExp(`${cookieKey}|${cookieValue}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
    assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
  }
});

test("prompt row previews redact private key assignments", () => {
  const text = "Store ssh_private_key=short-key-material only in local secrets.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Store [REDACTED_POSSIBLE_SECRET] only in local secrets.");
  assert.doesNotMatch(preview, /ssh_private_key|short-key-material/);
  assert.doesNotMatch(label, /ssh_private_key|short-key-material/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact authorization bearer headers", () => {
  const text = "Send Authorization: Bearer short-token-value before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Send [REDACTED_POSSIBLE_SECRET] before request.");
  assert.doesNotMatch(preview, /Authorization|Bearer|short-token-value/);
  assert.doesNotMatch(label, /Authorization|Bearer|short-token-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact standalone bearer tokens", () => {
  const text = "Use Bearer short-token-value for the request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_POSSIBLE_SECRET] for the request.");
  assert.doesNotMatch(preview, /Bearer|short-token-value/);
  assert.doesNotMatch(label, /Bearer|short-token-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact standalone basic tokens", () => {
  const text = "Use Basic short-basic-value for the request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_POSSIBLE_SECRET] for the request.");
  assert.doesNotMatch(preview, /Basic|short-basic-value/);
  assert.doesNotMatch(label, /Basic|short-basic-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact quoted standalone auth scheme tokens", () => {
  const bearerScheme = ["Bear", "er"].join("");
  const bearerToken = ["short", "bearer", "value"].join("-");
  const basicScheme = ["Bas", "ic"].join("");
  const basicToken = ["short", "basic", "value"].join("-");
  const cases = [
    {
      text: `Use ${bearerScheme} "${bearerToken}" for the request.`,
      expected: "Use [REDACTED_POSSIBLE_SECRET] for the request.",
      leakPattern: new RegExp(`${bearerScheme}|${bearerToken}`),
    },
    {
      text: `Use ${basicScheme} '${basicToken}' for the request.`,
      expected: "Use [REDACTED_POSSIBLE_SECRET] for the request.",
      leakPattern: new RegExp(`${basicScheme}|${basicToken}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews redact standalone alphanumeric auth scheme tokens", () => {
  const bearerToken = ["short", "bearer", "value", "1"].join("");
  const basicToken = ["short", "basic", "value", "1"].join("");
  const cases = [
    {
      text: `Use Bearer ${bearerToken} for the request.`,
      expected: "Use [REDACTED_POSSIBLE_SECRET] for the request.",
      leakPattern: new RegExp(`Bearer|${bearerToken}`),
    },
    {
      text: `Use Basic ${basicToken} for the request.`,
      expected: "Use [REDACTED_POSSIBLE_SECRET] for the request.",
      leakPattern: new RegExp(`Basic|${basicToken}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews redact standalone provider-prefixed tokens", () => {
  const syntheticToken = `${["g", "h", "p"].join("")}_${"A".repeat(36)}`;
  const text = `Use ${syntheticToken} for repo access.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Use [REDACTED_POSSIBLE_SECRET] for repo access.");
  assert.doesNotMatch(preview, new RegExp(syntheticToken));
  assert.doesNotMatch(label, new RegExp(syntheticToken));
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact authorization scheme headers", () => {
  const text = "Send Authorization: Basic short-basic-value before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Send [REDACTED_POSSIBLE_SECRET] before request.");
  assert.doesNotMatch(preview, /Authorization|Basic|short-basic-value/);
  assert.doesNotMatch(label, /Authorization|Basic|short-basic-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact cookie headers", () => {
  const text =
    "Headers:\nCookie: session_id=short-session-value; csrf=short-csrf-value\nbefore request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Headers: [REDACTED_POSSIBLE_SECRET] before request.");
  assert.doesNotMatch(preview, /Cookie|session_id|short-session-value|csrf|short-csrf-value/);
  assert.doesNotMatch(label, /Cookie|session_id|short-session-value|csrf|short-csrf-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact curl cookie credentials", () => {
  const cookieValue = ["short", "session", "value"].join("-");
  const secondCookieValue = ["short", "csrf", "value"].join("-");
  const cookiePair = `session_id=${cookieValue}`;
  const secondCookiePair = `csrf=${secondCookieValue}`;
  const text =
    `Run curl -b ${cookiePair} https://example.com and curl --cookie ${secondCookiePair} https://example.org.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Run curl [REDACTED_POSSIBLE_SECRET] https://example.com and curl [REDACTED_POSSIBLE_SECRET] https://example.org.",
  );
  const leakPattern = new RegExp(`session_id|csrf|${cookieValue}|${secondCookieValue}`);
  assert.doesNotMatch(preview, leakPattern);
  assert.doesNotMatch(label, leakPattern);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews preserve quoted curl cookie header shape while redacting", () => {
  const cookieValue = ["short", "session", "value"].join("-");
  const cookiePair = `session_id=${cookieValue}`;
  const text = `Run curl -H "Cookie: ${cookiePair}" https://example.com`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, 'Run curl -H "[REDACTED_POSSIBLE_SECRET]" https://example.com');
  const leakPattern = new RegExp(`Cookie|session_id|${cookieValue}`);
  assert.doesNotMatch(preview, leakPattern);
  assert.doesNotMatch(label, leakPattern);
  assert.match(label, /-H "\[REDACTED_POSSIBLE_SECRET\]" https:\/\/example\.com/);
});

test("prompt row previews preserve quoted curl authorization header shape while redacting", () => {
  const authScheme = ["Bear", "er"].join("");
  const tokenValue = ["short", "bearer", "value"].join("-");
  const text = `Run curl -H "Authorization: ${authScheme} ${tokenValue}" https://example.com`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, 'Run curl -H "[REDACTED_POSSIBLE_SECRET]" https://example.com');
  const leakPattern = new RegExp(`Authorization|${authScheme}|${tokenValue}`);
  assert.doesNotMatch(preview, leakPattern);
  assert.doesNotMatch(label, leakPattern);
  assert.match(label, /-H "\[REDACTED_POSSIBLE_SECRET\]" https:\/\/example\.com/);
});

test("prompt row previews preserve equals-style quoted curl header shape while redacting", () => {
  const authScheme = ["Bear", "er"].join("");
  const tokenValue = ["short", "bearer", "value"].join("-");
  const cookieValue = ["short", "session", "value"].join("-");
  const cases = [
    {
      text: `Run curl --header="Authorization: ${authScheme} ${tokenValue}" https://example.com`,
      expected: 'Run curl --header="[REDACTED_POSSIBLE_SECRET]" https://example.com',
      leakPattern: new RegExp(`Authorization|${authScheme}|${tokenValue}`),
    },
    {
      text: `Run curl --header='Cookie: session_id=${cookieValue}' https://example.org`,
      expected: "Run curl --header='[REDACTED_POSSIBLE_SECRET]' https://example.org",
      leakPattern: new RegExp(`Cookie|session_id|${cookieValue}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews preserve quoted curl header shape case-insensitively", () => {
  const authScheme = ["Bear", "er"].join("");
  const tokenValue = ["short", "bearer", "value"].join("-");
  const cookieValue = ["short", "session", "value"].join("-");
  const cases = [
    {
      text: `Run curl -H "AUTHORIZATION: ${authScheme} ${tokenValue}" https://example.com`,
      expected: 'Run curl -H "[REDACTED_POSSIBLE_SECRET]" https://example.com',
      leakPattern: new RegExp(`AUTHORIZATION|${authScheme}|${tokenValue}`),
    },
    {
      text: `Run curl --header="COOKIE: session_id=${cookieValue}" https://example.org`,
      expected: 'Run curl --header="[REDACTED_POSSIBLE_SECRET]" https://example.org',
      leakPattern: new RegExp(`COOKIE|session_id|${cookieValue}`),
    },
    {
      text: `Run curl --header='Set-Cookie: session_id=${cookieValue}' https://example.net`,
      expected: "Run curl --header='[REDACTED_POSSIBLE_SECRET]' https://example.net",
      leakPattern: new RegExp(`Set-Cookie|session_id|${cookieValue}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews preserve glued short curl header flag shape while redacting", () => {
  const authScheme = ["Bear", "er"].join("");
  const tokenValue = ["short", "bearer", "value"].join("-");
  const cookieValue = ["short", "session", "value"].join("-");
  const cases = [
    {
      text: `Run curl -H"Authorization: ${authScheme} ${tokenValue}" https://example.com`,
      expected: 'Run curl -H"[REDACTED_POSSIBLE_SECRET]" https://example.com',
      leakPattern: new RegExp(`Authorization|${authScheme}|${tokenValue}`),
    },
    {
      text: `Run curl -H'Cookie: session_id=${cookieValue}' https://example.org`,
      expected: "Run curl -H'[REDACTED_POSSIBLE_SECRET]' https://example.org",
      leakPattern: new RegExp(`Cookie|session_id|${cookieValue}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews preserve quoted curl key-like header shape while redacting", () => {
  const apiKeyHeader = ["X", "Api", "Key"].join("-");
  const apiKeyValue = ["short", "api", "value"].join("-");
  const proxyAuthorizationHeader = ["Proxy", "Authorization"].join("-");
  const basicScheme = ["Bas", "ic"].join("");
  const basicValue = ["short", "basic", "value"].join("-");
  const authTokenHeader = ["X", "Auth", "Token"].join("-");
  const tokenValue = ["short", "token", "value"].join("-");
  const cases = [
    {
      text: `Run curl -H "${apiKeyHeader}: ${apiKeyValue}" https://example.net`,
      expected: 'Run curl -H "[REDACTED_POSSIBLE_SECRET]" https://example.net',
      leakPattern: new RegExp(`${apiKeyHeader}|${apiKeyValue}`),
    },
    {
      text: `Run curl --header="${proxyAuthorizationHeader}: ${basicScheme} ${basicValue}" https://example.org`,
      expected: 'Run curl --header="[REDACTED_POSSIBLE_SECRET]" https://example.org',
      leakPattern: new RegExp(`${proxyAuthorizationHeader}|${basicScheme}|${basicValue}`),
    },
    {
      text: `Run curl -H'${authTokenHeader}: ${tokenValue}' https://example.com`,
      expected: "Run curl -H'[REDACTED_POSSIBLE_SECRET]' https://example.com",
      leakPattern: new RegExp(`${authTokenHeader}|${tokenValue}`),
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
  }
});

test("prompt row previews redact credential and signature query params", () => {
  const text =
    "Fetch https://example.test/file?X-Amz-Credential=short-credential-value&X-Amz-Signature=short-signature-value before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Fetch https://example.test/file?[REDACTED_POSSIBLE_SECRET]&[REDACTED_POSSIBLE_SECRET] before request.",
  );
  assert.doesNotMatch(preview, /X-Amz|Credential|Signature|short-credential-value|short-signature-value/);
  assert.doesNotMatch(label, /X-Amz|Credential|Signature|short-credential-value|short-signature-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact cloud access key query params", () => {
  const text =
    "Fetch https://example.test/file?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=short-signature before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Fetch https://example.test/file?[REDACTED_POSSIBLE_SECRET]&[REDACTED_POSSIBLE_SECRET] before request.",
  );
  assert.doesNotMatch(preview, /AWSAccessKeyId|AKIAIOSFODNN7EXAMPLE|Signature|short-signature/);
  assert.doesNotMatch(label, /AWSAccessKeyId|AKIAIOSFODNN7EXAMPLE|Signature|short-signature/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews preserve safe query params around sensitive query params", () => {
  const sensitiveKey = ["auth", "token"].join("_");
  const sensitiveValue = ["short", "token", "value"].join("-");
  const text = `Fetch https://example.test/file?format=json&${sensitiveKey}=${sensitiveValue}&limit=10 before request.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Fetch https://example.test/file?format=json&[REDACTED_POSSIBLE_SECRET]&limit=10 before request.",
  );
  assert.doesNotMatch(preview, new RegExp(`${sensitiveKey}|${sensitiveValue}`));
  assert.doesNotMatch(label, new RegExp(`${sensitiveKey}|${sensitiveValue}`));
  assert.match(label, /format=json/);
  assert.match(label, /limit=10/);
});

test("prompt row previews redact cloud access key assignments", () => {
  const text = "Credentials: aws_access_key_id=AKIAIOSFODNN7EXAMPLE aws_secret_access_key=short-secret";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Credentials: [REDACTED_POSSIBLE_SECRET] [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(preview, /aws_access_key_id|aws_secret_access_key|AKIAIOSFODNN7EXAMPLE|short-secret/);
  assert.doesNotMatch(label, /aws_access_key_id|aws_secret_access_key|AKIAIOSFODNN7EXAMPLE|short-secret/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact URL userinfo credentials", () => {
  const cases = [
    {
      text: "Connect postgres://app_user:short-db-pass@db.example/app before request.",
      expected: "Connect [REDACTED_POSSIBLE_SECRET] before request.",
      leakPattern: /postgres|app_user|short-db-pass|db\.example/,
    },
    {
      text: "Open redis://:short-redis-pass@cache.example:6379/0 before request.",
      expected: "Open [REDACTED_POSSIBLE_SECRET] before request.",
      leakPattern: /redis|short-redis-pass|cache\.example/,
    },
  ];

  for (const { text, expected, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, expected);
    assert.doesNotMatch(preview, leakPattern);
    assert.doesNotMatch(label, leakPattern);
    assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
  }
});

test("prompt row previews redact curl user credentials", () => {
  const firstPassword = ["short", "secret", "value"].join("-");
  const secondPassword = ["short", "basic", "value"].join("-");
  const text =
    `Run curl -u alice:${firstPassword} https://example.com and curl --user bob:${secondPassword} https://example.org.`;

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(
    preview,
    "Run curl [REDACTED_POSSIBLE_SECRET] https://example.com and curl [REDACTED_POSSIBLE_SECRET] https://example.org.",
  );
  const leakPattern = new RegExp(`alice|bob|${firstPassword}|${secondPassword}`);
  assert.doesNotMatch(preview, leakPattern);
  assert.doesNotMatch(label, leakPattern);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact private key blocks case-insensitively", () => {
  const pgpPrivateKeyBlock = ["PGP", "PRIVATE", "KEY", "BLOCK"].join(" ");
  const cases = [
    {
      text: [
        "-----begin test private key-----",
        "short-body",
        "-----end test private key-----",
      ].join("\n"),
      leakPattern: /begin test private key|short-body|end test private key/i,
    },
    {
      text: [
        `-----BEGIN ${pgpPrivateKeyBlock}-----`,
        "short-pgp-body",
        `-----END ${pgpPrivateKeyBlock}-----`,
      ].join("\n"),
      leakPattern: /PGP PRIVATE KEY BLOCK|short-pgp-body/i,
    },
  ];

  for (const { text, leakPattern } of cases) {
    const preview = promptRowPreviewText(text);
    const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

    assert.equal(preview, "[REDACTED_PRIVATE_KEY]");
    assert.doesNotMatch(label, leakPattern);
    assert.match(label, /\[REDACTED_PRIVATE_KEY\]/);
  }
});

test("prompt row labels include localized risk flags", () => {
  const label = promptRowAriaLabel(
    promptRecord({ risk_flags: ["possible_api_key", "private_key"] }),
    0,
    1,
  );

  assert.match(label, /위험 패턴: 비밀값 형태 할당, 비공개 키 표식/);
  assert.doesNotMatch(label, /possible_api_key|private_key/);
});

test("prompt row labels handle missing timestamps and empty prompts", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord({ timestamp: null, text: "   ", word_count: 0 }), 0, 1),
    "프롬프트 1 / 1: Codex, 시간 없음, 0개 단어, 품질 36 약함, 빈 프롬프트",
  );
});

test("prompt row labels explain active-work selection locks", () => {
  assert.equal(
    promptRowAriaLabel(promptRecord(), 0, 1, lockState({ improvementRunning: true })),
    "프롬프트 1 / 1: Codex, 2026-06-06T12:00:00Z, 3개 단어, 품질 36 약함, Return exactly OK. 프롬프트 추천 생성 중에는 다른 프롬프트를 선택할 수 없습니다",
  );
});

test("selected prompt metadata label separates visual chips", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord()),
    "선택한 프롬프트 메타데이터: Codex, 2026-06-06T12:00:00Z, /Users/wj, 품질 36 약함",
  );
});

test("selected prompt metadata label handles missing values", () => {
  assert.equal(
    selectedPromptMetaLabel(promptRecord({ cwd: null, timestamp: null })),
    "선택한 프롬프트 메타데이터: Codex, 시간 없음, 작업공간 없음, 품질 36 약함",
  );
});
