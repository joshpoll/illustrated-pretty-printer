/**
 * Dimension arrows for SVG diagrams.
 *
 * Draws a line between two points with arrowheads at both ends and a
 * centered label. Arrowheads are drawn as explicit path elements (not
 * SVG markers) so they reliably inherit the given color in all browsers.
 */

import type { JSX } from "solid-js";

const ARROW_SIZE = 4;

interface DimArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Label rendered at midpoint. Can be a string or JSX (e.g. for subscripts). */
  label: JSX.Element;
  color: string;
  /** Perpendicular offset for label. Positive = left of travel. Default 10. */
  labelOffset?: number;
  fontSize?: number;
}

export function DimArrow(props: DimArrowProps) {
  const dx = () => props.x2 - props.x1;
  const dy = () => props.y2 - props.y1;
  const len = () => Math.sqrt(dx() * dx() + dy() * dy());

  const ux = () => (len() > 0 ? dx() / len() : 1);
  const uy = () => (len() > 0 ? dy() / len() : 0);
  const px = () => -uy();
  const py = () => ux();

  const startHead = () => {
    const ax = props.x1, ay = props.y1;
    const s = ARROW_SIZE * 1.5;
    return `M ${ax + ux() * s + px() * ARROW_SIZE} ${ay + uy() * s + py() * ARROW_SIZE} L ${ax} ${ay} L ${ax + ux() * s - px() * ARROW_SIZE} ${ay + uy() * s - py() * ARROW_SIZE}`;
  };

  const endHead = () => {
    const ax = props.x2, ay = props.y2;
    const s = ARROW_SIZE * 1.5;
    return `M ${ax - ux() * s + px() * ARROW_SIZE} ${ay - uy() * s + py() * ARROW_SIZE} L ${ax} ${ay} L ${ax - ux() * s - px() * ARROW_SIZE} ${ay - uy() * s - py() * ARROW_SIZE}`;
  };

  const offset = () => props.labelOffset ?? 10;
  const midX = () => (props.x1 + props.x2) / 2 + px() * offset();
  const midY = () => (props.y1 + props.y2) / 2 + py() * offset();
  const fs = () => props.fontSize ?? 11;

  return (
    <g>
      <line
        x1={props.x1} y1={props.y1}
        x2={props.x2} y2={props.y2}
        stroke={props.color} stroke-width={1}
      />
      <path d={startHead()} fill="none" stroke={props.color} stroke-width={1} stroke-linejoin="round" />
      <path d={endHead()} fill="none" stroke={props.color} stroke-width={1} stroke-linejoin="round" />
      <text
        x={midX()} y={midY()}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={fs()}
        fill={props.color}
        style="font-style: italic;"
      >
        {props.label}
      </text>
    </g>
  );
}

/** Horizontal dimension arrow. */
export function HDimArrow(props: {
  x1: number; x2: number; y: number;
  label: JSX.Element; color: string;
  above?: boolean;
  fontSize?: number;
}) {
  return (
    <DimArrow
      x1={props.x1} y1={props.y}
      x2={props.x2} y2={props.y}
      label={props.label}
      color={props.color}
      labelOffset={props.above ? -10 : 10}
      fontSize={props.fontSize}
    />
  );
}

/** Vertical dimension arrow. Label to the right by default. */
export function VDimArrow(props: {
  x: number; y1: number; y2: number;
  label: JSX.Element; color: string;
  labelOffset?: number;
  fontSize?: number;
}) {
  return (
    <DimArrow
      x1={props.x} y1={props.y1}
      x2={props.x} y2={props.y2}
      label={props.label}
      color={props.color}
      labelOffset={props.labelOffset ?? -16}
      fontSize={props.fontSize}
    />
  );
}
