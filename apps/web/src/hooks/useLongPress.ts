"use client";

import { useCallback, useRef } from "react";

interface UseLongPressOptions {
  /** Duration in ms before long press triggers (default: 500ms) */
  threshold?: number;
  /** Callback when long press is detected */
  onLongPress: () => void;
  /** Optional callback for regular click (fires if released before threshold) */
  onClick?: () => void;
}

interface UseLongPressReturn {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

/**
 * Hook for detecting long press on touch and mouse devices.
 * Prevents context menu on long press for cleaner mobile UX.
 */
export function useLongPress({
  threshold = 500,
  onLongPress,
  onClick,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      clear();
      isLongPressRef.current = false;
      startPosRef.current = { x, y };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, threshold);
    },
    [clear, onLongPress, threshold]
  );

  const end = useCallback(() => {
    if (!isLongPressRef.current && onClick) {
      // Only fire click if it wasn't a long press
      onClick();
    }
    clear();
    startPosRef.current = null;
  }, [clear, onClick]);

  // Cancel if user moves finger/mouse too far (prevents accidental triggers while scrolling)
  const move = useCallback(
    (x: number, y: number) => {
      if (!startPosRef.current) return;
      const dx = Math.abs(x - startPosRef.current.x);
      const dy = Math.abs(y - startPosRef.current.y);
      // Cancel if moved more than 10px
      if (dx > 10 || dy > 10) {
        clear();
        startPosRef.current = null;
      }
    },
    [clear]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      start(touch.clientX, touch.clientY);
    },
    [start]
  );

  const onTouchEnd = useCallback(() => {
    end();
  }, [end]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      move(touch.clientX, touch.clientY);
    },
    [move]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only for left click
      if (e.button !== 0) return;
      start(e.clientX, e.clientY);
    },
    [start]
  );

  const onMouseUp = useCallback(() => {
    end();
  }, [end]);

  const onMouseLeave = useCallback(() => {
    clear();
    startPosRef.current = null;
  }, [clear]);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  };
}
