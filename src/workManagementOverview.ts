import { storedFilterSuggestionValues } from "./storedFilters.ts";
import { workSourceFileRoleLabel, workSourceFileRolesInlineText } from "./workSourceFileRoles.ts";
import type {
  FrequencyItem,
  ProjectWorkLogCoverageResult,
  ProjectWorkLogExtractionItemsResult,
  ProjectWorkLogExtractionProposalsResult,
  ProjectWorkLogNormalizedItem,
  ProjectWorkLogNormalizedItemsResult,
  ProjectWorkStatusExportResult,
  ProjectWorkSummaryResult,
  ProjectWorkSummarySnapshotsResult,
} from "./types.ts";

export type WorkManagementOverviewSource =
  | "current_summary"
  | "snapshot"
  | "extraction_proposal"
  | "saved_extraction"
  | "normalized_row"
  | "status_export"
  | "progress_log";
export type WorkManagementOverviewPersistenceState = "persisted" | "live_only";
export type WorkManagementOverviewSort =
  | "date_desc"
  | "review_action_first"
  | "live_only_first"
  | "missing_confidence_first"
  | "low_confidence_first"
  | "work_items_desc";

export interface WorkManagementOverviewFilters {
  date: string;
  minConfidence: string;
  project: string;
  source: "" | WorkManagementOverviewSource;
  sourceRole: string;
  persistence: "" | WorkManagementOverviewPersistenceState;
}

export interface WorkManagementOverviewInput {
  summary?: ProjectWorkSummaryResult | null;
  snapshots?: ProjectWorkSummarySnapshotsResult | null;
  extractionProposals?: ProjectWorkLogExtractionProposalsResult | null;
  extractionItems?: ProjectWorkLogExtractionItemsResult | null;
  normalizedItems?: ProjectWorkLogNormalizedItemsResult | ProjectWorkLogNormalizedItemsInput | null;
  statusExport?: ProjectWorkStatusExportResult | null;
  coverage?: ProjectWorkLogCoverageResult | null;
}

interface ProjectWorkLogNormalizedItemsInput {
  items: ProjectWorkLogNormalizedItem[];
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
  normalized_row_count: number;
  status_export_count: number;
  progress_log_count: number;
  work_item_count: number;
  session_evidence_count: number;
  needs_session_evidence: boolean;
  needs_title_normalization: boolean;
  session_evidence_audit: string | null;
  same_project_same_date_session_count: number;
  same_project_other_session_dates: { text: string; count: number }[];
  same_project_other_session_date_count: number;
  nearest_same_project_other_session_date: string | null;
  nearest_same_project_other_session_distance_days: number | null;
  confidence_count: number;
  min_confidence: number | null;
  max_confidence: number | null;
  persistence_state: WorkManagementOverviewPersistenceState;
  latest_snapshot_created_at: string | null;
  latest_saved_extraction_at: string | null;
  latest_normalized_at: string | null;
  latest_title: string | null;
  source_file_roles: FrequencyItem[];
  latest_source_role: string | null;
}

export interface WorkManagementOverviewSourceRoleOption {
  label: string;
  value: string;
  count: number;
}

export interface WorkManagementOverview {
  row_count: number;
  project_count: number;
  date_count: number;
  current_summary_count: number;
  snapshot_summary_count: number;
  extraction_proposal_count: number;
  saved_extraction_count: number;
  normalized_row_count: number;
  status_export_row_count: number;
  status_export_total_row_count: number;
  session_matched_row_count: number;
  session_unresolved_row_count: number;
  title_normalization_row_count: number;
  progress_log_count: number;
  persisted_row_count: number;
  live_only_row_count: number;
  latest_snapshot_created_at: string | null;
  latest_saved_extraction_at: string | null;
  latest_normalized_at: string | null;
  rows: WorkManagementOverviewRow[];
}

export function emptyWorkManagementOverviewFilters(): WorkManagementOverviewFilters {
  return {
    date: "",
    minConfidence: "",
    persistence: "",
    project: "",
    source: "",
    sourceRole: "",
  };
}

