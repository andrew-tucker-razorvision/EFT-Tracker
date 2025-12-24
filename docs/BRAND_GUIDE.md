# EFT-Tracker Brand Guide

A tactical/military-inspired dark theme for the Escape from Tarkov quest tracker.

## Color Palette

### Dark Theme Foundation

| Token | Hex | Usage |
| ----- | --- | ----- |
| `--bg-dark` | `#0a0a0a` | Page background |
| `--bg-panel` | `#111111` | Panel/section backgrounds |
| `--bg-card` | `#161616` | Card backgrounds |
| `--bg-elevated` | `#1a1a1a` | Elevated surfaces, modals |

### Text Colors

| Token | Hex | Usage |
| ----- | --- | ----- |
| `--text-bright` | `#e8e6d4` | Primary text, headings (warm cream) |
| `--text-secondary` | `#9a9a8a` | Body text, descriptions |
| `--text-dim` | `#6a6a5a` | Labels, hints, disabled states |

### Accent Colors

| Token | Value | Usage |
| ----- | ----- | ----- |
| `--accent-gold` | `#c4aa6a` | Primary accent, CTAs, highlights |
| `--accent-gold-dim` | `rgba(196,170,106,0.25)` | Hover backgrounds |
| `--accent-gold-glow` | `rgba(196,170,106,0.08)` | Subtle outer borders/glows |

### Status Colors

| Token | Hex | Usage |
| ----- | --- | ----- |
| `--success` | `#4ade80` | Completed, success states |
| `--available` | `#4db8ff` | Available, ready states |
| `--kappa` | `#ffcc00` | Kappa tracking, warnings |

### Borders

| Token | Value | Usage |
| ----- | ----- | ----- |
| `--tactical-border` | `rgba(196,170,106,0.2)` | Default borders |
| `--tactical-border-hover` | `rgba(196,170,106,0.4)` | Hover state borders |
| `--grid-line` | `rgba(196,170,106,0.03)` | Background grid |

---

## Typography

### Font Families

- **Headings**: Rajdhani (Google Fonts) - weights: 400, 500, 600, 700
- **Body**: Inter (Google Fonts) - weights: 400, 500, 600
- **Monospace**: Geist Mono

### Heading Hierarchy

| Level | Size | Weight | Style |
| ----- | ---- | ------ | ----- |
| H1 | `text-4xl md:text-5xl lg:text-6xl` | Bold | Uppercase, Rajdhani, `leading-[1.05]` |
| H2 | `text-3xl md:text-4xl` | Bold | Uppercase, Rajdhani |
| H3 | `text-xl md:text-2xl` | Semibold | Uppercase, Rajdhani |
| H4 | `text-lg` | Bold | Rajdhani |

### Body Text

| Type | Size | Color |
| ---- | ---- | ----- |
| Large body | `text-lg leading-relaxed` | `--text-secondary` |
| Default body | `text-base` | `--text-secondary` |
| Small/labels | `text-sm uppercase tracking-wide` | `--text-dim` |

---

## Component Patterns

### Buttons

**Tactical (Primary CTA)**

```css
bg-[var(--accent-gold)] text-[var(--bg-dark)]
font-bold uppercase tracking-wide
hover:bg-[#d4ba7a] hover:-translate-y-0.5
clip-path: polygon(6px 0, 100% 0, 100% calc(100%-6px), calc(100%-6px) 100%, 0 100%, 0 6px)
```

The angled clip-path creates the signature tactical "cut corner" look.

**Tactical Ghost (Secondary)**

```css
bg-transparent border border-[var(--tactical-border)]
text-[var(--text-secondary)]
hover:border-[var(--tactical-border-hover)] hover:text-[var(--text-bright)]
```

**Tactical Outline**

```css
bg-transparent border border-[var(--accent-gold)]
text-[var(--accent-gold)]
hover:bg-[var(--accent-gold-dim)] hover:text-[var(--text-bright)]
```

### Cards

