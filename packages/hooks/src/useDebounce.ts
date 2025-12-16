import { useEffect, useState } from 'react';

/**
 * Hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delayMs - Debounce delay in milliseconds (default: 300)
 * @returns The debounced value
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 *
 * useEffect(() => {
 *   // Only called after user stops typing for 500ms
 *   console.log('Searching for:', debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
