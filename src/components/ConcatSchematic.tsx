import { createSignal, createMemo, onMount, Show, For } from "solid-js";
import { colors } from "../lib/colors";
import { HDimArrow, VDimArrow } from "../lib/svgArrows";

// --- Data for the concrete example ---
const leftLines = [
  'render(div(',       // 11 chars
  '  h1("Hello"),',    // 14 chars
  '  p(',              // 4 chars
];
const leftMeasure = { h: 2, mw: 14, lw: 4 };

const rightLines = [
  '"a pretty printer"),', // 20 chars
  'footer()))',           // 10 chars
];
const rightMeasure = { h: 1, mw: 20, lw: 10 };

const resultMeasure = {
  h: leftMeasure.h + rightMeasure.h,
  mw: Math.max(leftMeasure.mw, leftMeasure.lw + rightMeasure.mw),
  lw: leftMeasure.lw + rightMeasure.lw,
};

// Build result lines by tetris-concatenating
const resultLines: string[] = [];
for (let i = 0; i < leftLines.length - 1; i++) resultLines.push(leftLines[i]);
resultLines.push(leftLines[leftLines.length - 1] + rightLines[0]);
for (let i = 1; i < rightLines.length; i++) {
  resultLines.push(" ".repeat(leftMeasure.lw) + rightLines[i]);
}

// L-shaped measure silhouette path. Origin = top-left.
function measureShapePath(
  mw: number, h: number, lw: number,
  cw: number, lh: number,
): string {
  const mwPx = mw * cw;
  const lwPx = lw * cw;
  const bodyH = h * lh;
  const totalH = (h + 1) * lh;
  if (h === 0) return `M 0 0 H ${lwPx} V ${lh} H 0 Z`;
  if (lw >= mw) return `M 0 0 H ${lwPx} V ${totalH} H 0 Z`;
  return `M 0 0 H ${mwPx} V ${bodyH} H ${lwPx} V ${totalH} H 0 Z`;
}

// Subscript helper for SVG text labels: renders "base" with subscript "sub"
function Sub(props: { base: string; sub: string }) {
  return (
    <>
      {props.base}<tspan font-size="0.7em" dy="0.3em">{props.sub}</tspan><tspan dy="-0.3em">{""}</tspan>
    </>
  );
}

