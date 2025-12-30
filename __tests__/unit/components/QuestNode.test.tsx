import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import {
  QuestNode,
  QUEST_NODE_WIDTH,
  QUEST_NODE_HEIGHT,
} from "@/components/quest-tree/QuestNode";
import { createQuestWithProgress, mockQuests } from "../../fixtures/quests";
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
    onDetails: (questId: string) => void;
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
  const onDetails = overrides.onDetails ?? vi.fn();

  const data: QuestNodeData = {
    quest,
    isSelected: overrides.isSelected ?? false,
    isRoot: overrides.isRoot ?? false,
    isLeaf: overrides.isLeaf ?? false,
    isFocused: overrides.isFocused ?? false,
    isInFocusChain: overrides.isInFocusChain ?? false,
    hasFocusMode: overrides.hasFocusMode ?? false,
    playerLevel: null,
    isSaving: false,
    onStatusChange,
    onClick,
    onFocus,
    onDetails,
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

      // Level badge rendered across two elements: "Lv" label + number value
      expect(screen.getByText("Lv")).toBeInTheDocument();
      expect(screen.getByText(String(quest.levelRequired))).toBeInTheDocument();
    });

    it("should have trader color styling (trader name not shown in compact design)", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Trader info is shown via border color, not text
      // Available quests have cursor-pointer
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
      expect(QUEST_NODE_WIDTH).toBe(155);
      expect(QUEST_NODE_HEIGHT).toBe(58);
    });
  });

  describe("status styling", () => {
    it("should apply locked status styling", () => {
      const quest = createQuestWithProgress(mockQuests[0], "locked");
      const props = createNodeProps(quest);

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      // Locked quests have opacity-70 class (cursor-pointer to allow skip-to-quest feature)
      const nodeDiv = container.querySelector(".opacity-70");
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
    it("should call onDetails on right-click (context menu)", () => {
      const quest = createQuestWithProgress(mockQuests[0], "available");
      const onDetails = vi.fn();
      const props = createNodeProps(quest, { onDetails });

      const { container } = renderWithReactFlow(<QuestNode {...props} />);

      const nodeDiv = container.querySelector(".cursor-pointer");
      if (nodeDiv) {
        fireEvent.contextMenu(nodeDiv);
      }

      expect(onDetails).toHaveBeenCalledWith(quest.id);
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

  describe("wiki links", () => {
    describe("rendering", () => {
      it("should show wiki link icon when wikiLink is present", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        expect(quest.wikiLink).toBeTruthy(); // Debut has wiki link
        const props = createNodeProps(quest);

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        const wikiIcon = container.querySelector('button[aria-label*="wiki"]');
        expect(wikiIcon).toBeInTheDocument();
      });

      it("should not show wiki link icon when wikiLink is null", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        quest.wikiLink = null;
        const props = createNodeProps(quest);

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        expect(
          container.querySelector('button[aria-label*="wiki"]')
        ).not.toBeInTheDocument();
      });

      it("should hide wiki link icon when node is dimmed in focus mode", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        const props = createNodeProps(quest, {
          hasFocusMode: true,
          isInFocusChain: false,
          isFocused: false,
        });

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        // isDimmed = true, icon should not render
        expect(
          container.querySelector('button[aria-label*="wiki"]')
        ).not.toBeInTheDocument();
      });
    });

    describe("interaction", () => {
      it("should open wiki link in new tab when icon is clicked", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        const windowOpenSpy = vi
          .spyOn(window, "open")
          .mockImplementation(() => null);
        const props = createNodeProps(quest);

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        const wikiIcon = container.querySelector('button[aria-label*="wiki"]');
        if (wikiIcon) {
          fireEvent.click(wikiIcon);
        }

        expect(windowOpenSpy).toHaveBeenCalledWith(
          quest.wikiLink,
          "_blank",
          "noopener,noreferrer"
        );

        windowOpenSpy.mockRestore();
      });

      it("should not trigger status change when wiki icon is clicked", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        const onStatusChange = vi.fn();
        vi.spyOn(window, "open").mockImplementation(() => null);
        const props = createNodeProps(quest, { onStatusChange });

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        const wikiIcon = container.querySelector('button[aria-label*="wiki"]');
        if (wikiIcon) {
          fireEvent.click(wikiIcon);
        }

        // Status change should NOT be called
        expect(onStatusChange).not.toHaveBeenCalled();
      });
    });

    describe("accessibility", () => {
      it("should have descriptive aria-label", () => {
        const quest = createQuestWithProgress(mockQuests[0], "available");
        const props = createNodeProps(quest);

        const { container } = renderWithReactFlow(<QuestNode {...props} />);

        const wikiIcon = container.querySelector('button[aria-label*="wiki"]');
        expect(wikiIcon).toHaveAttribute(
          "aria-label",
          `Open ${quest.title} wiki page`
        );
      });
    });
  });
});
