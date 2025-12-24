# Refactoring UI Design Guide

A condensed reference of design principles from "Refactoring UI" by Adam Wathan & Steve Schoger. Use this guide for all UI design decisions.

---

## Quick Reference (Top 10 Rules)

1. **Start with a feature, not a layout** - Design actual functionality first, not the shell
2. **Design in grayscale first** - Forces you to use spacing, contrast, and size for hierarchy
3. **Limit choices with systems** - Define scales for spacing, typography, colors, shadows up front
4. **Not all elements are equal** - Create visual hierarchy; de-emphasize secondary content
5. **Labels are a last resort** - Let the data speak; format and context often suffice
6. **Start with too much white space** - Then remove it; easier than adding
7. **Keep line length 45-75 characters** - Optimal readability for paragraphs
8. **Use HSL for colors** - Easier to create consistent palettes than hex/RGB
9. **Shadows convey elevation** - Use consistent shadow scale for depth hierarchy
10. **Use fewer borders** - Try spacing, color, or shadows instead

---

## 1. Starting from Scratch

### Start with a Feature, Not a Layout

- Don't design the navigation bar first
- An "app" is a collection of features - design those
- You might not need the shell at all (Google homepage)

### Detail Comes Later

- Don't obsess over typefaces, shadows, icons initially
- Design in grayscale - forces hierarchy through spacing/contrast/size
- Sketches and wireframes are disposable - move fast

### Don't Design Too Much

- Don't design every feature before implementing
- Work in short cycles: design simple version → build → iterate
- **Be a pessimist**: design smallest useful version first
- "Nice-to-haves" should be designed later

### Choose a Personality

- **Font choice**: Serif = elegant/classic, Rounded sans = playful, Neutral sans = plain
- **Color**: Blue = safe, Gold = sophisticated, Pink = fun
- **Border radius**: Small = neutral, Large = playful, None = serious/formal
- **Language**: Less personal = official, Casual = friendly
- Stay consistent - don't mix square and rounded corners

### Limit Your Choices

Define systems in advance for:
- Font size
- Font weight
- Line height
- Color
- Margin/Padding
- Width/Height
- Box shadows
- Border radius
- Border width
- Opacity

**Design by elimination**: With constrained options, try adjacent values and pick the best.

---

## 2. Hierarchy is Everything

### Not All Elements Are Equal

- Visual hierarchy = how important elements appear relative to each other
- When everything competes for attention, it feels chaotic
- Deliberately de-emphasize secondary/tertiary information

### Size Isn't Everything

- Don't rely only on font size for hierarchy
- Use **font weight** (400-500 normal, 600-700 emphasis)
- Use **color** for hierarchy:
  - Dark color for primary content (headlines)
  - Grey for secondary (dates, metadata)
  - Lighter grey for tertiary (copyright, hints)
- **Avoid font weights under 400** - too hard to read at small sizes

### Don't Use Grey Text on Colored Backgrounds

- Grey on white works because it reduces contrast
- On colored backgrounds, hand-pick a color with same hue but adjusted saturation/lightness
- Don't just use white text with reduced opacity (looks washed out)

### Emphasize by De-emphasizing

- If primary element doesn't stand out, de-emphasize competitors instead
- Give inactive nav items softer colors
- Let sidebars sit on page background without their own color

### Labels Are a Last Resort

- **Format often suffices**: email, phone, price are self-evident
- **Context helps**: "Customer Support" under a name needs no "Department:" label
- **Combine label and value**: "12 left in stock" not "In stock: 12"
- When labels needed, **de-emphasize them** (smaller, lighter, thinner)
- Only emphasize labels when users scan for them (spec sheets)

### Separate Visual from Document Hierarchy

- `<h1>` doesn't mean it should be huge
- Section titles often act as labels - keep them small
- Pick elements for semantics, style for visual hierarchy

### Balance Weight and Contrast

- Bold text covers more surface area = feels emphasized
- Icons are "heavy" - reduce contrast (softer color) to balance with text
- Thin borders too subtle? Make them heavier instead of darker

### Semantics Are Secondary

