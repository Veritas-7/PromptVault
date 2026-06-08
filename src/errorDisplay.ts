import { redactSensitiveDisplayText } from "./promptRowA11y.ts";

export function displayErrorText(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return redactSensitiveDisplayText(message);
}
