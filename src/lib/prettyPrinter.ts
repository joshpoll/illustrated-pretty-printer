// Pretty printer algorithm based on Bernardy's "A Pretty But Not Greedy Printer"
// Simplified for pedagogical purposes — focuses on core Pareto frontier idea.
//
// Key structural choice: uses Flush(doc) instead of a standalone Line node.
// Flush(d) renders d then starts a new line (resets cursor to column 0).
// This matches printiest (ammkrn/printiest) and Bernardy's original design.

// === Document AST ===
export type Doc =
  | { tag: "text"; s: string }
  | { tag: "flush"; doc: Doc } // render doc, then newline (cursor → column 0)
  | { tag: "concat"; docs: Doc[] }
  | { tag: "choice"; a: Doc; b: Doc };

// === Measure: three numbers that describe a layout ===
export interface Measure {
  height: number; // number of line breaks (lines - 1)
  maxWidth: number; // widest line
  lastWidth: number; // width of the last line
}

// === Layout candidate: a measure + the choices that produced it ===
export interface Candidate {
  measure: Measure;
  choices: boolean[]; // true = picked 'a' branch at each choice node
}

// === Step trace for visualization ===
export interface AlgorithmStep {
  label: string;
  subDoc: Doc;
  candidatesBefore: Candidate[];
  candidatesAfter: Candidate[];
}

// === Dominance ===
export function dominates(a: Measure, b: Measure): boolean {
  return (
    a.height <= b.height &&
    a.maxWidth <= b.maxWidth &&
    a.lastWidth <= b.lastWidth &&
    (a.height < b.height || a.maxWidth < b.maxWidth || a.lastWidth < b.lastWidth)
  );
}

// === Pareto frontier: keep only non-dominated candidates that fit within width ===
export function pareto(candidates: Candidate[], width: number): Candidate[] {
  const valid = candidates.filter((c) => c.measure.maxWidth <= width);
  if (valid.length === 0) {
    return paretoFilter(candidates);
  }
  return paretoFilter(valid);
}

function paretoFilter(candidates: Candidate[]): Candidate[] {
  const result: Candidate[] = [];
  for (const c of candidates) {
    if (result.some((r) => dominates(r.measure, c.measure))) continue;
    const filtered = result.filter((r) => !dominates(c.measure, r.measure));
    result.length = 0;
    result.push(...filtered, c);
  }
  return result;
}

// === Concatenation of two measures ("tetris" operation) ===
// From the paper (p. 6:11): when concatenating two layouts, the right layout
// starts at the cursor position (lastWidth) of the left. ALL subsequent lines
// of the right operand are indented by lastWidth_a. Hence:
//   height    = h_a + h_b
//   maxWidth  = max(mw_a, lw_a + mw_b)
//   lastWidth = lw_a + lw_b
export function concatMeasures(a: Measure, b: Measure): Measure {
  return {
    height: a.height + b.height,
    maxWidth: Math.max(a.maxWidth, a.lastWidth + b.maxWidth),
    lastWidth: a.lastWidth + b.lastWidth,
  };
}

// === Flush measure: render doc then newline ===
function flushMeasure(m: Measure): Measure {
  return { height: m.height + 1, maxWidth: m.maxWidth, lastWidth: 0 };
}

