/**
 * Unit tests for quest status computation utility
 */

import { describe, it, expect } from "vitest";
import {
  computeQuestStatus,
  computeObjectiveProgress,
  shouldAutoCompleteQuest,
  wouldObjectiveChangeQuestStatus,
  isObjectiveComplete,
  type ObjectiveWithProgress,
} from "../../apps/web/src/lib/quest-status";

describe("computeObjectiveProgress", () => {
  it("returns zeros for empty objectives array", () => {
    const result = computeObjectiveProgress([]);
    expect(result).toEqual({
      total: 0,
      completed: 0,
      requiredTotal: 0,
      requiredCompleted: 0,
    });
  });

  it("counts all objectives as required when none are optional", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
      { id: "3", optional: false, progress: [] },
    ];
    const result = computeObjectiveProgress(objectives);
    expect(result).toEqual({
      total: 3,
      completed: 1,
      requiredTotal: 3,
      requiredCompleted: 1,
    });
  });

  it("separates optional and required objectives", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: true, progress: [{ completed: true }] },
      { id: "3", optional: false, progress: [{ completed: false }] },
      { id: "4", optional: true, progress: [] },
    ];
    const result = computeObjectiveProgress(objectives);
    expect(result).toEqual({
      total: 4,
      completed: 2,
      requiredTotal: 2,
      requiredCompleted: 1,
    });
  });

  it("handles objectives with null progress", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: null },
      { id: "2", optional: false, progress: undefined },
    ];
    const result = computeObjectiveProgress(objectives);
    expect(result).toEqual({
      total: 2,
      completed: 0,
      requiredTotal: 2,
      requiredCompleted: 0,
    });
  });
});

describe("computeQuestStatus", () => {
  it("returns LOCKED when stored status is LOCKED", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
    ];
    const result = computeQuestStatus("LOCKED", objectives);
    expect(result).toBe("LOCKED");
  });

  it("returns stored status when no objectives", () => {
    expect(computeQuestStatus("AVAILABLE", [])).toBe("AVAILABLE");
    expect(computeQuestStatus("IN_PROGRESS", [])).toBe("IN_PROGRESS");
    expect(computeQuestStatus("COMPLETED", [])).toBe("COMPLETED");
  });

  it("returns default status when no objectives and null stored status", () => {
    expect(computeQuestStatus(null, [])).toBe("AVAILABLE");
    expect(computeQuestStatus(null, [], "LOCKED")).toBe("LOCKED");
  });

  it("returns COMPLETED when all required objectives complete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: true }] },
      { id: "3", optional: true, progress: [{ completed: false }] },
    ];
    const result = computeQuestStatus("AVAILABLE", objectives);
    expect(result).toBe("COMPLETED");
  });

  it("returns IN_PROGRESS when some required objectives complete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
    ];
    const result = computeQuestStatus("AVAILABLE", objectives);
    expect(result).toBe("IN_PROGRESS");
  });

  it("returns stored status when no objectives complete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: false }] },
      { id: "2", optional: false, progress: [] },
    ];
    expect(computeQuestStatus("AVAILABLE", objectives)).toBe("AVAILABLE");
    expect(computeQuestStatus("IN_PROGRESS", objectives)).toBe("IN_PROGRESS");
  });

  it("treats all objectives as required when none are marked optional", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: true }] },
    ];
    const result = computeQuestStatus("AVAILABLE", objectives);
    expect(result).toBe("COMPLETED");
  });

  it("ignores optional objectives for completion", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: true, progress: [{ completed: false }] },
    ];
    const result = computeQuestStatus("AVAILABLE", objectives);
    expect(result).toBe("COMPLETED");
  });

  it("returns default when null stored status and no progress", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [] },
    ];
    expect(computeQuestStatus(null, objectives)).toBe("AVAILABLE");
    expect(computeQuestStatus(null, objectives, "LOCKED")).toBe("LOCKED");
  });
});

describe("shouldAutoCompleteQuest", () => {
  it("returns false for empty objectives", () => {
    expect(shouldAutoCompleteQuest([])).toBe(false);
  });

  it("returns true when all required objectives complete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: true }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(true);
  });

  it("returns true when all required complete even with optional incomplete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: true, progress: [{ completed: false }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(true);
  });

  it("returns false when some required objectives incomplete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(false);
  });

  it("treats all as required when no optional objectives", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(false);
  });

  it("requires all objectives when all are optional", () => {
    const objectivesIncomplete: ObjectiveWithProgress[] = [
      { id: "1", optional: true, progress: [{ completed: true }] },
      { id: "2", optional: true, progress: [{ completed: false }] },
    ];
    expect(shouldAutoCompleteQuest(objectivesIncomplete)).toBe(false);

    const objectivesComplete: ObjectiveWithProgress[] = [
      { id: "1", optional: true, progress: [{ completed: true }] },
      { id: "2", optional: true, progress: [{ completed: true }] },
    ];
    expect(shouldAutoCompleteQuest(objectivesComplete)).toBe(true);
  });
});

