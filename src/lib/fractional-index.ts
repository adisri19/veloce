export interface KanbanItem {
  id: string;
  kanbanOrder: number;
}

export interface FractionalPositionResult {
  newOrder: number;
  needsRebalance: boolean;
  rebalancedItems?: { id: string; kanbanOrder: number }[];
}

const MIN_GAP = 1e-6;

/**
 * Computes the new fractional order for moving a card in a Kanban column.
 * Column items must be sorted in ascending order of kanbanOrder.
 */
export function computeFractionalIndex(
  itemsInColumn: KanbanItem[],
  movingItemId: string,
  beforeId?: string,
  afterId?: string
): FractionalPositionResult {
  // Filter out the moving item itself
  const column = itemsInColumn.filter((item) => item.id !== movingItemId);

  // 1. Empty column
  if (column.length === 0) {
    return { newOrder: 1000, needsRebalance: false };
  }

  let prevOrder: number | null = null;
  let nextOrder: number | null = null;

  if (afterId && beforeId) {
    const afterIdx = column.findIndex((c) => c.id === afterId);
    const beforeIdx = column.findIndex((c) => c.id === beforeId);
    if (afterIdx !== -1 && beforeIdx !== -1) {
      prevOrder = column[afterIdx]?.kanbanOrder ?? null;
      nextOrder = column[beforeIdx]?.kanbanOrder ?? null;
    }
  } else if (beforeId) {
    // Placed before `beforeId`
    const beforeIdx = column.findIndex((c) => c.id === beforeId);
    if (beforeIdx !== -1) {
      nextOrder = column[beforeIdx]?.kanbanOrder ?? null;
      prevOrder = beforeIdx > 0 ? (column[beforeIdx - 1]?.kanbanOrder ?? null) : null;
    }
  } else if (afterId) {
    // Placed after `afterId`
    const afterIdx = column.findIndex((c) => c.id === afterId);
    if (afterIdx !== -1) {
      prevOrder = column[afterIdx]?.kanbanOrder ?? null;
      nextOrder = afterIdx < column.length - 1 ? (column[afterIdx + 1]?.kanbanOrder ?? null) : null;
    }
  }

  // Dropped at top of column
  if (prevOrder === null && nextOrder !== null) {
    const computed = nextOrder / 2;
    if (computed < MIN_GAP || !Number.isFinite(computed)) {
      return rebalanceColumn(column, movingItemId, 0);
    }
    return { newOrder: computed, needsRebalance: false };
  }

  // Dropped at bottom of column
  if (prevOrder !== null && nextOrder === null) {
    const computed = prevOrder + 1000;
    if (!Number.isFinite(computed)) {
      return rebalanceColumn(column, movingItemId, column.length);
    }
    return { newOrder: computed, needsRebalance: false };
  }

  // Dropped between two cards
  if (prevOrder !== null && nextOrder !== null) {
    const gap = nextOrder - prevOrder;
    if (gap <= MIN_GAP || !Number.isFinite(gap)) {
      const idx = column.findIndex((c) => c.id === beforeId);
      return rebalanceColumn(column, movingItemId, idx === -1 ? column.length : idx);
    }
    const computed = (prevOrder + nextOrder) / 2;
    return { newOrder: computed, needsRebalance: false };
  }

  // Default fallback: place at bottom
  const lastOrder = column[column.length - 1]?.kanbanOrder ?? 0;
  return { newOrder: lastOrder + 1000, needsRebalance: false };
}

function rebalanceColumn(
  existingColumn: KanbanItem[],
  movingItemId: string,
  insertIndex: number
): FractionalPositionResult {
  const combined = [...existingColumn];
  combined.splice(insertIndex, 0, { id: movingItemId, kanbanOrder: 0 });

  const rebalanced: { id: string; kanbanOrder: number }[] = [];
  let newOrder = 1000;

  for (let i = 0; i < combined.length; i++) {
    const order = (i + 1) * 1000;
    const item = combined[i]!;
    if (item.id === movingItemId) {
      newOrder = order;
    }
    rebalanced.push({ id: item.id, kanbanOrder: order });
  }

  return {
    newOrder,
    needsRebalance: true,
    rebalancedItems: rebalanced,
  };
}
