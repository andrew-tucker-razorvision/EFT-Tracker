import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

// Mock session for authenticated tests
export const mockSession: Session = {
  user: {
    id: "test_user_qa",
    email: "qa@test.com",
    name: "QA Test User",
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Mock unauthenticated session
export const mockUnauthenticatedSession = null;

interface AllProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

function AllProviders({ children, session = null }: AllProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  session?: Session | null;
}

function customRender(
  ui: ReactElement,
  { session, ...options }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders session={session}>{children}</AllProviders>
    ),
    ...options,
  });
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
export { default as userEvent } from "@testing-library/user-event";
