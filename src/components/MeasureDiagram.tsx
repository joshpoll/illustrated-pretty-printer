import { colors } from "../lib/colors";

export default function MeasureDiagram() {
  // A concrete multi-line layout to annotate
  const lines = [
    "render(div(",
    "         h1(\"Hello\"),",
    "         p(\"world\")))",
  ];

  const charW = 8.4;
  const lineH = 22;
  const padX = 40;
  const padY = 30;
  const maxLen = Math.max(...lines.map((l) => l.length));
  const lastLen = lines[lines.length - 1].length;

  const svgW = maxLen * charW + padX * 2 + 80;
  const svgH = lines.length * lineH + padY * 2 + 40;

  const textY = (i: number) => padY + i * lineH + 15;

  return (
    <div class="diagram-container">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} style="max-width: 100%; height: auto;">
        {/* The text lines */}
        {lines.map((ln, i) => (
          <text
            x={padX}
            y={textY(i)}
            font-family="var(--font-mono)"
            font-size="13"
            fill="#333"
          >
            {ln}
          </text>
        ))}

        {/* maxWidth bracket (horizontal, above) */}
        {(() => {
          const widestIdx = lines.indexOf(lines.reduce((a, b) => (a.length >= b.length ? a : b)));
          const widestLen = lines[widestIdx].length;
          const y = padY - 8;
          const x1 = padX;
          const x2 = padX + widestLen * charW;
          return (
            <>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={colors.red} stroke-width={2} />
              <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={colors.red} stroke-width={2} />
              <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={colors.red} stroke-width={2} />
              <text
                x={(x1 + x2) / 2}
                y={y - 6}
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                fill={colors.red}
              >
                maxWidth = {widestLen}
              </text>
            </>
          );
        })()}

        {/* height bracket (vertical, right side) */}
        {(() => {
          const x = padX + maxLen * charW + 20;
          const y1 = textY(0) - 10;
          const y2 = textY(lines.length - 1) + 4;
          return (
            <>
              <line x1={x} y1={y1} x2={x} y2={y2} stroke={colors.purple} stroke-width={2} />
              <line x1={x - 4} y1={y1} x2={x + 4} y2={y1} stroke={colors.purple} stroke-width={2} />
              <line x1={x - 4} y1={y2} x2={x + 4} y2={y2} stroke={colors.purple} stroke-width={2} />
              <text
                x={x + 8}
                y={(y1 + y2) / 2 + 4}
                font-size="12"
                font-weight="600"
                fill={colors.purple}
              >
                height = {lines.length - 1}
              </text>
            </>
          );
        })()}

        {/* lastWidth bracket (horizontal, below last line) */}
        {(() => {
          const y = textY(lines.length - 1) + 12;
          const x1 = padX;
          const x2 = padX + lastLen * charW;
          return (
            <>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={colors.green} stroke-width={2} />
              <line x1={x1} y1={y - 4} x2={x1} y2={y + 4} stroke={colors.green} stroke-width={2} />
              <line x1={x2} y1={y - 4} x2={x2} y2={y + 4} stroke={colors.green} stroke-width={2} />
              <text
                x={(x1 + x2) / 2}
                y={y + 16}
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                fill={colors.green}
              >
                lastWidth = {lastLen}
              </text>
            </>
          );
        })()}
      </svg>
      <div class="diagram-caption">
        A layout is described by three numbers:{" "}
        <span style={{ color: colors.purple, "font-weight": "600" }}>height</span> (line breaks),{" "}
        <span style={{ color: colors.red, "font-weight": "600" }}>maxWidth</span> (widest line), and{" "}
        <span style={{ color: colors.green, "font-weight": "600" }}>lastWidth</span> (last line width).
        These three numbers are all we need to compare layouts.
      </div>
    </div>
  );
}
