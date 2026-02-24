import { createSignal, createMemo, For, Show, onMount } from "solid-js";
import { colors } from "../lib/colors";
import M from "../lib/Math";
import {
  smallExampleDoc,
  measureDocTree,
  render,
  type TreeTraceNode,
} from "../lib/prettyPrinter";

// ── Tree layout (non-overlapping, bottom-up width) ───────────────

const nodeColors: Record<string, string> = {
  text: colors.blue,
  flush: colors.green,
  concat: colors.textMuted,
  choice: colors.orange,
};

interface LayoutNode {
  trace: TreeTraceNode;
  x: number;
  y: number;
  children: LayoutNode[];
}

const LEAF_W = 40;
const CHILD_GAP = 8;
const V_SPACING = 56;

function subtreeWidth(node: TreeTraceNode): number {
  if (node.children.length === 0) return LEAF_W;
  const childWidths = node.children.map(subtreeWidth);
  return (
    childWidths.reduce((a, b) => a + b, 0) +
    CHILD_GAP * (node.children.length - 1)
  );
}

function assignPositions(
  node: TreeTraceNode,
  cx: number,
  y: number
): LayoutNode {
  if (node.children.length === 0) {
    return { trace: node, x: cx, y, children: [] };
  }
  const childWidths = node.children.map(subtreeWidth);
  const totalW =
    childWidths.reduce((a, b) => a + b, 0) +
    CHILD_GAP * (node.children.length - 1);
  let startX = cx - totalW / 2;
  const children = node.children.map((c, i) => {
    const childCx = startX + childWidths[i] / 2;
    startX += childWidths[i] + CHILD_GAP;
    return assignPositions(c, childCx, y + V_SPACING);
  });
  return { trace: node, x: cx, y, children };
}

function flattenLayout(node: LayoutNode): LayoutNode[] {
  return [node, ...node.children.flatMap(flattenLayout)];
}

// ── Grouped steps (batch consecutive text leaves) ────────────────

interface GroupedStep {
  nodeIds: number[];
  focusId: number;
  label: string;
}

function buildSteps(root: TreeTraceNode): GroupedStep[] {
  const all: TreeTraceNode[] = [];
  function collect(n: TreeTraceNode) {
    for (const c of n.children) collect(c);
    all.push(n);
  }
  collect(root);
  all.sort((a, b) => a.computeOrder - b.computeOrder);

  const steps: GroupedStep[] = [];
  let i = 0;
  while (i < all.length) {
    if (all[i].doc.tag === "text") {
      const batch: number[] = [];
      const labels: string[] = [];
      while (i < all.length && all[i].doc.tag === "text") {
        batch.push(all[i].id);
        labels.push(all[i].label);
        i++;
      }
      steps.push({
        nodeIds: batch,
        focusId: batch[batch.length - 1],
        label: `text: ${labels.join(", ")}`,
      });
    } else {
      const n = all[i];
      const tagLabel =
        n.doc.tag === "choice"
          ? "choice (<|>)"
          : n.doc.tag === "concat"
            ? "concat (<>)"
            : n.doc.tag;
      steps.push({
        nodeIds: [n.id],
        focusId: n.id,
        label: tagLabel,
      });
      i++;
    }
  }
  return steps;
}

// ── Component ────────────────────────────────────────────────────

