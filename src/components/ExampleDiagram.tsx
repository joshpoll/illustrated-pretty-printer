import { colors } from "../lib/colors";
import { complementCircle } from "../lib/svgClip";

/**
 * Example Venn diagram demonstrating clip-path set operations.
 * Shows two overlapping circles A and B with regions:
 *   - A \ B (only in A)
 *   - A ∩ B (overlap)
 *   - B \ A (only in B)
 */
export default function ExampleDiagram() {
  const svgW = 400;
  const svgH = 260;

  const A = { cx: 155, cy: 130, r: 80 };
  const B = { cx: 245, cy: 130, r: 80 };
  const bounds = { w: svgW, h: svgH };

  return (
    <div class="diagram-container">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} width={svgW} height={svgH}>
        <defs>
          {/* Clip to inside A */}
          <clipPath id="insideA">
            <circle cx={A.cx} cy={A.cy} r={A.r} />
          </clipPath>
          {/* Clip to inside B */}
          <clipPath id="insideB">
            <circle cx={B.cx} cy={B.cy} r={B.r} />
          </clipPath>
          {/* Clip to outside A (complement) */}
          <clipPath id="outsideA">
            <path clip-rule="evenodd" d={complementCircle(A, bounds)} />
          </clipPath>
          {/* Clip to outside B (complement) */}
          <clipPath id="outsideB">
            <path clip-rule="evenodd" d={complementCircle(B, bounds)} />
          </clipPath>
        </defs>

        {/* A \ B: circle A clipped to outside B */}
        <g clip-path="url(#outsideB)">
          <circle cx={A.cx} cy={A.cy} r={A.r}
            fill={colors.blue} fill-opacity={0.15}
            stroke={colors.blue} stroke-width={2} />
        </g>

        {/* A ∩ B: circle A clipped to inside B */}
        <g clip-path="url(#insideB)">
          <circle cx={A.cx} cy={A.cy} r={A.r}
            fill={colors.purple} fill-opacity={0.2}
            stroke="none" />
        </g>

        {/* B \ A: circle B clipped to outside A */}
        <g clip-path="url(#outsideA)">
          <circle cx={B.cx} cy={B.cy} r={B.r}
            fill={colors.orange} fill-opacity={0.15}
            stroke={colors.orange} stroke-width={2} />
        </g>

        {/* Full outlines (drawn on top) */}
        <circle cx={A.cx} cy={A.cy} r={A.r}
          fill="none" stroke={colors.blue} stroke-width={2} />
        <circle cx={B.cx} cy={B.cy} r={B.r}
          fill="none" stroke={colors.orange} stroke-width={2} />

        {/* Labels */}
        <text x={A.cx - 40} y={A.cy + 5}
          text-anchor="middle" font-size={18} font-weight={600}
          fill={colors.blue}>A</text>
        <text x={B.cx + 40} y={B.cy + 5}
          text-anchor="middle" font-size={18} font-weight={600}
          fill={colors.orange}>B</text>
        <text x={200} y={135}
          text-anchor="middle" font-size={14} font-weight={600}
          fill={colors.purple}>A∩B</text>
      </svg>
      <div class="diagram-caption">
        A Venn diagram with regions derived via <code>clipPath</code>.
        Blue = <em>A \ B</em>, purple = <em>A ∩ B</em>, orange = <em>B \ A</em>.
      </div>
    </div>
  );
}
