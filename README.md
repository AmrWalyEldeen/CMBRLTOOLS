# CMBRL Online Biology Tools

A static GitHub Pages suite of browser-based biology calculators developed for CMBRL. No backend or build step is required.

## Included live tools

- Protein Concentration Calculator
- qPCR Fold Change Calculator
- Cell Culture & Cell Counting Calculator
- Buffer & Solution Preparation Calculator (BioBuffer Lab)

The new buffer/solution module supports preparation from solids, C₁V₁=C₂V₂ dilution calculations, unknown-concentration calculations, Henderson–Hasselbalch buffer design, multi-component stock mixes, molecular-weight calculation from chemical formulas, and concentration/volume unit conversion.

## GitHub Pages deployment

1. Upload **all files and the `assets/` folder** from this package to the repository root.
2. Keep `.nojekyll` in the root.
3. In GitHub, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main`, and select `/ (root)`.
5. Save and wait for GitHub Pages to publish.

## Main files

- `index.html` — integrated CMBRL site and all tool interfaces
- `assets/cell-culture.js` / `assets/cell-culture.css` — cell culture calculator
- `assets/buffer-tool.js` / `assets/buffer-tool.css` — buffer and solution calculator
- `assets/buffer-tool-data.js` — atomic weights, common reagents, and buffer-system reference data
- `assets/cmbrl-logo.jpg` — laboratory logo
- `assets/amr-ahmed-walyeldeen.png` — developer photo

## Laboratory note

These tools perform mathematical calculations. Verify assay conditions, reagent form/hydration, molecular weight, purity, manufacturer specifications, laboratory SOPs, and final pH/volume experimentally where required.

All calculations run locally in the browser.
