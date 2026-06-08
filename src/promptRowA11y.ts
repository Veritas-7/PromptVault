import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { qualityBandLabel } from "./qualityLabels.ts";
import { riskFlagLabel } from "./riskLabels.ts";
import type { PromptRecord } from "./types";

const PROMPT_ROW_SNIPPET_LENGTH = 120;

function compactPromptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function redactSensitivePromptPreview(text: string): string {
  return text
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY(?: BLOCK)?-----/gi,
      "[REDACTED_PRIVATE_KEY]",
    )
    .replace(
      /\bgh[oprsu]_[A-Za-z0-9_]{20,}\b|\b(?:Bearer|Basic)\s+[A-Za-z0-9][A-Za-z0-9]*[._~+/=-][A-Za-z0-9._~+/=-]*[A-Za-z0-9_=/+-]|(?:--user|-u)\s+[^:\s]+:[^\s]+|\b[A-Za-z][A-Za-z0-9+.-]*:\/\/(?:[^@\s/?#:]*:)[^@\s/?#]+@\S+|^\s*(?:set-cookie|cookie)\s*:\s*[^\r\n]*|\b(?:[A-Za-z0-9]+[_-])*(?:(?:aws[ _-]?)?access[ _-]?key(?:[ _-]?id)?|(?:aws[ _-]?)?secret[ _-]?access[ _-]?key|api[ _-]?key|private[ _-]?key|(?:access|refresh|auth|id)[ _-]?token|authorization|cookie|credential|secret|signature|token|password)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|(?:[A-Za-z]+\s+)?\S+)?/gim,
      "[REDACTED_POSSIBLE_SECRET]",
    )
    .replace(
      /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|\b[A-Za-z0-9_-]{48,}\b/g,
      "[REDACTED_LONG_TOKEN]",
    );
}

export function promptRowPreviewText(text: string): string {
  const compact = compactPromptText(redactSensitivePromptPreview(text));
  if (!compact) return "빈 프롬프트";
  if (compact.length <= PROMPT_ROW_SNIPPET_LENGTH) return compact;
  return `${compact.slice(0, PROMPT_ROW_SNIPPET_LENGTH - 3).trimEnd()}...`;
}

export function promptRowAriaLabel(
  prompt: PromptRecord,
  index: number,
  total: number,
  lockState?: ActionLockState,
): string {
  const position = `프롬프트 ${index + 1} / ${total}`;
  const timestamp = prompt.timestamp?.trim() || "시간 없음";
  const riskLabel = prompt.risk_flags.length
    ? `, 위험 패턴: ${prompt.risk_flags.map(riskFlagLabel).join(", ")}`
    : "";
  const label = `${position}: ${prompt.source}, ${timestamp}, ${prompt.word_count.toLocaleString()}개 단어, 품질 ${prompt.quality.score} ${qualityBandLabel(prompt.quality.band)}${riskLabel}, ${promptRowPreviewText(prompt.text)}`;
  const reason = lockState ? activeActionLockReason(lockState) : null;
  if (reason) return `${label}. ${reason}에는 다른 프롬프트를 선택할 수 없습니다`;
  return label;
}

export function selectedPromptMetaLabel(prompt: PromptRecord): string {
  const timestamp = prompt.timestamp?.trim() || "시간 없음";
  const workspace = prompt.cwd?.trim() || "작업공간 없음";
  return `선택한 프롬프트 메타데이터: ${prompt.source}, ${timestamp}, ${workspace}, 품질 ${prompt.quality.score} ${qualityBandLabel(prompt.quality.band)}`;
}