- Don't design buttons purely on semantic meaning (primary/secondary/danger)
- Design based on hierarchy: What's the ONE true primary action?
- **Primary**: Solid, high contrast background
- **Secondary**: Outline or lower contrast background
- **Tertiary**: Styled like links
- **Destructive actions**: Not always red/bold - use confirmation dialogs for emphasis

---

## 3. Layout and Spacing

### Start with Too Much White Space

- White space is usually added, not removed
- Start with way too much, then remove until happy
- Dense UIs have their place, but make it deliberate

### Establish a Spacing and Sizing System

- Linear scale doesn't work (120px vs 125px is meaningless)
- Adjacent values should differ by ~25%+
- **Recommended scale (base 16px)**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

```
4px   - Tight internal spacing
8px   - Default small gap
12px  - Medium-small
16px  - Base unit
24px  - Component padding
32px  - Section gaps
48px  - Large gaps
64px  - Section padding
96px  - Hero padding
128px - Major sections
```

### You Don't Have to Fill the Whole Screen

- If you only need 600px, use 600px
- Extra space around edges never hurts
- **Shrink the canvas**: Design mobile first if struggling with large canvas
- **Think in columns**: Split narrow content into columns rather than stretching

### Grids Are Overrated

- Grids give fluid percentage widths
- **Sidebars should be fixed width**, main content flexible
- Don't shrink elements until you need to
- Use max-width, let elements shrink only when viewport demands

### Relative Sizing Doesn't Scale

- 2.5em headline on desktop ≠ right size on mobile
- Large elements should shrink faster than small elements
- **Fine-tune independently** - don't lock proportions

### Avoid Ambiguous Spacing

- More space **around** groups than **within** them
- Form: More space between field groups than between label and input
- Lists: More space between items than line-height within items
- Applies horizontally too

---

## 4. Designing Text

### Establish a Type Scale

- Don't use every pixel value from 10-24px
- Modular scales (4:5 ratio) sound nice but have issues:
  - Fractional values
  - Jumps often too limiting for UI

**Recommended hand-crafted scale:**

```
12px - Small labels, captions
14px - Secondary text, metadata
16px - Body text (base)
18px - Large body, lead paragraphs
20px - Small headings
24px - Section headings
30px - Page headings
36px - Large headings
48px - Hero headings
60px - Display text
72px - Large display
```

- **Avoid em units** for type scale - nesting causes computed values to drift

### Use Good Fonts

- **Safe choice**: Neutral sans-serif (Helvetica, system fonts)
- **Filter by weights**: Fonts with 5+ weights are usually better crafted
- **Optimize for legibility**: Avoid condensed typefaces for body text
- **Trust popularity**: Popular fonts on Google Fonts are usually good
- **Steal from good sites**: Inspect typography on well-designed sites

### Keep Your Line Length in Check

- **45-75 characters per line** for best readability
- Use `em` units for width: 20-35em is the sweet spot
- If content area is wider, still constrain paragraph width

### Baseline, Not Center

- When mixing font sizes on one line, align by baseline
- Center alignment of mixed sizes looks awkward

### Line-Height Is Proportional

- **Narrow content**: Can use tighter line-height (~1.5)
- **Wide content**: Needs taller line-height (up to 2)
- **Large text**: Needs less line-height (can be 1 for headlines)
- **Small text**: Needs more line-height
- Line-height and font size are **inversely proportional**

### Not Every Link Needs a Color

- In link-heavy interfaces, colored links are overbearing
- Use heavier font weight or darker color instead
- Ancillary links: underline or color only on hover

### Align with Readability in Mind

- **Left-align** most text (for LTR languages)
- **Center**: Only for headlines or short blocks (2-3 lines max)
- **Right-align numbers** in tables
- **Hyphenate justified text** to avoid awkward gaps

### Use Letter-Spacing Effectively

- Trust the typeface designer by default
- **Tighten headlines**: If using wide-spaced font for headlines
- **Increase for all-caps**: Uppercase text is harder to read, more spacing helps

---

## 5. Working with Color

### Ditch Hex for HSL

