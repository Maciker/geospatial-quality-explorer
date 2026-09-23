# CSS Modules

## File Structure

- Naming: `ComponentName.module.css`
- Location next to the component in `infrastructure/ui/`
- Import as `styles`
- One `.module.css` file per component

## Layout with Flexbox

- Flexbox as standard for all layouts
- Grid allowed only for 2D galleries or clearly bidimensional layouts
- Avoid floats completely
- Common patterns:
  - `display: flex; flex-direction: column` for vertical stacks
  - `display: flex; justify-content: space-between` for distribution
  - `gap` for spacing between elements

```css
.container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

## Prohibitions

- No Tailwind, Bootstrap or utility CSS frameworks
- No preprocessors (Sass, Less, Stylus) - pure CSS only
- No `!important`
- No inline styles (except dynamic values calculated in JS)
- No global CSS (except `globals.css` for resets and variables)
- No nesting deeper than 2 levels
- No type selectors (`div`, `span`) - use classes
- No complex selectors (`div > span + p`)
- No `text-align: justify`

## Single Class per Element

Every element in JSX must have **one single className**. Never combine classes with template literals. All composition must happen in CSS using `composes`.

```tsx
// Bad — combining classes in JSX
<button className={`${styles.button} ${styles.buttonPrimary}`}>

// Good — single class, composition in CSS
<button className={styles.buttonPrimary}>
```

## Composition with `composes`

Use CSS Modules `composes` to reuse base styles and avoid duplication.

```css
.button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.buttonPrimary {
  composes: button;
  background-color: var(--button-bg-color);
  color: var(--button-text-color);
}

.buttonSecondary {
  composes: button;
  background-color: transparent;
  border: 1px solid var(--border-color);
}
```

## CSS Variables and Theming

- Use variables from `globals.css` for colors and theming
- Never hardcode colors (except transparencies like `rgba()`)
- Available variables: `--bg-color`, `--text-color`, `--text-secondary-color`, `--border-color`, `--button-bg-color`, `--button-text-color`, `--link-color`, `--bg-code-color`

## Class Naming

- **camelCase** for names (consistent with JS)
- **Semantic names by function**, not by style
- Good: `container`, `header`, `actions`, `cardTitle`, `submitButton`
- Bad: `flexRow`, `mt10`, `bgBlue`, `w100`

## Property Order (recommended)

1. Layout: `display`, `flex-direction`, `justify-content`, `align-items`, `gap`
2. Positioning: `position`, `top`, `right`, `bottom`, `left`, `z-index`
3. Box model: `width`, `height`, `padding`, `margin`, `box-sizing`
4. Typography: `font-size`, `font-weight`, `line-height`, `letter-spacing`, `color`
5. Visual: `background`, `border`, `border-radius`, `box-shadow`
6. Effects: `opacity`, `transform`, `transition`, `animation`

## Units

- **rem** for spacing, font-sizes, and flexible dimensions (respects accessibility)
- **px** for thin borders (1px, 2px) and shadows
- **%** or **viewport units** for responsive layouts
- Avoid magic values - use consistent multiples (8px, 16px, 24px, 32px, 48px)

**Why rem for font-size:** `px` ignores user accessibility preferences. `rem` scales if the user increases the base font size in their browser.

```css
/* Bad - ignores accessibility preferences */
.title { font-size: 32px; }

/* Good - respects user preferences */
.title { font-size: 2rem; }
```

## Typography

**Principle: Design should help text be read better.**

- Use only font variables defined in `globals.css`:
  - `--font-heading` for titles (h1-h6)
  - `--font-body` for general text
- Maximum two fonts: One for titles, one for body
- Font sizes always in `rem`
- Left alignment by default
- Never justify text
- Center text only in very specific cases (heroes, CTAs)
- Good line height (`line-height: 1.5` - `1.6`)

```css
.title {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 700;
  text-align: left;
}

.text {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
  text-align: left;
}
```

### Typographic Scale

| Use | Size | rem |
|-----|------|-----|
| Small text | 14px | 0.875rem |
| Body text | 16px | 1rem |
| h3, subtitles | 24px | 1.5rem |
| h2 | 32px | 2rem |
| h1 | 36-40px | 2.25-2.5rem |

## Animations and Transitions

- CSS transitions allowed for interactive states (hover, focus, disabled)
- Keyframes allowed in moderation
- Durations: 150-300ms for transitions, max 500ms for animations
- Use `ease`, `ease-in-out` - avoid `linear` for UI

```css
.button {
  transition: opacity 0.2s ease, background-color 0.2s ease;
}
```

## Responsive

- Limit widths: Always use `max-width` when using `width: 100%`
- Flexbox first: Flexbox layouts are naturally responsive
- Media queries only when necessary for structural changes
- Main breakpoint: `768px`
- Standard max-width: `1400px` (`--max-width` variable)
- Buttons with enough space to tap on mobile

```css
.container {
  width: 100%;
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 3rem;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
}
```

## White Space

- Leave air between sections (use `gap`, `margin`, `padding` generously)
- Space helps visual hierarchy
- White space is not wasted space

## Contrast and Readability

- Dark text on light background (or vice versa in dark mode)
- Never light gray text on white - use `--text-color` and `--text-secondary-color`
- Links with distinctive color
- Use theme variables to guarantee contrast in both modes

## Accessibility

- Never remove `outline` without providing a `:focus-visible` alternative
- Buttons with minimum touchable size (44x44px on mobile)
- Text not too small on mobile (minimum 14px / 0.875rem)

```css
.button:focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: 2px;
}
```
