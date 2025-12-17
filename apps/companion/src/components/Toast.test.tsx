import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { ToastContainer, useToast, type ToastMessage } from "./Toast";

describe("ToastContainer", () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    mockOnDismiss.mockClear();
  });

  it("renders nothing when no toasts", () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={mockOnDismiss} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders success toast with correct styling", () => {
    const toasts: ToastMessage[] = [
      { id: "1", type: "success", message: "Quest synced!" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText("Quest synced!")).toBeInTheDocument();
  });

  it("renders error toast with correct message", () => {
    const toasts: ToastMessage[] = [
      { id: "2", type: "error", message: "Sync failed!" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText("Sync failed!")).toBeInTheDocument();
  });

  it("renders info toast with correct message", () => {
    const toasts: ToastMessage[] = [
      { id: "3", type: "info", message: "No pending events" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText("No pending events")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    const toasts: ToastMessage[] = [
      { id: "1", type: "success", message: "First toast" },
      { id: "2", type: "error", message: "Second toast" },
      { id: "3", type: "info", message: "Third toast" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(screen.getByText("First toast")).toBeInTheDocument();
    expect(screen.getByText("Second toast")).toBeInTheDocument();
    expect(screen.getByText("Third toast")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", async () => {
    const user = userEvent.setup();
    const toasts: ToastMessage[] = [
      { id: "test-id", type: "success", message: "Test message" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByRole("button");
    await user.click(closeButton);

    expect(mockOnDismiss).toHaveBeenCalledWith("test-id");
  });

  it("auto-dismisses toast after duration", async () => {
    vi.useFakeTimers();
    const toasts: ToastMessage[] = [
      {
        id: "auto-dismiss",
        type: "info",
        message: "Auto dismiss",
        duration: 1000,
      },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={mockOnDismiss} />);

    expect(mockOnDismiss).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockOnDismiss).toHaveBeenCalledWith("auto-dismiss");
    vi.useRealTimers();
  });
});

describe("useToast hook", () => {
  it("starts with empty toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds success toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Success message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe("success");
    expect(result.current.toasts[0].message).toBe("Success message");
  });

  it("adds error toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.error("Error message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe("error");
    expect(result.current.toasts[0].message).toBe("Error message");
  });

  it("adds info toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.info("Info message");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe("info");
    expect(result.current.toasts[0].message).toBe("Info message");
  });

  it("adds toast with custom duration", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("Custom duration", 5000);
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });

  it("dismisses toast by id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("First");
      result.current.error("Second");
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.dismissToast(result.current.toasts[0].id);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe("Second");
  });

  it("generates unique ids for each toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("First");
      result.current.success("Second");
      result.current.success("Third");
    });

    const ids = result.current.toasts.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it("maintains toast order (newest last)", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.success("First");
      result.current.error("Second");
      result.current.info("Third");
    });

    expect(result.current.toasts[0].message).toBe("First");
    expect(result.current.toasts[1].message).toBe("Second");
    expect(result.current.toasts[2].message).toBe("Third");
  });
});
