"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { QuestNode, QUEST_NODE_WIDTH, QUEST_NODE_HEIGHT } from "./QuestNode";
import { TraderNode } from "./TraderNode";
import { buildTraderLaneGraph, getQuestChain } from "@/lib/quest-layout";
import { getTraderColor } from "@/lib/trader-colors";
import type {
  QuestWithProgress,
  QuestStatus,
  QuestNodeData,
  Trader,
} from "@/types";

// Register custom node types
const nodeTypes: NodeTypes = {
  quest: QuestNode,
  trader: TraderNode,
};

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

interface QuestTreeProps {
  quests: QuestWithProgress[];
  allQuests: QuestWithProgress[]; // All quests (unfiltered) for accurate depth calculation
  traders: Trader[];
  selectedQuestId?: string | null;
  playerLevel?: number | null;
  maxColumns?: number | null; // Limit number of columns (depth) shown per trader
  onQuestSelect: (questId: string) => void;
  onStatusChange: (questId: string, status: QuestStatus) => void;
}

function QuestTreeInner({
  quests,
  allQuests,
  traders,
  selectedQuestId,
  playerLevel,
  maxColumns,
  onQuestSelect,
  onStatusChange,
}: QuestTreeProps) {
  const isMobile = useIsMobile();
  const { fitView } = useReactFlow();

  // Focus mode state
  const [focusedQuestId, setFocusedQuestId] = useState<string | null>(null);

  // Calculate focus chain when focused quest changes
  // Use allQuests to include cross-trader dependencies in the chain
  const focusChain = useMemo(() => {
    if (!focusedQuestId) return undefined;
    return getQuestChain(focusedQuestId, allQuests);
  }, [focusedQuestId, allQuests]);

  // Handle focus on a quest
  const handleFocus = useCallback((questId: string) => {
    // Toggle focus if same quest, otherwise focus on new quest
    setFocusedQuestId((prev) => (prev === questId ? null : questId));
  }, []);

  // Handle ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedQuestId) {
        setFocusedQuestId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedQuestId]);

  // Build graph with layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const graph = buildTraderLaneGraph(quests, allQuests, traders, {
      onStatusChange,
      onClick: onQuestSelect,
      onFocus: handleFocus,
      selectedQuestId,
      focusedQuestId,
      focusChain,
      playerLevel,
      maxColumns,
    });
    return {
      initialNodes: graph.nodes,
      initialEdges: graph.edges,
    };
  }, [
    quests,
    allQuests,
    traders,
    selectedQuestId,
    playerLevel,
    maxColumns,
    focusedQuestId,
    focusChain,
    onStatusChange,
    onQuestSelect,
    handleFocus,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when quests or selection changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Calculate bounds to constrain panning - include ALL nodes (traders + quests)
  const translateExtent = useMemo(() => {
    if (nodes.length === 0) return undefined;

    const padding = 50; // Padding around all nodes

    // Use ALL nodes for bounds calculation so traders are included
    const minX = Math.min(...nodes.map((n) => n.position.x)) - padding;
    const minY = Math.min(...nodes.map((n) => n.position.y)) - padding;
    const maxX =
      Math.max(...nodes.map((n) => n.position.x + QUEST_NODE_WIDTH)) + padding;
    const maxY =
      Math.max(...nodes.map((n) => n.position.y + QUEST_NODE_HEIGHT)) + padding;

    return [
      [minX, minY],
      [maxX, maxY],
    ] as [[number, number], [number, number]];
  }, [nodes]);

  // Center on focused quest when focus changes
  useEffect(() => {
    if (focusedQuestId) {
      const focusedNode = nodes.find((n) => n.id === focusedQuestId);
      if (focusedNode) {
        fitView({
          nodes: [focusedNode],
          duration: 300,
          padding: 0.5,
          maxZoom: 1,
        });
      }
    }
  }, [focusedQuestId, nodes, fitView]);

  // Handle background click to exit focus mode
  const handlePaneClick = useCallback(() => {
    if (focusedQuestId) {
      setFocusedQuestId(null);
    }
  }, [focusedQuestId]);

  // Handle node click for status change
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: { data?: unknown }) => {
      // Only handle quest nodes, not trader nodes
      const data = node.data as QuestNodeData | undefined;
      if (data?.quest) {
        const quest = data.quest;
        // Call status change handler
        onStatusChange(quest.id, quest.computedStatus);
      }
    },
    [onStatusChange]
  );

  // Handle node double-click for focus mode
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: { data?: unknown }) => {
      // Only handle quest nodes, not trader nodes
      const data = node.data as QuestNodeData | undefined;
      if (data?.quest) {
        handleFocus(data.quest.id);
      }
    },
    [handleFocus]
  );

  // MiniMap node color based on trader
  const getNodeColor = useCallback(
    (node: { data: Record<string, unknown> }) => {
      const data = node.data as QuestNodeData | undefined;
      if (data?.quest) {
        return getTraderColor(data.quest.traderId).primary;
      }
      return "#636363";
    },
    []
  );

  return (
    <div className="w-full h-full touch-pan-x touch-pan-y relative">
      {/* Top action bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        {/* Focus mode indicator */}
        {focusedQuestId && (
          <div
            className="text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-2"
            style={{ backgroundColor: "#9a8866", color: "#1b1919" }}
          >
            <span>Focus Mode</span>
            <button
              onClick={() => setFocusedQuestId(null)}
              className="rounded-full p-0.5 hover:opacity-80"
              title="Exit focus mode (ESC)"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        defaultViewport={{ x: 20, y: 20, zoom: 1 }}
        translateExtent={translateExtent}
        minZoom={0.1}
        maxZoom={isMobile ? 2 : 4}
        defaultEdgeOptions={{
          type: "default", // Bezier curves
        }}
        proOptions={{ hideAttribution: true }}
        panOnScroll={!isMobile}
        zoomOnScroll={!isMobile}
        panOnDrag={[1, 2]}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
      >
        <Controls
          showInteractive={false}
          className="!shadow-md"
          position={isMobile ? "bottom-left" : "bottom-left"}
        />
        {/* Solid dark background for contrast */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={100}
          size={0}
          color="transparent"
          style={{ backgroundColor: "#1e1e20" }}
        />
        {/* Hide MiniMap on mobile for more screen space */}
        {!isMobile && (
          <MiniMap
            nodeColor={getNodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background/80 !border-border"
          />
        )}
      </ReactFlow>
    </div>
  );
}

// Wrapper component that provides ReactFlowProvider
export function QuestTree(props: QuestTreeProps) {
  return (
    <ReactFlowProvider>
      <QuestTreeInner {...props} />
    </ReactFlowProvider>
  );
}

export default QuestTree;
