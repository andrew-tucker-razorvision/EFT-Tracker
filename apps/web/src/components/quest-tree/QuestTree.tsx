// @ts-nocheck - React 19 ReactFlow component type compatibility
"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from "react";
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
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Keyboard } from "lucide-react";
import { QuestNode, QUEST_NODE_WIDTH, QUEST_NODE_HEIGHT } from "./QuestNode";
import { TraderNode } from "./TraderNode";
import { buildTraderLaneGraph, getQuestChain } from "@/lib/quest-layout";
import { getTraderColor } from "@/lib/trader-colors";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

interface QuestTreeProps {
  quests: QuestWithProgress[];
  allQuests: QuestWithProgress[]; // All quests (unfiltered) for accurate depth calculation
  traders: Trader[];
  selectedQuestId?: string | null;
  playerLevel?: number | null;
  maxColumns?: number | null; // Limit number of columns (depth) shown per trader
  savingQuestIds?: Set<string>; // Set of quest IDs currently being saved
  onQuestSelect: (questId: string) => void;
  onStatusChange: (questId: string, status: QuestStatus) => void;
  onQuestDetails?: (questId: string) => void; // Open quest details modal
}

function QuestTreeInner({
  quests,
  allQuests,
  traders,
  selectedQuestId,
  playerLevel,
  maxColumns,
  savingQuestIds,
  onQuestSelect,
  onStatusChange,
  onQuestDetails,
}: QuestTreeProps) {
  const isMobile = useIsMobile();
  const { fitView, setViewport, getViewport } = useReactFlow();
  const isInitializedRef = useRef(false);
  // Ref to access current nodes without causing effect re-runs
  const nodesRef = useRef<Node[]>([]);
  // Ref for container to attach custom wheel handler
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to store translate extent for use in wheel handler
  const translateExtentRef = useRef<
    [[number, number], [number, number]] | undefined
  >(undefined);

  // Focus mode state
  const [focusedQuestId, setFocusedQuestId] = useState<string | null>(null);

  // Keyboard navigation state - tracks currently keyboard-selected node
  const [keyboardSelectedId, setKeyboardSelectedId] = useState<string | null>(
    null
  );

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

  // Build graph with layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const graph = buildTraderLaneGraph(quests, allQuests, traders, {
      onStatusChange,
      onClick: onQuestSelect,
      onFocus: handleFocus,
      onDetails: onQuestDetails,
      selectedQuestId,
      focusedQuestId,
      focusChain,
      playerLevel,
      maxColumns,
      savingQuestIds,
      keyboardSelectedId,
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
    savingQuestIds,
    focusedQuestId,
    focusChain,
    onStatusChange,
    onQuestSelect,
    handleFocus,
    onQuestDetails,
    keyboardSelectedId,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when quests or selection changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Keep nodesRef in sync with nodes for use in effects that shouldn't re-run on node changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Get quest nodes only (excluding trader nodes) for keyboard navigation
  const questNodes = useMemo(() => {
    return nodes.filter((n) => n.type === "quest");
  }, [nodes]);

  // Find nearest node in a direction for keyboard navigation
  const findNearestNode = useCallback(
    (
      currentId: string,
      direction: "up" | "down" | "left" | "right"
    ): string | null => {
      const currentNode = questNodes.find((n) => n.id === currentId);
      if (!currentNode) return questNodes[0]?.id || null;

      const { x: cx, y: cy } = currentNode.position;

      // Filter nodes in the desired direction
      const candidates = questNodes.filter((n) => {
        if (n.id === currentId) return false;
        const { x, y } = n.position;
        switch (direction) {
          case "up":
            return y < cy;
          case "down":
            return y > cy;
          case "left":
            return x < cx;
          case "right":
            return x > cx;
        }
      });

      if (candidates.length === 0) return null;

      // Find the closest node in that direction
      // Weight the primary direction more heavily
      const getDistance = (node: Node) => {
        const dx = Math.abs(node.position.x - cx);
        const dy = Math.abs(node.position.y - cy);
        // Primary direction weighted more
        if (direction === "up" || direction === "down") {
          return dy + dx * 0.5;
        }
        return dx + dy * 0.5;
      };

      candidates.sort((a, b) => getDistance(a) - getDistance(b));
      return candidates[0]?.id || null;
    },
    [questNodes]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // ESC exits focus mode
      if (e.key === "Escape") {
        if (focusedQuestId) {
          setFocusedQuestId(null);
        } else if (keyboardSelectedId) {
          setKeyboardSelectedId(null);
        }
        return;
      }

      // Arrow keys for navigation
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();

        // If no node selected, select the first quest node
        if (!keyboardSelectedId) {
          const firstQuest = questNodes[0];
          if (firstQuest) {
            setKeyboardSelectedId(firstQuest.id);
          }
          return;
        }

        const direction = e.key.replace("Arrow", "").toLowerCase() as
          | "up"
          | "down"
          | "left"
          | "right";
        const nextId = findNearestNode(keyboardSelectedId, direction);
        if (nextId) {
          setKeyboardSelectedId(nextId);
          // Center view on the selected node
          const node = nodesRef.current.find((n) => n.id === nextId);
          if (node) {
            fitView({
              nodes: [node],
              duration: 150,
              padding: 0.5,
              maxZoom: 1.5,
            });
          }
        }
        return;
      }

      // Only handle action keys if a node is selected
      if (!keyboardSelectedId) return;

      const selectedNode = nodesRef.current.find(
        (n) => n.id === keyboardSelectedId
      );
      const data = selectedNode?.data as QuestNodeData | undefined;
      if (!data?.quest) return;

      // Enter: Toggle quest status
      if (e.key === "Enter") {
        e.preventDefault();
        onStatusChange(data.quest.id, data.quest.computedStatus);
        return;
      }

      // Space: Open quest details
      if (e.key === " ") {
        e.preventDefault();
        if (onQuestDetails) {
          onQuestDetails(data.quest.id);
        }
        return;
      }

      // F: Enter focus mode on selected quest
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleFocus(data.quest.id);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    focusedQuestId,
    keyboardSelectedId,
    questNodes,
    findNearestNode,
    onStatusChange,
    onQuestDetails,
    handleFocus,
    fitView,
  ]);

  // Set initial viewport to center content with appropriate zoom when React Flow is ready
  // Uses nodesRef to avoid callback recreation on every nodes change
  const onInit = useCallback(() => {
    if (!isInitializedRef.current && nodesRef.current.length > 0) {
      // First: fit all content to center it properly
      fitView({ padding: 0.1, duration: 0 });

      // Then: zoom in by 50% after fitView completes
      // Use setTimeout because fitView updates viewport asynchronously
      setTimeout(() => {
        const { x, y, zoom } = getViewport();
        setViewport({ x, y, zoom: zoom * 1.5 }, { duration: 0 });
      }, 50);

      isInitializedRef.current = true;
    }
  }, [fitView, getViewport, setViewport]);

  // Calculate bounds to constrain panning - include ALL nodes (traders + quests)
  const translateExtent = useMemo(() => {
    if (nodes.length === 0) {
      return undefined;
    }

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

  // Sync translateExtent to ref for use in wheel handler (must be in effect, not render)
  useEffect(() => {
    translateExtentRef.current = translateExtent;
  }, [translateExtent]);

  // Center on focused quest when focus changes
  // Uses nodesRef to avoid re-centering when nodes update while already focused
  useEffect(() => {
    if (focusedQuestId) {
      const focusedNode = nodesRef.current.find((n) => n.id === focusedQuestId);
      if (focusedNode) {
        fitView({
          nodes: [focusedNode],
          duration: 300,
          padding: 0.5,
          maxZoom: 1,
        });
      }
    }
  }, [focusedQuestId, fitView]);

  // Custom wheel handler for vertical-only scrolling with bounds clamping
  // React Flow's panOnScrollMode doesn't reliably prevent horizontal movement on all devices
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle scroll events, not pinch-to-zoom (which has ctrlKey)
      if (e.ctrlKey) return;

      e.preventDefault();

      const { x, y, zoom } = getViewport();
      // Only use deltaY for vertical scrolling, ignore deltaX completely
      const panSpeed = 0.8;
      let newY = y - e.deltaY * panSpeed;

      // Clamp to translateExtent bounds if available
      const extent = translateExtentRef.current;
      if (extent) {
        const [[, minY], [, maxY]] = extent;
        const viewportHeight = container.clientHeight;

        // Calculate valid viewport.y range:
        // - maxViewportY: can't scroll higher than top of content
        // - minViewportY: can't scroll lower than bottom of content
        const maxViewportY = -minY * zoom;
        const minViewportY = viewportHeight - maxY * zoom;

        // Clamp newY within valid range
        newY = Math.max(minViewportY, Math.min(maxViewportY, newY));
      }

      setViewport({ x, y: newY, zoom }, { duration: 0 });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [getViewport, setViewport]);

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
    <div ref={containerRef} className="w-full h-full touch-pan-y relative">
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
      {/* Keyboard shortcuts help - top right, hidden on mobile */}
      {!isMobile && (
        <div className="absolute top-2 right-2 z-10">
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <button
                className="p-2 rounded-md bg-background/80 border border-border shadow-sm hover:bg-background transition-colors"
                aria-label="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" align="start" className="max-w-xs">
              <div className="space-y-2 text-xs">
                <p className="font-semibold text-foreground">
                  Keyboard Shortcuts
                </p>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span>Navigate quests</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Arrow keys
                    </kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Toggle status</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Enter
                    </kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Quest details</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Space
                    </kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Focus mode</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      F
                    </kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Search quests</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      /
                    </kbd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Exit / Clear</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        translateExtent={translateExtent}
        minZoom={0.1}
        maxZoom={isMobile ? 2 : 4}
        defaultEdgeOptions={{
          type: "default", // Bezier curves
        }}
        proOptions={{ hideAttribution: true }}
        panOnScroll={false}
        zoomOnScroll={false}
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