- **Hue**: Position on color wheel (0-360°)
- **Saturation**: How colorful (0% = grey, 100% = vivid)
- **Lightness**: How close to black/white (0% = black, 50% = pure color, 100% = white)
- HSL makes it easy to create related colors

### You Need More Colors Than You Think

Five hex codes won't cut it. You need:

**Greys (8-10 shades)**:
- Text, backgrounds, panels, form controls
- Start dark grey (not pure black), work to white

**Primary Colors (5-10 shades each)**:
- For buttons, navigation, branding
- Include ultra-light (tinted backgrounds) and dark (text)

**Accent Colors (5-10 shades each)**:
- Yellow/teal for highlighting new features
- Red for destructive/errors
- Yellow for warnings
- Green for success/positive trends

### Define Your Shades Up Front

Don't use `lighten()` or `darken()` functions - they create inconsistent palettes.

**Process**:
1. Pick **base color** (works as button background)
2. Pick **darkest shade** (for text on light backgrounds)
3. Pick **lightest shade** (for tinted backgrounds)
4. Fill gaps to create 9 shades (100-900)

### Don't Let Lightness Kill Your Saturation

- As lightness approaches 0% or 100%, colors look washed out
- **Increase saturation** for very light/dark shades
- **Rotate hue** toward brighter hues (60°, 180°, 300°) to lighten
- **Rotate hue** toward darker hues (0°, 120°, 240°) to darken
- Don't rotate more than 20-30° or it looks like different color

### Greys Don't Have to Be Grey

- Saturate greys for temperature
- **Cool greys**: Add blue saturation
- **Warm greys**: Add yellow/orange saturation
- Increase saturation for lighter/darker shades to maintain temperature

### Accessible Doesn't Have to Mean Ugly

- **WCAG**: 4.5:1 contrast for normal text, 3:1 for large text
- **Flip the contrast**: Dark text on light colored background instead of white on dark
- **Rotate hue**: Toward brighter colors (cyan, magenta, yellow) to increase contrast while keeping colorful

### Don't Rely on Color Alone

- Color blindness affects ~8% of men
- Always combine color with:
  - Icons (up/down arrows for trends)
  - Text labels
  - Patterns
- Use contrast (light vs dark) which colorblind users can distinguish

---

## 6. Creating Depth

### Emulate a Light Source

- **Light comes from above** (like the sun)
- Top edges should be lighter (facing light)
- Bottom edges should be darker (facing away)

**Raised elements**:
- Lighter top edge (border or inset shadow)
- Dark shadow below element

**Inset elements**:
- Lighter bottom edge
- Dark shadow at top inside

### Use Shadows to Convey Elevation

- Small shadows = slightly raised (buttons)
- Medium shadows = floating above (dropdowns)
- Large shadows = high elevation (modals)

**Define 5 shadow levels**:
```css
--shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
--shadow-md:  0 4px 6px rgba(0,0,0,0.1);
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1);
--shadow-xl:  0 20px 25px rgba(0,0,0,0.15);
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);
```

**Combine with interaction**:
- Drag item: Add larger shadow (feels lifted)
- Press button: Remove/reduce shadow (feels pressed)

### Shadows Can Have Two Parts

1. **Large, soft shadow**: Simulates direct light source
2. **Small, tight shadow**: Simulates ambient shadow underneath

At higher elevations, reduce the tight shadow (it disappears as objects rise).

### Even Flat Designs Can Have Depth

- **Color**: Lighter = closer, darker = further
- **Solid shadows**: Vertical offset, no blur, maintains flat aesthetic

### Overlap Elements to Create Layers

- Offset cards to cross background transitions
- Make elements taller than parents
- Use "invisible borders" matching background to separate overlapping images

---

## 7. Working with Images

### Use Good Photos

- Bad photos ruin good designs
- Hire professionals or use quality stock (Unsplash)
- Don't use smartphone photos as placeholders

### Text Needs Consistent Contrast

Problems with text on images:
- Light areas wash out white text
- Dark areas hide dark text

**Solutions**:
- **Semi-transparent overlay** (black darkens, white lightens)
- **Lower image contrast** + adjust brightness
- **Colorize image** (desaturate, add solid fill with multiply blend)
- **Text shadow** (large blur, no offset - like a glow)

