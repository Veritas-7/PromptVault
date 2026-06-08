export function redactSensitiveDisplayText(text: string): string {
  return text
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY(?: BLOCK)?-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY(?: BLOCK)?-----/gi,
      "[REDACTED_PRIVATE_KEY]",
    )
    .replace(
      /--[A-Za-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[A-Za-z0-9_-]*(?:=|\s+)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^-\s][^\s]*|-[^-\s][^\s]*)/gi,
      "[REDACTED_POSSIBLE_SECRET]",
    )
    .replace(
      /(["'])(?:[A-Za-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[A-Za-z0-9_-]*)\1\s*:\s*(?:"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*')/gi,
      "[REDACTED_POSSIBLE_SECRET]",
    )
    .replace(
      /((?:--header(?:\s+|=)|-H\s*))(["'])(?:[A-Za-z0-9_-]*(?:authorization|cookie|api[-_]?key|access[-_]?key|credential|secret|signature|token|password)[A-Za-z0-9_-]*)\s*:\s*[^"'\r\n]*\2/gi,
      (_match, prefix: string, quote: string) => `${prefix}${quote}[REDACTED_POSSIBLE_SECRET]${quote}`,
    )
    .replace(
      /\bgh[oprsu]_[A-Za-z0-9_]{20,}\b|\b(?:Bearer|Basic)\s+(?:"(?:[A-Za-z0-9][A-Za-z0-9]*[._~+/=-][A-Za-z0-9._~+/=-]*[A-Za-z0-9_=/+-]|[A-Za-z0-9]{16,})"|'(?:[A-Za-z0-9][A-Za-z0-9]*[._~+/=-][A-Za-z0-9._~+/=-]*[A-Za-z0-9_=/+-]|[A-Za-z0-9]{16,})'|(?:[A-Za-z0-9][A-Za-z0-9]*[._~+/=-][A-Za-z0-9._~+/=-]*[A-Za-z0-9_=/+-]|[A-Za-z0-9]{16,})\b)|(?:--user|-u)\s+[^:\s]+:[^\s]+|(?:--cookie|-b)\s+[^=\s]+=[^\s]+|\b[A-Za-z][A-Za-z0-9+.-]*:\/\/(?:[^@\s/?#:]*:)[^@\s/?#]+@\S+|^\s*(?:set-cookie|cookie)\s*:\s*[^\r\n]*|\b(?:[A-Za-z0-9]+[_-])*(?:(?:aws[ _-]?)?access[ _-]?key(?:[ _-]?id)?|(?:aws[ _-]?)?secret[ _-]?access[ _-]?key|api[ _-]?key|private[ _-]?key|(?:access|refresh|auth|id)[ _-]?token|authorization|cookie|credential|secret|signature|token|password)\s*[:=]\s*(?:"[^"\r\n]*"|'[^'\r\n]*'|(?:[A-Za-z]+\s+)?[^\s&]+)?/gim,
      "[REDACTED_POSSIBLE_SECRET]",
    )
    .replace(
      /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b|\b[A-Za-z0-9_-]{48,}\b/g,
      "[REDACTED_LONG_TOKEN]",
    );
}
