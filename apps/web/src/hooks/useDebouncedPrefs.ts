import { useDebouncedCallback } from "use-debounce";
import { useUpdateUserPrefs, UserPrefs } from "./useUserPrefs";

/**
 * Debounced wrapper around useUpdateUserPrefs
 * Batches rapid preference changes into a single API call
 * 1 second debounce delay
 */
export function useDebouncedPrefs() {
  const mutation = useUpdateUserPrefs();

  const debouncedUpdate = useDebouncedCallback(
    (updates: Partial<UserPrefs>) => {
      if (mutation.isPending) return; // Prevent concurrent updates
      mutation.mutate(updates);
    },
    1000 // 1 second debounce
  );

  return {
    update: debouncedUpdate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    retry: mutation.reset,
  };
}