export function activeWorkManagementOverviewFilterCount(
  filters: WorkManagementOverviewFilters,
): number {
  return [
    filters.date,
    filters.minConfidence,
    filters.persistence,
    filters.project,
    filters.source,
    filters.sourceRole,
  ].filter((value) => value.trim()).length;
}

const SOURCE_ORDER: WorkManagementOverviewSource[] = [
  "current_summary",
  "snapshot",
  "extraction_proposal",
  "saved_extraction",
  "normalized_row",
  "status_export",
  "progress_log",
];

const SOURCE_LABELS: Record<WorkManagementOverviewSource, string> = {
  current_summary: "현재요약",
  extraction_proposal: "추출제안",
  normalized_row: "정규화",
  progress_log: "진행로그",
  saved_extraction: "저장추출",
  snapshot: "스냅샷",
  status_export: "상태Export",
};

const SOURCE_ROLE_ORDER = [
  "handoff-log",
  "work-log",
  "project-status",
  "progress-log",
  "generated-report",
  "dated-work-log",
  "progress-artifact",
];

interface MutableWorkManagementOverviewRow extends WorkManagementOverviewRow {
  sourceSet: Set<WorkManagementOverviewSource>;
  sourceRoleCounts: Map<string, number>;
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
      row.latest_snapshot_created_at = latestTimestamp(row.latest_snapshot_created_at, snapshot.created_at);
      row.sourceSet.add("snapshot");
    }
  }

  for (const item of input.extractionItems?.items ?? []) {
    const row = upsertRow(rowsByKey, item.date, item.project);
    row.saved_extraction_count += 1;
    row.work_item_count = Math.max(row.work_item_count, row.saved_extraction_count);
    row.latest_title ??= item.title;
    row.latest_saved_extraction_at = latestTimestamp(row.latest_saved_extraction_at, item.saved_at);
    addRowConfidence(row, item.confidence);
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
    row.work_item_count = Math.max(row.work_item_count, row.extraction_proposal_count);
    row.latest_title ??= proposal.title;
    addRowConfidence(row, proposal.confidence);
    row.sourceSet.add("extraction_proposal");
  }

  for (const item of input.normalizedItems?.items ?? []) {
    const row = upsertRow(rowsByKey, item.date, item.project);
    row.normalized_row_count += 1;
    row.work_item_count = Math.max(row.work_item_count, item.work_item_count);
    row.session_evidence_count = Math.max(
      row.session_evidence_count,
      item.session_evidence_count,
    );
    row.latest_title ??= item.normalized_title;
    row.latest_normalized_at = latestTimestamp(row.latest_normalized_at, item.applied_at);
    addRowConfidence(row, item.confidence);
    row.sourceSet.add("normalized_row");
  }

  for (const item of input.statusExport?.rows ?? []) {
    const row = upsertRow(rowsByKey, item.date, item.project);
    row.status_export_count += 1;
    row.work_item_count = Math.max(row.work_item_count, item.work_item_count);
    row.session_evidence_count = Math.max(
      row.session_evidence_count,
      item.session_evidence_count,
    );
    row.latest_title ??= item.top_titles[0] ?? item.sample_evidence;
    row.needs_session_evidence = row.needs_session_evidence || item.needs_session_evidence;
    row.needs_title_normalization = row.needs_title_normalization || item.needs_title_normalization;
    row.session_evidence_audit ??= item.session_evidence_audit;
    row.same_project_same_date_session_count = Math.max(
      row.same_project_same_date_session_count,
      item.same_project_same_date_session_count,
    );
    if (item.same_project_other_session_date_count > row.same_project_other_session_date_count) {
      row.same_project_other_session_dates = item.same_project_other_session_dates;
      row.same_project_other_session_date_count = item.same_project_other_session_date_count;
    }
    if (item.nearest_same_project_other_session_date
      && (row.nearest_same_project_other_session_distance_days === null
        || item.nearest_same_project_other_session_distance_days === null
        || item.nearest_same_project_other_session_distance_days < row.nearest_same_project_other_session_distance_days)) {
      row.nearest_same_project_other_session_date = item.nearest_same_project_other_session_date;
      row.nearest_same_project_other_session_distance_days =
        item.nearest_same_project_other_session_distance_days;
    }
    addWorkManagementOverviewSourceRoles(row, item.source_file_roles);
    row.latest_source_role = item.latest_source_role;
    row.sourceSet.add("status_export");
  }

  for (const file of input.coverage?.files ?? []) {
    if (file.status !== "parsed" || !file.latest_date) continue;
    const row = upsertRow(rowsByKey, file.latest_date, file.project);
    row.progress_log_count += 1;
    row.work_item_count = Math.max(row.work_item_count, file.work_item_count);
    row.latest_title ??= file.latest_title;
    row.sourceSet.add("progress_log");
  }

  const rows = [...rowsByKey.values()]
    .map(({ sourceSet, sourceRoleCounts, ...row }) => ({
      ...row,
      persistence_state: row.snapshot_count > 0
          || row.saved_extraction_count > 0
          || row.normalized_row_count > 0
        ? "persisted" as const
        : "live_only" as const,
      source_file_roles: frequencyItemsFromCounts(sourceRoleCounts),
      sources: SOURCE_ORDER.filter((source) => sourceSet.has(source)),
    }))
    .sort((left, right) => {
      const dateOrder = right.date.localeCompare(left.date);
      if (dateOrder !== 0) return dateOrder;
      return left.project.localeCompare(right.project);
    });

  const statusExportRowCount = sumRows(rows, "status_export_count");
  const statusExportTotalRowCount = Math.max(
    statusExportRowCount,
    input.statusExport?.total_row_count ?? 0,
  );

  return {
    row_count: rows.length,
    project_count: new Set(rows.map((row) => row.project)).size,
    date_count: new Set(rows.map((row) => row.date)).size,
    current_summary_count: sumRows(rows, "current_summary_count"),
    snapshot_summary_count: sumRows(rows, "snapshot_count"),
    extraction_proposal_count: sumRows(rows, "extraction_proposal_count"),
    saved_extraction_count: sumRows(rows, "saved_extraction_count"),
    normalized_row_count: sumRows(rows, "normalized_row_count"),
    status_export_row_count: statusExportRowCount,
    status_export_total_row_count: statusExportTotalRowCount,
    session_matched_row_count: rows.filter((row) =>
      row.status_export_count > 0 && !row.needs_session_evidence
    ).length,
    session_unresolved_row_count: rows.filter((row) => row.needs_session_evidence).length,
    title_normalization_row_count: rows.filter((row) => row.needs_title_normalization).length,
    progress_log_count: sumRows(rows, "progress_log_count"),
    persisted_row_count: rows.filter((row) => row.persistence_state === "persisted").length,
    live_only_row_count: rows.filter((row) => row.persistence_state === "live_only").length,
    latest_snapshot_created_at: latestTimestampFromRows(rows, "latest_snapshot_created_at"),
    latest_saved_extraction_at: latestTimestampFromRows(rows, "latest_saved_extraction_at"),
    latest_normalized_at: latestTimestampFromRows(rows, "latest_normalized_at"),
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
    `정규화 ${overview.normalized_row_count.toLocaleString()}`,
    `상태행 ${overview.status_export_row_count.toLocaleString()}/${overview.status_export_total_row_count.toLocaleString()}`,
    `세션매칭 ${overview.session_matched_row_count.toLocaleString()}`,
    `세션미해결 ${overview.session_unresolved_row_count.toLocaleString()}`,
    `제목정규화 ${overview.title_normalization_row_count.toLocaleString()}`,
    `진행로그 ${overview.progress_log_count.toLocaleString()}`,
    `저장관리 ${overview.persisted_row_count.toLocaleString()}`,
    `라이브만 ${overview.live_only_row_count.toLocaleString()}`,
    `최신스냅샷 ${overview.latest_snapshot_created_at ?? "없음"}`,
    `최신저장추출 ${overview.latest_saved_extraction_at ?? "없음"}`,
    `최신정규화 ${overview.latest_normalized_at ?? "없음"}`,
  ].join(" · ");
}

