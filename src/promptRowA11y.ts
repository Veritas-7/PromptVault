import { activeActionLockReason, type ActionLockState } from "./actionLocks.ts";
import { dateTimeDisplayText } from "./dateDisplay.ts";
import { redactSensitiveDisplayText } from "./displayRedaction.ts";
import { qualityBandLabel } from "./qualityLabels.ts";
import { riskFlagLabel } from "./riskLabels.ts";
import type { PromptRecord } from "./types";

export { redactSensitiveDisplayText } from "./displayRedaction.ts";

const PROMPT_ROW_SNIPPET_LENGTH = 120;

function compactPromptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function promptRowPreviewText(text: string): string {
  const compact = compactPromptText(redactSensitiveDisplayText(text));
  if (!compact) return "빈 프롬프트";
  if (compact.length <= PROMPT_ROW_SNIPPET_LENGTH) return compact;
  return `${compact.slice(0, PROMPT_ROW_SNIPPET_LENGTH - 3).trimEnd()}...`;
}

export function selectedPromptDisplayText(text: string): string {
  return redactSensitiveDisplayText(text);
}

export function promptMetadataDisplayText(text: string): string {
  return compactPromptText(redactSensitiveDisplayText(text));
}

export function promptQualitySuggestionText(text: string): string {
  return compactPromptText(redactSensitiveDisplayText(text));
}

export function promptProviderDisplayText(text: string): string {
  return compactPromptText(redactSensitiveDisplayText(text));
}

export function sourceLabelDisplayText(text: string): string {
  return compactPromptText(redactSensitiveDisplayText(text));
}

export function pathDisplayText(text: string): string {
  return compactPromptText(redactSensitiveDisplayText(text));
}

export function promptTimestampDisplayText(timestamp: string | null | undefined): string {
  return dateTimeDisplayText(timestamp);
}

export function promptRowAriaLabel(
  prompt: PromptRecord,
  index: number,
  total: number,
  lockState?: ActionLockState,
): string {
  const position = `프롬프트 ${index + 1} / ${total}`;
  const source = promptMetadataDisplayText(prompt.source);
  const timestamp = promptTimestampDisplayText(prompt.timestamp);
  const riskLabel = prompt.risk_flags.length
    ? `, 위험 패턴: ${prompt.risk_flags.map(riskFlagLabel).join(", ")}`
    : "";
  const label = `${position}: ${source}, ${timestamp}, ${prompt.word_count.toLocaleString()}개 단어, 품질 ${prompt.quality.score} ${qualityBandLabel(prompt.quality.band)}${riskLabel}, ${promptRowPreviewText(prompt.text)}`;
  const reason = lockState ? activeActionLockReason(lockState) : null;
  if (reason) return `${label}. ${reason}에는 다른 프롬프트를 선택할 수 없습니다`;
  return label;
}

export function selectedPromptMetaLabel(prompt: PromptRecord): string {
  const source = promptMetadataDisplayText(prompt.source);
  const timestamp = promptTimestampDisplayText(prompt.timestamp);
  const workspace = prompt.cwd?.trim()
    ? promptMetadataDisplayText(prompt.cwd)
    : "작업공간 없음";
  return `선택한 프롬프트 메타데이터: ${source}, ${timestamp}, ${workspace}, 품질 ${prompt.quality.score} ${qualityBandLabel(prompt.quality.band)}`;
}
