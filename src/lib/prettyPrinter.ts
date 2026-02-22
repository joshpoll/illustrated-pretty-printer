// Pretty printer algorithm based on Bernardy's "A Pretty But Not Greedy Printer"
// Simplified for pedagogical purposes — focuses on core Pareto frontier idea.

// === Document AST ===
export type Doc =
  | { tag: "text"; s: string }
  | { tag: "line" }
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
  label: string; // description of what's happening
  subDoc: Doc; // the sub-document being measured
  candidatesBefore: Candidate[]; // candidates before Pareto pruning
  candidatesAfter: Candidate[]; // candidates after Pareto pruning (the frontier)
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
  // First filter out candidates that exceed the page width
  const valid = candidates.filter((c) => c.measure.maxWidth <= width);
  if (valid.length === 0) {
    // If nothing fits, keep the narrowest candidate(s) as fallback
    return paretoFilter(candidates);
  }
  return paretoFilter(valid);
}

function paretoFilter(candidates: Candidate[]): Candidate[] {
  const result: Candidate[] = [];
  for (const c of candidates) {
    // Check if c is dominated by any existing result
    if (result.some((r) => dominates(r.measure, c.measure))) continue;
    // Remove any existing results dominated by c
    const filtered = result.filter((r) => !dominates(c.measure, r.measure));
    result.length = 0;
    result.push(...filtered, c);
  }
  return result;
}

// === Concatenation of two measures ("tetris" operation) ===
export function concatMeasures(a: Measure, b: Measure): Measure {
  return {
    height: a.height + b.height,
    maxWidth: Math.max(a.maxWidth, a.lastWidth + b.maxWidth),
    lastWidth: a.lastWidth + b.lastWidth,
  };
}

// === Core algorithm: measure a Doc, returning the Pareto frontier of candidates ===
// Optionally collects algorithm steps for visualization.
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

    case "line": {
      const c: Candidate = {
        measure: { height: 1, maxWidth: 0, lastWidth: 0 },
        choices: [],
      };
      const result = [c];
      if (trace) {
        trace.push({
          label: "line",
          subDoc: doc,
          candidatesBefore: result,
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

        // Cartesian product
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

// === Render: replay choices to produce a string ===
export function render(doc: Doc, choices: boolean[]): string {
  let idx = 0;

  function go(d: Doc): string {
    switch (d.tag) {
      case "text":
        return d.s;
      case "line":
        return "\n";
      case "concat":
        return d.docs.map(go).join("");
      case "choice": {
        const pick = choices[idx++];
        return go(pick ? d.a : d.b);
      }
    }
  }

  return go(doc);
}

// === Render with indentation ===
export function renderIndented(doc: Doc, choices: boolean[]): string {
  const raw = render(doc, choices);
  return raw;
}

// === Best layout: pick the candidate with smallest height, breaking ties by maxWidth ===
export function bestLayout(doc: Doc, width: number): string {
  const frontier = measureDoc(doc, width);
  if (frontier.length === 0) return "";

  // Sort by height, then maxWidth, then lastWidth
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

export const line: Doc = { tag: "line" };

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
  if (flat.length === 1) return flat[0];
  return { tag: "concat", docs: flat };
}

export function choice(a: Doc, b: Doc): Doc {
  return { tag: "choice", a, b };
}

export function flatten(doc: Doc): Doc {
  switch (doc.tag) {
    case "text":
      return doc;
    case "line":
      return text(" ");
    case "concat":
      return { tag: "concat", docs: doc.docs.map(flatten) };
    case "choice":
      return flatten(doc.a); // flatten always picks the 'a' (horizontal) branch
  }
}

export function group(doc: Doc): Doc {
  return choice(flatten(doc), doc);
}

// Nest: add indentation after each line break
export function nest(indent: number, doc: Doc): Doc {
  const pad = " ".repeat(indent);
  function go(d: Doc): Doc {
    switch (d.tag) {
      case "text":
        return d;
      case "line":
        return concat(line, text(pad));
      case "concat":
        return { tag: "concat", docs: d.docs.map(go) };
      case "choice":
        return { tag: "choice", a: go(d.a), b: go(d.b) };
    }
  }
  return go(doc);
}

// === Example documents for demos ===

// Helper: intersperse a separator between items
function intersperse(sep: Doc, items: Doc[]): Doc[] {
  const result: Doc[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) result.push(sep);
    result.push(items[i]);
  }
  return result;
}

// Helper: build a function call like f(a, b, c) that can break across lines
export function funcCall(name: string, args: Doc[]): Doc {
  const sep = concat(text(","), line);
  const body = intersperse(sep, args);
  return group(concat(text(name + "("), nest(name.length + 1, concat(...body)), text(")")));
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
  return group(
    concat(
      text("a"),
      line,
      group(concat(text("b"), line, text("c")))
    )
  );
}

// Pretty-print a Doc AST for display
export function docToString(doc: Doc): string {
  switch (doc.tag) {
    case "text":
      return `"${doc.s}"`;
    case "line":
      return "line";
    case "concat":
      return doc.docs.map(docToString).join(" <> ");
    case "choice":
      return `(${docToString(doc.a)} <|> ${docToString(doc.b)})`;
  }
}