export function filterWorkManagementOverviewRows(
  rows: readonly WorkManagementOverviewRow[],
  filters: WorkManagementOverviewFilters,
): WorkManagementOverviewRow[] {
  const date = filters.date.trim();
  const minConfidence = normalizedConfidenceFilter(filters.minConfidence);
  const project = filters.project.trim();
  const source = filters.source.trim();
  const sourceRole = filters.sourceRole.trim();
  const persistence = filters.persistence.trim();
  return rows.filter((row) => {
    if (date && row.date !== date) return false;
    if (project && row.project !== project) return false;
    if (source && !row.sources.includes(source as WorkManagementOverviewSource)) return false;
    if (sourceRole && !row.source_file_roles.some((role) => role.text === sourceRole)) return false;
    if (persistence && row.persistence_state !== persistence) return false;
    if (minConfidence !== null) {
      if (row.min_confidence === null || row.min_confidence < minConfidence) return false;
    }
    return true;
  });
}

export function sortWorkManagementOverviewRows(
  rows: readonly WorkManagementOverviewRow[],
  sort: WorkManagementOverviewSort,
): WorkManagementOverviewRow[] {
  const next = [...rows];
  next.sort((left, right) => {
    if (sort === "review_action_first") {
      const actionOrder = reviewActionSortValue(left) - reviewActionSortValue(right);
      if (actionOrder !== 0) return actionOrder;
    }
    if (sort === "live_only_first") {
      const persistenceOrder = persistenceSortValue(left) - persistenceSortValue(right);
      if (persistenceOrder !== 0) return persistenceOrder;
    }
    if (sort === "missing_confidence_first") {
      const confidenceOrder = missingConfidenceSortValue(left) - missingConfidenceSortValue(right);
      if (confidenceOrder !== 0) return confidenceOrder;
    }
    if (sort === "low_confidence_first") {
      const confidenceOrder = confidenceSortValue(left) - confidenceSortValue(right);
      if (confidenceOrder !== 0) return confidenceOrder;
    }
    if (sort === "work_items_desc") {
      const workItemOrder = right.work_item_count - left.work_item_count;
      if (workItemOrder !== 0) return workItemOrder;
    }
    return compareWorkManagementRowsByDate(left, right);
  });
  return next;
}