### Everything Has an Intended Size

- **Don't scale up icons**: 16-24px icons look chunky at 3-4x size
  - Enclose small icons in larger shapes with background colors
- **Don't scale down screenshots**: Text becomes unreadable
  - Take screenshots at smaller viewport or use partial screenshots
  - Draw simplified UI with text replaced by lines
- **Don't scale down icons either**: Details become muddy
  - Redraw simplified versions for small sizes (favicons)

### Beware User-Uploaded Content

- **Control shape/size**: Use fixed containers with `background-size: cover`
- **Prevent background bleed**: Add subtle inner box-shadow (not border)

---

## 8. Finishing Touches

### Supercharge the Defaults

- Replace bullets with icons (checkmarks, arrows, locks)
- Enlarge and color quotation marks in testimonials
- Custom underlines for links (thick, colorful, overlapping)
- Custom checkboxes/radio buttons with brand colors

### Add Color with Accent Borders

Quick way to add visual interest:
- Top of cards
- Active nav items
- Side of alerts
- Under headlines
- Top of entire layout

### Decorate Your Backgrounds

- Change background color for sections
- Subtle gradients (two hues within 30°)
- Repeating patterns (keep contrast low)
- Simple geometric shapes
- Partial patterns along edges

### Don't Overlook Empty States

- Empty states are first impressions
- Add illustrations or images
- Emphasize call-to-action
- Hide irrelevant UI (filters that do nothing on empty data)

### Use Fewer Borders

Borders can make designs feel busy. Alternatives:
- **Box shadows**: Outline without distraction
- **Different background colors**: Create natural separation
- **Extra spacing**: Simplest form of separation

### Think Outside the Box

- **Dropdowns**: Add sections, columns, icons, supporting text
- **Tables**: Combine columns, add hierarchy, use images/color
- **Radio buttons**: Use selectable cards instead

Don't let conventions limit creativity.

---

## 9. Anti-Patterns to Avoid

1. **Starting with the layout** instead of features
2. **Using only font size** for hierarchy
3. **Grey text on colored backgrounds** (use same-hue adjusted colors)
4. **Equal emphasis** on all elements
5. **Labels for everything** when format/context suffices
6. **Arbitrarily sized elements** without a spacing system
7. **Filling the whole screen** when content doesn't need it
8. **Pure black backgrounds** (#000000 is harsh)
9. **Relying on color alone** for meaning
10. **Too many borders** when spacing/shadows work
11. **Placeholder images** with plans to replace later
12. **Ignoring empty states**
13. **Scaling icons beyond intended size**
14. **Fixed proportions** that don't scale across breakpoints
15. **Center-aligning long paragraphs**

---

## 10. Systems Reference

### Spacing Scale (Base 16px)

| Value | Usage |
|-------|-------|
| 4px | Tight gaps, icon padding |
| 8px | Small component gaps |
| 12px | Form field internal spacing |
| 16px | Default padding |
| 24px | Card padding, form groups |
| 32px | Component gaps |
| 48px | Section gaps |
| 64px | Major section padding |
| 96px | Hero/header padding |

### Type Scale

| Size | Usage |
|------|-------|
| 12px | Captions, badges |
| 14px | Secondary text, metadata |
| 16px | Body text |
| 18px | Lead paragraphs |
| 20px | Small headings |
| 24px | Section headings |
| 30px | Page titles |
| 36px | Large headings |
| 48px | Hero headings |

### Shadow Elevation

| Level | Usage |
|-------|-------|
| sm | Buttons at rest |
| md | Cards, raised elements |
| lg | Dropdowns, popovers |
| xl | Modals, dialogs |
| 2xl | Tooltips on dark backgrounds |

### Color Palette Structure

For each color, define 9 shades (100-900):
- **100-200**: Tinted backgrounds
- **300-400**: Borders, secondary elements
- **500**: Base color (buttons)
- **600-700**: Hover states, dark text
- **800-900**: Headings, dark backgrounds

---

## Credits

Based on "Refactoring UI" by Adam Wathan & Steve Schoger.
https://refactoringui.com/
