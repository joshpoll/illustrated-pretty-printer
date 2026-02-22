# Working Log

Record of significant changes, design decisions, and process notes.

---

## 2026-02-22: ConcatSchematic — progressive abstraction diagram + reusable SVG arrows

### What was done
- Created `src/components/ConcatSchematic.tsx`, a three-step progressive abstraction diagram for tetris concatenation in Section 3:
  - **Step 1 (Concrete text)**: Colored monospace text showing the concatenation result — blue for left operand lines, orange for right, with the join line split at the cursor column.
  - **Step 2 (+ Measure shapes)**: Same text with semi-transparent L-shaped outlines overlaid, showing how each operand's measure (h, mw, lw) corresponds to a geometric silhouette.
  - **Step 3 (+ Result outline)**: Adds a dashed black outline showing the combined result's measure shape encompassing both operands.
- Below the stepped view, a **permanent abstract equation** renders in the style of the paper's Figure 5.1: `[blue L-shape] <> [orange L-shape] = [combined shape]` with dimension arrows annotated with the concatenation formulas (max mw_a (lw_a+mw_b), l_a+l_b, lw_a+lw_b).
- **Removed `TetrisConcatDemo`** from App.tsx — ConcatSchematic replaces it with a richer visualization. The old file remains on disk but is no longer imported.
- Created `src/lib/svgArrows.tsx` — reusable `DimArrow`, `HDimArrow`, and `VDimArrow` components for dimension-line annotations in SVG diagrams.
- Updated `CLAUDE.md` with a note on progressive abstraction in the Article Structure Philosophy section.

### Design decisions
- **Arrowheads as explicit paths, not SVG markers.** SVG `<marker>` elements don't reliably inherit `stroke` color from their parent `<line>` via `currentColor` across browsers. Drawing arrowhead chevrons as `<path>` elements in a `<g>` alongside the line ensures consistent color.
- **Height arrows span body only, not last line.** Matching the paper's convention: h counts line breaks, so the height annotation spans from the top of the shape down to the "step" where the last line begins. This avoids double-counting the last line (which is annotated separately by lw).
- **Labels use SVG `<tspan>` subscripts** rather than Fira Mono formatting. The `Sub` helper renders proper subscripts (e.g. mw_a → mw with small subscript a), and the label font inherits the body serif for a cleaner look matching the paper's style.
- **No annotations on the concrete text view.** Early iterations had dimension arrows on the concrete text (steps 1-3), but they were cluttered and overlapped the code. The abstract equation below serves this purpose better.

### What worked
- The L-shape path generator (`measureShapePath`) cleanly handles the three cases: single-line (rect), last-line-wider-than-body (rect), and standard L-shape.
- Progressive disclosure (step 1→2→3) works well pedagogically — the reader sees the concrete operation first, then the geometric interpretation layers in.

### What didn't
- First pass at HDimArrow had the `above` semantics inverted due to SVG's y-down coordinate system. The perpendicular "left of travel" for a left-to-right arrow points downward, so `above=true` was actually placing labels below. Fixed by flipping the sign in the labelOffset calculation.
- Annotation spacing required several iterations. Initial offsets (6-8px) caused arrows and labels to overlap the shapes. Final values: 14px arrow-to-shape gap, 20px label perpendicular offset, 40px vertical padding.

### Open questions / future work
- The `svgArrows.tsx` VDimArrow label semantics could also be cleaned up (left/right naming vs. offset sign), but the current API works.
- Could extract the `measureShapePath` function to a shared lib if other components need it.
- The `TetrisConcatDemo.tsx` file could be deleted from the repo since it's no longer imported.

---

## 2026-02-22: Monospace font + SVG text rendering fixes

### What was done
- Added Fira Mono (Google Fonts) as the monospace font, replacing the SF Mono/Fira Code fallback stack that wasn't reliably available.
- Fixed three compounding SVG text rendering issues in WidthSliderDemo (Section 1) and MeasureDiagram (Section 3):
  1. **CSS specificity**: The template's `svg text { font-family: var(--font-body) }` rule was silently overriding `font-family` SVG attributes, rendering "monospace" text in Palatino. Fixed by using inline `style` instead.
  2. **Whitespace collapsing**: SVG `<text>` drops leading spaces, so indented pretty-printer output was rendering flush-left. Fixed with `white-space: pre`.
  3. **charW measurement**: Switched from Canvas `measureText` to SVG `getComputedTextLength()` on a hidden `<text>` element, ensuring annotation lines/brackets align with the actual rendered text.
- Added overflow highlighting to WidthSliderDemo: lines exceeding the page width get a light red background (`#fee2e2`) and red text.

### What worked
- The SVG measurement approach (hidden `<text>` + `getComputedTextLength()`) is reliable and matches rendering exactly.
- `white-space: pre` on SVG text elements is the simplest fix for whitespace.

### What didn't
- Initial attempt used Canvas `measureText` for charW, which gave different results than SVG rendering. The mismatch was subtle — annotation lines were off by a few pixels per character, accumulating over long lines.
- The overflow highlighting initially appeared to fire too early (at width 45 instead of 34), but this turned out to be correct — the missing indentation made it *look* wrong because unindented text appeared much shorter than its true character count.

### Open questions / future work
- Other components (TetrisConcatDemo, AlgorithmStepDemo, DocTreeDiagram, ParetoFrontierDemo) still use `font-family="var(--font-mono)"` attributes and may have the same issues.
- The SVG text gotchas should be upstreamed to the article template. Notes captured in `.claude/projects/.../memory/svg-monospace-text.md`.
- Could extract a shared `useMonoCharWidth()` hook to avoid repeating the measurement pattern.

---
