# @eft-tracker/ui

Shared React component library for EFT Tracker.

Building blocks for consistent UIs across the web and companion apps. All components:
- Use Tailwind CSS for styling
- Follow the @eft-tracker/theme design system
- Are fully typed with TypeScript
- Support ref forwarding
- Include accessibility features

## Components

### Button

Versatile button component with multiple variants and sizes.

```typescript
import { Button } from '@eft-tracker/ui';

export function MyComponent() {
  return (
    <>
      <Button variant="primary" size="md">
        Primary
      </Button>
      <Button variant="secondary" isLoading>
        Loading
      </Button>
      <Button variant="danger" icon={<TrashIcon />}>
        Delete
      </Button>
    </>
  );
}
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost' | 'danger'`
- `size`: `'sm' | 'md' | 'lg'`
- `isLoading`: Show loading spinner
- `icon`: Optional icon element
- All standard `<button>` attributes

### Card

Container component with optional header, title, content, and footer.

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@eft-tracker/ui';

export function QuestCard({ quest }) {
  return (
    <Card hoverable>
      <CardHeader>
        <CardTitle>{quest.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Level: {quest.level}</p>
        <p>Trader: {quest.trader}</p>
      </CardContent>
    </Card>
  );
}
```

**Components:**
- `Card`: Main container
- `CardHeader`: Header section with optional bottom border
- `CardTitle`: Heading text
- `CardContent`: Main content area
- `CardFooter`: Footer section with top border

**Props:**
- `Card`: `hoverable` (optional) - adds hover shadow

### Badge

Status badge component for tags, labels, and indicators.

```typescript
import { Badge } from '@eft-tracker/ui';

export function QuestStatus({ quest }) {
  return (
    <div>
      {quest.completed && <Badge variant="success">Completed</Badge>}
      {quest.inProgress && <Badge variant="warning">In Progress</Badge>}
      {quest.failed && <Badge variant="error">Failed</Badge>}
    </div>
  );
}
```

**Props:**
- `variant`: `'default' | 'success' | 'warning' | 'error' | 'info'`
- All standard `<span>` attributes

## Adding New Components

1. Create new file in `src/` (e.g., `src/modal.tsx`)
2. Export from `src/index.ts`
3. Update this README with usage example
4. Consider adding unit tests in root `__tests__/`

## Styling

All components use Tailwind CSS. Make sure your app has:

```typescript
// tailwind.config.ts
import { config } from '@eft-tracker/theme/tailwind';

export default config;
```

And includes Tailwind directives:

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```