export function workManagementOverviewDateSuggestions(
  rows: readonly WorkManagementOverviewRow[],
): string[] {
  return storedFilterSuggestionValues(rows.map((row) => row.date));
}

export function workManagementOverviewProjectSuggestions(
  rows: readonly WorkManagementOverviewRow[],
): string[] {
  return storedFilterSuggestionValues(rows.map((row) => row.project));
}

export function workManagementOverviewSourceRoleOptions(
  rows: readonly WorkManagementOverviewRow[],
  selectedRole = "",
): WorkManagementOverviewSourceRoleOption[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const role of row.source_file_roles) {
      counts.set(role.text, (counts.get(role.text) ?? 0) + role.count);
    }
  }
  const selected = selectedRole.trim();
  if (selected && !counts.has(selected)) {
    counts.set(selected, 0);
  }
  return [...counts.entries()]
    .sort(([leftRole], [rightRole]) => compareSourceRoles(leftRole, rightRole))
    .map(([role, count]) => ({
      count,
      label: `${workSourceFileRoleLabel(role)} ${count.toLocaleString()}개`,
      value: role,
    }));
}

export function workManagementOverviewFilterMetaText(
  resultCount: number,
  totalCount: number,
  filters: WorkManagementOverviewFilters,
): string {
  const activeFilterCount = activeWorkManagementOverviewFilterCount(filters);
  const parts = [
    activeFilterCount > 0
      ? `관리 감사 필터 ${activeFilterCount.toLocaleString()}개`
      : "관리 감사 필터 없음",
    ...workManagementOverviewFilterConditionText(filters),
    `결과 ${resultCount.toLocaleString()} / ${totalCount.toLocaleString()}개`,
  ];
  return parts.join(" · ");
}

