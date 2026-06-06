export type PlanRunState = "idle" | "planning" | "ready" | "failed";

export function planFailureText(state: PlanRunState, hasPlan: boolean): string | null {
  if (state !== "failed") return null;
  return hasPlan
    ? "Could not refresh the import plan. Existing plan data may be stale."
    : "Could not create an import plan. Check the error above and use Plan to retry.";
}

export function planUnavailableText(state: PlanRunState): string {
  if (state === "planning") return "Building source inventory.";
  if (state === "failed") return "Import plan is unavailable. Use Plan to retry.";
  return "Run Plan to inspect available prompt sources.";
}
