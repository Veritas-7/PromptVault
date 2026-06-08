import assert from "node:assert/strict";
import test from "node:test";
import { riskFlagLabel } from "../src/riskLabels.ts";

test("risk flag labels match backend risk identifiers", () => {
  assert.equal(riskFlagLabel("possible_api_key"), "비밀값 형태 할당");
  assert.equal(riskFlagLabel("private_key"), "비공개 키 표식");
  assert.equal(riskFlagLabel("long_base64_like_token"), "긴 토큰 형식 문자열");
});

test("risk flag labels preserve unknown backend identifiers", () => {
  assert.equal(riskFlagLabel("new_backend_flag"), "new_backend_flag");
  assert.equal(riskFlagLabel(""), "알 수 없음");
});

test("risk flag labels redact secret-like unknown backend identifiers", () => {
  const apiFlag = ["--api", "key"].join("-");
  const secretValue = ["risk", "flag", "secret"].join("-");
  const label = riskFlagLabel(`new_backend_flag ${apiFlag} ${secretValue}`);

  assert.equal(label, "new_backend_flag [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(label, new RegExp(`${apiFlag}|${secretValue}`));
});