// === Core algorithm: measure a Doc, returning the Pareto frontier of candidates ===
export function measureDoc(
  doc: Doc,
  width: number,
  trace?: AlgorithmStep[]
): Candidate[] {
  switch (doc.tag) {
    case "text": {
      const c: Candidate = {
        measure: { height: 0, maxWidth: doc.s.length, lastWidth: doc.s.length },
        choices: [],
      };
      const result = [c];
      if (trace) {
        trace.push({
          label: `text("${doc.s}")`,
          subDoc: doc,
          candidatesBefore: result,
          candidatesAfter: result,
        });
      }
      return result;
    }

    case "flush": {
      const inner = measureDoc(doc.doc, width, trace);
      const result = pareto(
        inner.map((c) => ({
          measure: flushMeasure(c.measure),
          choices: c.choices,
        })),
        width
      );
      if (trace) {
        trace.push({
          label: "flush",
          subDoc: doc,
          candidatesBefore: inner,
          candidatesAfter: result,
        });
      }
      return result;
    }

    case "concat": {
      if (doc.docs.length === 0) {
        const c: Candidate = {
          measure: { height: 0, maxWidth: 0, lastWidth: 0 },
          choices: [],
        };
        return [c];
      }

      let current = measureDoc(doc.docs[0], width, trace);

      for (let i = 1; i < doc.docs.length; i++) {
        const right = measureDoc(doc.docs[i], width, trace);

        const combined: Candidate[] = [];
        for (const l of current) {
          for (const r of right) {
            combined.push({
              measure: concatMeasures(l.measure, r.measure),
              choices: [...l.choices, ...r.choices],
            });
          }
        }

        const pruned = pareto(combined, width);

        if (trace) {
          trace.push({
            label: `concat step ${i}/${doc.docs.length - 1}`,
            subDoc: { tag: "concat", docs: doc.docs.slice(0, i + 1) },
            candidatesBefore: combined,
            candidatesAfter: pruned,
          });
        }

        current = pruned;
      }

      return current;
    }

    case "choice": {
      const aCandidates = measureDoc(doc.a, width, trace).map((c) => ({
        measure: c.measure,
        choices: [true, ...c.choices],
      }));
      const bCandidates = measureDoc(doc.b, width, trace).map((c) => ({
        measure: c.measure,
        choices: [false, ...c.choices],
      }));

      const combined = [...aCandidates, ...bCandidates];
      const pruned = pareto(combined, width);

      if (trace) {
        trace.push({
          label: "choice (<|>)",
          subDoc: doc,
          candidatesBefore: combined,
          candidatesAfter: pruned,
        });
      }

      return pruned;
    }
  }
}

// === Tetris-style concatenation of two layouts (lists of lines) ===
// From the paper (p. 6:8):
//   xs <> (y : ys) = init(xs) ++ [last(xs) ++ y] ++ map (indent ++) ys
//     where indent = replicate (length (last xs)) ' '
// The last line of the left layout joins with the first line of the right,
// and ALL subsequent lines of the right are indented by last-line-width of the left.
function tetrisConcat(left: string[], right: string[]): string[] {
  if (left.length === 0) return right;
  if (right.length === 0) return left;
  const init = left.slice(0, -1);
  const lastLeft = left[left.length - 1];
  const firstRight = right[0];
  const restRight = right.slice(1);
  const indent = " ".repeat(lastLeft.length);
  return [...init, lastLeft + firstRight, ...restRight.map((l) => indent + l)];
}

// === Render: replay choices to produce a string ===
// Renders to a list of lines (matching the paper's L = [String] representation),
// then joins with newlines.
export function render(doc: Doc, choices: boolean[]): string {
  let idx = 0;

  function go(d: Doc): string[] {
    switch (d.tag) {
      case "text":
        return [d.s];
      case "flush":
        return [...go(d.doc), ""];
      case "concat": {
        let result = go(d.docs[0]);
        for (let i = 1; i < d.docs.length; i++) {
          result = tetrisConcat(result, go(d.docs[i]));
        }
        return result;
      }
      case "choice": {
        const pick = choices[idx++];
        return go(pick ? d.a : d.b);
      }
    }
  }

  return go(doc).join("\n");
}

// === Best layout: pick the best candidate from the Pareto frontier ===
export function bestLayout(doc: Doc, width: number): string {
  const frontier = measureDoc(doc, width);
  if (frontier.length === 0) return "";

  // Sort: fewest lines first, then narrowest, then smallest lastWidth
  frontier.sort((a, b) => {
    if (a.measure.height !== b.measure.height) return a.measure.height - b.measure.height;
    if (a.measure.maxWidth !== b.measure.maxWidth)
      return a.measure.maxWidth - b.measure.maxWidth;
    return a.measure.lastWidth - b.measure.lastWidth;
  });

  return render(doc, frontier[0].choices);
}

// === Convenience constructors ===

export function text(s: string): Doc {
  return { tag: "text", s };
}

export function flush(doc: Doc): Doc {
  return { tag: "flush", doc };
}

export function concat(...docs: Doc[]): Doc {
  // Flatten nested concats
  const flat: Doc[] = [];
  for (const d of docs) {
    if (d.tag === "concat") {
      flat.push(...d.docs);
    } else {
      flat.push(d);
    }
  }
  if (flat.length === 0) return text("");
  if (flat.length === 1) return flat[0];
  return { tag: "concat", docs: flat };
}

