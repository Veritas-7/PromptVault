export function refreshGlobalErrorAfterSuccess(
  quiet: boolean,
  currentError: string | null,
): string | null {
  return quiet ? currentError : null;
}
