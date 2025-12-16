import { useEffect, useState, useCallback } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to manage async operations with loading and error states
 *
 * @param asyncFunction - An async function that returns data
 * @param immediate - Whether to run immediately on mount (default: true)
 * @returns Object with { data, loading, error, execute }
 *
 * @example
 * const { data, loading, error } = useAsync(
 *   () => fetch('/api/quests').then(r => r.json())
 * );
 *
 * if (loading) return <p>Loading...</p>;
 * if (error) return <p>Error: {error.message}</p>;
 * return <div>{data.length} quests</div>;
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}
