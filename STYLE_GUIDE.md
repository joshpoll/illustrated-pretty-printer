# Visualization Cookbook

Techniques and patterns learned from building illustrated math/CS articles. Reference this when creating new diagrams.

## 1. Venn Diagrams via Clip Paths

Use `complementCircle` / `complementEllipse` / `complementRect` from `src/lib/svgClip.ts` to build clip regions.

```tsx
import { complementCircle } from "../lib/svgClip";

const A = { cx: 150, cy: 130, r: 80 };
const B = { cx: 240, cy: 130, r: 80 };
const bounds = { w: 400, h: 260 };

// In <defs>:
<clipPath id="outsideB">
  <path clip-rule="evenodd" d={complementCircle(B, bounds)} />
</clipPath>

// A \ B: draw A clipped to outside B
<g clip-path="url(#outsideB)">
  <circle cx={A.cx} cy={A.cy} r={A.r} fill="blue" fill-opacity={0.2} />
</g>
```

Key rules:
- The bounding box in `bounds` must cover the entire SVG viewBox
- Always use `clip-rule="evenodd"` on the complement path
- Draw full outlines separately on top (unclipped) so borders aren't cut off

## 2. Set Difference Rendering

To show A \ B with distinct styling:
1. Define `<clipPath id="outsideB">` using the complement path
2. Draw shape A inside `<g clip-path="url(#outsideB)">` with the A-only styling
3. Optionally draw A ∩ B by clipping A to insideB with overlap styling
4. Draw full outlines of both A and B on top

This ensures regions are **structurally derived** — change A or B and everything updates.

## 3. Label Placement in Clipped Regions

Use `crescentMetrics()` from svgClip.ts to find safe label positions in crescent-shaped regions (e.g., the part of an ellipse on one side of a vertical cut line).

```tsx
import { crescentMetrics } from "../lib/svgClip";

const metrics = crescentMetrics(ellipse, cutX, 'left');
// metrics.center.x, metrics.center.y — safe label position
// metrics.width, metrics.height — available space
```

The position is ~55% from the cut line toward the far edge — in the "meat" of the crescent.

## 4. Hatching Patterns for Overlaps

For regions that need a pattern fill instead of solid color:

```tsx
<defs>
  <pattern id="hatch" patternUnits="userSpaceOnUse"
    width="8" height="8" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="8"
      stroke={colors.purple} stroke-width="1.5" />
  </pattern>
</defs>

<circle ... fill="url(#hatch)" />
```

## 5. Math in SVG via foreignObject

For LaTeX labels inside SVG elements:

```tsx
<foreignObject x={labelX - 40} y={labelY - 15} width={80} height={30}>
  <div style="text-align: center;">
    <M tex="A \cap B" />
  </div>
</foreignObject>
```

Tips:
- Give generous width/height — foreignObject clips overflow
- Center the content with a wrapper div
- For simple single-character labels, plain `<text>` is fine; use foreignObject when you need real math

## 6. Interactive Step-Through Diagrams

Pattern for diagrams that reveal content step by step:

```tsx
import { createSignal, Show } from "solid-js";

const [step, setStep] = createSignal(0);

// SVG content that appears conditionally
<Show when={step() >= 1}>
  <circle ... />
</Show>
<Show when={step() >= 2}>
  <line ... />
</Show>

// Controls below the diagram
<div class="diagram-controls">
  <button onClick={() => setStep(Math.max(0, step() - 1))}>Prev</button>
  <span class="value-display">Step {step() + 1} / 3</span>
  <button onClick={() => setStep(Math.min(2, step() + 1))}>Next</button>
</div>
```

## 7. Seeded PRNG for Reproducible Randomness

When diagrams need random-looking but stable layouts:

```tsx
import { seededRandom } from "../lib/seededRandom";

// Always produces the same value for seed=42
const x = seededRandom(42) * width;

// Generate a stable sequence
const positions = Array.from({ length: 10 }, (_, i) => ({
  x: seededRandom(i * 2) * width,
  y: seededRandom(i * 2 + 1) * height,
}));
```

## 8. Color Coding Conventions

Import from `src/lib/colors.ts`:

```tsx
import { colors } from "../lib/colors";

<circle fill={colors.blue} />       // Primary structures
<circle fill={colors.orange} />     // Minimal elements, edges
<circle fill={colors.green} />      // Covers, success states
<circle fill={colors.red} />        // Emphasis, errors
<circle fill={colors.purple} />     // Overlaps, definitions
```

Use `fill-opacity` (0.1–0.3) for region fills, full opacity for strokes and labels.

## 9. Diagram Layout Patterns

Standard structure:

```tsx
<div class="diagram-container">
  <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
    <defs>
      {/* clip paths, patterns, gradients */}
    </defs>
    {/* diagram content */}
  </svg>
  <div class="diagram-caption">
    Caption with <M tex="\text{math}" /> goes here.
  </div>
</div>
```

- Use `class="diagram-container wide"` for wider diagrams (900px vs 740px)
- Always set explicit `viewBox` and `width`/`height`
- The CSS handles responsive scaling automatically
