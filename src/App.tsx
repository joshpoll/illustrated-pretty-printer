import M from "./lib/Math";
import ExampleDiagram from "./components/ExampleDiagram";

export default function App() {
  return (
    <div class="page-layout">
      <div class="page-main">
        {/* ===== Header ===== */}
        <header>
          <h1>Your Article Title Here</h1>
          <div class="subtitle">A subtitle or one-sentence hook</div>
          <div class="authors">Author Name</div>
        </header>

        {/* ===== Abstract ===== */}
        <div class="abstract">
          <strong>Abstract.</strong> A brief summary of what this article covers
          and why the reader should care. Keep it to 2–3 sentences. Mention the
          key result and what makes it surprising or useful.
        </div>

        {/* ===== Table of Contents ===== */}
        <nav class="toc">
          <h2>Contents</h2>
          <ol>
            <li><a href="#why-this-matters">Why does this matter?</a></li>
            <li><a href="#setting-up">Setting up the problem</a></li>
          </ol>
        </nav>

        {/* ===== Section 1 ===== */}
        <section id="why-this-matters">
          <h2>1. Why does this matter?</h2>

          <p>
            Start with a concrete example or application before any abstraction.
            Suppose we have a set <M tex="A" /> and another set <M tex="B" />.
            The question is: how do <M tex="A" /> and <M tex="B" /> relate?
          </p>

          <p>
            Here's a diagram showing all three regions — <M tex="A \setminus B" />,
            the overlap <M tex="A \cap B" />, and <M tex="B \setminus A" />:
          </p>

          <ExampleDiagram />

          <p>
            Notice how the regions are <em class="concept">structurally derived</em>{" "}
            from the actual shapes using clip paths, not drawn independently.
            If you change the position or size of either circle, every region
            updates automatically.
          </p>

          <div class="box key-idea">
            <span class="box-label">Key Idea</span>
            <p>
              Your main insight goes here. State it clearly so a reader who skims
              will still get the point. Use <M tex="\text{inline math}" /> freely.
            </p>
          </div>
        </section>

        {/* ===== Section 2 ===== */}
        <section id="setting-up">
          <h2>2. Setting up the problem</h2>

          <p>
            Now introduce the formal setup. Display math works like this:
          </p>

          <M tex="\Pr[X \geq t] \leq \exp\!\bigl(-\tfrac{t^2}{2}\bigr)" display />

          <div class="box definition">
            <span class="box-label">Definition</span>
            <p>
              A <em class="concept">widget</em> is a pair <M tex="(X, f)" /> where{" "}
              <M tex="X" /> is a finite set and{" "}
              <M tex="f : 2^X \to \mathbb{R}" /> is monotone.
            </p>
          </div>

          <p>
            Build up incrementally. Introduce one concept at a time, with a
            diagram or example after each new idea.
          </p>

          <div class="box remark">
            <span class="box-label">Remark</span>
            <p>
              Side notes, historical context, or "why we chose this approach"
              go in remark boxes. These are skippable for readers in a hurry.
            </p>
          </div>

          <div class="box">
            <span class="box-label">Theorem 1</span>
            <p>
              For every monotone family <M tex="\mathcal{H}" /> on{" "}
              <M tex="[n]" />, we have{" "}
              <M tex="p_c(\mathcal{H}) = O(q(\mathcal{H}) \log n)" />.
            </p>
          </div>

          {/* Placeholder for a diagram you haven't built yet */}
          <div class="diagram-placeholder">
            Future diagram: visualize the theorem statement
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer>
          Built with SolidJS. Source on GitHub.
        </footer>
      </div>
    </div>
  );
}
