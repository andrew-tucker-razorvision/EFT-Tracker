# @eft-tracker/theme

Centralized design system tokens for EFT Tracker.

This package exports:
- **Color palette**: Primary, gray, status colors (success, warning, error)
- **Spacing scale**: 0 to 64rem
- **Typography**: Font families, sizes, and weights
- **Breakpoints**: Mobile-first responsive design
- **Border radius**: Consistent border radius values
- **Shadows**: Subtle to prominent box shadows
- **Z-index scale**: Layering system for modals, popovers, etc.
- **Animation**: Duration and easing values
- **Tailwind config**: Ready-to-use Tailwind configuration

## Usage

### Import theme tokens

```typescript
import { colors, spacing, typography, breakpoints } from '@eft-tracker/theme';

// Use in JavaScript
const primaryColor = colors.primary[500];

// Or use in Tailwind with the provided config
```

### Use Tailwind config

```typescript
// tailwind.config.ts
import { config } from '@eft-tracker/theme/tailwind';

export default config;
```

## Theme Structure

```
colors:
  ├── primary (sky)
  ├── gray
  ├── success (green)
  ├── warning (yellow)
  ├── error (red)
  └── semantic (background, foreground, border)

spacing: 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, ...

typography:
  ├── fontFamily (sans, mono)
  ├── fontSize (xs to 4xl)
  └── fontWeight (thin to black)
```

All values follow Tailwind CSS conventions for consistency across the ecosystem.
