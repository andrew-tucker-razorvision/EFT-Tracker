# UI Review Checklist

Run through this checklist before shipping any UI changes. Based on "Refactoring UI" by Adam Wathan & Steve Schoger.

---

## Visual Hierarchy

- [ ] **Primary content is clearly emphasized** - Headlines, key data, CTAs stand out
- [ ] **Secondary content is de-emphasized** - Supporting text uses lighter color/weight
- [ ] **Labels don't compete with values** - Labels are smaller/dimmer than data
- [ ] **Not relying only on font size** - Using weight and color for hierarchy too
- [ ] **One clear primary action** - Not multiple competing CTAs

## Spacing & Layout

- [ ] **Spacing from defined scale** - Using consistent values (4, 8, 12, 16, 24, 32, 48, 64px)
- [ ] **More space between groups than within** - Related items grouped visually
- [ ] **No ambiguous spacing** - Clear which elements belong together
- [ ] **Sufficient breathing room** - Not cramped; started with too much space
- [ ] **Not filling space unnecessarily** - Content width matches content needs

## Typography

- [ ] **Line length 45-75 characters** - Paragraphs aren't too wide
- [ ] **Mixed font sizes align by baseline** - Not vertically centered
- [ ] **Headings have tighter line-height** - Large text doesn't need as much
- [ ] **Body text has adequate line-height** - Small text is easy to follow
- [ ] **All-caps has letter-spacing** - Uppercase text is readable
- [ ] **Font sizes from defined scale** - Not arbitrary pixel values

## Color & Contrast

- [ ] **Accessible contrast ratios** - 4.5:1 for normal text, 3:1 for large
- [ ] **Not relying on color alone** - Icons/text supplement color meaning
- [ ] **Colors from defined palette** - Not picking arbitrary colors
- [ ] **No grey text on colored backgrounds** - Using same-hue adjusted colors
- [ ] **Status colors consistent** - Red=error, yellow=warning, green=success

## Depth & Shadows

- [ ] **Shadows convey consistent elevation** - Using defined shadow scale
- [ ] **Light source is consistent** - Top-down lighting throughout
- [ ] **Interactive elements feel clickable** - Buttons have appropriate depth
- [ ] **Not overusing shadows** - Shadows are purposeful, not decorative

## Borders & Separation

- [ ] **Using borders sparingly** - Tried spacing/color/shadows first
- [ ] **Borders from defined scale** - Consistent widths (1px, 2px)
- [ ] **Border colors are subtle** - Not competing with content

## Images & Icons

- [ ] **Icons at intended size** - Not scaled up beyond design size
- [ ] **Screenshots legible** - Text is readable, not scaled too small
- [ ] **User content controlled** - Fixed containers, prevents layout breaking
- [ ] **Text on images has contrast** - Overlays or shadows if needed

## Interactive States

- [ ] **Hover states defined** - Clear feedback on interactive elements
- [ ] **Active/pressed states** - Buttons feel pressed when clicked
- [ ] **Disabled states clear** - Obviously non-interactive
- [ ] **Focus states visible** - Keyboard navigation is clear

## Edge Cases

- [ ] **Empty states designed** - Not just blank screens
- [ ] **Loading states considered** - Skeleton screens or spinners
- [ ] **Error states handled** - Form errors, API failures
- [ ] **Long content handled** - Truncation, wrapping, scrolling

## Consistency

- [ ] **Matches existing patterns** - Uses established components
- [ ] **Personality is consistent** - Border radius, colors, tone match
- [ ] **Responsive behavior defined** - Works at all breakpoints

---

## Quick Checks

Before every PR with UI changes, verify:

1. **Squint test**: Does hierarchy hold when you squint at the screen?
2. **Grayscale test**: Does it work without color?
3. **Zoom test**: Is it readable at 200% zoom?
4. **Mobile test**: Does it work on narrow viewports?

---

## Common Fixes

| Problem | Solution |
|---------|----------|
| Everything looks the same | De-emphasize secondary content |
| Labels too prominent | Make them smaller, lighter, uppercase |
| Feels cramped | Add more space, start over with too much |
| Borders everywhere | Use spacing or background colors instead |
| Text hard to read on image | Add overlay or text shadow |
| Elements don't group well | Increase space between groups |
| Colors feel off | Check saturation at light/dark ends |
| Shadows look wrong | Use two-part shadows, match elevation |

---

## Reference

Full principles: `~/.claude/REFACTORING_UI_GUIDE.md`
