import type { PromptRecord } from "./types";

const PROMPT_ROW_SNIPPET_LENGTH = 120;

function compactPromptText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function clippedPromptSnippet(text: string): string {
  const compact = compactPromptText(text);
  if (!compact) return "empty prompt";
  if (compact.length <= PROMPT_ROW_SNIPPET_LENGTH) return compact;
  return `${compact.slice(0, PROMPT_ROW_SNIPPET_LENGTH - 3).trimEnd()}...`;
}

export function promptRowAriaLabel(prompt: PromptRecord, index: number, total: number): string {
  const position = `Prompt ${index + 1} of ${total}`;
  const timestamp = prompt.timestamp?.trim() || "unknown time";
  return `${position}: ${prompt.source}, ${timestamp}, ${prompt.word_count} words, quality ${prompt.quality.score} ${prompt.quality.band}, ${clippedPromptSnippet(prompt.text)}`;
}

export function selectedPromptMetaLabel(prompt: PromptRecord): string {
  const timestamp = prompt.timestamp?.trim() || "unknown time";
  const workspace = prompt.cwd?.trim() || "unknown workspace";
  return `Selected prompt metadata: ${prompt.source}, ${timestamp}, ${workspace}, quality ${prompt.quality.score} ${prompt.quality.band}`;
}
