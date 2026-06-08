import assert from "node:assert/strict";
import test from "node:test";
import { displayErrorText } from "../src/errorDisplay.ts";

test("display error text redacts sensitive Error messages", () => {
  const apiFlag = ["--api", "key"].join("-");
  const secretValue = ["native", "error", "secret"].join("-");
  const error = new Error(`Native scan failed with ${apiFlag} ${secretValue}`);

  const message = displayErrorText(error);

  assert.equal(message, "Native scan failed with [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(message, new RegExp(`${apiFlag}|${secretValue}`));
});

test("display error text redacts sensitive string rejections", () => {
  const tokenName = ["access", "token"].join("_");
  const secretValue = ["string", "reject", "secret"].join("-");

  const message = displayErrorText(`Import failed: ${tokenName}=${secretValue}`);

  assert.equal(message, "Import failed: [REDACTED_POSSIBLE_SECRET]");
  assert.doesNotMatch(message, new RegExp(`${tokenName}|${secretValue}`));
});
