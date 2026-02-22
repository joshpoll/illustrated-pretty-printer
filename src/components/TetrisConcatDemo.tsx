import { createSignal, createMemo, For } from "solid-js";
import { colors } from "../lib/colors";
import type { Measure } from "../lib/prettyPrinter";
import { concatMeasures } from "../lib/prettyPrinter";

interface Example {
  name: string;
  left: { lines: string[]; measure: Measure };
  right: { lines: string[]; measure: Measure };
}

const examples: Example[] = [
  {
    name: "Simple concat",
    left: {
      lines: ["foo("],
      measure: { height: 0, maxWidth: 4, lastWidth: 4 },
    },
    right: {
      lines: ["bar)"],
      measure: { height: 0, maxWidth: 4, lastWidth: 4 },
    },
  },
  {
    name: "Multi-line left",
    left: {
      lines: ["render(", "  div("],
      measure: { height: 1, maxWidth: 7, lastWidth: 6 },
    },
    right: {
      lines: ["content))"],
      measure: { height: 0, maxWidth: 9, lastWidth: 9 },
    },
  },
  {
    name: "Both multi-line",
    left: {
      lines: ["func(", "  a,", "  b,"],
      measure: { height: 2, maxWidth: 5, lastWidth: 4 },
    },
    right: {
      lines: ["c,", "  d)"],
      measure: { height: 1, maxWidth: 4, lastWidth: 4 },
    },
  },
];

export default function TetrisConcatDemo() {
  const [exIdx, setExIdx] = createSignal(0);
  const ex = createMemo(() => examples[exIdx()]);
  const result = createMemo(() => concatMeasures(ex().left.measure, ex().right.measure));

  const charW = 8.4;
  const lineH = 20;
  const padX = 20;
  const padY = 20;
  const gap = 0; // right block attaches at lastWidth

  const resultLines = createMemo(() => {
    const l = ex().left.lines;
    const r = ex().right.lines;
    const lastLeftWidth = l[l.length - 1].length;
    const combined: string[] = [];

    // Left lines except last
    for (let i = 0; i < l.length - 1; i++) {
      combined.push(l[i]);
    }

    // Last left line + first right line
    combined.push(l[l.length - 1] + r[0]);

    // Remaining right lines, indented by lastLeftWidth
    for (let i = 1; i < r.length; i++) {
      combined.push(" ".repeat(lastLeftWidth) + r[i]);
    }

    return combined;
  });

  const maxLen = createMemo(() =>
    Math.max(...resultLines().map((l) => l.length), 30)
  );

  const svgW = createMemo(() => maxLen() * charW + padX * 2 + 40);
  const svgH = createMemo(() => resultLines().length * lineH + padY * 2 + 10);

  return (
    <div class="diagram-container">
      <svg
        viewBox={`0 0 ${svgW()} ${svgH()}`}
        width={svgW()}
        style="max-width: 100%; height: auto;"
      >
        {/* Left block background */}
        {ex().left.lines.map((ln, i) => (
          <rect
            x={padX}
            y={padY + i * lineH}
            width={ln.length * charW}
            height={lineH}
            fill={colors.blue}
            opacity={0.08}
            rx={2}
          />
        ))}

        {/* Right block background */}
        {(() => {
          const lastLeftW = ex().left.lines[ex().left.lines.length - 1].length;
          const startLine = ex().left.lines.length - 1;
          return ex().right.lines.map((ln, i) => (
            <rect
              x={padX + (i === 0 ? lastLeftW : lastLeftW) * charW}
              y={padY + (startLine + i) * lineH}
              width={ln.length * charW}
              height={lineH}
              fill={colors.orange}
              opacity={0.1}
              rx={2}
            />
          ));
        })()}

        {/* The combined text */}
        <For each={resultLines()}>
          {(ln, i) => (
            <text
              x={padX}
              y={padY + i() * lineH + 14}
              font-family="var(--font-mono)"
              font-size="13"
              fill="#333"
            >
              {ln}
            </text>
          )}
        </For>

        {/* Cursor line showing lastWidth attachment point */}
        {(() => {
          const lastLeftW = ex().left.lines[ex().left.lines.length - 1].length;
          const attachY = padY + (ex().left.lines.length - 1) * lineH;
          const attachX = padX + lastLeftW * charW;
          return (
            <line
              x1={attachX}
              y1={attachY}
              x2={attachX}
              y2={attachY + lineH}
              stroke={colors.green}
              stroke-width={2}
              stroke-dasharray="3 3"
              opacity={0.6}
            />
          );
        })()}
      </svg>

      {/* Measure arithmetic */}
      <div
        style={{
          display: "flex",
          "justify-content": "center",
          gap: "32px",
          "font-size": "0.88rem",
          "font-family": "var(--font-mono)",
          "flex-wrap": "wrap",
          margin: "12px 0",
        }}
      >
        <div>
          <span style={{ color: colors.blue, "font-weight": "600" }}>L</span>
          : h={ex().left.measure.height}, mw={ex().left.measure.maxWidth}, lw=
          {ex().left.measure.lastWidth}
        </div>
        <div>
          <span style={{ color: colors.orange, "font-weight": "600" }}>R</span>
          : h={ex().right.measure.height}, mw={ex().right.measure.maxWidth}, lw=
          {ex().right.measure.lastWidth}
        </div>
        <div>
          <strong>Result</strong>: h={result().height}, mw={result().maxWidth},
          lw={result().lastWidth}
        </div>
      </div>

      <div class="diagram-controls">
        <For each={examples}>
          {(ex, i) => (
            <button
              class={i() === exIdx() ? "active" : ""}
              onClick={() => setExIdx(i())}
            >
              {ex.name}
            </button>
          )}
        </For>
      </div>

      <div class="diagram-caption">
        "Tetris" concatenation: the right block starts where the left block's last line
        ends. The <span style={{ color: colors.green, "font-weight": "600" }}>green dashed line</span> marks
        the cursor position (lastWidth) where the right block attaches.
      </div>
    </div>
  );
}
