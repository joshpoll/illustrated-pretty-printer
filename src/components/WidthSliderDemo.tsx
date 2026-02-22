import { createSignal, createMemo, onMount } from "solid-js";
import { exampleDoc, bestLayout } from "../lib/prettyPrinter";
import { colors } from "../lib/colors";

export default function WidthSliderDemo() {
  const [width, setWidth] = createSignal(60);
  const doc = exampleDoc();

  const rendered = createMemo(() => bestLayout(doc, width()));
  const lines = createMemo(() => rendered().split("\n"));

  // Dynamically measure monospace character width using SVG text element
  const fontSize = 13;
  const monoStyle = `font-family: "Fira Mono", monospace; font-size: ${fontSize}px; white-space: pre;`;
  const [charW, setCharW] = createSignal(7.8); // initial estimate for Fira Mono at 13px
  const lineH = 20;
  const padX = 16;
  const padY = 12;
  let measureRef!: SVGTextElement;

  onMount(async () => {
    await document.fonts.ready;
    setCharW(measureRef.getComputedTextLength() / 10);
  });

  const edgeX = createMemo(() => padX + width() * charW());
  const maxLineLen = createMemo(() => Math.max(...lines().map((l) => l.length)));
  const svgW = createMemo(() =>
    Math.max(edgeX() + 40, maxLineLen() * charW() + padX * 2, 400)
  );
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
          x1={edgeX()}
          y1={0}
          x2={edgeX()}
          y2={svgH()}
          stroke={colors.red}
          stroke-width={1.5}
          stroke-dasharray="6 4"
          opacity={0.6}
        />
        {/* Hidden element for measuring actual SVG character width */}
        <text
          ref={measureRef}
          x={0} y={0}
          style={monoStyle}
          visibility="hidden"
        >
          MMMMMMMMMM
        </text>

        <text
          x={edgeX() + 4}
          y={14}
          fill={colors.red}
          style={`font-family: "Fira Mono", monospace; font-size: 11px;`}
          opacity={0.7}
        >
          {width()}
        </text>

        {/* Rendered text */}
        {lines().map((ln, i) => {
          const overflows = ln.length > width();
          return (
            <>
              {overflows && (
                <rect
                  x={padX - 4}
                  y={padY + i * lineH}
                  width={ln.length * charW() + 8}
                  height={lineH}
                  fill="#fee2e2"
                  rx={3}
                />
              )}
              <text
                x={padX}
                y={padY + i * lineH + 14}
                style={monoStyle}
                fill={overflows ? colors.red : colors.blue}
              >
                {ln}
              </text>
            </>
          );
        })}
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
