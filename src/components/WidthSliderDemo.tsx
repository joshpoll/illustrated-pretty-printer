import { createSignal, createMemo } from "solid-js";
import { exampleDoc, bestLayout } from "../lib/prettyPrinter";
import { colors } from "../lib/colors";

export default function WidthSliderDemo() {
  const [width, setWidth] = createSignal(60);
  const doc = exampleDoc();

  const rendered = createMemo(() => bestLayout(doc, width()));
  const lines = createMemo(() => rendered().split("\n"));

  // SVG dimensions
  const charW = 8.4;
  const lineH = 20;
  const padX = 16;
  const padY = 12;

  const svgW = createMemo(() => Math.max(width() * charW + padX * 2 + 20, 400));
  const svgH = createMemo(() => lines().length * lineH + padY * 2);

  return (
    <div class="diagram-container wide">
      <svg
        viewBox={`0 0 ${svgW()} ${svgH()}`}
        width={svgW()}
        style="max-width: 100%; height: auto;"
      >
        {/* Page edge line */}
        <line
          x1={padX + width() * charW}
          y1={0}
          x2={padX + width() * charW}
          y2={svgH()}
          stroke={colors.red}
          stroke-width={1.5}
          stroke-dasharray="6 4"
          opacity={0.6}
        />
        <text
          x={padX + width() * charW + 4}
          y={14}
          fill={colors.red}
          font-size="11"
          font-family="var(--font-mono)"
          opacity={0.7}
        >
          {width()}
        </text>

        {/* Rendered text */}
        {lines().map((ln, i) => (
          <text
            x={padX}
            y={padY + i * lineH + 14}
            font-family="var(--font-mono)"
            font-size="13"
            fill={colors.blue}
          >
            {ln}
          </text>
        ))}
      </svg>

      <div class="diagram-controls">
        <label>
          Page width
          <input
            type="range"
            min={20}
            max={120}
            value={width()}
            onInput={(e) => setWidth(parseInt(e.currentTarget.value))}
          />
          <span class="value-display">{width()}</span>
        </label>
      </div>
      <div class="diagram-caption">
        Drag the slider to change the page width. The same document is re-laid-out
        optimally at each width. The dashed <span style={{ color: colors.red }}>red line</span> marks the page edge.
      </div>
    </div>
  );
}