describe("wouldObjectiveChangeQuestStatus", () => {
  it("detects status change from AVAILABLE to IN_PROGRESS", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: false }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
    ];
    const result = wouldObjectiveChangeQuestStatus(
      "AVAILABLE",
      objectives,
      "1",
      true
    );
    expect(result.wouldChange).toBe(true);
    expect(result.newStatus).toBe("IN_PROGRESS");
  });

  it("detects status change from IN_PROGRESS to COMPLETED", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: false }] },
    ];
    const result = wouldObjectiveChangeQuestStatus(
      "IN_PROGRESS",
      objectives,
      "2",
      true
    );
    expect(result.wouldChange).toBe(true);
    expect(result.newStatus).toBe("COMPLETED");
  });

  it("returns no change when already complete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] },
      { id: "2", optional: false, progress: [{ completed: true }] },
    ];
    const result = wouldObjectiveChangeQuestStatus(
      "COMPLETED",
      objectives,
      "1",
      true
    );
    expect(result.wouldChange).toBe(false);
    expect(result.newStatus).toBe("COMPLETED");
  });

  it("respects LOCKED status", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: false }] },
    ];
    const result = wouldObjectiveChangeQuestStatus(
      "LOCKED",
      objectives,
      "1",
      true
    );
    expect(result.wouldChange).toBe(false);
    expect(result.newStatus).toBe("LOCKED");
  });
});

describe("isObjectiveComplete", () => {
  it("returns false for null progress", () => {
    expect(isObjectiveComplete(null)).toBe(false);
    expect(isObjectiveComplete(undefined)).toBe(false);
  });

  it("uses completed flag for binary objectives (no target)", () => {
    expect(isObjectiveComplete({ completed: true })).toBe(true);
    expect(isObjectiveComplete({ completed: false })).toBe(false);
    expect(isObjectiveComplete({ completed: true, target: null })).toBe(true);
    expect(isObjectiveComplete({ completed: false, target: null })).toBe(false);
  });

  it("uses current >= target for numeric objectives", () => {
    // Not complete: 1/2
    expect(isObjectiveComplete({ completed: false, current: 1, target: 2 })).toBe(false);
    // Complete: 2/2
    expect(isObjectiveComplete({ completed: false, current: 2, target: 2 })).toBe(true);
    // Over-complete: 3/2 (edge case, should still be complete)
    expect(isObjectiveComplete({ completed: false, current: 3, target: 2 })).toBe(true);
    // Zero progress: 0/5
    expect(isObjectiveComplete({ completed: false, current: 0, target: 5 })).toBe(false);
    // Full progress: 5/5
    expect(isObjectiveComplete({ completed: true, current: 5, target: 5 })).toBe(true);
  });

  it("defaults current to 0 when null for numeric objectives", () => {
    expect(isObjectiveComplete({ completed: false, current: null, target: 2 })).toBe(false);
  });

  it("ignores target=0 (treats as binary)", () => {
    // target=0 means binary objective
    expect(isObjectiveComplete({ completed: true, current: 0, target: 0 })).toBe(true);
    expect(isObjectiveComplete({ completed: false, current: 0, target: 0 })).toBe(false);
  });
});

describe("numeric progress in computeObjectiveProgress", () => {
  it("counts numeric objectives as complete when current >= target", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true, current: 2, target: 2 }] },
      { id: "2", optional: false, progress: [{ completed: false, current: 1, target: 2 }] },
    ];
    const result = computeObjectiveProgress(objectives);
    expect(result.completed).toBe(1);
    expect(result.requiredCompleted).toBe(1);
  });

  it("works with mixed binary and numeric objectives", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] }, // Binary, complete
      { id: "2", optional: false, progress: [{ completed: false, current: 3, target: 3 }] }, // Numeric, complete
      { id: "3", optional: false, progress: [{ completed: false, current: 1, target: 5 }] }, // Numeric, incomplete
    ];
    const result = computeObjectiveProgress(objectives);
    expect(result.completed).toBe(2);
    expect(result.requiredCompleted).toBe(2);
  });
});

describe("numeric progress in shouldAutoCompleteQuest", () => {
  it("auto-completes when all numeric objectives reach target", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true, current: 5, target: 5 }] },
      { id: "2", optional: false, progress: [{ completed: true, current: 2, target: 2 }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(true);
  });

  it("does not auto-complete when numeric objectives incomplete", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true, current: 5, target: 5 }] },
      { id: "2", optional: false, progress: [{ completed: false, current: 1, target: 2 }] },
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(false);
  });

  it("auto-completes with mixed binary and numeric objectives", () => {
    const objectives: ObjectiveWithProgress[] = [
      { id: "1", optional: false, progress: [{ completed: true }] }, // Binary, complete
      { id: "2", optional: false, progress: [{ completed: true, current: 10, target: 10 }] }, // Numeric, complete
    ];
    expect(shouldAutoCompleteQuest(objectives)).toBe(true);
  });
});
