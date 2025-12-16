# @eft-tracker/hooks

Custom React hooks for common patterns and operations.

Used across web and companion apps for state management, async operations, and utilities.

## Hooks

### useDebounce

Debounce a value with a configurable delay.

```typescript
import { useDebounce } from '@eft-tracker/hooks';

export function SearchQuests() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    // Only called after user stops typing for 500ms
    console.log('Searching for:', debouncedSearch);
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search quests..."
    />
  );
}
```

**Parameters:**
- `value`: Value to debounce
- `delayMs`: Delay in milliseconds (default: 300)

**Returns:** Debounced value

### useLocalStorage

Sync component state with localStorage.

```typescript
import { useLocalStorage } from '@eft-tracker/hooks';

export function UserPreferences() {
  const [userName, setUserName] = useLocalStorage('userName', '');
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Values automatically persist to localStorage
  return (
    <div>
      <input
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Your name"
      />
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option>light</option>
        <option>dark</option>
      </select>
    </div>
  );
}
```

**Parameters:**
- `key`: localStorage key
- `initialValue`: Initial value if key doesn't exist

**Returns:** `[value, setValue]` - Like useState but persisted

**Features:**
- Handles SSR (doesn't break on server)
- JSON serialization for complex types
- Error handling with fallback to initial value

### useAsync

Manage async operations with loading and error states.

```typescript
import { useAsync } from '@eft-tracker/hooks';

export function QuestList() {
  const { data: quests, loading, error, execute } = useAsync(
    () => fetch('/api/quests').then((r) => r.json()),
    true // immediate: run on mount
  );

  if (loading) return <div>Loading quests...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={execute}>Refresh</button>
      {quests?.map((q) => (
        <div key={q.id}>{q.name}</div>
      ))}
    </div>
  );
}
```

**Parameters:**
- `asyncFunction`: Async function that returns data
- `immediate`: Run immediately on mount (default: true)

**Returns:**
- `data`: The resolved data or null
- `loading`: Loading state
- `error`: Error object or null
- `execute`: Function to manually trigger the operation

**Features:**
- Automatic cleanup on unmount
- Proper error handling
- Controlled loading state
- Manual execution support

## Adding New Hooks

1. Create new file in `src/` (e.g., `src/useClickOutside.ts`)
2. Add JSDoc comment explaining usage
3. Export from `src/index.ts`
4. Update this README with example

## Best Practices

- Keep hooks focused on a single concern
- Include JSDoc comments with examples
- Export TypeScript types for public APIs
- Avoid side effects without proper dependencies
- Test async hooks with proper error handling
