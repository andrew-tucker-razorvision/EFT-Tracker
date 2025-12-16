import { useState, useEffect } from 'react';

/**
 * Hook to synchronize state with localStorage
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if key doesn't exist
 * @returns [storedValue, setValue] - Similar to useState
 *
 * @example
 * const [name, setName] = useLocalStorage('userName', '');
 *
 * // Value persists across page reloads
 * return (
 *   <input
 *     value={name}
 *     onChange={(e) => setName(e.target.value)}
 *   />
 * );
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
