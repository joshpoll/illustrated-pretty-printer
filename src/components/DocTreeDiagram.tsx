import { colors } from "../lib/colors";
import type { Doc } from "../lib/prettyPrinter";
import { group, concat, text, line } from "../lib/prettyPrinter";

// Color mapping for node types
const nodeColors: Record<string, string> = {
  text: colors.blue,
  line: colors.green,
  concat: colors.textMuted,
  choice: colors.orange,
};

const nodeLabels: Record<string, string> = {
  text: "text",
  line: "line",
  concat: "<>",
  choice: "<|>",
};

interface TreeNode {
  doc: Doc;
  x: number;
  y: number;
  children: TreeNode[];
  label: string;
  color: string;
  sublabel?: string;
}

function layoutTree(doc: Doc, x: number, y: number, hSpacing: number): TreeNode {
  const vSpacing = 60;
  const color = nodeColors[doc.tag];
  const label = nodeLabels[doc.tag];

  switch (doc.tag) {
    case "text":
      return { doc, x, y, children: [], label, color, sublabel: `"${doc.s}"` };
    case "line":
      return { doc, x, y, children: [], label, color, sublabel: "\\n" };
    case "concat": {
      const n = doc.docs.length;
      const totalW = (n - 1) * hSpacing;
      const startX = x - totalW / 2;
      const children = doc.docs.map((d, i) =>
        layoutTree(d, startX + i * hSpacing, y + vSpacing, hSpacing * 0.55)
      );
      return { doc, x, y, children, label, color };
    }
    case "choice": {
      const childSpacing = hSpacing * 0.7;
      const left = layoutTree(doc.a, x - childSpacing, y + vSpacing, hSpacing * 0.55);
      const right = layoutTree(doc.b, x + childSpacing, y + vSpacing, hSpacing * 0.55);
      return { doc, x, y, children: [left, right], label, color };
    }
  }
}

function renderNode(node: TreeNode): any {
  const r = 18;
  return (
    <>
      {/* Edges to children */}
      {node.children.map((child) => (
        <line
          x1={node.x}
          y1={node.y + r}
          x2={child.x}
          y2={child.y - r}
          stroke="#cbd5e1"
          stroke-width={1.5}
        />
      ))}

      {/* Recurse */}
      {node.children.map(renderNode)}

      {/* Node circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill="white"
        stroke={node.color}
        stroke-width={2}
      />

      {/* Label */}
      <text
        x={node.x}
        y={node.y + (node.label === "<>" || node.label === "<|>" ? 5 : 4)}
        text-anchor="middle"
        font-size={node.label.length > 3 ? "10" : "12"}
        font-weight="600"
        fill={node.color}
        font-family="var(--font-mono)"
      >
        {node.label}
      </text>

      {/* Sublabel for leaf nodes */}
      {node.sublabel && (
        <text
          x={node.x}
          y={node.y + r + 14}
          text-anchor="middle"
          font-size="10"
          fill={colors.textMuted}
          font-family="var(--font-mono)"
        >
          {node.sublabel}
        </text>
      )}
    </>
  );
}

export default function DocTreeDiagram() {
  // Build a small example: group(a <> line <> b)
  // = (flatten(a <> line <> b)) <|> (a <> line <> b)
  // = (a <> " " <> b) <|> (a <> \n <> b)
  const doc = group(concat(text("hello"), line, text("world")));

  const tree = layoutTree(doc, 250, 30, 120);

  return (
    <div class="diagram-container">
      <svg viewBox="0 0 500 220" width={500} style="max-width: 100%; height: auto;">
        {renderNode(tree)}
      </svg>
      <div class="legend">
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: colors.orange }} />
          choice ({"<|>"})
        </span>
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: colors.textMuted }} />
          concat ({"<>"})
        </span>
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: colors.blue }} />
          text
        </span>
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: colors.green }} />
          line
        </span>
      </div>
      <div class="diagram-caption">
        The Doc tree for <code>group("hello" &lt;&gt; line &lt;&gt; "world")</code>.
        The top <span style={{ color: colors.orange }}>choice</span> node picks between
        putting everything on one line (left) or breaking (right).
      </div>
    </div>
  );
}
