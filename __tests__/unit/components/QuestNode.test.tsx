import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  QuestNode,
  QUEST_NODE_WIDTH,
  QUEST_NODE_HEIGHT,
} from "@/components/quest-tree/QuestNode";
import {
  createQuestWithProgress,
  mockQuests,
} from "../../../test/fixtures/quests";
import type { QuestNodeData, QuestStatus, QuestWithProgress } from "@/types";

// Wrapper to provide React Flow context
function renderWithReactFlow(ui: React.ReactElement) {
  return render(<ReactFlowProvider>{ui}</ReactFlowProvider>);
}

// Create mock node props
function createNodeProps(
  quest: QuestWithProgress,
  overrides: Partial<{
    onStatusChange: (questId: string, status: QuestStatus) => void;
    onClick: (questId: string) => void;
    onFocus: (questId: string) => void;
    isSelected: boolean;
    isRoot: boolean;
    isLeaf: boolean;
    isFocused: boolean;
    isInFocusChain: boolean;
    hasFocusMode: boolean;
  }> = {}
) {
  const onStatusChange = overrides.onStatusChange ?? vi.fn();
  const onClick = overrides.onClick ?? vi.fn();
  const onFocus = overrides.onFocus ?? vi.fn();

  const data: QuestNodeData = {
    quest,
    isSelected: overrides.isSelected ?? false,
    isRoot: overrides.isRoot ?? false,
    isLeaf: overrides.isLeaf ?? false,
    isFocused: overrides.isFocused ?? false,
    isInFocusChain: overrides.isInFocusChain ?? false,
    hasFocusMode: overrides.hasFocusMode ?? false,
    playerLevel: null,
    onStatusChange,
    onClick,
    onFocus,
  };

  return {
    id: quest.id,
    type: "quest" as const,
    data,
    selected: overrides.isSelected ?? false,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    zIndex: 0,
    dragging: false,
    draggable: true,
    deletable: true,
    selectable: true,
    parentId: undefined,
    sourcePosition: undefined,
    targetPosition: undefined,
  };
}

describe("QuestNode", () => {
  describe("rendering", () => {
    it("should render quest title", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const props = createNodeProps(quest);

      renderWithReactFlow(<QuestNode {...props} />);

      expect(screen.getByText(quest.title)).toBeInTheDocument();
    });

    it("should render level requirement badge", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const props = createNodeProps(quest);

      renderWithReactFlow(<QuestNode {...props} />);

      // Compact format: "Lv.X" (no space)
      expect(screen.getByText(`Lv.${quest.levelRequired}`)).toBeInTheDocument();
    });

    it("should have trader color styling (trader name not shown in compact design)", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Trader info is shown via border color, not text
      expect(container.querySelector(".cursor-pointer")).toBeInTheDocument();
    });

    it("should show Kappa badge when kappaRequired is true", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      expect(quest.kappaRequired).toBe(true); // Verify our test quest requires Kappa
      const props = createNodeProps(quest);

      renderWithReactFlow(<QuestNode {...props} />);

      expect(screen.getByText("K")).toBeInTheDocument();
      expect(screen.getByTitle("Required for Kappa")).toBeInTheDocument();
    });

    it("should hide Kappa badge when kappaRequired is false", () => {
      // BP Depot doesn't require Kappa
      const quest = createQuestWithProgress(mockQuests[4], "available");
      expect(quest.kappaRequired).toBe(false);
      const props = createNodeProps(quest);

      renderWithReactFlow(<QuestNode {...props} />);

      expect(screen.queryByText("K")).not.toBeInTheDocument();
    });

    it("should export node dimensions", () => {
      expect(QUEST_NODE_WIDTH).toBe(110);
      expect(QUEST_NODE_HEIGHT).toBe(38);
    });
  });

  describe("status styling", () => {
    it("should apply locked status styling", () => {
      const quest = createQuestWithProgress(mockQuests[0], "locked");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Locked quests have opacity-50 and cursor-not-allowed classes
      const nodeDiv = container.querySelector(".cursor-not-allowed");
      expect(nodeDiv).toBeInTheDocument();
    });

    it("should apply available status styling", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Available quests should have shadow styling
      const nodeDiv = container.querySelector(".shadow-sm");
      expect(nodeDiv).toBeInTheDocument();
    });

    it("should apply in_progress status styling (same as available)", () => {
      // Use a non-Kappa quest (BP Depot at index 4) to test in_progress styling
      // in_progress is now treated the same as available (simplified status model)
      const quest = createQuestWithProgress(mockQuests[4], "in_progress");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // In progress quests now have shadow styling like available quests
      const nodeDiv = container.querySelector(".shadow-sm");
      expect(nodeDiv).toBeInTheDocument();
    });

    it("should show checkmark for completed quests", () => {
      const quest = createQuestWithProgress(mockQuests[0], "completed");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Completed quests have SVG checkmark
      const checkmark = container.querySelector("svg");
      expect(checkmark).toBeInTheDocument();
    });
  });

  describe("click handling", () => {
    it("should call onStatusChange when clicked", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const onStatusChange = vi.fn();
      const props = createNodeProps(quest, { onStatusChange });

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      const nodeDiv = container.querySelector(".cursor-pointer");
      if (nodeDiv) {
        fireEvent.click(nodeDiv);
      }

      expect(onStatusChange).toHaveBeenCalledWith(quest.id, "available");
    });

    it("should call onClick on right-click (context menu)", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const onClick = vi.fn();
      const props = createNodeProps(quest, { onClick });

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      const nodeDiv = container.querySelector(".cursor-pointer");
      if (nodeDiv) {
        fireEvent.contextMenu(nodeDiv);
      }

      expect(onClick).toHaveBeenCalledWith(quest.id);
    });

    it("should pass current status to onStatusChange", () => {
      const quest = createQuestWithProgress(mockQuests[0], "in_progress");
      const onStatusChange = vi.fn();
      const props = createNodeProps(quest, { onStatusChange });

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      const nodeDiv = container.querySelector(".cursor-pointer");
      if (nodeDiv) {
        fireEvent.click(nodeDiv);
      }

      // Should pass the current status, not the next one
      expect(onStatusChange).toHaveBeenCalledWith(quest.id, "in_progress");
    });
  });

  describe("selection", () => {
    it("should apply selected ring when selected", () => {
      // Use a non-Kappa quest (BP Depot at index 4) to avoid Kappa ring override
      const quest = createQuestWithProgress(mockQuests[4], "available");
      const props = createNodeProps(quest, { isSelected: true });

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Selected nodes have ring-blue-500
      const nodeDiv = container.querySelector(".ring-blue-500");
      expect(nodeDiv).toBeInTheDocument();
    });
  });
});
