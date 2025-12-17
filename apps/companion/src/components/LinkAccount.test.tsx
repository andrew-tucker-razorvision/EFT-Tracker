import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LinkAccount } from "./LinkAccount";
import * as tauriLib from "../lib/tauri";

vi.mock("../lib/tauri", () => ({
  validateToken: vi.fn(),
}));

describe("LinkAccount", () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
    mockOnBack.mockClear();
    vi.mocked(tauriLib.validateToken).mockClear();
  });

  it("renders token input field and buttons", () => {
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    expect(
      screen.getByPlaceholderText(/enter companion token/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /link account/i })
    ).toBeInTheDocument();
  });

  it("shows error when token is empty", async () => {
    const user = userEvent.setup();
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    expect(await screen.findByText(/please enter a companion token/i)).toBeInTheDocument();
  });

  it("shows error when token does not start with cmp_", async () => {
    const user = userEvent.setup();
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "invalid_token_123");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    expect(
      await screen.findByText(/invalid token format/i)
    ).toBeInTheDocument();
  });

  it("validates token format with cmp_ prefix", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    mockValidateToken.mockResolvedValue({ valid: true });

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "cmp_valid_token_123");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    await waitFor(() => {
      expect(mockValidateToken).toHaveBeenCalledWith("cmp_valid_token_123");
    });
  });

  it("shows loading state while validating", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    mockValidateToken.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ valid: true }), 100))
    );

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "cmp_token_123");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    // Should show loading state
    expect(screen.getByRole("button", { name: /validating/i })).toBeInTheDocument();
  });

  it("calls onComplete when token is valid", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    const validationResult = { valid: true };
    mockValidateToken.mockResolvedValue(validationResult);

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "cmp_valid_token_abc123");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith("cmp_valid_token_abc123", validationResult);
    });
  });

  it("shows error when token is invalid", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    mockValidateToken.mockResolvedValue({
      valid: false,
      error: "Token is expired or invalid",
    });

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "cmp_expired_token_xyz");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    expect(
      await screen.findByText(/token is expired or invalid/i)
    ).toBeInTheDocument();
  });

  it("shows error when validation fails", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    mockValidateToken.mockRejectedValue(new Error("Network error"));

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "cmp_token_123");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const user = userEvent.setup();
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it("toggles token visibility", async () => {
    const user = userEvent.setup();
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i) as HTMLInputElement;
    const toggleButton = screen.getByRole("button", { name: /show/i });

    // Initially hidden
    expect(input.type).toBe("password");

    // Click to show
    await user.click(toggleButton);
    expect(input.type).toBe("text");

    // Click to hide
    await user.click(toggleButton);
    expect(input.type).toBe("password");
  });

  it("trims whitespace from token before validation", async () => {
    const user = userEvent.setup();
    const mockValidateToken = vi.mocked(tauriLib.validateToken);
    mockValidateToken.mockResolvedValue({ valid: true });

    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "  cmp_token_123  ");

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    await waitFor(() => {
      // Should be trimmed before validation
      expect(mockValidateToken).toHaveBeenCalledWith("cmp_token_123");
    });
  });

  it("clears error when user starts typing", async () => {
    const user = userEvent.setup();
    render(<LinkAccount onComplete={mockOnComplete} onBack={mockOnBack} />);

    const linkButton = screen.getByRole("button", { name: /link account/i });
    await user.click(linkButton);

    expect(await screen.findByText(/please enter a companion token/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/enter companion token/i);
    await user.type(input, "c");

    // Error should be cleared
    expect(
      screen.queryByText(/please enter a companion token/i)
    ).not.toBeInTheDocument();
  });
});
