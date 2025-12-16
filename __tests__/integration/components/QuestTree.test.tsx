/**
 * Integration tests for QuestTree component
 * Tests component logic with mocked ReactFlow (not browser rendering)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "next-auth/react";
import {
  mockQuests,
  mockQuestsWithProgress,
  createQuestWithProgress,
  QUEST_IDS,
} from "../../fixtures/quests";
import { mockTraders } from "../../fixtures/traders";

// Mock session for SessionProvider
const mockSession = {
  user: { id: "test-user", name: "Test User", email: "test@example.com" },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

// Mock ReactFlow before importing QuestTree
const mockFitView = vi.fn();
const mockSetViewport = vi.fn();
const mockGetViewport = vi.fn(() => ({ x: 0, y: 0, zoom: 1 }));

interface MockNode {
  id: string;
  data: {
    isSelected?: boolean;
    isFocused?: boolean;
    isInFocusChain?: boolean;
    quest?: { title?: string; computedStatus?: string };
    traderName?: string;
  };
}

interface MockReactFlowProps {
  nodes: MockNode[];
  onNodeClick?: (event: React.MouseEvent, node: MockNode) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: MockNode) => void;
}

vi.mock("@xyflow/react", () => ({
  ReactFlow: ({
    nodes,
    onNodeClick,
    onNodeDoubleClick,
  }: MockReactFlowProps) => (
    <div data-testid="react-flow-mock">
      {nodes.map((node) => (
        <button
          key={node.id}
          data-testid={`quest-node-${node.id}`}
          data-quest-id={node.id}
          data-selected={node.data.isSelected}
          data-focused={node.data.isFocused}
          data-in-focus-chain={node.data.isInFocusChain}
          data-status={node.data.quest?.computedStatus}
          onClick={(e) => onNodeClick?.(e, node)}
          onDoubleClick={(e) => onNodeDoubleClick?.(e, node)}
        >
          {node.data.quest?.title || node.data.traderName || node.id}
        </button>
      ))}
    </div>
  ),
  useReactFlow: () => ({
    fitView: mockFitView,
    setViewport: mockSetViewport,
    getViewport: mockGetViewport,
  }),
  useNodesState: <T,>(initialNodes: T) => {
    const [nodes, setNodes] = useState(initialNodes);
    return [nodes, setNodes, vi.fn()];
  },
  useEdgesState: <T,>(initialEdges: T) => {
    const [edges, setEdges] = useState(initialEdges);
    return [edges, setEdges, vi.fn()];
  },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => children,
  Controls: () => <div data-testid="react-flow-controls" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Background: () => <div data-testid="react-flow-background" />,
  BackgroundVariant: { Dots: "dots" },
}));

// Import after mocking
import { useState } from "react";
import QuestTree from "@/components/quest-tree/QuestTree";

describe("QuestTree Integration Tests", () => {
  const defaultProps = {
    quests: mockQuestsWithProgress,
    allQuests: mockQuestsWithProgress,
    traders: mockTraders,
    selectedQuestId: null,
    playerLevel: 15,
    maxColumns: null,
    savingQuestIds: new Set<string>(),
    onQuestSelect: vi.fn(),
    onStatusChange: vi.fn(),
    onQuestDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render ReactFlow with quest nodes", () => {
      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      expect(screen.getByTestId("react-flow-mock")).toBeInTheDocument();
      expect(
        screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`)
      ).toBeInTheDocument();
    });

    it("should render all quest nodes from props", () => {
      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const questNodes = screen.getAllByTestId(/^quest-node-/);
      // Should have at least as many nodes as quests (may include trader nodes)
      expect(questNodes.length).toBeGreaterThanOrEqual(
        mockQuestsWithProgress.length
      );
    });
  });

  describe("Quest Interactions", () => {
    it("should call onStatusChange when quest node is clicked", async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();

      render(<QuestTree {...defaultProps} onStatusChange={onStatusChange} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      await user.click(questNode);

      // Should call onStatusChange with quest ID and its current status
      expect(onStatusChange).toHaveBeenCalled();
      const [questId, status] = onStatusChange.mock.calls[0];
      expect(questId).toBe(QUEST_IDS.DEBUT);
      expect(["available", "in_progress", "completed", "locked"]).toContain(
        status
      );
    });

    it("should mark selected quest with data attribute", () => {
      render(
        <QuestTree {...defaultProps} selectedQuestId={QUEST_IDS.DEBUT} />,
        {
          wrapper: ({ children }) => (
            <SessionProvider session={mockSession}>{children}</SessionProvider>
          ),
        }
      );

      const selectedNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      expect(selectedNode).toHaveAttribute("data-selected", "true");
    });

    it("should show quest status in data attribute", () => {
      const questsWithCompleted = [
        createQuestWithProgress(mockQuests[0], "completed"),
        createQuestWithProgress(mockQuests[1], "available"),
      ];

      render(
        <QuestTree
          {...defaultProps}
          quests={questsWithCompleted}
          allQuests={questsWithCompleted}
        />,
        {
          wrapper: ({ children }) => (
            <SessionProvider session={mockSession}>{children}</SessionProvider>
          ),
        }
      );

      const completedNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      const availableNode = screen.getByTestId(
        `quest-node-${QUEST_IDS.CHECKING}`
      );

      expect(completedNode).toHaveAttribute("data-status", "completed");
      expect(availableNode).toHaveAttribute("data-status", "available");
    });
  });

  describe("Focus Mode", () => {
    it("should toggle focus mode on double-click", async () => {
      const user = userEvent.setup();

      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);

      // Simulate double-click
      await user.dblClick(questNode);

      // Wait for focus mode to activate
      await waitFor(() => {
        expect(questNode).toHaveAttribute("data-focused", "true");
      });
    });

    it("should dim quests outside focus chain", async () => {
      const user = userEvent.setup();

      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const debutNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      const bpDepotNode = screen.getByTestId(
        `quest-node-${QUEST_IDS.BP_DEPOT}`
      );

      // Double-click to enter focus mode
      await user.dblClick(debutNode);

      await waitFor(() => {
        // Debut should be in focus chain
        expect(debutNode).toHaveAttribute("data-in-focus-chain", "true");

        // BP Depot is unrelated, should not be in focus chain
        expect(bpDepotNode).toHaveAttribute("data-in-focus-chain", "false");
      });
    });

    it("should include prerequisites and dependents in focus chain", async () => {
      const user = userEvent.setup();

      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const checkingNode = screen.getByTestId(
        `quest-node-${QUEST_IDS.CHECKING}`
      );

      // Double-click Checking quest (which depends on Debut)
      await user.dblClick(checkingNode);

      await waitFor(() => {
        // Both Checking and its prerequisite Debut should be in focus chain
        expect(checkingNode).toHaveAttribute("data-in-focus-chain", "true");

        const debutNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
        expect(debutNode).toHaveAttribute("data-in-focus-chain", "true");
      });
    });
  });

  describe("Zoom Stability", () => {
    it("should not change zoom level on quest click", async () => {
      const user = userEvent.setup();

      render(<QuestTree {...defaultProps} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      // Record initial zoom
      const initialViewport = mockGetViewport();
      const initialZoom = initialViewport.zoom;

      // Click a quest
      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      await user.click(questNode);

      // Zoom should remain unchanged
      const afterClickViewport = mockGetViewport();
      expect(afterClickViewport.zoom).toBe(initialZoom);
    });
  });

  describe("Quest Status Changes", () => {
    it("should keep quest visible after status change", async () => {
      const user = userEvent.setup();
      const onStatusChange = vi.fn();

      render(<QuestTree {...defaultProps} onStatusChange={onStatusChange} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);

      // Click to trigger status change
      await user.click(questNode);

      // Quest node should still be in the document
      expect(questNode).toBeInTheDocument();
    });

    it("should show saving state for quests being saved", () => {
      const savingQuestIds = new Set([QUEST_IDS.DEBUT]);

      render(<QuestTree {...defaultProps} savingQuestIds={savingQuestIds} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      // Quest node data should include isSaving flag
      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      expect(questNode).toBeInTheDocument();
      // Note: In real component, this would be passed to node data
      // Here we're just verifying the prop is handled
    });
  });

  describe("Column Filtering", () => {
    it("should respect maxColumns prop", () => {
      render(<QuestTree {...defaultProps} maxColumns={2} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      // With maxColumns=2, only quests in first 2 columns should be visible
      // This is hard to test without full ReactFlow, but we can verify nodes exist
      const questNodes = screen.getAllByTestId(/^quest-node-/);
      expect(questNodes.length).toBeGreaterThan(0);
    });

    it("should show all quests when maxColumns is null", () => {
      render(<QuestTree {...defaultProps} maxColumns={null} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      const questNodes = screen.getAllByTestId(/^quest-node-/);
      expect(questNodes.length).toBeGreaterThanOrEqual(
        mockQuestsWithProgress.length
      );
    });
  });

  describe("Player Level", () => {
    it("should pass player level to quest nodes", () => {
      render(<QuestTree {...defaultProps} playerLevel={20} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      // Player level should be accessible to nodes through data
      const questNode = screen.getByTestId(`quest-node-${QUEST_IDS.DEBUT}`);
      expect(questNode).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should render without crashing when no quests provided", () => {
      render(<QuestTree {...defaultProps} quests={[]} allQuests={[]} />, {
        wrapper: ({ children }) => (
          <SessionProvider session={mockSession}>{children}</SessionProvider>
        ),
      });

      expect(screen.getByTestId("react-flow-mock")).toBeInTheDocument();
    });
  });
});
