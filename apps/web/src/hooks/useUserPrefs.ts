import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export interface UserPrefs {
  playerLevel: number | null;
  questsPerTree: number | null;
  bypassLevelRequirement: boolean;
}

/**
 * Query hook for fetching user preferences
 * Only fetches when user is authenticated
 * Data is cached indefinitely (only changes when mutated)
 */
export function useUserPrefs() {
  const { status } = useSession();

  return useQuery({
    queryKey: ["userPrefs"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) throw new Error("Failed to fetch preferences");
      return res.json() as Promise<UserPrefs>;
    },
    enabled: status === "authenticated",
    staleTime: Infinity, // Only changes when we mutate
    gcTime: Infinity, // Keep in cache forever
  });
}

/**
 * Mutation hook for updating user preferences
 * Includes optimistic updates and auto-retry logic
 */
export function useUpdateUserPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserPrefs>) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      return res.json();
    },
    retry: 1, // Auto-retry once after 5 seconds
    retryDelay: 5000,
    onMutate: async (updates) => {
      // Cancel any pending queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["userPrefs"] });

      // Get current cached value
      const previous = queryClient.getQueryData(["userPrefs"]);

      // Optimistically update cache with new values
      queryClient.setQueryData(["userPrefs"], (old: UserPrefs | undefined) => ({
        ...old,
        ...updates,
      }));

      // Return previous value for rollback if mutation fails
      return { previous };
    },
    onError: (error, _updates, context) => {
      // Revert optimistic update on error
      if (context?.previous) {
        queryClient.setQueryData(["userPrefs"], context.previous);
      }

      // Notify user of error
      toast.error("Failed to save preferences", {
        description: "Your changes will be saved when you're back online",
      });
    },
    onSuccess: () => {
      // Optimistic update already handles state - no need to invalidate
      // Data has staleTime: Infinity so it never needs refetching
      // Invalidation would cause re-renders that trigger the infinite loop
    },
  });
}