```css
bg-[var(--bg-panel)] border border-[var(--tactical-border)]
p-6 (or p-4 for compact)
hover:border-[var(--tactical-border-hover)] hover:-translate-y-0.5
transition-all
```

Optional outer glow effect:

```css
/* Wrapper with glow */
.card-glow {
  position: relative;
}
.card-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border: 1px solid var(--accent-gold-glow);
  pointer-events: none;
}
```

### Status Indicators

**Left Border Accent**

```css
border-l-[3px] border-l-[var(--success)]  /* Completed */
border-l-[3px] border-l-[var(--available)] /* Available */
border-l-[3px] border-l-[var(--kappa)]    /* Kappa */
```

**Dot Indicator with Glow**

```css
w-2 h-2 rounded-full bg-[var(--success)]
shadow-[0_0_8px_var(--success)]
```

---

## Layout & Spacing

> Based on "Refactoring UI" by Adam Wathan & Steve Schoger - use strict spacing scales to maintain visual consistency.

### Spacing Scale (8px base)

Use these semantic spacing classes defined in `globals.css`:

| Class | Value | Usage |
| ----- | ----- | ----- |
| `gap-form` | `1.5rem` (24px) | Between form field groups |
| `gap-form-field` | `0.375rem` (6px) | Between label and input within a group |
| `gap-component` | `1rem` (16px) | Between related components |
| `p-card` | `1.5rem` (24px) | Card internal padding |

**Why this matters:** More space between groups than within them creates clear visual hierarchy without relying on dividers.

### Container Widths

| Context | Max Width |
| ------- | --------- |
| Hero sections | `max-w-[1200px]` |
| Content sections | `max-w-[1100px]` |
| Card containers | `max-w-[1024px]` |

### Section Spacing

| Context | Value |
| ------- | ----- |
| Hero padding | `py-16` |
| Section padding | `py-24` |
| Horizontal padding | `px-8` |

### Component Spacing

| Context | Value |
| ------- | ----- |
| Card padding | `p-card` (semantic, 24px) |
| Compact card padding | `p-4` |
| Gap between cards | `gap-6` |
| Gap between list items | `gap-2` |

---

## Shadow Elevation System

> "Use shadows to convey elevation" - Refactoring UI

Shadows communicate depth and importance. Use consistent elevation levels:

| Class | Usage | Components |
| ----- | ----- | ---------- |
| `shadow-sm` | Subtle elevation | Buttons at rest |
| `shadow-elevation-sm` | Low elevation | Cards at rest |
| `shadow-elevation-md` | Medium elevation | Cards on hover |
| `shadow-elevation-lg` | High elevation | Dropdowns, popovers |
| `shadow-elevation-xl` | Maximum elevation | Modals, dialogs |
| `shadow-inset-input` | Inset shadow | Form inputs (emulates light source) |

### Shadow Definitions

```css
--shadow-elevation-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
--shadow-elevation-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
--shadow-elevation-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
--shadow-elevation-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
--shadow-inset-input: inset 0 1px 2px rgba(0, 0, 0, 0.2);
```

---

## Text Hierarchy

> "Labels are a last resort" - Refactoring UI. De-emphasize labels, emphasize data.

### Three-Level System

| Level | Class | Color | Usage |
| ----- | ----- | ----- | ----- |
| Primary | `text-primary` | `--text-bright` | Headlines, key data values |
| Secondary | `text-secondary` | `--text-secondary` | Body text, supporting info |
| Tertiary | `text-tertiary` / `text-label` | `--text-tertiary` | Labels, metadata, timestamps |

### Label/Value Pattern

**Before (wrong):**

```html
<span>Level: 15</span>  <!-- Both same weight/color -->
```

**After (correct):**

```html
<span class="text-label">Lv.</span>
<span class="text-primary font-semibold">15</span>
```

The label is de-emphasized (smaller, dimmer) while the value is prominent.

### Form Labels

Use `text-label` class for form labels:

```html
<Label className="text-label">Email</Label>
<Input ... />
```

### Grid Patterns

**Three-column features:**

