import type {
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshotsResult,
} from "./types.ts";

export type WorkManagementOverviewSource =
  | "current_summary"
  | "snapshot"
  | "extraction_proposal"
  | "saved_extraction"
  | "progress_log";

export interface WorkManagementOverviewInput {
  summary?: ProjectWorkSummaryResult | null;
  snapshots?: ProjectWorkSummarySnapshotsResult | null;
  extractionProposals?: ProjectWorkLogExtractionProposalsResult | null;
  extractionItems?: ProjectWorkLogExtractionItemsResult | null;
  coverage?: ProjectWorkLogCoverageResult | null;
}

export interface WorkManagementOverviewRow {
  key: string;
  date: string;
  project: string;
  sources: WorkManagementOverviewSource[];
  current_summary_count: number;
  snapshot_count: number;
  extraction_proposal_count: number;
  saved_extraction_count: number;
  progress_log_count: number;
  work_item_count: number;
  session_evidence_count: number;
  latest_title: string | null;
}

export interface WorkManagementOverview {
  row_count: number;
  project_count: number;
  date_count: number;
  current_summary_count: number;
  snapshot_summary_count: number;
  extraction_proposal_count: number;
  saved_extraction_count: number;
  progress_log_count: number;
  rows: WorkManagementOverviewRow[];
}

const SOURCE_ORDER: WorkManagementOverviewSource[] = [
  "current_summary",
  "snapshot",
  "extraction_proposal",
  "saved_extraction",
  "progress_log",
];

const SOURCE_LABELS: Record<WorkManagementOverviewSource, string> = {
  current_summary: "현재요약",
  extraction_proposal: "추출제안",
  progress_log: "진행로그",
  saved_extraction: "저장추출",
  snapshot: "스냅샷",
};

interface MutableWorkManagementOverviewRow extends WorkManagementOverviewRow {
  sourceSet: Set<WorkManagementOverviewSource>;
}

export function buildWorkManagementOverview(
  input: WorkManagementOverviewInput,
): WorkManagementOverview {
  const rowsByKey = new Map<string, MutableWorkManagementOverviewRow>();

  for (const summary of input.summary?.summaries ?? []) {
    const row = upsertRow(rowsByKey, summary.date, summary.project);
    row.current_summary_count += 1;
    row.work_item_count = Math.max(row.work_item_count, summary.work_item_count);
    row.session_evidence_count = Math.max(row.session_evidence_count, summary.session_evidence_count);
    row.latest_title ??= summary.headline;
    row.sourceSet.add("current_summary");
  }

  for (const snapshot of input.snapshots?.snapshots ?? []) {
    for (const summary of snapshot.summaries) {
      const row = upsertRow(rowsByKey, summary.date, summary.project);
      row.snapshot_count += 1;
      row.work_item_count = Math.max(row.work_item_count, summary.work_item_count);
      row.session_evidence_count = Math.max(row.session_evidence_count, summary.session_evidence_count);
      row.latest_title ??= summary.headline;
      row.sourceSet.add("snapshot");
    }
  }

  for (const item of input.extractionItems?.items ?? []) {
    const row = upsertRow(rowsByKey, item.date, item.project);
    row.saved_extraction_count += 1;
    row.latest_title ??= item.title;
    row.sourceSet.add("saved_extraction");
  }

  const savedExtractionCandidateIds = new Set(
    (input.extractionItems?.items ?? []).map((item) => item.candidate_id),
  );
  for (const proposal of input.extractionProposals?.proposals ?? []) {
    if (savedExtractionCandidateIds.has(proposal.candidate_id)) continue;
    if (!proposal.accepted || !proposal.date) continue;
    const row = upsertRow(rowsByKey, proposal.date, proposal.project);
    row.extraction_proposal_count += 1;
    row.work_item_count = Math.max(row.work_item_count, 1);
    row.latest_title ??= proposal.title;
    row.sourceSet.add("extraction_proposal");
  }

  for (const file of input.coverage?.files ?? []) {
    if (file.status !== "parsed" || !file.latest_date) continue;
    const row = upsertRow(rowsByKey, file.latest_date, file.project);
    row.progress_log_count += 1;
    row.latest_title ??= file.latest_title;
    row.sourceSet.add("progress_log");
  }

  const rows = [...rowsByKey.values()]
    .map(({ sourceSet, ...row }) => ({
      ...row,
      sources: SOURCE_ORDER.filter((source) => sourceSet.has(source)),
    }))
    .sort((left, right) => {
      const dateOrder = right.date.localeCompare(left.date);
      if (dateOrder !== 0) return dateOrder;
      return left.project.localeCompare(right.project);
    });

  return {
    row_count: rows.length,
    project_count: new Set(rows.map((row) => row.project)).size,
    date_count: new Set(rows.map((row) => row.date)).size,
    current_summary_count: sumRows(rows, "current_summary_count"),
    snapshot_summary_count: sumRows(rows, "snapshot_count"),
    extraction_proposal_count: sumRows(rows, "extraction_proposal_count"),
    saved_extraction_count: sumRows(rows, "saved_extraction_count"),
    progress_log_count: sumRows(rows, "progress_log_count"),
    rows,
  };
}

export function workManagementOverviewMetaText(overview: WorkManagementOverview): string {
  return [
    `관리 ${overview.row_count.toLocaleString()}개`,
    `${overview.project_count.toLocaleString()}개 프로젝트`,
    `${overview.date_count.toLocaleString()}일`,
    `현재요약 ${overview.current_summary_count.toLocaleString()}`,
    `스냅샷 ${overview.snapshot_summary_count.toLocaleString()}`,
    `추출제안 ${overview.extraction_proposal_count.toLocaleString()}`,
    `저장추출 ${overview.saved_extraction_count.toLocaleString()}`,
    `진행로그 ${overview.progress_log_count.toLocaleString()}`,
  ].join(" · ");
}

export function workManagementOverviewSourceText(row: WorkManagementOverviewRow): string {
  return row.sources.map((source) => SOURCE_LABELS[source]).join(" · ");
}

function upsertRow(
  rowsByKey: Map<string, MutableWorkManagementOverviewRow>,
  date: string,
  project: string,
): MutableWorkManagementOverviewRow {
  const key = `${date}::${project}`;
  const existing = rowsByKey.get(key);
  if (existing) return existing;

  const row: MutableWorkManagementOverviewRow = {
    key,
    date,
    project,
    sources: [],
    sourceSet: new Set(),
    current_summary_count: 0,
    snapshot_count: 0,
    extraction_proposal_count: 0,
    saved_extraction_count: 0,
    progress_log_count: 0,
    work_item_count: 0,
    session_evidence_count: 0,
    latest_title: null,
  };
  rowsByKey.set(key, row);
  return row;
}

function sumRows(
  rows: WorkManagementOverviewRow[],
  field:
    | "current_summary_count"
    | "snapshot_count"
    | "extraction_proposal_count"
    | "saved_extraction_count"
    | "progress_log_count",
): number {
  return rows.reduce((total, row) => total + row[field], 0);
}
