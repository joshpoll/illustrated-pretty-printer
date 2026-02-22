import { createSignal, createMemo, For } from "solid-js";
import { colors } from "../lib/colors";
import type { Measure } from "../lib/prettyPrinter";
import { dominates } from "../lib/prettyPrinter";

interface Point {
  measure: Measure;
  id: number;
}

const initialPoints: Measure[] = [
  { height: 0, maxWidth: 40, lastWidth: 40 },
  { height: 1, maxWidth: 25, lastWidth: 12 },
  { height: 2, maxWidth: 18, lastWidth: 8 },
  { height: 1, maxWidth: 30, lastWidth: 20 },
  { height: 3, maxWidth: 15, lastWidth: 5 },
  { height: 2, maxWidth: 28, lastWidth: 15 },
  { height: 1, maxWidth: 35, lastWidth: 35 },
  { height: 3, maxWidth: 22, lastWidth: 10 },
];

export default function ParetoFrontierDemo() {
  let nextId = initialPoints.length;
  const [points, setPoints] = createSignal<Point[]>(
    initialPoints.map((m, i) => ({ measure: m, id: i }))
  );
  const [showDominated, setShowDominated] = createSignal(true);

  const frontier = createMemo(() => {
    const pts = points();
    return pts.filter(
      (p) => !pts.some((q) => q.id !== p.id && dominates(q.measure, p.measure))
    );
  });

  const frontierIds = createMemo(() => new Set(frontier().map((p) => p.id)));

  // Plot config — 2D: x = maxWidth, y = height
  const plotW = 460;
  const plotH = 300;
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const innerW = plotW - margin.left - margin.right;
  const innerH = plotH - margin.top - margin.bottom;

  const xMax = 50;
  const yMax = 5;

  const scaleX = (v: number) => margin.left + (v / xMax) * innerW;
  const scaleY = (v: number) => margin.top + (v / yMax) * innerH;

  // Staircase line for frontier (sorted by height)
  const staircasePath = createMemo(() => {
    const f = [...frontier()].sort(
      (a, b) => a.measure.height - b.measure.height || a.measure.maxWidth - b.measure.maxWidth
    );
    if (f.length === 0) return "";
    const parts: string[] = [];
    // Start from left edge
    parts.push(`M ${scaleX(0)} ${scaleY(f[0].measure.height)}`);
    for (const p of f) {
      const x = scaleX(p.measure.maxWidth);
      const y = scaleY(p.measure.height);
      // Horizontal then vertical
      parts.push(`L ${x} ${scaleY(f[parts.length > 1 ? 0 : 0].measure.height)}`);
    }
    // Rebuild properly as staircase
    const pts = f.map((p) => ({
      x: scaleX(p.measure.maxWidth),
      y: scaleY(p.measure.height),
    }));

    let d = `M ${margin.left} ${pts[0].y}`;
    for (let i = 0; i < pts.length; i++) {
      d += ` L ${pts[i].x} ${pts[i].y}`;
      if (i < pts.length - 1) {
        d += ` L ${pts[i].x} ${pts[i + 1].y}`;
      }
    }
    // Extend to bottom-right
    d += ` L ${pts[pts.length - 1].x} ${scaleY(yMax)}`;
    return d;
  });

  function addRandomPoint() {
    const m: Measure = {
      height: Math.floor(Math.random() * 5),
      maxWidth: 5 + Math.floor(Math.random() * 40),
      lastWidth: 3 + Math.floor(Math.random() * 30),
    };
    setPoints((prev) => [...prev, { measure: m, id: nextId++ }]);
  }

  function removePoint(id: number) {
    setPoints((prev) => prev.filter((p) => p.id !== id));
  }

  function reset() {
    nextId = initialPoints.length;
    setPoints(initialPoints.map((m, i) => ({ measure: m, id: i })));
  }

  return (
    <div class="diagram-container wide">
      <svg viewBox={`0 0 ${plotW} ${plotH}`} width={plotW} style="max-width: 100%; height: auto;">
        {/* Grid lines */}
        <For each={Array.from({ length: 6 }, (_, i) => i)}>
          {(i) => (
            <>
              <line
                x1={margin.left}
                y1={scaleY(i)}
                x2={plotW - margin.right}
                y2={scaleY(i)}
                stroke="#e5e5e5"
                stroke-width={1}
              />
              <text
                x={margin.left - 8}
                y={scaleY(i) + 4}
                text-anchor="end"
                font-size="11"
                fill={colors.textMuted}
                font-family="var(--font-mono)"
              >
                {i}
              </text>
            </>
          )}
        </For>
        <For each={[0, 10, 20, 30, 40, 50]}>
          {(v) => (
            <>
              <line
                x1={scaleX(v)}
                y1={margin.top}
                x2={scaleX(v)}
                y2={plotH - margin.bottom}
                stroke="#e5e5e5"
                stroke-width={1}
              />
              <text
                x={scaleX(v)}
                y={plotH - margin.bottom + 16}
                text-anchor="middle"
                font-size="11"
                fill={colors.textMuted}
                font-family="var(--font-mono)"
              >
                {v}
              </text>
            </>
          )}
        </For>

        {/* Axis labels */}
        <text
          x={plotW / 2}
          y={plotH - 4}
          text-anchor="middle"
          font-size="13"
          fill={colors.textMuted}
        >
          maxWidth
        </text>
        <text
          x={14}
          y={plotH / 2}
          text-anchor="middle"
          font-size="13"
          fill={colors.textMuted}
          transform={`rotate(-90, 14, ${plotH / 2})`}
        >
          height
        </text>

        {/* Staircase frontier line */}
        <path
          d={staircasePath()}
          fill={colors.green}
          fill-opacity={0.08}
          stroke={colors.green}
          stroke-width={2}
          stroke-dasharray="6 3"
        />

        {/* Points */}
        <For each={points()}>
          {(p) => {
            const onFrontier = () => frontierIds().has(p.id);
            const x = scaleX(p.measure.maxWidth);
            const y = scaleY(p.measure.height);
            return (
              <g
                style="cursor: pointer"
                onClick={() => removePoint(p.id)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={6}
                  fill={onFrontier() ? colors.green : "#ccc"}
                  stroke={onFrontier() ? colors.green : "#aaa"}
                  stroke-width={1.5}
                  opacity={onFrontier() ? 1 : 0.5}
                />
                {/* X mark for dominated points */}
                {!onFrontier() && showDominated() && (
                  <>
                    <line
                      x1={x - 3}
                      y1={y - 3}
                      x2={x + 3}
                      y2={y + 3}
                      stroke={colors.red}
                      stroke-width={1.5}
                      opacity={0.5}
                    />
                    <line
                      x1={x + 3}
                      y1={y - 3}
                      x2={x - 3}
                      y2={y + 3}
                      stroke={colors.red}
                      stroke-width={1.5}
                      opacity={0.5}
                    />
                  </>
                )}
              </g>
            );
          }}
        </For>
      </svg>

      <div class="diagram-controls">
        <button onClick={addRandomPoint}>Add random measure</button>
        <button onClick={reset}>Reset</button>
        <label style={{ "font-size": "0.88rem", color: "var(--text-muted)" }}>
          <input
            type="checkbox"
            checked={showDominated()}
            onChange={(e) => setShowDominated(e.currentTarget.checked)}
          />{" "}
          Show dominated
        </label>
      </div>

      <div class="legend">
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: colors.green }} />
          Pareto frontier ({frontier().length} measures)
        </span>
        <span class="legend-item">
          <span class="legend-swatch" style={{ background: "#ccc" }} />
          Dominated ({points().length - frontier().length} measures)
        </span>
      </div>

      <div class="diagram-caption">
        Each dot is a candidate layout measure, plotted by maxWidth and height (lastWidth suppressed
        for clarity). <span style={{ color: colors.green, "font-weight": "600" }}>Green dots</span> form
        the Pareto frontier — no other measure is better in every dimension. Click a dot to remove it.
      </div>
    </div>
  );
}
