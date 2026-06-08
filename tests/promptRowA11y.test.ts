import assert from "node:assert/strict";
import test from "node:test";
import type { ActionLockState } from "../src/actionLocks.ts";
import {
  promptRowAriaLabel,
  promptRowPreviewText,
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

test("prompt row previews redact credential and signature query params", () => {
  const text =
    "Fetch https://example.test/file?X-Amz-Credential=short-credential-value&X-Amz-Signature=short-signature-value before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Fetch https://example.test/file?[REDACTED_POSSIBLE_SECRET] before request.");
  assert.doesNotMatch(preview, /X-Amz|Credential|Signature|short-credential-value|short-signature-value/);
  assert.doesNotMatch(label, /X-Amz|Credential|Signature|short-credential-value|short-signature-value/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
});

test("prompt row previews redact cloud access key query params", () => {
  const text =
    "Fetch https://example.test/file?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=short-signature before request.";

  const preview = promptRowPreviewText(text);
  const label = promptRowAriaLabel(promptRecord({ text }), 0, 1);

  assert.equal(preview, "Fetch https://example.test/file?[REDACTED_POSSIBLE_SECRET] before request.");
  assert.doesNotMatch(preview, /AWSAccessKeyId|AKIAIOSFODNN7EXAMPLE|Signature|short-signature/);
  assert.doesNotMatch(label, /AWSAccessKeyId|AKIAIOSFODNN7EXAMPLE|Signature|short-signature/);
  assert.match(label, /\[REDACTED_POSSIBLE_SECRET\]/);
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
