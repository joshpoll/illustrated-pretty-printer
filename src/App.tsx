import M from "./lib/Math";
import WidthSliderDemo from "./components/WidthSliderDemo";
import DocTreeDiagram from "./components/DocTreeDiagram";
import MeasureDiagram from "./components/MeasureDiagram";
import TetrisConcatDemo from "./components/TetrisConcatDemo";
import ParetoFrontierDemo from "./components/ParetoFrontierDemo";
import AlgorithmStepDemo from "./components/AlgorithmStepDemo";

export default function App() {
  return (
    <div class="page-layout">
      <div class="page-main">
        {/* ===== Header ===== */}
        <header>
          <h1>A Pretty But Not Greedy Printer</h1>
          <div class="subtitle">
            How to format code optimally using the Pareto frontier
          </div>
          <div class="authors">
            Based on the paper by Jean-Philippe Bernardy (2017)
          </div>
        </header>

        {/* ===== Abstract ===== */}
        <div class="abstract">
          <strong>Abstract.</strong> Pretty printers turn tree-structured documents
          into nicely formatted text. Most are either greedy (fast but suboptimal)
          or exhaustive (optimal but exponentially slow). Bernardy's algorithm
          achieves the best of both worlds: it finds optimal layouts in time linear
          in the document size, by using a Pareto frontier to prune dominated
          layout candidates at each step.
        </div>

        {/* ===== Table of Contents ===== */}
        <nav class="toc">
          <h2>Contents</h2>
          <ol>
            <li>
              <a href="#what-does-a-pretty-printer-do">
                What does a pretty printer actually do?
              </a>
            </li>
            <li>
              <a href="#documents-and-choices">Documents and choices</a>
            </li>
            <li>
              <a href="#three-numbers">
                Three numbers that describe a layout
              </a>
            </li>
            <li>
              <a href="#too-many-choices">Too many choices</a>
            </li>
            <li>
              <a href="#pareto-frontier">The Pareto frontier</a>
            </li>
            <li>
              <a href="#algorithm-step-by-step">The algorithm, step by step</a>
            </li>
            <li>
              <a href="#why-its-fast">Why it's fast</a>
            </li>
          </ol>
        </nav>

        {/* ===== Section 1 ===== */}
        <section id="what-does-a-pretty-printer-do">
          <h2>1. What does a pretty printer actually do?</h2>

          <p>
            Suppose you have a tree-structured expression — a function call whose
            arguments are themselves function calls, or an S-expression, or an
            HTML document. You want to turn it into nicely formatted text that
            fits within a given page width.
          </p>

          <p>
            If the page is wide enough, everything goes on one line. As the page
            gets narrower, the printer has to introduce line breaks. But
            where? A naive approach tries every possible combination — which is
            exponentially many. A <em class="concept">greedy</em> approach makes
            decisions left-to-right without lookahead — which is fast but can
            miss better layouts.
          </p>

          <p>
            The algorithm we'll explore here achieves three goals simultaneously:
          </p>

          <ul>
            <li>
              <strong>Visibility</strong> — no line exceeds the page width
              (when possible)
            </li>
            <li>
              <strong>Legibility</strong> — the output is easy to read (fewest
              line breaks)
            </li>
            <li>
              <strong>Frugality</strong> — among equally legible layouts, prefer
              the narrowest
            </li>
          </ul>

          <p>
            Try it yourself. Drag the slider to change the page width and watch
            the same document re-render:
          </p>

          <WidthSliderDemo />
        </section>

        {/* ===== Section 2 ===== */}
        <section id="documents-and-choices">
          <h2>2. Documents and choices</h2>

          <p>
            The input to a pretty printer isn't a string — it's a{" "}
            <em class="concept">document</em>, a tree that describes all the
            possible ways the output could be formatted. The tree has four kinds of
            nodes:
          </p>

          <div class="box definition">
            <span class="box-label">Definition (Doc type)</span>
            <ul>
              <li>
                <code>text(s)</code> — a literal string <M tex="s" /> (no line
                breaks)
              </li>
              <li>
                <code>flush(d)</code> — render <M tex="d" />, then start a new
                line (reset cursor to column 0)
              </li>
              <li>
                <code>
                  a &lt;&gt; b
                </code>{" "}
                — concatenation: lay out <M tex="a" /> then <M tex="b" /> (with
                "tetris" indentation)
              </li>
              <li>
                <code>
                  a &lt;|&gt; b
                </code>{" "}
                — choice: use layout <M tex="a" /> or layout <M tex="b" /> (the
                printer picks)
              </li>
            </ul>
          </div>

          <p>
            There's also a useful shorthand:{" "}
            <code>group(items)</code> means "try putting the
            items on one line with spaces; if it doesn't fit, fall back to
            putting each on its own line." Formally:
          </p>

          <M
            tex="\texttt{group}(\vec{d}) = \texttt{hsep}(\vec{d}) \;\langle|\rangle\; \texttt{vsep}(\vec{d})"
            display
          />

          <p>
            where <code>hsep</code> joins with spaces and <code>vsep</code>{" "}
            joins with flushes (line breaks). The choice node is what gives the
            printer its power — and its computational challenge.
          </p>

          <p>
            Here's what a simple document looks like as a tree. The{" "}
            <span style={{ color: "#ea580c", "font-weight": "600" }}>
              choice
            </span>{" "}
            node at the top is where the printer decides: one line or two?
          </p>

          <DocTreeDiagram />

          <p>
            Each <code>&lt;|&gt;</code> node doubles the number of possible
            layouts. With <M tex="n" /> choice nodes, there are up to{" "}
            <M tex="2^n" /> candidates. Even for modest documents, this is way
            too many to enumerate.
          </p>
        </section>

        {/* ===== Section 3 ===== */}
        <section id="three-numbers">
          <h2>3. Three numbers that describe a layout</h2>

          <p>
            A fully resolved document (all choices made) produces a list of
            lines — a concrete layout. But we don't need the full text of every
            layout to compare them. Three numbers suffice:
          </p>

          <div class="box definition">
            <span class="box-label">Definition (Measure)</span>
            <p>
              The <em class="concept">measure</em> of a layout is a triple{" "}
              <M tex="(h,\; w,\; \ell)" /> where:
            </p>
            <ul>
              <li>
                <M tex="h" /> = <strong>height</strong>: number of line breaks
                (lines minus 1)
              </li>
              <li>
                <M tex="w" /> = <strong>maxWidth</strong>: the widest line
              </li>
              <li>
                <M tex="\ell" /> = <strong>lastWidth</strong>: width of the last
                line
              </li>
            </ul>
          </div>

          <MeasureDiagram />

          <p>
            Why do we need <code>lastWidth</code>? Because of how concatenation
            works. When you concatenate two layouts, the second one doesn't start
            at column 0 — it starts where the first one left off. It's like
            Tetris: the right block slots in at the cursor position of the left
            block.
          </p>

          <p>
            The arithmetic of concatenation is:
          </p>

          <M
            tex="\begin{aligned} h_{L \cdot R} &= h_L + h_R \\ w_{L \cdot R} &= \max(w_L,\; \ell_L + w_R) \\ \ell_{L \cdot R} &= \ell_L + \ell_R \end{aligned}"
            display
          />

          <p>
            The key line is the second one: the new maximum width is the wider of the
            left block's widest line and the right block's widest line shifted
            over by the left block's last-line width.
          </p>

          <TetrisConcatDemo />
        </section>

        {/* ===== Section 4 ===== */}
        <section id="too-many-choices">
          <h2>4. Too many choices</h2>

          <p>
            With <M tex="n" /> choice (<code>&lt;|&gt;</code>) nodes in the
            document tree, there are <M tex="2^n" /> possible fully-resolved
            layouts. Even for a modest document with 20 choice points, that's
            over a million candidates. For 40 choice points — common in
            real code — it's over a trillion.
          </p>

          <div
            style={{
              display: "flex",
              "justify-content": "center",
              gap: "20px",
              margin: "24px 0",
              "font-family": "var(--font-mono)",
              "font-size": "0.88rem",
              "flex-wrap": "wrap",
            }}
          >
            {[1, 2, 3, 4, 5, 10, 20].map((n) => (
              <div style={{ "text-align": "center" }}>
                <div style={{ color: "#555" }}>n={n}</div>
                <div
                  style={{
                    "font-weight": "600",
                    color:
                      Math.pow(2, n) > 1000 ? "#dc2626" : "#2563eb",
                  }}
                >
                  {Math.pow(2, n).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <p>
            We can't enumerate all of them. But here's the crucial observation:
            most of these layouts are <strong>clearly worse</strong> than others.
            If layout A is shorter, narrower, <em>and</em> has a smaller
            last-line width than layout B, then A is better than B in{" "}
            <em>every possible context</em> — no matter what gets concatenated
            after it.
          </p>

          <p>
            This means we can prune. Aggressively.
          </p>
        </section>

        {/* ===== Section 5 ===== */}
        <section id="pareto-frontier">
          <h2>5. The Pareto frontier</h2>

          <p>
            We say measure <M tex="A" />{" "}
            <em class="concept">dominates</em> measure <M tex="B" /> if{" "}
            <M tex="A" /> is at least as good in every dimension and strictly
            better in at least one:
          </p>

          <M
            tex="A \preceq B \;\iff\; h_A \le h_B \;\wedge\; w_A \le w_B \;\wedge\; \ell_A \le \ell_B"
            display
          />

          <p>
            (with at least one strict inequality). If <M tex="A" /> dominates{" "}
            <M tex="B" />, then in <em>any</em> context — no matter what comes
            before or after — using <M tex="A" /> gives an equal or better
            final layout than using <M tex="B" />.
          </p>

          <p>
            The set of non-dominated measures is the{" "}
            <em class="concept">Pareto frontier</em>. Everything behind the
            frontier can be safely thrown away.
          </p>

          <ParetoFrontierDemo />

          <div class="box key-idea">
            <span class="box-label">Key Idea</span>
            <p>
              Concatenation is <strong>monotone</strong>: if{" "}
              <M tex="A \preceq B" />, then for any measure <M tex="X" />,{" "}
              <M tex="A \cdot X \preceq B \cdot X" />. This means dominated
              measures can never become useful later — they stay dominated no
              matter what context they end up in. So it's safe to prune them at
              every step.
            </p>
          </div>

          <div class="box remark">
            <span class="box-label">Remark</span>
            <p>
              The same idea appears throughout optimization: keep only the
              Pareto-efficient solutions and discard the rest. What makes it
              work here is the monotonicity of concatenation — a property that
              not all combination operators have.
            </p>
          </div>
        </section>

        {/* ===== Section 6 ===== */}
        <section id="algorithm-step-by-step">
          <h2>6. The algorithm, step by step</h2>

          <p>
            The algorithm processes the document tree bottom-up. At each node, it
            computes the Pareto frontier of candidate measures:
          </p>

          <ul>
            <li>
              <strong>
                <code>text(s)</code>
              </strong>
              : one candidate with{" "}
              <M tex="(0,\; |s|,\; |s|)" />
            </li>
            <li>
              <strong>
                <code>flush(d)</code>
              </strong>
              : measure <M tex="d" />, then add 1 to height and set lastWidth to 0
            </li>
            <li>
              <strong>
                <code>a &lt;&gt; b</code>
              </strong>
              : take the Cartesian product of the frontiers for <M tex="a" /> and{" "}
              <M tex="b" />, compute each combined measure, then Pareto-filter
            </li>
            <li>
              <strong>
                <code>a &lt;|&gt; b</code>
              </strong>
              : combine the frontiers for <M tex="a" /> and <M tex="b" />, then
              Pareto-filter
            </li>
          </ul>

          <p>
            At the root, we pick the best measure from the frontier (fewest lines,
            breaking ties by narrowest width) and replay its choices to produce the
            output string.
          </p>

          <p>
            Step through the algorithm on a small example:
          </p>

          <AlgorithmStepDemo />
        </section>

        {/* ===== Section 7 ===== */}
        <section id="why-its-fast">
          <h2>7. Why it's fast</h2>

          <p>
            The naive approach has <M tex="2^n" /> candidates for a document with{" "}
            <M tex="n" /> choice nodes. Why doesn't the Pareto approach also blow
            up?
          </p>

          <p>
            The key insight: the frontier size is bounded by the page width{" "}
            <M tex="W" />, not by the document size. Think about it: each
            non-dominated measure has a distinct <code>height</code> value (if
            two measures had the same height and one had smaller maxWidth and
            lastWidth, the other would be dominated). And the height can't
            exceed <M tex="W" /> in practice, because a layout with more
            than <M tex="W" /> lines and a maxWidth under <M tex="W" /> would
            require extremely short lines.
          </p>

          <p>
            More precisely, the frontier size <M tex="k" /> satisfies{" "}
            <M tex="k \le W^2" /> (since the lastWidth and maxWidth values are
            each bounded by <M tex="W" />). At each combining step in the
            algorithm:
          </p>

          <ol>
            <li>
              Take the Cartesian product of two frontiers: at most{" "}
              <M tex="k^2" /> candidates
            </li>
            <li>
              Pareto-filter back to at most <M tex="k" /> candidates
            </li>
          </ol>

          <p>
            The total work across all <M tex="n" /> nodes of the document tree
            is therefore <M tex="O(n \cdot k^2)" />. Since <M tex="k" /> depends
            only on <M tex="W" /> (the page width, a constant), the algorithm is{" "}
            <strong>linear in the document size</strong> for any fixed page width.
          </p>

          <div class="box key-idea">
            <span class="box-label">Key Idea</span>
            <p>
              The Pareto frontier acts as a "bottleneck" that prevents the
              exponential blowup. No matter how many choices the document
              contains, the number of non-dominated measures at each step is
              bounded by a function of the page width alone. Pruning at every step
              keeps the computation tractable.
            </p>
          </div>

          <M
            tex="\underbrace{O(n)}_{\text{document nodes}} \;\times\; \underbrace{O(k^2)}_{\text{product + filter}} \;=\; O(n \cdot W^4)"
            display
          />

          <p>
            For typical page widths (<M tex="W = 80" /> or <M tex="W = 120" />),
            the constant factor <M tex="W^4" /> is large but fixed. The runtime
            grows linearly with the document, which is the best we could hope for —
            after all, we need to look at every node at least once.
          </p>

          <div class="box remark">
            <span class="box-label">Remark</span>
            <p>
              In practice, the frontier is much smaller than the{" "}
              <M tex="W^2" /> worst case. Real documents tend to produce
              frontiers with just a handful of measures, making the algorithm
              very fast in practice. The reference implementation by{" "}
              <a
                href="https://github.com/ammkrn/printiest"
                target="_blank"
                rel="noopener"
              >
                ammkrn/printiest
              </a>{" "}
              in Lean confirms this.
            </p>
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer>
          Based on "A Pretty But Not Greedy Printer" by Jean-Philippe Bernardy
          (2017). Built with SolidJS.
        </footer>
      </div>
    </div>
  );
}
