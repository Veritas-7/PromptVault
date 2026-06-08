import type { ProjectWorkLogExtractionItem } from "./types.ts";

export interface WorkLogExtractionItemGroup {
  group_id: string;
  date: string;
  project: string;
  item_count: number;
  items: ProjectWorkLogExtractionItem[];
}

export function groupWorkLogExtractionItemsByProjectDate(
  items: readonly ProjectWorkLogExtractionItem[],
): WorkLogExtractionItemGroup[] {
  const groups: WorkLogExtractionItemGroup[] = [];
  const groupIndexes = new Map<string, number>();

  for (const item of items) {
    const groupId = `${item.date}::${item.project}`;
    const existingIndex = groupIndexes.get(groupId);
    if (existingIndex !== undefined) {
      const group = groups[existingIndex];
      group.items.push(item);
      group.item_count = group.items.length;
      continue;
    }

    groupIndexes.set(groupId, groups.length);
    groups.push({
      group_id: groupId,
      date: item.date,
      project: item.project,
      item_count: 1,
      items: [item],
    });
  }

  return groups;
}
