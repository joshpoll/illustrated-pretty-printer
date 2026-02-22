// Semantic color palette for illustrated articles.
// Use these constants instead of raw hex values for consistency.

export const colors = {
  /** Primary structures, links, active elements */
  blue: "#2563eb",
  /** Minimal elements, edges, highlights */
  orange: "#ea580c",
  /** Covers, success states, key ideas */
  green: "#16a34a",
  /** Emphasis, errors, warnings */
  red: "#dc2626",
  /** Overlaps, definitions, special structures */
  purple: "#7c3aed",
  /** Remarks, secondary highlights */
  yellow: "#ca8a04",

  // Neutral palette for graph elements
  /** Vertex/node fill */
  vertexFill: "#f8fafc",
  /** Vertex/node stroke */
  vertexStroke: "#64748b",
  /** Muted text */
  textMuted: "#555",
} as const;

/** CSS variable names matching index.css :root */
export const cssVars = {
  blue: "var(--accent-blue)",
  orange: "var(--accent-orange)",
  green: "var(--accent-green)",
  red: "var(--accent-red)",
  purple: "var(--accent-purple)",
} as const;
