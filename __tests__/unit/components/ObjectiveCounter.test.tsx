/**
 * Unit tests for ObjectiveCounter component
 * Tests increment/decrement bounds, ARIA accessibility, and visual states
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ObjectiveCounter } from "../../../apps/web/src/components/quest-detail/ObjectiveCounter";

describe("ObjectiveCounter", () => {
  const defaultProps = {
    current: 0,
    target: 5,
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("displays current/target progress", () => {
      render(<ObjectiveCounter {...defaultProps} current={2} target={5} />);
      expect(screen.getByText("2/5")).toBeInTheDocument();
    });

    it("shows complete state when current equals target", () => {
      render(<ObjectiveCounter {...defaultProps} current={5} target={5} />);
      expect(screen.getByText("5/5")).toBeInTheDocument();
      // Complete checkmark should be visible
      expect(screen.getByLabelText("Completed")).toBeInTheDocument();
    });

    it("hides Done button when complete", () => {
      render(<ObjectiveCounter {...defaultProps} current={5} target={5} />);
      expect(screen.queryByLabelText("Mark as complete")).not.toBeInTheDocument();
    });

    it("shows Done button when not complete", () => {
      render(<ObjectiveCounter {...defaultProps} current={2} target={5} />);
      expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
    });

    it("shows loading spinner when isLoading", () => {
      render(<ObjectiveCounter {...defaultProps} isLoading={true} />);
      // Progress display should show spinner instead of text
      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("increment behavior", () => {
    it("calls onIncrement when + button clicked", () => {
      const onIncrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onIncrement={onIncrement} current={2} />);

      fireEvent.click(screen.getByLabelText("Increment progress"));
      expect(onIncrement).toHaveBeenCalledTimes(1);
    });

    it("disables + button at target", () => {
      const onIncrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onIncrement={onIncrement} current={5} target={5} />);

      const button = screen.getByLabelText("Increment progress");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(onIncrement).not.toHaveBeenCalled();
    });

    it("disables + button when disabled prop is true", () => {
      const onIncrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onIncrement={onIncrement} disabled={true} />);

      const button = screen.getByLabelText("Increment progress");
      expect(button).toBeDisabled();
    });

    it("disables + button when isLoading", () => {
      const onIncrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onIncrement={onIncrement} isLoading={true} />);

      const button = screen.getByLabelText("Increment progress");
      expect(button).toBeDisabled();
    });
  });

  describe("decrement behavior", () => {
    it("calls onDecrement when - button clicked", () => {
      const onDecrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onDecrement={onDecrement} current={3} />);

      fireEvent.click(screen.getByLabelText("Decrement progress"));
      expect(onDecrement).toHaveBeenCalledTimes(1);
    });

    it("disables - button at zero", () => {
      const onDecrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onDecrement={onDecrement} current={0} />);

      const button = screen.getByLabelText("Decrement progress");
      expect(button).toBeDisabled();

      fireEvent.click(button);
      expect(onDecrement).not.toHaveBeenCalled();
    });

    it("disables - button when disabled prop is true", () => {
      const onDecrement = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onDecrement={onDecrement} current={3} disabled={true} />);

      const button = screen.getByLabelText("Decrement progress");
      expect(button).toBeDisabled();
    });
  });

  describe("complete behavior", () => {
    it("calls onComplete when Done button clicked", () => {
      const onComplete = vi.fn();
      render(<ObjectiveCounter {...defaultProps} onComplete={onComplete} current={2} />);

      fireEvent.click(screen.getByLabelText("Mark as complete"));
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not show Done button when already complete", () => {
      render(<ObjectiveCounter {...defaultProps} current={5} target={5} />);
      expect(screen.queryByLabelText("Mark as complete")).not.toBeInTheDocument();
    });

    it("does not show Done button when disabled", () => {
      render(<ObjectiveCounter {...defaultProps} current={2} disabled={true} />);
      expect(screen.queryByLabelText("Mark as complete")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has spinbutton role on progress display", () => {
      render(<ObjectiveCounter {...defaultProps} current={2} target={5} />);
      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("has correct aria-valuenow", () => {
      render(<ObjectiveCounter {...defaultProps} current={3} target={5} />);
      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton).toHaveAttribute("aria-valuenow", "3");
    });

    it("has correct aria-valuemin", () => {
      render(<ObjectiveCounter {...defaultProps} current={3} target={5} />);
      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton).toHaveAttribute("aria-valuemin", "0");
    });

    it("has correct aria-valuemax", () => {
      render(<ObjectiveCounter {...defaultProps} current={3} target={5} />);
      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton).toHaveAttribute("aria-valuemax", "5");
    });

    it("has descriptive aria-label on progress display", () => {
      render(<ObjectiveCounter {...defaultProps} current={3} target={5} />);
      const spinbutton = screen.getByRole("spinbutton");
      expect(spinbutton).toHaveAttribute("aria-label", "Progress: 3 of 5");
    });

    it("has aria-labels on all buttons", () => {
      render(<ObjectiveCounter {...defaultProps} current={2} />);
      expect(screen.getByLabelText("Decrement progress")).toBeInTheDocument();
      expect(screen.getByLabelText("Increment progress")).toBeInTheDocument();
      expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
    });
  });

  describe("event propagation", () => {
    it("stops propagation on container click", () => {
      const parentHandler = vi.fn();
      render(
        <div onClick={parentHandler}>
          <ObjectiveCounter {...defaultProps} />
        </div>
      );

      // Click the container
      const container = screen.getByRole("spinbutton").parentElement!;
      fireEvent.click(container);

      expect(parentHandler).not.toHaveBeenCalled();
    });

    it("stops propagation on button clicks", () => {
      const parentHandler = vi.fn();
      render(
        <div onClick={parentHandler}>
          <ObjectiveCounter {...defaultProps} current={2} />
        </div>
      );

      fireEvent.click(screen.getByLabelText("Increment progress"));
      expect(parentHandler).not.toHaveBeenCalled();

      fireEvent.click(screen.getByLabelText("Decrement progress"));
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });
});
