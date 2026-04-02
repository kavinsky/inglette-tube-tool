# Inglette Tool

A browser-based calculator for **pie-cut tube bend** geometry. Given a tube diameter, bend radius, bend angle, and number of segments, it computes all cut angles, arc lengths, and side offsets — and renders visual templates you can use directly at the workbench.

## What it does

- Calculates the cut angle φ, segment arc lengths, and long/short side offsets for each piece
- Renders a straight-cut template (wrap-around layout) and a cut-angle diagram
- Shows the assembled bend preview
- Supports mm and inch unit display

## Stack

- [Vue 3](https://vuejs.org/) + Composition API
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- Canvas-based visualizations (no external charting library)

## Development

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Type-check + production build
npm run build

# Preview the production build locally
npm run preview
```

## Project structure

```
src/
  composables/
    usePieCut.js        # All geometry calculations
  components/
    InputPanel.vue      # Sidebar inputs
    StraightCutCanvas.vue
    CutTemplateCanvas.vue
    ArcCanvas.vue       # Assembled bend preview
    ResultsTable.vue
  App.vue
```

The geometry lives entirely in `usePieCut.js`. If you need to adjust formulas or add new outputs, start there.

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`.

## License

MIT — see [LICENSE](LICENSE).
