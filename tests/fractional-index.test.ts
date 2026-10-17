import { describe, it, expect } from "vitest";
import { computeFractionalIndex, KanbanItem } from "../src/lib/fractional-index";

describe("Fractional Indexing", () => {
  it("assigns 1000 to first item in empty column", () => {
    const result = computeFractionalIndex([], "card-1");
    expect(result.newOrder).toBe(1000);
    expect(result.needsRebalance).toBe(false);
  });

  it("places card at top by dividing first card order by 2", () => {
    const column: KanbanItem[] = [
      { id: "c1", kanbanOrder: 1000 },
      { id: "c2", kanbanOrder: 2000 },
    ];
    const result = computeFractionalIndex(column, "new-card", "c1");
    expect(result.newOrder).toBe(500);
    expect(result.needsRebalance).toBe(false);
  });

  it("places card at bottom by adding 1000 to last card", () => {
    const column: KanbanItem[] = [
      { id: "c1", kanbanOrder: 1000 },
      { id: "c2", kanbanOrder: 2000 },
    ];
    const result = computeFractionalIndex(column, "new-card", undefined, "c2");
    expect(result.newOrder).toBe(3000);
    expect(result.needsRebalance).toBe(false);
  });

  it("places card between two cards using average", () => {
    const column: KanbanItem[] = [
      { id: "c1", kanbanOrder: 1000 },
      { id: "c2", kanbanOrder: 2000 },
    ];
    const result = computeFractionalIndex(column, "new-card", "c2", "c1");
    expect(result.newOrder).toBe(1500);
    expect(result.needsRebalance).toBe(false);
  });

  it("triggers rebalance when gap is smaller than 1e-6", () => {
    const column: KanbanItem[] = [
      { id: "c1", kanbanOrder: 1.0000001 },
      { id: "c2", kanbanOrder: 1.0000002 },
    ];
    const result = computeFractionalIndex(column, "new-card", "c2", "c1");
    expect(result.needsRebalance).toBe(true);
    expect(result.rebalancedItems).toBeDefined();
    expect(result.rebalancedItems?.length).toBe(3);
    expect(result.newOrder).toBe(2000);
  });
});