function workManagementOverviewFilterConditionText(
  filters: WorkManagementOverviewFilters,
): string[] {
  const conditions = [];
  const date = filters.date.trim();
  if (date) conditions.push(`날짜 ${date}`);
  const project = filters.project.trim();
  if (project) conditions.push(`프로젝트 ${project}`);
  const source = filters.source.trim();
  if (source) {
    conditions.push(`근거 ${SOURCE_LABELS[source as WorkManagementOverviewSource] ?? source}`);
  }
  const sourceRole = filters.sourceRole.trim();
  if (sourceRole) conditions.push(`로그 유형 ${workSourceFileRoleLabel(sourceRole)}`);
  const persistence = filters.persistence.trim();
  if (persistence) {
    conditions.push(
      `저장 상태 ${persistence === "persisted" ? "저장관리" : persistence === "live_only" ? "라이브만" : persistence}`,
    );
  }
  const minConfidence = normalizedConfidenceFilter(filters.minConfidence);
  if (minConfidence !== null) conditions.push(`confidence ${minConfidence.toFixed(2)} 이상`);
  return conditions.length ? [`조건 ${conditions.join(" · ")}`] : [];
}

export function workManagementOverviewSourceText(row: WorkManagementOverviewRow): string {
  return row.sources.map((source) => SOURCE_LABELS[source]).join(" · ");
}

export function workManagementOverviewSourceRoleText(
  row: WorkManagementOverviewRow,
): string | null {
  if (!row.source_file_roles.length) return null;
  const parts = [`로그 유형 · ${workSourceFileRolesInlineText(row.source_file_roles)}`];
  if (row.latest_source_role) {
    parts.push(`최근 ${workSourceFileRoleLabel(row.latest_source_role)}`);
  }
  return parts.join(" · ");
}

export function workManagementOverviewConfidenceText(row: WorkManagementOverviewRow): string {
  if (row.confidence_count === 0 || row.min_confidence === null || row.max_confidence === null) {
    return "confidence 없음";
  }
  if (row.min_confidence === row.max_confidence) {
    return `confidence ${row.min_confidence.toFixed(2)}`;
  }
  return `confidence ${row.min_confidence.toFixed(2)}-${row.max_confidence.toFixed(2)}`;
}

export function workManagementOverviewPersistenceText(row: WorkManagementOverviewRow): string {
  if (row.persistence_state === "live_only") {
    return "라이브만 · 저장근거 없음";
  }
  const parts = ["저장관리"];
  if (row.latest_snapshot_created_at) {
    parts.push(`최신 스냅샷 ${row.latest_snapshot_created_at}`);
  }
  if (row.latest_saved_extraction_at) {
    parts.push(`최신 저장추출 ${row.latest_saved_extraction_at}`);
  }
  if (row.latest_normalized_at) {
    parts.push(`최신 정규화 ${row.latest_normalized_at}`);
  }
  return parts.join(" · ");
}

export function workManagementOverviewSessionText(row: WorkManagementOverviewRow): string {
  const parts = [`세션 근거 ${row.session_evidence_count.toLocaleString()}건`];
  if (row.status_export_count === 0) {
    parts.push("상태 export 미확인");
  } else if (row.needs_session_evidence) {
    parts.push(
      row.session_evidence_audit === "unresolved-after-full-index"
        ? "전체 인덱스 미해결"
        : "근거 limit 영향",
    );
    const sessionHint = workManagementOverviewSessionHintText(row);
    if (sessionHint) {
      parts.push(sessionHint);
    }
  } else {
    parts.push("세션 매칭");
  }
  if (row.needs_title_normalization) {
    parts.push("제목 정규화 필요");
  }
  return parts.join(" · ");
}