export default function ParetoTreeDemo() {
  const doc = smallExampleDoc();
  const traceRoot = measureDocTree(doc, 40);

  // Layout tree with non-overlapping positions
  const totalW = subtreeWidth(traceRoot);
  const treeCx = totalW / 2 + 20;
  const treeLayout = assignPositions(traceRoot, treeCx, 28);
  const allNodes = flattenLayout(treeLayout);
  const steps = buildSteps(traceRoot);

  // Compute SVG bounds from actual node positions
  const xs = allNodes.map((n) => n.x);
  const ys = allNodes.map((n) => n.y);
  const treeW = Math.max(...xs) - Math.min(...xs) + 80;
  const treeH = Math.max(...ys) + 40;
  const treeMinX = Math.min(...xs) - 40;

  // Lookup maps
  const traceById = new Map<number, TreeTraceNode>();
  function collectTrace(n: TreeTraceNode) {
    traceById.set(n.id, n);
    for (const c of n.children) collectTrace(c);
  }
  collectTrace(traceRoot);

  // Signals
  const [stepIdx, setStepIdx] = createSignal(0);
  const [selectedNodeId, setSelectedNodeId] = createSignal<number | null>(null);
  const [hoveredRow, setHoveredRow] = createSignal<number | null>(null);

  const computedIds = createMemo(() => {
    const ids = new Set<number>();
    for (let i = 0; i <= stepIdx(); i++) {
      for (const nid of steps[i].nodeIds) ids.add(nid);
    }
    return ids;
  });

  const focusNodeId = createMemo(() => steps[stepIdx()].focusId);

  const detailNodeId = createMemo(() => selectedNodeId() ?? focusNodeId());
  const detailNode = createMemo(() => traceById.get(detailNodeId())!);

  const showDetail = createMemo(
    () =>
      detailNode() &&
      computedIds().has(detailNodeId()) &&
      detailNode()!.children.length > 0
  );

  function goStep(idx: number) {
    setStepIdx(idx);
    setSelectedNodeId(null);
    setHoveredRow(null);
  }

  // ── Char width measurement ───────────────────────────────────
  let measRef: SVGTextElement | undefined;
  const [charW, setCharW] = createSignal(7.2);

  onMount(async () => {
    await document.fonts.ready;
    if (measRef) {
      setCharW(measRef.getComputedTextLength() / 10);
    }
  });

  const monoStyle = "font-family: 'Fira Mono', monospace; white-space: pre;";
  const nodeR = 16;

  // ── Detail panel: scatter config ─────────────────────────────
  const scatterW = 300;
  const scatterH = 180;
  const scatterMargin = { top: 20, right: 16, bottom: 32, left: 42 };
  const scatterInnerW = scatterW - scatterMargin.left - scatterMargin.right;
  const scatterInnerH = scatterH - scatterMargin.top - scatterMargin.bottom;

  const scatterXMax = createMemo(() => {
    const node = detailNode();
    if (!node) return 6;
    const max = Math.max(...node.frontier.map((c) => c.measure.maxWidth), 1);
    return Math.ceil(max * 1.3) + 1;
  });
  const scatterYMax = createMemo(() => {
    const node = detailNode();
    if (!node) return 3;
    const max = Math.max(...node.frontier.map((c) => c.measure.height), 0);
    return max + 1.5;
  });

  const sx = (v: number) =>
    scatterMargin.left + (v / scatterXMax()) * scatterInnerW;
  const sy = (v: number) =>
    scatterMargin.top + (v / scatterYMax()) * scatterInnerH;

  return (
    <>
      {/* ── Notation sidebar (wide screens) ───────────────────── */}
      <div class="notation-sidebar">
        <h3>Measure</h3>
        <table>
          <tbody>
            <tr>
              <td>
                <M tex="h" />
              </td>
              <td>height (line breaks)</td>
            </tr>
            <tr>
              <td>
                <M tex="w" />
              </td>
              <td>max line width</td>
            </tr>
            <tr>
              <td>
                <M tex="\ell" />
              </td>
              <td>last line width</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ "margin-top": "16px" }}>Node types</h3>
        <table>
          <tbody>
            <tr>
              <td style={{ color: colors.blue }}>text</td>
              <td>literal string</td>
            </tr>
            <tr>
              <td style={{ color: colors.textMuted }}>&lt;&gt;</td>
              <td>concatenation</td>
            </tr>
            <tr>
              <td style={{ color: colors.orange }}>&lt;|&gt;</td>
              <td>choice</td>
            </tr>
            <tr>
              <td style={{ color: colors.green }}>flush</td>
              <td>newline</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ "margin-top": "16px" }}>Frontier</h3>
        <div style={{ "font-size": "0.78rem", color: colors.textMuted }}>
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              "border-radius": "50%",
              background: colors.green,
              "margin-right": "4px",
              "vertical-align": "middle",
            }}
          />
          Badge = frontier size at node
        </div>
      </div>

      <div class="diagram-container wide">
        {/* Step label */}
        <div
          style={{
            "text-align": "center",
            "margin-bottom": "8px",
            "font-size": "0.92rem",
          }}
        >
          <strong>
            Step {stepIdx() + 1} / {steps.length}
          </strong>
          :{" "}
          <code style={{ color: colors.blue }}>{steps[stepIdx()].label}</code>
        </div>

        {/* ── Main flex row: tree left, detail right ──────────── */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            "align-items": "flex-start",
            "min-height": "340px",
          }}
        >
          {/* Tree SVG */}
          <svg
            viewBox={`${treeMinX} 0 ${treeW} ${treeH}`}
            style="flex: 1; min-width: 0; height: auto;"
          >
            {/* Hidden measurement text */}
            <text
              ref={measRef}
              x={-9999}
              y={-9999}
              style={monoStyle + " font-size: 9px;"}
            >
              MMMMMMMMMM
            </text>

            <For each={allNodes}>
              {(node) => {
                const computed = () => computedIds().has(node.trace.id);
                const isActive = () =>
                  steps[stepIdx()].nodeIds.includes(node.trace.id);
                const isSelected = () => detailNodeId() === node.trace.id;
                const isLeaf = node.trace.children.length === 0;
                const color = nodeColors[node.trace.doc.tag];
                const canClick = () => computed() && !isLeaf;

                return (
                  <>
                    {/* Edges to children */}
                    <For each={node.children}>
                      {(child) => (
                        <line
                          x1={node.x}
                          y1={node.y + nodeR}
                          x2={child.x}
                          y2={child.y - nodeR}
                          stroke="#cbd5e1"
                          stroke-width={1.5}
                          opacity={computed() ? 1 : 0.2}
                        />
                      )}
                    </For>

                    {/* Node circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeR}
                      fill="white"
                      stroke={
                        isSelected()
                          ? colors.green
                          : isActive()
                            ? color
                            : color
                      }
                      stroke-width={
                        isSelected() ? 3 : isActive() ? 3 : 2
                      }
                      opacity={computed() ? 1 : 0.2}
                      style={canClick() ? "cursor: pointer;" : ""}
                      onClick={() => {
                        if (canClick()) setSelectedNodeId(node.trace.id);
                      }}
                    />

                    {/* Node label */}
                    <text
                      x={node.x}
                      y={node.y + 4.5}
                      text-anchor="middle"
                      font-size={
                        node.trace.doc.tag === "flush" ? "8" : "11"
                      }
                      font-weight="600"
                      fill={color}
                      opacity={computed() ? 1 : 0.2}
                      style={`font-family: 'Fira Mono', monospace; ${canClick() ? "cursor: pointer;" : ""}`}
                      onClick={() => {
                        if (canClick()) setSelectedNodeId(node.trace.id);
                      }}
                    >
                      {node.trace.doc.tag === "text"
                        ? node.trace.label
                        : node.trace.doc.tag === "choice"
                          ? "<|>"
                          : node.trace.doc.tag === "flush"
                            ? "flush"
                            : "<>"}
                    </text>

                    {/* Frontier badge for computed non-leaf nodes */}
                    <Show when={computed() && !isLeaf}>
                      <circle
                        cx={node.x + nodeR - 2}
                        cy={node.y - nodeR + 4}
                        r={8}
                        fill={colors.green}
                        opacity={0.9}
                      />
                      <text
                        x={node.x + nodeR - 2}
                        y={node.y - nodeR + 7.5}
                        text-anchor="middle"
                        font-size="9"
                        font-weight="700"
                        fill="white"
                      >
                        {node.trace.frontier.length}
                      </text>
                    </Show>
                  </>
                );
              }}
            </For>
          </svg>

          {/* ── Detail panel (right side, always present) ──────── */}
          <div
            style={{
              width: "320px",
              "flex-shrink": "0",
              "font-size": "0.82rem",
              "min-height": "300px",
            }}
          >
            <Show
              when={showDetail()}
              fallback={
                <div
                  style={{
                    color: colors.textMuted,
                    "font-size": "0.82rem",
                    "text-align": "center",
                    "padding-top": "80px",
                  }}
                >
                  Step through to see
                  <br />
                  frontiers at each node.
                </div>
              }
            >
              {/* Node type header */}
              <div
                style={{
                  "font-weight": "600",
                  "margin-bottom": "6px",
                  "font-size": "0.85rem",
                  color: nodeColors[detailNode()!.doc.tag],
                }}
              >
                {detailNode()!.doc.tag === "choice"
                  ? "<|> node"
                  : detailNode()!.doc.tag === "concat"
                    ? "<> node"
                    : detailNode()!.doc.tag + " node"}
              </div>

              {/* Measure table */}
              <table
                style={{
                  "border-collapse": "collapse",
                  "font-family": "var(--font-mono)",
                  "font-size": "0.78rem",
                  width: "100%",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "4px 8px",
                        "border-bottom": "2px solid #e2e8f0",
                        "text-align": "right",
                      }}
                    >
                      h
                    </th>
                    <th
                      style={{
                        padding: "4px 8px",
                        "border-bottom": "2px solid #e2e8f0",
                        "text-align": "right",
                      }}
                    >
                      mw
                    </th>
                    <th
                      style={{
                        padding: "4px 8px",
                        "border-bottom": "2px solid #e2e8f0",
                        "text-align": "right",
                      }}
                    >
                      lw
                    </th>
                    <th
                      style={{
                        padding: "4px 8px",
                        "border-bottom": "2px solid #e2e8f0",
                        "text-align": "left",
                      }}
                    >
                      layout
                    </th>
                    <th
                      style={{
                        padding: "4px 8px",
                        "border-bottom": "2px solid #e2e8f0",
                      }}
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  <For each={detailNode()!.candidatesBefore}>
                    {(c, idx) => {
                      const onFrontier = () =>
                        detailNode()!.frontier.some(
                          (f) =>
                            f.measure.height === c.measure.height &&
                            f.measure.maxWidth === c.measure.maxWidth &&
                            f.measure.lastWidth === c.measure.lastWidth
                        );
                      const isHovered = () => hoveredRow() === idx();
                      const rendered = render(detailNode()!.doc, c.choices);
                      const displayText = rendered.replace(/\n/g, "\\n");
                      return (
                        <tr
                          style={{
                            opacity: onFrontier() ? 1 : 0.35,
                            background: isHovered()
                              ? "#f0fdf4"
                              : "transparent",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={() =>
                            onFrontier() && setHoveredRow(idx())
                          }
                          onMouseLeave={() => setHoveredRow(null)}
                        >
                          <td
                            style={{
                              padding: "3px 8px",
                              "text-align": "right",
                              "border-bottom": "1px solid #f0f0f0",
                            }}
                          >
                            {c.measure.height}
                          </td>
                          <td
                            style={{
                              padding: "3px 8px",
                              "text-align": "right",
                              "border-bottom": "1px solid #f0f0f0",
                            }}
                          >
                            {c.measure.maxWidth}
                          </td>
                          <td
                            style={{
                              padding: "3px 8px",
                              "text-align": "right",
                              "border-bottom": "1px solid #f0f0f0",
                            }}
                          >
                            {c.measure.lastWidth}
                          </td>
                          <td
                            style={{
                              padding: "3px 8px",
                              "border-bottom": "1px solid #f0f0f0",
                              "font-size": "0.72rem",
                              color: "#666",
                            }}
                          >
                            <code>{displayText}</code>
                          </td>
                          <td
                            style={{
                              padding: "3px 8px",
                              "border-bottom": "1px solid #f0f0f0",
                            }}
                          >
                            <Show when={onFrontier()}>
                              <span
                                style={{
                                  color: colors.green,
                                  "font-weight": "600",
                                }}
                              >
                                &#10003;
                              </span>
                            </Show>
                            <Show when={!onFrontier()}>
                              <span style={{ color: colors.red }}>
                                &#10007;
                              </span>
                            </Show>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
              <div
                style={{
                  "margin-top": "6px",
                  color: colors.textMuted,
                  "font-size": "0.78rem",
                }}
              >
                {detailNode()!.frontier.length} /{" "}
                {detailNode()!.candidatesBefore.length} survive pruning
              </div>

              {/* Scatter plot with text cards */}
              <svg
                viewBox={`0 0 ${scatterW} ${scatterH}`}
                width={scatterW}
                style="max-width: 100%; height: auto; margin-top: 12px;"
              >
                {/* Grid */}
                <For
                  each={Array.from(
                    { length: Math.ceil(scatterYMax()) + 1 },
                    (_, i) => i
                  )}
                >
                  {(i) => (
                    <>
                      <line
                        x1={scatterMargin.left}
                        y1={sy(i)}
                        x2={scatterW - scatterMargin.right}
                        y2={sy(i)}
                        stroke="#eee"
                        stroke-width={1}
                      />
                      <text
                        x={scatterMargin.left - 6}
                        y={sy(i) + 4}
                        text-anchor="end"
                        font-size="10"
                        fill={colors.textMuted}
                        style="font-family: 'Fira Mono', monospace;"
                      >
                        {i}
                      </text>
                    </>
                  )}
                </For>
                {(() => {
                  const xm = scatterXMax();
                  const ticks: number[] = [];
                  const tickStep = xm <= 8 ? 1 : xm <= 20 ? 2 : 5;
                  for (let v = 0; v <= xm; v += tickStep) ticks.push(v);
                  return (
                    <For each={ticks}>
                      {(v) => (
                        <>
                          <line
                            x1={sx(v)}
                            y1={scatterMargin.top}
                            x2={sx(v)}
                            y2={scatterH - scatterMargin.bottom}
                            stroke="#eee"
                            stroke-width={1}
                          />
                          <text
                            x={sx(v)}
                            y={scatterH - scatterMargin.bottom + 14}
                            text-anchor="middle"
                            font-size="10"
                            fill={colors.textMuted}
                            style="font-family: 'Fira Mono', monospace;"
                          >
                            {v}
                          </text>
                        </>
                      )}
                    </For>
                  );
                })()}

                <text
                  x={scatterW / 2}
                  y={scatterH - 2}
                  text-anchor="middle"
                  font-size="11"
                  fill={colors.textMuted}
                >
                  maxWidth
                </text>
                <text
                  x={8}
                  y={scatterH / 2}
                  text-anchor="middle"
                  font-size="11"
                  fill={colors.textMuted}
                  transform={`rotate(-90, 8, ${scatterH / 2})`}
                >
                  height
                </text>

                {/* Text cards for frontier candidates */}
                {(() => {
                  const frontier = detailNode()!.frontier;
                  // Compute offsets for cards sharing the same (mw, h)
                  const posKey = (c: typeof frontier[0]) =>
                    `${c.measure.maxWidth},${c.measure.height}`;
                  const groups = new Map<string, number>();
                  const offsets: number[] = [];
                  for (const c of frontier) {
                    const k = posKey(c);
                    const idx = groups.get(k) ?? 0;
                    offsets.push(idx);
                    groups.set(k, idx + 1);
                  }
                  return (
                    <For each={frontier}>
                      {(c, i) => {
                        const txt = render(detailNode()!.doc, c.choices);
                        const lines = txt.split("\n");
                        const maxLineLen = Math.max(
                          ...lines.map((l) => l.length)
                        );
                        const cardW = () =>
                          Math.max(maxLineLen * charW() + 8, 20);
                        const cardH = lines.length * 12 + 6;
                        // Offset overlapping cards horizontally
                        const offsetX = offsets[i()] * (cardW() + 4);
                        const cx = () => sx(c.measure.maxWidth) + offsetX;
                        const cy = () => sy(c.measure.height);
                        const beforeIdx = () =>
                          detailNode()!.candidatesBefore.findIndex(
                            (b) =>
                              b.measure.height === c.measure.height &&
                              b.measure.maxWidth === c.measure.maxWidth &&
                              b.measure.lastWidth === c.measure.lastWidth
                          );
                        const isHovered = () =>
                          hoveredRow() === beforeIdx();

                        return (
                          <g
                            onMouseEnter={() =>
                              setHoveredRow(beforeIdx())
                            }
                            onMouseLeave={() => setHoveredRow(null)}
                            style="cursor: default;"
                          >
                            <rect
                              x={cx() - cardW() / 2}
                              y={cy() - cardH / 2}
                              width={cardW()}
                              height={cardH}
                              rx={3}
                              fill="white"
                              stroke={colors.green}
                              stroke-width={isHovered() ? 2 : 1}
                              opacity={isHovered() ? 1 : 0.85}
                            />
                            <For each={lines}>
                              {(line, lineIdx) => (
                                <text
                                  x={cx() - cardW() / 2 + 4}
                                  y={
                                    cy() -
                                    cardH / 2 +
                                    12 +
                                    lineIdx() * 12
                                  }
                                  font-size="9"
                                  fill="#333"
                                  style={monoStyle}
                                >
                                  {line || " "}
                                </text>
                              )}
                            </For>
                          </g>
                        );
                      }}
                    </For>
                  );
                })()}
              </svg>
            </Show>
          </div>
        </div>

        {/* ── Controls ───────────────────────────────────────── */}
        <div class="diagram-controls">
          <button
            onClick={() => goStep(Math.max(0, stepIdx() - 1))}
            disabled={stepIdx() === 0}
          >
            &#8592; Prev
          </button>
          <div class="step-indicator">
            <For each={steps}>
              {(_, i) => (
                <span
                  class={`step-dot ${i() === stepIdx() ? "active" : i() < stepIdx() ? "completed" : ""}`}
                  onClick={() => goStep(i())}
                  style="cursor: pointer;"
                />
              )}
            </For>
          </div>
          <button
            onClick={() => goStep(Math.min(steps.length - 1, stepIdx() + 1))}
            disabled={stepIdx() === steps.length - 1}
          >
            Next &#8594;
          </button>
        </div>

        <div class="diagram-caption">
          The algorithm processes{" "}
          <code>group(["a", group(["b", "c"])])</code> bottom-up.
          <span style={{ color: colors.green, "font-weight": "600" }}>
            {" "}
            Green badges
          </span>{" "}
          show the frontier size at each node. Click any computed node to
          inspect its frontier.
        </div>
      </div>
    </>
  );
}
