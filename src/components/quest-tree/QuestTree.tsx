"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { QuestNode } from "./QuestNode";
import { TraderNode } from "./TraderNode";
import { buildTraderLaneGraph, getQuestChain } from "@/lib/quest-layout";
import { getTraderColor } from "@/lib/trader-colors";
import type { QuestWithProgress, QuestStatus, QuestNodeData, Trader } from "@/types";

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
  traders: Trader[];
  selectedQuestId?: string | null;
  onQuestSelect: (questId: string) => void;
  onStatusChange: (questId: string, status: QuestStatus) => void;
}

function QuestTreeInner({
  quests,
  traders,
  selectedQuestId,
  onQuestSelect,
  onStatusChange,
}: QuestTreeProps) {
  const isMobile = useIsMobile();
  const { fitView } = useReactFlow();

  // Focus mode state
  const [focusedQuestId, setFocusedQuestId] = useState<string | null>(null);

  // Calculate focus chain when focused quest changes
  const focusChain = useMemo(() => {
    if (!focusedQuestId) return undefined;
    return getQuestChain(focusedQuestId, quests);
  }, [focusedQuestId, quests]);

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
    const graph = buildTraderLaneGraph(quests, traders, {
      onStatusChange,
      onClick: onQuestSelect,
      onFocus: handleFocus,
      selectedQuestId,
      focusedQuestId,
      focusChain,
    });
    return {
      initialNodes: graph.nodes,
      initialEdges: graph.edges,
    };
  }, [
    quests,
    traders,
    selectedQuestId,
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

  // MiniMap node color based on trader
  const getNodeColor = useCallback(
    (node: { data: Record<string, unknown> }) => {
      const data = node.data as QuestNodeData | undefined;
      if (data?.quest) {
        return getTraderColor(data.quest.traderId).primary;
      }
      return "#6B7280";
    },
    []
  );

  return (
    <div className="w-full h-full touch-pan-x touch-pan-y relative">
      {/* Focus mode indicator */}
      {focusedQuestId && (
        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
          <span>Focus Mode</span>
          <button
            onClick={() => setFocusedQuestId(null)}
            className="hover:bg-blue-600 rounded-full p-0.5"
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
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: isMobile ? 0.1 : 0.2,
          maxZoom: isMobile ? 0.8 : 1,
        }}
        minZoom={0.05}
        maxZoom={isMobile ? 1.5 : 2}
        defaultEdgeOptions={{
          type: "default", // Bezier curves
        }}
        proOptions={{ hideAttribution: true }}
        panOnScroll={!isMobile}
        zoomOnScroll={!isMobile}
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false} // Disable default double-click zoom (we use it for focus)
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls
          showInteractive={false}
          className="!shadow-md"
          position={isMobile ? "bottom-left" : "bottom-left"}
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