export function choice(a: Doc, b: Doc): Doc {
  return { tag: "choice", a, b };
}

// Vertical concatenation: a then newline then b
export function vConcat(a: Doc, b: Doc): Doc {
  return concat(flush(a), b);
}

// Join items vertically (flush all but last, then concat)
export function vJoin(items: Doc[]): Doc {
  if (items.length === 0) return text("");
  if (items.length === 1) return items[0];
  const parts: Doc[] = items.slice(0, -1).map((d) => flush(d));
  parts.push(items[items.length - 1]);
  return concat(...parts);
}

// Group: try laying out items horizontally (with sep), otherwise vertically.
// This is the core "choice" construct — the printer picks whichever fits better.
export function group(items: Doc[], sep: string = " "): Doc {
  if (items.length === 0) return text("");
  if (items.length === 1) return items[0];

  // Horizontal: items joined by sep on one line
  const hParts: Doc[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) hParts.push(text(sep));
    hParts.push(items[i]);
  }
  const horizontal = concat(...hParts);

  // Vertical: items on separate lines
  const vertical = vJoin(items);

  return choice(horizontal, vertical);
}

// Group with indentation for vertical layout
export function groupIndent(
  items: { indent: number; doc: Doc }[],
  sep: string = " "
): Doc {
  if (items.length === 0) return text("");
  if (items.length === 1) return items[0].doc;

  // Horizontal: all items on one line with sep
  const hParts: Doc[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) hParts.push(text(sep));
    hParts.push(items[i].doc);
  }
  const horizontal = concat(...hParts);

  // Vertical: items on separate lines with indentation
  const vLines: Doc[] = items.map(({ indent, doc }) =>
    indent > 0 ? concat(text(" ".repeat(indent)), doc) : doc
  );
  const vertical = vJoin(vLines);

  return choice(horizontal, vertical);
}

// Hang: if everything fits on one line, put it there;
// otherwise put lower on the next line with indentation.
export function hang(indent: number, upper: Doc, lower: Doc): Doc {
  return groupIndent(
    [
      { indent: 0, doc: upper },
      { indent, doc: lower },
    ],
    " "
  );
}

// === Example documents for demos ===

// Build a function call like f(a, b, c) that can break across lines.
// Tetris-style concat automatically indents args under the opening paren.
export function funcCall(name: string, args: Doc[]): Doc {
  if (args.length === 0) return text(name + "()");

  // Attach commas to all args except the last
  const withCommas = args.map((a, i) =>
    i < args.length - 1 ? concat(a, text(",")) : a
  );

  // sep: horizontal (with space after comma) or vertical (commas already attached)
  const inner = group(withCommas, " ");
  return concat(text(name + "("), inner, text(")"));
}

// S-expression printer (matches printiest's tests)
export type Sexpr = { tag: "atom"; s: string } | { tag: "list"; items: Sexpr[] };

export function sexprPretty(sexpr: Sexpr): Doc {
  switch (sexpr.tag) {
    case "atom":
      return text(sexpr.s);
    case "list": {
      const inner = group(sexpr.items.map(sexprPretty), " ");
      return concat(text("("), inner, text(")"));
    }
  }
}

// A simple nested expression for demos
export function exampleDoc(): Doc {
  return funcCall("render", [
    funcCall("div", [
      funcCall("h1", [text('"Hello"')]),
      funcCall("p", [text('"This is a pretty printer demo"')]),
      funcCall("ul", [
        funcCall("li", [text('"item 1"')]),
        funcCall("li", [text('"item 2"')]),
      ]),
    ]),
  ]);
}

// A smaller example for the algorithm step-through
export function smallExampleDoc(): Doc {
  return group([text("a"), group([text("b"), text("c")], " ")], " ");
}

// Pretty-print a Doc AST for display
export function docToString(doc: Doc): string {
  switch (doc.tag) {
    case "text":
      return `"${doc.s}"`;
    case "flush":
      return `flush(${docToString(doc.doc)})`;
    case "concat":
      return doc.docs.map(docToString).join(" <> ");
    case "choice":
      return `(${docToString(doc.a)} <|> ${docToString(doc.b)})`;
  }
}
