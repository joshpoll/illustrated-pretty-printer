// Utility functions for SVG clip-path set operations.
// Use these to construct "inside" and "outside" clip regions
// for Venn-diagram-style set-difference rendering.
//
// Pattern: to render A \ B (A minus B), draw shape A twice:
//   1. Clipped to insideB  → shows A ∩ B
//   2. Clipped to outsideB → shows A \ B
//
// The "outside" clip uses the even-odd rule: a bounding box with
// the shape punched out as a hole.

/**
 * Even-odd path that clips to everything OUTSIDE a rectangle.
 * Use as: <clipPath id="..."><path clip-rule="evenodd" d={complementRect(...)} /></clipPath>
 */
export function complementRect(
  rect: { x: number; y: number; w: number; h: number },
  bounds: { w: number; h: number },
): string {
  const { x, y, w, h } = rect;
  return (
    `M 0 0 H ${bounds.w} V ${bounds.h} H 0 Z ` +
    `M ${x} ${y} V ${y + h} H ${x + w} V ${y} Z`
  );
}

/**
 * Even-odd path that clips to everything OUTSIDE a circle.
 */
export function complementCircle(
  circle: { cx: number; cy: number; r: number },
  bounds: { w: number; h: number },
): string {
  const { cx, cy, r } = circle;
  return (
    `M 0 0 H ${bounds.w} V ${bounds.h} H 0 Z ` +
    `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
  );
}

/**
 * Even-odd path that clips to everything OUTSIDE an ellipse.
 */
export function complementEllipse(
  ellipse: { cx: number; cy: number; rx: number; ry: number },
  bounds: { w: number; h: number },
): string {
  const { cx, cy, rx, ry } = ellipse;
  return (
    `M 0 0 H ${bounds.w} V ${bounds.h} H 0 Z ` +
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
  );
}

/**
 * Compute a safe label position for the "crescent" region of an ellipse
 * on one side of a vertical cut line. Used for placing labels inside
 * clip-path–derived regions (e.g. T = S' \ W, or S' ∩ W).
 *
 * The center is placed ~55% of the way from the cut line to the far
 * edge of the ellipse — safely in the "meat" of the crescent, away
 * from boundary strokes.
 */
export function crescentMetrics(
  ellipse: { cx: number; cy: number; rx: number; ry: number },
  cutX: number,
  side: 'left' | 'right',
): { center: { x: number; y: number }; width: number; height: number } {
  const { cx, cy, rx, ry } = ellipse;
  const farEdge = side === 'right' ? cx + rx : cx - rx;
  const span = Math.abs(farEdge - cutX);
  const labelX = side === 'right'
    ? cutX + 0.55 * span
    : cutX - 0.55 * span;

  // Vertical extent of the ellipse at the label x position
  const t = (labelX - cx) / rx;
  const clamped = Math.min(1, Math.max(-1, t));
  const halfH = Math.sqrt(1 - clamped * clamped) * ry;

  return {
    center: { x: labelX, y: cy },
    width: span,
    height: 2 * halfH,
  };
}
