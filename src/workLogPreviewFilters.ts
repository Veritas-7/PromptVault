import { storedFilterSuggestionValues } from "./storedFilters.ts";
import type {
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionProposal,
} from "./types.ts";

export interface WorkLogPreviewFilters {
  date: string;
  project: string;
}

export function emptyWorkLogPreviewFilters(): WorkLogPreviewFilters {
  return {
    date: "",
    project: "",
  };
}

function trimmedFilterValue(value: string): string {
  return value.trim();
}

export function activeWorkLogPreviewFilterCount(filters: WorkLogPreviewFilters): number {
  return [
    filters.date,
    filters.project,
  ].filter((value) => value.trim()).length;
}

export function filterWorkLogExtractionCandidates(
  candidates: readonly ProjectWorkLogExtractionCandidate[],
  filters: WorkLogPreviewFilters,
): ProjectWorkLogExtractionCandidate[] {
  const project = trimmedFilterValue(filters.project);
  if (!project) return [...candidates];
  return candidates.filter((candidate) => candidate.project === project);
}

export function filterWorkLogExtractionProposals(
  proposals: readonly ProjectWorkLogExtractionProposal[],
  filters: WorkLogPreviewFilters,
): ProjectWorkLogExtractionProposal[] {
  const date = trimmedFilterValue(filters.date);
  const project = trimmedFilterValue(filters.project);
  return proposals.filter((proposal) => {
    if (project && proposal.project !== project) return false;
    if (date && proposal.date !== date) return false;
    return true;
  });
}

export function workLogPreviewProjectSuggestions(
  candidates: readonly ProjectWorkLogExtractionCandidate[],
  proposals: readonly ProjectWorkLogExtractionProposal[],
): string[] {
  return storedFilterSuggestionValues([
    ...candidates.map((candidate) => candidate.project),
    ...proposals.map((proposal) => proposal.project),
  ]);
}

export function workLogProposalDateSuggestions(
  proposals: readonly ProjectWorkLogExtractionProposal[],
): string[] {
  return storedFilterSuggestionValues(proposals.map((proposal) => proposal.date ?? ""));
}
