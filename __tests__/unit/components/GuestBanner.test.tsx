import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuestBanner } from "@/components/guest-banner";
import { useSession } from "next-auth/react";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

const mockUseSession = vi.mocked(useSession);

describe("GuestBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("visibility", () => {
    it("should show banner when unauthenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });

      render(<GuestBanner />);

      expect(screen.getByText("Sign up to save your progress!")).toBeInTheDocument();
    });

    it("should hide banner when authenticated", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { id: "1", email: "test@test.com", name: "Test" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: vi.fn(),
      });

      render(<GuestBanner />);

      expect(screen.queryByText("Sign up to save your progress!")).not.toBeInTheDocument();
    });

    it("should hide banner when loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
        update: vi.fn(),
      });

      render(<GuestBanner />);

      expect(screen.queryByText("Sign up to save your progress!")).not.toBeInTheDocument();
    });
  });

  describe("content", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });
    });

    it("should render guest message on larger screens", () => {
      render(<GuestBanner />);

      // This text is hidden on small screens but present in DOM
      expect(screen.getByText(/You're browsing as a guest\./)).toBeInTheDocument();
    });

    it("should render Sign Up button", () => {
      render(<GuestBanner />);

      const signUpButton = screen.getByRole("link", { name: "Sign Up" });
      expect(signUpButton).toBeInTheDocument();
      expect(signUpButton).toHaveAttribute("href", "/register");
    });

    it("should render dismiss button", () => {
      render(<GuestBanner />);

      expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
    });
  });

  describe("dismiss functionality", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: vi.fn(),
      });
    });

    it("should hide banner when dismiss button is clicked", () => {
      render(<GuestBanner />);

      // Banner should be visible initially
      expect(screen.getByText("Sign up to save your progress!")).toBeInTheDocument();

      // Click dismiss button
      const dismissButton = screen.getByRole("button", { name: "Dismiss" });
      fireEvent.click(dismissButton);

      // Banner should be hidden
      expect(screen.queryByText("Sign up to save your progress!")).not.toBeInTheDocument();
    });
  });
});
