import { redactSensitiveDisplayText } from "./displayRedaction.ts";

function compactDisplayText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function dateTimeDisplayText(timestamp: string | null | undefined, emptyText = "시간 없음"): string {
  const trimmedTimestamp = timestamp?.trim();
  if (!trimmedTimestamp) return emptyText;

  const parsedTimestamp = new Date(trimmedTimestamp);
  if (!Number.isFinite(parsedTimestamp.getTime())) {
    const compactTimestamp = compactDisplayText(trimmedTimestamp);
    const redactedTimestamp = compactDisplayText(redactSensitiveDisplayText(trimmedTimestamp));
    if (
      redactedTimestamp !== compactTimestamp
      && redactedTimestamp.includes("[REDACTED_POSSIBLE_SECRET]")
    ) {
      return "[REDACTED_POSSIBLE_SECRET]";
    }
    return redactedTimestamp;
  }

  return parsedTimestamp.toLocaleString();
}
