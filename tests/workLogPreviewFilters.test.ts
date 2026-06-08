import assert from "node:assert/strict";
import test from "node:test";
import {
  activeWorkLogPreviewFilterCount,
  emptyWorkLogPreviewFilters,
  filterWorkLogExtractionCandidates,
  filterWorkLogExtractionProposals,
  workLogPreviewProjectSuggestions,
  workLogProposalDateSuggestions,
  type WorkLogPreviewFilters,
} from "../src/workLogPreviewFilters.ts";
import type {
  ProjectWorkLogExtractionCandidate,
  ProjectWorkLogExtractionProposal,
} from "../src/types.ts";

const emptyFilters: WorkLogPreviewFilters = {
  date: "",
  project: "",
};

function candidate(
  overrides: Partial<ProjectWorkLogExtractionCandidate> = {},
): ProjectWorkLogExtractionCandidate {
  return {
    candidate_id: "candidate-carevault",
    project: "CareVault",
    source_path: "/tmp/CareVault/workingd.md",
    source_file: "workingd.md",
    reason: "unparsed_progress_log",
    excerpt: "2026-06-09: Verify source sentence.",
    line_count: 3,
    char_count: 120,
    risk_flags: [],
    modified_at: null,
    ...overrides,
  };
}

function proposal(
  overrides: Partial<ProjectWorkLogExtractionProposal> = {},
): ProjectWorkLogExtractionProposal {
  return {
    candidate_id: "proposal-carevault",
    project: "CareVault",
    source_path: "/tmp/CareVault/workingd.md",
    source_file: "workingd.md",
    date: "2026-06-09",
    title: "Verify source sentence",
    status: "proposed",
    evidence: "2026-06-09: Verify source sentence.",
    confidence: 0.78,
    accepted: true,
    rejection_reason: null,
    ...overrides,
  };
}

test("empty work log preview filters expose the full filter shape", () => {
  assert.deepEqual(emptyWorkLogPreviewFilters(), emptyFilters);
});

test("active work log preview filter count ignores whitespace", () => {
  assert.equal(activeWorkLogPreviewFilterCount(emptyFilters), 0);
  assert.equal(activeWorkLogPreviewFilterCount({ date: "2026-06-09", project: " " }), 1);
  assert.equal(activeWorkLogPreviewFilterCount({ date: "2026-06-09", project: "CareVault" }), 2);
});

test("work log candidate preview filters by project without requiring proposal dates", () => {
  const candidates = [
    candidate({ candidate_id: "candidate-carevault", project: "CareVault" }),
    candidate({ candidate_id: "candidate-promptvault", project: "PromptVault" }),
  ];

  assert.deepEqual(
    filterWorkLogExtractionCandidates(candidates, { date: "2026-06-09", project: " CareVault " })
      .map((item) => item.candidate_id),
    ["candidate-carevault"],
  );
});

test("work log extraction proposal preview filters by project and date", () => {
  const proposals = [
    proposal({ candidate_id: "proposal-carevault-today", project: "CareVault", date: "2026-06-09" }),
    proposal({ candidate_id: "proposal-carevault-old", project: "CareVault", date: "2026-06-08" }),
    proposal({ candidate_id: "proposal-promptvault", project: "PromptVault", date: "2026-06-09" }),
    proposal({ candidate_id: "proposal-undated", project: "CareVault", date: null }),
  ];

  assert.deepEqual(
    filterWorkLogExtractionProposals(proposals, { date: " 2026-06-09 ", project: "CareVault" })
      .map((item) => item.candidate_id),
    ["proposal-carevault-today"],
  );
});

test("work log preview suggestions combine projects and omit undated proposals", () => {
  assert.deepEqual(
    workLogPreviewProjectSuggestions([
      candidate({ project: " CareVault " }),
      candidate({ project: "PromptVault" }),
    ], [
      proposal({ project: "CareVault" }),
      proposal({ project: "RepoTutorStudio" }),
    ]),
    ["CareVault", "PromptVault", "RepoTutorStudio"],
  );
  assert.deepEqual(
    workLogProposalDateSuggestions([
      proposal({ date: "2026-06-09" }),
      proposal({ date: null }),
      proposal({ date: "2026-06-04" }),
      proposal({ date: "2026-06-09" }),
    ]),
    ["2026-06-04", "2026-06-09"],
  );
});
