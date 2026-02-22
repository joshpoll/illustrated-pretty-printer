import { createEffect, createSignal, onMount } from "solid-js";
import katex from "katex";

interface MathProps {
  tex: string;
  display?: boolean;
}

export default function M(props: MathProps) {
  let ref!: HTMLSpanElement;

  onMount(() => {
    katex.render(props.tex, ref, {
      displayMode: props.display ?? false,
      throwOnError: false,
      trust: true,
    });
  });

  createEffect(() => {
    // Re-render when tex changes
    const _ = props.tex;
    if (ref) {
      katex.render(props.tex, ref, {
        displayMode: props.display ?? false,
        throwOnError: false,
        trust: true,
      });
    }
  });

  return (
    <span
      ref={ref}
      class={props.display ? "math-display" : "math-inline"}
    />
  );
}
