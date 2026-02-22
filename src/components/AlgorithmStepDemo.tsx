import { createSignal, createMemo, For, Show } from "solid-js";
import { colors } from "../lib/colors";
import {
  smallExampleDoc,
  measureDoc,
  docToString,
  dominates,
  type AlgorithmStep,
  type Candidate,
} from "../lib/prettyPrinter";

export default function AlgorithmStepDemo() {
  const doc = smallExampleDoc();
  const trace: AlgorithmStep[] = [];
  measureDoc(doc, 40, trace);

  const [stepIdx, setStepIdx] = createSignal(0);
  const step = createMemo(() => trace[stepIdx()]);

  // Plot config
  const plotW = 400;
  const plotH = 200;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = plotW - margin.left - margin.right;
  const innerH = plotH - margin.top - margin.bottom;

  const xMax = 20;
  const yMax = 4;

  const scaleX = (v: number) => margin.left + (v / xMax) * innerW;
  const scaleY = (v: number) => margin.top + (v / yMax) * innerH;

  return (
    <div class="diagram-container wide">
      {/* Step info */}
      <div
        style={{
          "text-align": "center",
          "margin-bottom": "12px",
          "font-size": "0.92rem",
        }}
      >
        <strong>
          Step {stepIdx() + 1} / {trace.length}
        </strong>
        :{" "}
        <code style={{ color: colors.blue }}>{step().label}</code>
      </div>

      {/* Sub-expression */}
      <div
        style={{
          "text-align": "center",
          "font-family": "var(--font-mono)",
          "font-size": "0.82rem",
          color: colors.textMuted,
          "margin-bottom": "16px",
          "max-width": "600px",
          margin: "0 auto 16px",
          "word-break": "break-all",
        }}
      >
        {docToString(step().subDoc)}
      </div>

      <div style={{ display: "flex", gap: "24px", "justify-content": "center", "flex-wrap": "wrap" }}>
        {/* Scatter plot */}
        <svg viewBox={`0 0 ${plotW} ${plotH}`} width={plotW} style="max-width: 100%; height: auto; flex-shrink: 0;">
          {/* Grid */}
          <For each={Array.from({ length: yMax + 1 }, (_, i) => i)}>
            {(i) => (
              <>
                <line
                  x1={margin.left}
                  y1={scaleY(i)}
                  x2={plotW - margin.right}
                  y2={scaleY(i)}
                  stroke="#eee"
                  stroke-width={1}
                />
                <text
                  x={margin.left - 6}
                  y={scaleY(i) + 4}
                  text-anchor="end"
                  font-size="10"
                  fill={colors.textMuted}
                  font-family="var(--font-mono)"
                >
                  {i}
                </text>
              </>
            )}
          </For>
          <For each={[0, 5, 10, 15, 20]}>
            {(v) => (
              <>
                <line
                  x1={scaleX(v)}
                  y1={margin.top}
                  x2={scaleX(v)}
                  y2={plotH - margin.bottom}
                  stroke="#eee"
                  stroke-width={1}
                />
                <text
                  x={scaleX(v)}
                  y={plotH - margin.bottom + 14}
                  text-anchor="middle"
                  font-size="10"
                  fill={colors.textMuted}
                  font-family="var(--font-mono)"
                >
                  {v}
                </text>
              </>
            )}
          </For>
          <text x={plotW / 2} y={plotH - 4} text-anchor="middle" font-size="11" fill={colors.textMuted}>
            maxWidth
          </text>
          <text
            x={10}
            y={plotH / 2}
            text-anchor="middle"
            font-size="11"
            fill={colors.textMuted}
            transform={`rotate(-90, 10, ${plotH / 2})`}
          >
            height
          </text>

          {/* Before-pruning points (faded) */}
          <For each={step().candidatesBefore}>
            {(c) => {
              const onFrontier = () =>
                step().candidatesAfter.some(
                  (f) =>
                    f.measure.height === c.measure.height &&
                    f.measure.maxWidth === c.measure.maxWidth &&
                    f.measure.lastWidth === c.measure.lastWidth
                );
              return (
                <circle
                  cx={scaleX(c.measure.maxWidth)}
                  cy={scaleY(c.measure.height)}
                  r={5}
                  fill={onFrontier() ? colors.green : "#ddd"}
                  stroke={onFrontier() ? colors.green : "#bbb"}
                  stroke-width={1.5}
                  opacity={onFrontier() ? 1 : 0.4}
                />
              );
            }}
          </For>
        </svg>

        {/* Measure table */}
        <div style={{ "font-size": "0.82rem", "min-width": "200px" }}>
          <table
            style={{
              "border-collapse": "collapse",
              "font-family": "var(--font-mono)",
              "font-size": "0.78rem",
            }}
          >
            <thead>
              <tr>
                <th style={{ padding: "4px 8px", "border-bottom": "2px solid #e2e8f0", "text-align": "right" }}>h</th>
                <th style={{ padding: "4px 8px", "border-bottom": "2px solid #e2e8f0", "text-align": "right" }}>mw</th>
                <th style={{ padding: "4px 8px", "border-bottom": "2px solid #e2e8f0", "text-align": "right" }}>lw</th>
                <th style={{ padding: "4px 8px", "border-bottom": "2px solid #e2e8f0" }}></th>
              </tr>
            </thead>
            <tbody>
              <For each={step().candidatesBefore}>
                {(c) => {
                  const onFrontier = () =>
                    step().candidatesAfter.some(
                      (f) =>
                        f.measure.height === c.measure.height &&
                        f.measure.maxWidth === c.measure.maxWidth &&
                        f.measure.lastWidth === c.measure.lastWidth
                    );
                  return (
                    <tr style={{ opacity: onFrontier() ? 1 : 0.4 }}>
                      <td style={{ padding: "3px 8px", "text-align": "right", "border-bottom": "1px solid #f0f0f0" }}>
                        {c.measure.height}
                      </td>
                      <td style={{ padding: "3px 8px", "text-align": "right", "border-bottom": "1px solid #f0f0f0" }}>
                        {c.measure.maxWidth}
                      </td>
                      <td style={{ padding: "3px 8px", "text-align": "right", "border-bottom": "1px solid #f0f0f0" }}>
                        {c.measure.lastWidth}
                      </td>
                      <td style={{ padding: "3px 8px", "border-bottom": "1px solid #f0f0f0" }}>
                        <Show when={onFrontier()}>
                          <span style={{ color: colors.green, "font-weight": "600" }}>&#10003;</span>
                        </Show>
                        <Show when={!onFrontier()}>
                          <span style={{ color: colors.red }}>&#10007;</span>
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
          <div style={{ "margin-top": "8px", color: colors.textMuted, "font-size": "0.78rem" }}>
            {step().candidatesAfter.length} / {step().candidatesBefore.length} survive pruning
          </div>
        </div>
      </div>

      <div class="diagram-controls">
        <button
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          disabled={stepIdx() === 0}
        >
          &#8592; Prev
        </button>
        <div class="step-indicator">
          <For each={trace}>
            {(_, i) => (
              <span
                class={`step-dot ${i() === stepIdx() ? "active" : i() < stepIdx() ? "completed" : ""}`}
              />
            )}
          </For>
        </div>
        <button
          onClick={() => setStepIdx((i) => Math.min(trace.length - 1, i + 1))}
          disabled={stepIdx() === trace.length - 1}
        >
          Next &#8594;
        </button>
      </div>

      <div class="diagram-caption">
        Stepping through the algorithm on{" "}
        <code>group(["a", group(["b", "c"])])</code>.
        At each step, candidates are generated and then pruned to the Pareto frontier
        (<span style={{ color: colors.green, "font-weight": "600" }}>green</span> = survives,
        faded = dominated).
      </div>
    </div>
  );
}
