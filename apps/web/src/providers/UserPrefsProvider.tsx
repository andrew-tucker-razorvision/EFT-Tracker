"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useUserPrefs, type UserPrefs } from "@/hooks/useUserPrefs";

interface UserPrefsContextValue {
  prefs: UserPrefs | null;
  isLoading: boolean;
  error: Error | null;
}

const UserPrefsContext = createContext<UserPrefsContextValue | undefined>(
  undefined
);

interface UserPrefsProviderProps {
  children: ReactNode;
}

/**
 * Provider that preloads user preferences at the app level
 * Ensures preferences are available to all components via context
 * For authenticated users: shows loading state while prefs load
 * For unauthenticated users: returns immediately with null prefs
 */
export function UserPrefsProvider({ children }: UserPrefsProviderProps) {
  const { data, isLoading, error } = useUserPrefs();

  const value: UserPrefsContextValue = {
    prefs: data ?? null,
    isLoading,
    error: error as Error | null,
  };

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore React 19 type compatibility issue with Context.Provider
    <UserPrefsContext.Provider value={value}>
      {children}
    </UserPrefsContext.Provider>
  );
}

/**
 * Hook to access user preferences from context
 * Must be used within UserPrefsProvider
 * Returns { prefs, isLoading, error }
 */
export function useUserPrefsContext(): UserPrefsContextValue {
  const context = useContext(UserPrefsContext);
  if (context === undefined) {
    throw new Error(
      "useUserPrefsContext must be used within UserPrefsProvider"
    );
  }
  return context;
}