export function workManagementOverviewNextActionText(row: WorkManagementOverviewRow): string {
  if (row.status_export_count === 0) {
    return "다음 조치 · 상태 Export 로드로 세션 검증";
  }
  if (row.needs_title_normalization) {
    const sessionFollowUp = row.needs_session_evidence
      ? workManagementOverviewSessionFollowUpText(row)
      : null;
    return sessionFollowUp
      ? `다음 조치 · 제목 정규화 큐 검토 후 ${sessionFollowUp}`
      : "다음 조치 · 제목 정규화 큐 검토";
  }
  if (row.needs_session_evidence) {
    if (row.session_evidence_audit !== "unresolved-after-full-index") {
      return "다음 조치 · 세션 백필 후 재검증 · 근거 limit 영향";
    }
    const sessionFollowUp = workManagementOverviewSessionFollowUpText(row);
    if (sessionFollowUp) return `다음 조치 · ${sessionFollowUp}`;
    return "다음 조치 · 세션근거 큐 검토 · 전체 인덱스 미해결";
  }
  if (row.persistence_state === "live_only") {
    return row.progress_log_count > 0
      ? "다음 조치 · 진행로그 추출 저장 또는 라이브 고정 저장"
      : "다음 조치 · 라이브 고정 저장";
  }
  if (row.confidence_count === 0) {
    return "다음 조치 · AI 추출 또는 정규화로 confidence 확보";
  }
  if (row.min_confidence !== null && row.min_confidence < 0.75) {
    return "다음 조치 · 낮은 confidence row 재검토";
  }
  if (row.normalized_row_count === 0 && (row.saved_extraction_count > 0 || row.extraction_proposal_count > 0)) {
    return "다음 조치 · AI 제목 정규화 검토";
  }
  return "다음 조치 · 관리 완료 · 정기 재검증";
}

function workManagementOverviewSessionFollowUpText(row: WorkManagementOverviewRow): string | null {
  if (row.same_project_same_date_session_count > 0) {
    return `같은 날짜 세션 후보 ${row.same_project_same_date_session_count.toLocaleString()}건 수동 연결 검토`;
  }
  if (!row.nearest_same_project_other_session_date) {
    return null;
  }
  const distanceText = row.nearest_same_project_other_session_distance_days === null
    ? ""
    : ` · ${row.nearest_same_project_other_session_distance_days.toLocaleString()}일 차이`;
  const priorityText = row.nearest_same_project_other_session_distance_days !== null
      && row.nearest_same_project_other_session_distance_days <= 1
    ? "인접 날짜 세션 후보 검토"
    : "먼 날짜 세션 후보 낮은 우선순위 검토";
  return `${priorityText} · ${row.nearest_same_project_other_session_date}${distanceText}`;
}

function workManagementOverviewSessionHintText(row: WorkManagementOverviewRow): string | null {
  if (row.same_project_same_date_session_count > 0) {
    return `같은 날짜 후보 ${row.same_project_same_date_session_count.toLocaleString()}건`;
  }
  if (!row.nearest_same_project_other_session_date) {
    return null;
  }
  const distanceText = row.nearest_same_project_other_session_distance_days === null
    ? ""
    : ` · ${row.nearest_same_project_other_session_distance_days.toLocaleString()}일 차이`;
  return `가장 가까운 같은 프로젝트 세션 ${row.nearest_same_project_other_session_date}${distanceText}`;
}

export function workManagementOverviewDurabilityWarningText(
  overview: WorkManagementOverview,
): string | null {
  if (overview.row_count === 0 || overview.live_only_row_count <= overview.persisted_row_count) {
    return null;
  }
  return [
    `라이브만 ${overview.live_only_row_count.toLocaleString()}개가`,
    `저장관리 ${overview.persisted_row_count.toLocaleString()}개보다 많습니다.`,
    "스냅샷 저장 또는 AI 추출 저장으로 관리 상태를 고정하세요.",
  ].join(" ");
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
    sourceRoleCounts: new Map(),
    current_summary_count: 0,
    snapshot_count: 0,
    extraction_proposal_count: 0,
    saved_extraction_count: 0,
    normalized_row_count: 0,
    status_export_count: 0,
    progress_log_count: 0,
    work_item_count: 0,
    session_evidence_count: 0,
    needs_session_evidence: false,
    needs_title_normalization: false,
    session_evidence_audit: null,
    same_project_same_date_session_count: 0,
    same_project_other_session_dates: [],
    same_project_other_session_date_count: 0,
    nearest_same_project_other_session_date: null,
    nearest_same_project_other_session_distance_days: null,
    confidence_count: 0,
    min_confidence: null,
    max_confidence: null,
    persistence_state: "live_only",
    latest_snapshot_created_at: null,
    latest_saved_extraction_at: null,
    latest_normalized_at: null,
    latest_title: null,
    source_file_roles: [],
    latest_source_role: null,
  };
  rowsByKey.set(key, row);
  return row;
}

