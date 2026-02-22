# CLAUDE.md

## Project Overview

Template for illustrated, interactive articles about math and CS. Built with SolidJS + Vite + TypeScript + KaTeX. Deployed to GitHub Pages.

## Working Log

**IMPORTANT:** This project maintains a working log at `WORKING_LOG.md`. When completing a significant piece of work (new feature, design change, bug fix, or feedback round), append a summary to the log describing:
- What was done and why
- What worked and what didn't
- Any open questions or future work identified

This log is part of an experiment in human-AI collaboration on technical communication, so capturing the process matters as much as the output.

## Key Architecture

- **SolidJS** for reactivity (signals drive SVG attributes directly)
- **KaTeX** for LaTeX math (loaded from CDN, wrapped in `src/lib/Math.tsx`)
- **Inline SVG** for all diagrams — both static and interactive
- **`src/lib/`** — reusable library code (Math, svgClip, colors, seededRandom)
- **`src/components/`** — article-specific diagrams and interactives

## Article Structure Philosophy

- **Always start with concrete examples** — motivation and applications before abstraction
- **Build up incrementally** — one concept at a time, diagram after each new idea
- **Conversational section headers** — questions ("Why does this matter?") or action verbs ("Building the gadget")
- **Every major concept gets a diagram or interactive** — if you can't draw it, the reader can't see it
- **Take advantage of reference images** — user provides photos from talks and papers; match them
- **Diagrams show, captions tell** — short name labels inside diagrams, equations and explanations in captions

### Style References

- "Fastish algorithms for integer programming" paper (co-authored by Josh) — conversational headers, incremental buildup, colored annotations
- The kahn-kalai illustrated guide — the first article built with this template

## Color Palette

Use the constants from `src/lib/colors.ts` for consistency:

| Color  | Hex       | Semantic Use                          |
|--------|-----------|---------------------------------------|
| Blue   | `#2563eb` | Primary structures, links, active     |
| Orange | `#ea580c` | Minimal elements, edges, highlights   |
| Green  | `#16a34a` | Covers, success, key ideas            |
| Red    | `#dc2626` | Emphasis, errors, warnings            |
| Purple | `#7c3aed` | Overlaps, definitions, special        |
| Yellow | `#ca8a04` | Remarks, secondary highlights         |

## Box System

```html
<div class="box">             <!-- Theorem (blue border) -->
<div class="box definition">  <!-- Definition (purple border) -->
<div class="box remark">       <!-- Remark (yellow border) -->
<div class="box key-idea">     <!-- Key Idea (green border) -->
```

Each box needs a `<span class="box-label">Label Text</span>` as first child.

## SVG Conventions

### Set operations via clip paths

When diagrams need set differences (A \ B), intersections, or complements, **always use `clipPath`** — never manually compute intersection geometry. The pattern:

1. **A ∩ B**: draw A clipped to B (`<clipPath>` containing B's shape)
2. **A \ B**: draw A clipped to complement of B (even-odd `<clipPath>` with bounding box minus B)

Helper functions in `src/lib/svgClip.ts`:
- `complementRect(rect, bounds)` — complement of a rectangle
- `complementCircle(circle, bounds)` — complement of a circle
- `complementEllipse(ellipse, bounds)` — complement of an ellipse
- `crescentMetrics(ellipse, cutX, side)` — safe label position for crescent regions

### Math in SVG

Use `<foreignObject>` with KaTeX for math labels inside SVG:
```tsx
<foreignObject x={...} y={...} width={...} height={...}>
  <M tex="A \cap B" />
</foreignObject>
```

### Stroke conventions

- **2px** for primary shape outlines
- **1.5px** for secondary/inner boundaries
- **Dashed** (`stroke-dasharray="6 4"`) for hypothetical or removed elements

## Interactive Patterns

```tsx
import { createSignal, createMemo, Show, For } from "solid-js";

// Signal for slider/button state
const [step, setStep] = createSignal(0);

// Derived values
const highlighted = createMemo(() => items().filter(predicate));

// Conditional rendering
<Show when={step() >= 2}>
  <circle ... />
</Show>

// List rendering
<For each={edges()}>
  {(edge) => <line ... />}
</For>

// Controls
<div class="diagram-controls">
  <label>Step <input type="range" ... /></label>
  <span class="value-display">{step()}</span>
</div>
```

## CSS Classes Reference

| Class | Use |
|-------|-----|
| `.container` | Max-width content wrapper (740px) |
| `.wide` | Wider wrapper (900px) |
| `.abstract` | Article abstract block |
| `.box` / `.box.definition` / `.box.remark` / `.box.key-idea` | Callout boxes |
| `.diagram-container` | Centers SVG diagrams |
| `.diagram-caption` | Muted caption below diagrams |
| `.diagram-controls` | Flex container for sliders/buttons |
| `.diagram-placeholder` | Dashed border placeholder for future diagrams |
| `.comparison` | Two-column grid for before/after |
| `.legend` / `.legend-item` / `.legend-swatch` | Diagram legends |
| `.step-indicator` / `.step-dot` | Multi-step progress dots |
| `em.concept` | Blue bold inline emphasis |
| `strong.highlight` | Orange bold inline emphasis |
| `.math-display` / `.math-inline` | KaTeX rendered math |
| `.anno` | Small bold annotation labels in SVGs |
| `.page-layout` / `.page-main` | Top-level flex layout |
| `.notation-sidebar` | Fixed notation reference (optional, hidden <1200px) |

## Conventions

- Dev server runs on **port 5555**. Do NOT kill processes on other ports.
- Reference materials (PDFs, photos) go in `reference-materials/` (gitignored).
- The `base` path in vite.config.ts is read from `BASE_PATH` env var. The GitHub Actions workflow sets this automatically. For local dev, `vite dev` works without it.