```css
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

**Two-column layout:**

```css
grid grid-cols-1 lg:grid-cols-2 gap-8
```

**Hero with sidebar:**

```css
grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16
```

---

## Special Effects

### Background Grid

Applied as a fixed overlay behind all content:

```css
.tactical-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 48px 48px;
}
```

### Radial Gradient Overlay

For hero sections, adds depth with subtle warm glow:

```css
background:
  radial-gradient(ellipse at 30% 20%, rgba(196,170,106,0.06) 0%, transparent 50%),
  radial-gradient(ellipse at 70% 80%, rgba(139,69,19,0.03) 0%, transparent 40%);
```

### Hover Effects

**Card lift:**

```css
hover:-translate-y-0.5 transition-all
```

**Border brighten:**

```css
border-[var(--tactical-border)]
hover:border-[var(--tactical-border-hover)]
```

### Glow Effects

**Success indicator glow:**

```css
shadow-[0_0_8px_var(--success)]
```

**Gold accent glow:**

```css
shadow-[0_0_12px_var(--accent-gold-glow)]
```

---

## Responsive Design

### Breakpoints

| Name | Width | Usage |
| ---- | ----- | ----- |
| Default | 0px+ | Mobile-first base styles |
| `md` | 768px | Tablet, 2-column layouts |
| `lg` | 1024px | Desktop, full layouts |
| `xl` | 1280px | Wide screens |

### Common Patterns

**Typography scaling:**

```css
text-4xl md:text-5xl lg:text-6xl
```

**Grid responsiveness:**

```css
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

**Layout stacking:**

```css
/* Stacks on mobile, side-by-side on desktop */
grid-cols-1 lg:grid-cols-[1fr_400px]
```

---

## Design Philosophy

1. **Near-black, not pure black** - `#0a0a0a` feels less harsh than `#000000`
2. **Warm gold accent** - `#c4aa6a` provides military/tactical feel without being garish
3. **Subtle effects** - Low opacity glows and borders add depth without distraction
4. **Uppercase headings** - Reinforces tactical/military aesthetic
5. **Lift on hover** - Small `-translate-y-0.5` gives cards tactile feedback
6. **Status colors with purpose** - Green=done, Blue=available, Yellow=special (Kappa)

---

## CSS Variables Reference

All variables should be defined in your global CSS:

```css
:root {
  /* Backgrounds */
  --bg-dark: #0a0a0a;
  --bg-panel: #111111;
  --bg-card: #161616;
  --bg-elevated: #1a1a1a;

  /* Text */
  --text-bright: #e8e6d4;
  --text-secondary: #9a9a8a;
  --text-dim: #6a6a5a;
  --text-tertiary: #6a6a5a; /* Same as dim, semantic alias */

  /* Accent */
  --accent-gold: #c4aa6a;
  --accent-gold-dim: rgba(196, 170, 106, 0.25);
  --accent-gold-glow: rgba(196, 170, 106, 0.08);

  /* Status */
  --success: #4ade80;
  --available: #4db8ff;
  --kappa: #ffcc00;

  /* Borders */
  --tactical-border: rgba(196, 170, 106, 0.2);
  --tactical-border-hover: rgba(196, 170, 106, 0.4);
  --grid-line: rgba(196, 170, 106, 0.03);

  /* Shadow Elevation System (Refactoring UI) */
  --shadow-elevation-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2);
  --shadow-elevation-md: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
  --shadow-elevation-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.25);
  --shadow-elevation-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  --shadow-inset-input: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}
```

---

## Refactoring UI Principles Applied

This design system incorporates key principles from "Refactoring UI":

1. **Limit your choices** - Strict spacing scale (8px base), defined shadow levels
2. **Labels are a last resort** - De-emphasize labels, emphasize data values
3. **Avoid ambiguous spacing** - More space between groups than within
4. **Use shadows to convey elevation** - Consistent depth hierarchy
5. **Start with too much white space** - Generous padding creates breathing room
6. **Semantics are secondary** - Button hierarchy based on visual importance, not HTML semantics