function addRowConfidence(row: MutableWorkManagementOverviewRow, confidence: number): void {
  if (!Number.isFinite(confidence)) return;
  row.confidence_count += 1;
  row.min_confidence = row.min_confidence === null
    ? confidence
    : Math.min(row.min_confidence, confidence);
  row.max_confidence = row.max_confidence === null
    ? confidence
    : Math.max(row.max_confidence, confidence);
}

function addWorkManagementOverviewSourceRoles(
  row: MutableWorkManagementOverviewRow,
  roles: readonly FrequencyItem[],
): void {
  for (const role of roles) {
    row.sourceRoleCounts.set(
      role.text,
      (row.sourceRoleCounts.get(role.text) ?? 0) + role.count,
    );
  }
}

function frequencyItemsFromCounts(counts: ReadonlyMap<string, number>): FrequencyItem[] {
  return [...counts.entries()].map(([text, count]) => ({ text, count }));
}

function normalizedConfidenceFilter(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareWorkManagementRowsByDate(
  left: WorkManagementOverviewRow,
  right: WorkManagementOverviewRow,
): number {
  const dateOrder = right.date.localeCompare(left.date);
  if (dateOrder !== 0) return dateOrder;
  return left.project.localeCompare(right.project);
}

function compareSourceRoles(left: string, right: string): number {
  const leftIndex = SOURCE_ROLE_ORDER.indexOf(left);
  const rightIndex = SOURCE_ROLE_ORDER.indexOf(right);
  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }
  return workSourceFileRoleLabel(left).localeCompare(workSourceFileRoleLabel(right));
}

function persistenceSortValue(row: WorkManagementOverviewRow): number {
  return row.persistence_state === "live_only" ? 0 : 1;
}

function missingConfidenceSortValue(row: WorkManagementOverviewRow): number {
  return row.confidence_count === 0 ? 0 : 1;
}

function confidenceSortValue(row: WorkManagementOverviewRow): number {
  return row.min_confidence ?? Number.POSITIVE_INFINITY;
}

function reviewActionSortValue(row: WorkManagementOverviewRow): number {
  if (row.needs_session_evidence && row.session_evidence_audit === "unresolved-after-full-index") return 0;
  if (row.needs_title_normalization) return 1;
  if (row.needs_session_evidence) return 2;
  if (row.persistence_state === "live_only") return 3;
  if (row.confidence_count === 0) return 4;
  if (row.min_confidence !== null && row.min_confidence < 0.75) return 5;
  if (row.normalized_row_count === 0 && (row.saved_extraction_count > 0 || row.extraction_proposal_count > 0)) {
    return 6;
  }
  if (row.status_export_count === 0) return 7;
  return 8;
}

function sumRows(
  rows: WorkManagementOverviewRow[],
  field:
    | "current_summary_count"
    | "snapshot_count"
    | "extraction_proposal_count"
    | "saved_extraction_count"
    | "normalized_row_count"
    | "status_export_count"
    | "progress_log_count",
): number {
  return rows.reduce((total, row) => total + row[field], 0);
}

function latestTimestamp(current: string | null, candidate: string | null): string | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate > current ? candidate : current;
}

function latestTimestampFromRows(
  rows: WorkManagementOverviewRow[],
  field: "latest_snapshot_created_at" | "latest_saved_extraction_at" | "latest_normalized_at",
): string | null {
  return rows.reduce<string | null>((latest, row) => latestTimestamp(latest, row[field]), null);
}
