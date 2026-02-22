# Illustrated Proof Template

A template for building illustrated, interactive articles about math and CS topics. Built with SolidJS + Vite + TypeScript + KaTeX, deployed to GitHub Pages.

## Quick Start

```bash
# Create a new repo from this template (on GitHub, click "Use this template")
# Then clone and install:
git clone git@github.com:yourname/your-article.git
cd your-article
npm install
npm run dev
# Open http://localhost:5555
```

## Project Structure

```
src/
  lib/                    # Reusable library code
    Math.tsx              # KaTeX wrapper component (<M tex="..." />)
    svgClip.ts            # Clip-path utilities for set operations
    colors.ts             # Semantic color palette constants
    seededRandom.ts       # Reproducible PRNG for diagrams
  components/             # Article-specific diagrams & interactives
    ExampleDiagram.tsx    # Demo Venn diagram (safe to replace)
  App.tsx                 # Article content — start editing here
  index.tsx               # Entry point
  index.css               # Full design system
CLAUDE.md                 # AI assistant instructions & style guide
STYLE_GUIDE.md            # Visualization cookbook
WORKING_LOG.md            # Process log
```

## Getting Started with Your Article

1. Edit `index.html` to set your article title
2. Edit `src/App.tsx` — replace the skeleton content with your article
3. Create new diagram components in `src/components/`
4. Put reference materials (PDFs, images) in `reference-materials/`

## Deployment

To enable GitHub Pages deployment:

1. Go to repo **Settings > Pages > Source** and select **GitHub Actions**
2. In `.github/workflows/deploy.yml`, uncomment the `push` trigger:
   ```yaml
   on:
     workflow_dispatch:
     push:
       branches: [main]
   ```
3. Push to `main` — GitHub Actions will build and deploy automatically

The workflow reads the repo name to set the correct base path, so no configuration is needed.

## Design System

See `CLAUDE.md` for the full style guide, including:
- Color palette and semantic meanings
- Box system (theorem, definition, remark, key idea)
- SVG clip-path patterns for set operations
- Interactive diagram patterns with SolidJS signals
- All available CSS classes

See `STYLE_GUIDE.md` for a visualization cookbook with specific SVG techniques.