export default function ConcatSchematic() {
  const [step, setStep] = createSignal(1);

  const fontSize = 13;
  const monoStyle = `font-family: "Fira Mono", monospace; font-size: ${fontSize}px; white-space: pre;`;
  const [charW, setCharW] = createSignal(7.8);
  const lineH = 20;
  let measureRef!: SVGTextElement;

  onMount(async () => {
    await document.fonts.ready;
    setCharW(measureRef.getComputedTextLength() / 10);
  });

  // --- Steps 1-3: concrete text + shapes ---
  const padX = 24;
  const padY = 20;

  const joinLineIdx = leftLines.length - 1;
  const joinSplitCol = leftMeasure.lw;

  const textSvgW = createMemo(() => {
    const maxLen = Math.max(...resultLines.map(l => l.length));
    return maxLen * charW() + padX * 2 + 20;
  });
  const textSvgH = resultLines.length * lineH + padY * 2;

  // --- Abstract equation (below, paper-style) ---
  const sc = createMemo(() => charW() * 0.7);
  const aLineH = 18;
  const aPadY = 40;        // vertical padding (space for arrow labels above/below)
  const aAnnoGap = 14;     // gap between shape edge and annotation arrow line
  const aVLabelOff = 20;   // perpendicular offset for vertical arrow labels
  const aGap = 24;         // horizontal gap between annotation zone and operator

  const aLeftW = createMemo(() => leftMeasure.mw * sc());
  const aLeftH = (leftMeasure.h + 1) * aLineH;
  const aRightW = createMemo(() => rightMeasure.mw * sc());
  const aRightH = (rightMeasure.h + 1) * aLineH;
  const aResultW = createMemo(() => resultMeasure.mw * sc());
  const aResultH = (resultMeasure.h + 1) * aLineH;

  const opW = 28;

  // Each shape zone = shapeWidth + gap to right annotation arrow + label space
  const rightAnnoZone = aAnnoGap + aVLabelOff + 24; // arrow + label + pad

  const aLeftX = createMemo(() => 12);
  const aOp1X = createMemo(() => aLeftX() + aLeftW() + rightAnnoZone + aGap);
  const aRightX = createMemo(() => aOp1X() + opW + aGap);
  const aOp2X = createMemo(() => aRightX() + aRightW() + rightAnnoZone + aGap);
  const aResultX = createMemo(() => aOp2X() + opW + aGap);

  const abstractSvgW = createMemo(() =>
    aResultX() + aResultW() + rightAnnoZone + 12
  );

  const maxShapeH = Math.max(aLeftH, aRightH, aResultH);
  const abstractSvgH = maxShapeH + aPadY * 2;

  // Align all shapes to a common baseline
  const aBaseY = abstractSvgH - aPadY;
  const aLeftY = aBaseY - aLeftH;
  const aRightY = aBaseY - aRightH;
  const aResultY = aBaseY - aResultH;

  function ShapeAnnotations(props: {
    x: number; y: number;
    mw: number; h: number; lw: number;
    totalH: number;
    color: string;
    mwLabel: () => any; lwLabel: () => any; hLabel: () => any;
  }) {
    const mwPx = () => props.mw * sc();
    const lwPx = () => props.lw * sc();
    const bodyH = () => props.h * aLineH;
    return (
      <>
        <HDimArrow
          x1={props.x} x2={props.x + mwPx()} y={props.y - aAnnoGap}
          label={props.mwLabel()} color={props.color} above
        />
        <HDimArrow
          x1={props.x} x2={props.x + lwPx()} y={props.y + props.totalH + aAnnoGap}
          label={props.lwLabel()} color={props.color} above={false}
        />
        <Show when={props.h > 0}>
          <VDimArrow
            x={props.x + mwPx() + aAnnoGap} y1={props.y} y2={props.y + bodyH()}
            label={props.hLabel()} color={props.color}
            labelOffset={-aVLabelOff}
          />
        </Show>
      </>
    );
  }

  return (
    <div class="diagram-container wide">
      {/* === Concrete text SVG (all 3 steps) === */}
      <svg
        viewBox={`0 0 ${textSvgW()} ${textSvgH}`}
        width={textSvgW()}
        style="max-width: 100%; height: auto;"
      >
        <text ref={measureRef} x={0} y={0} style={monoStyle} visibility="hidden">
          MMMMMMMMMM
        </text>

        <Show when={step() >= 2}>
          <path
            d={measureShapePath(leftMeasure.mw, leftMeasure.h, leftMeasure.lw, charW(), lineH)}
            transform={`translate(${padX}, ${padY})`}
            fill={colors.blue} fill-opacity={0.07}
            stroke={colors.blue} stroke-width={2} stroke-opacity={0.5}
          />
          <path
            d={measureShapePath(rightMeasure.mw, rightMeasure.h, rightMeasure.lw, charW(), lineH)}
            transform={`translate(${padX + joinSplitCol * charW()}, ${padY + joinLineIdx * lineH})`}
            fill={colors.orange} fill-opacity={0.07}
            stroke={colors.orange} stroke-width={2} stroke-opacity={0.5}
          />
        </Show>

        <Show when={step() === 3}>
          <path
            d={measureShapePath(resultMeasure.mw, resultMeasure.h, resultMeasure.lw, charW(), lineH)}
            transform={`translate(${padX}, ${padY})`}
            fill="none" stroke="#333" stroke-width={2.5} stroke-dasharray="6 3"
          />
        </Show>

        <For each={resultLines}>
          {(ln, i) => {
            const lineIdx = i();
            if (lineIdx < joinLineIdx) {
              return (
                <text x={padX} y={padY + lineIdx * lineH + 14} style={monoStyle} fill={colors.blue}>
                  {ln}
                </text>
              );
            } else if (lineIdx === joinLineIdx) {
              const bluePart = ln.slice(0, joinSplitCol);
              const orangePart = ln.slice(joinSplitCol);
              return (
                <>
                  <text x={padX} y={padY + lineIdx * lineH + 14} style={monoStyle} fill={colors.blue}>
                    {bluePart}
                  </text>
                  <text x={padX + joinSplitCol * charW()} y={padY + lineIdx * lineH + 14} style={monoStyle} fill={colors.orange}>
                    {orangePart}
                  </text>
                </>
              );
            } else {
              const textContent = ln.trimStart();
              const indent = ln.length - textContent.length;
              return (
                <text x={padX + indent * charW()} y={padY + lineIdx * lineH + 14} style={monoStyle} fill={colors.orange}>
                  {textContent}
                </text>
              );
            }
          }}
        </For>
      </svg>

      <div class="diagram-controls">
        <button class={step() === 1 ? "active" : ""} onClick={() => setStep(1)}>
          Concrete text
        </button>
        <button class={step() === 2 ? "active" : ""} onClick={() => setStep(2)}>
          + Measure shapes
        </button>
        <button class={step() === 3 ? "active" : ""} onClick={() => setStep(3)}>
          + Result outline
        </button>
      </div>

      <div class="diagram-caption">
        <Show when={step() === 1}>
          The result of concatenating two layouts. <span style={{ color: colors.blue, "font-weight": "600" }}>Blue</span> text
          comes from the left operand; <span style={{ color: colors.orange, "font-weight": "600" }}>orange</span> from
          the right. The right operand starts where the left's last line ends.
        </Show>
        <Show when={step() === 2}>
          Each operand's <em class="concept">measure</em> corresponds to an L-shaped region:
          a body of width <em>maxWidth</em> and a last line of width <em>lastWidth</em>.
          The <span style={{ color: colors.orange, "font-weight": "600" }}>orange</span> shape
          slots in at the cursor position.
        </Show>
        <Show when={step() === 3}>
          The <strong>dashed outline</strong> shows the combined result's measure shape.
          The result's bounding box captures both operands: the widest line determines <em>maxWidth</em>,
          heights add, and last-line widths add.
        </Show>
      </div>

      {/* === Abstract equation (paper-style, always visible) === */}
      <div style={{ "margin-top": "24px" }}>
        <svg
          viewBox={`0 0 ${abstractSvgW()} ${abstractSvgH}`}
          width={abstractSvgW()}
          style="max-width: 100%; height: auto;"
        >
          {/* Left shape (blue) */}
          <path
            d={measureShapePath(leftMeasure.mw, leftMeasure.h, leftMeasure.lw, sc(), aLineH)}
            transform={`translate(${aLeftX()}, ${aLeftY})`}
            fill={colors.blue} fill-opacity={0.1}
            stroke={colors.blue} stroke-width={1.5}
          />
          <ShapeAnnotations
            x={aLeftX()} y={aLeftY}
            mw={leftMeasure.mw} h={leftMeasure.h} lw={leftMeasure.lw}
            totalH={aLeftH} color={colors.blue}
            mwLabel={() => <><Sub base="mw" sub="a" /></>}
            lwLabel={() => <><Sub base="lw" sub="a" /></>}
            hLabel={() => <><Sub base="l" sub="a" /></>}
          />

          {/* <> operator */}
          <text
            x={aOp1X() + opW / 2}
            y={aBaseY - maxShapeH / 2 + 5}
            text-anchor="middle"
            font-size="15" font-weight="700" fill="#333"
            style={`font-family: "Fira Mono", monospace;`}
          >
            {"<>"}
          </text>

          {/* Right shape (orange) */}
          <path
            d={measureShapePath(rightMeasure.mw, rightMeasure.h, rightMeasure.lw, sc(), aLineH)}
            transform={`translate(${aRightX()}, ${aRightY})`}
            fill={colors.orange} fill-opacity={0.1}
            stroke={colors.orange} stroke-width={1.5}
          />
          <ShapeAnnotations
            x={aRightX()} y={aRightY}
            mw={rightMeasure.mw} h={rightMeasure.h} lw={rightMeasure.lw}
            totalH={aRightH} color={colors.orange}
            mwLabel={() => <><Sub base="mw" sub="b" /></>}
            lwLabel={() => <><Sub base="lw" sub="b" /></>}
            hLabel={() => <><Sub base="l" sub="b" /></>}
          />

          {/* = sign */}
          <text
            x={aOp2X() + opW / 2}
            y={aBaseY - maxShapeH / 2 + 5}
            text-anchor="middle"
            font-size="15" font-weight="700" fill="#333"
            style={`font-family: "Fira Mono", monospace;`}
          >
            =
          </text>

          {/* Result shape (composite) */}
          {(() => {
            const x = aResultX();
            const y = aResultY;
            const s = sc();
            return (
              <>
                <path
                  d={measureShapePath(leftMeasure.mw, leftMeasure.h, leftMeasure.lw, s, aLineH)}
                  transform={`translate(${x}, ${y})`}
                  fill={colors.blue} fill-opacity={0.1}
                  stroke={colors.blue} stroke-width={1} stroke-dasharray="3 2"
                />
                <path
                  d={measureShapePath(rightMeasure.mw, rightMeasure.h, rightMeasure.lw, s, aLineH)}
                  transform={`translate(${x + leftMeasure.lw * s}, ${y + leftMeasure.h * aLineH})`}
                  fill={colors.orange} fill-opacity={0.1}
                  stroke={colors.orange} stroke-width={1} stroke-dasharray="3 2"
                />
                <path
                  d={measureShapePath(resultMeasure.mw, resultMeasure.h, resultMeasure.lw, s, aLineH)}
                  transform={`translate(${x}, ${y})`}
                  fill="none" stroke="#333" stroke-width={2}
                />
              </>
            );
          })()}
          <ShapeAnnotations
            x={aResultX()} y={aResultY}
            mw={resultMeasure.mw} h={resultMeasure.h} lw={resultMeasure.lw}
            totalH={aResultH} color="#333"
            mwLabel={() => <>max <Sub base="mw" sub="a" /> (<Sub base="lw" sub="a" />+<Sub base="mw" sub="b" />)</>}
            lwLabel={() => <><Sub base="lw" sub="a" /> + <Sub base="lw" sub="b" /></>}
            hLabel={() => <><Sub base="l" sub="a" /> + <Sub base="l" sub="b" /></>}
          />
        </svg>
        <div class="diagram-caption">
          Concatenation as geometry (matching the paper's Figure 5.1). Each layout is an L-shaped
          silhouette. The right shape attaches at the left shape's last-line cursor.
        </div>
      </div>
    </div>
  );
}
