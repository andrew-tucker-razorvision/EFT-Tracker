# EFT-Tracker Brand & Design System

**Full documentation:** `docs/BRAND_GUIDE.md`

## Universal Design Principles

For general UI design principles, see:

- `.claude/REFACTORING_UI_GUIDE.md` - Condensed Refactoring UI principles
- `.claude/UI_REVIEW_CHECKLIST.md` - Pre-ship UI checklist

Project-specific rules below override global defaults where they conflict.

## Quick Reference

When making UI changes, follow the tactical/military dark theme:

- **Background**: Near-black (#0a0a0a), not pure black
- **Primary Accent**: Gold (#c4aa6a)
- **Headings**: Rajdhani font, uppercase, bold
- **Body**: Inter font
- **Status Colors**: Green (#4ade80 success), Cyan (#4db8ff available), Yellow (#ffcc00 kappa)

## Required Patterns

1. **Use CSS variables** - `var(--accent-gold)`, `var(--bg-panel)`, `var(--text-bright)`, etc.
2. **Card hover effects** - `hover:-translate-y-0.5` lift + `hover:border-[var(--tactical-border-hover)]`
3. **Tactical buttons** - Angled clip-path corners on primary CTAs
4. **Typography** - Uppercase headings with `tracking-wide` letter-spacing
5. **Borders** - Use `var(--tactical-border)` (gold-tinted, not gray)

## Key CSS Variables

```
--bg-dark, --bg-panel, --bg-card, --bg-elevated
--text-bright, --text-secondary, --text-dim
--accent-gold, --accent-gold-dim, --accent-gold-glow
--success, --available, --kappa
--tactical-border, --tactical-border-hover
```

Always reference `docs/BRAND_GUIDE.md` for complete specifications.
