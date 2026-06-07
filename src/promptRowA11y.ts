import type { PromptRecord } from "./types";

const PROMPT_ROW_SNIPPET_LENGTH = 120;

function compactPromptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clippedPromptSnippet(text: string): string {
  const compact = compactPromptText(text);
  if (!compact) return "빈 프롬프트";
  if (compact.length <= PROMPT_ROW_SNIPPET_LENGTH) return compact;
  return `${compact.slice(0, PROMPT_ROW_SNIPPET_LENGTH - 3).trimEnd()}...`;
}

export function promptRowAriaLabel(prompt: PromptRecord, index: number, total: number): string {
  const position = `프롬프트 ${index + 1} / ${total}`;
  const timestamp = prompt.timestamp?.trim() || "시간 없음";
  return `${position}: ${prompt.source}, ${timestamp}, ${prompt.word_count.toLocaleString()}개 단어, 품질 ${prompt.quality.score} ${prompt.quality.band}, ${clippedPromptSnippet(prompt.text)}`;
}

export function selectedPromptMetaLabel(prompt: PromptRecord): string {
  const timestamp = prompt.timestamp?.trim() || "시간 없음";
  const workspace = prompt.cwd?.trim() || "작업공간 없음";
  return `선택한 프롬프트 메타데이터: ${prompt.source}, ${timestamp}, ${workspace}, 품질 ${prompt.quality.score} ${prompt.quality.band}`;
}
