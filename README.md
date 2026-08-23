# CMBRL Online Biology Tools — GitHub Pages Package

This package is ready to publish as a static GitHub Pages website.

## Live tools

1. **Protein Concentration Calculator** — standard curves, blank correction, dilution factors, multiple fitting models, diagnostics, and spreadsheet export.
2. **qPCR Fold Change Calculator** — ΔCt, ΔΔCt, fold change, replicate summaries, statistics, interactive visualization, and spreadsheet/chart export.
3. **Cell Culture & Cell Counting Calculator** — cell viability, hemocytometer counting, seeding/dilution planning, multi-vessel batch planning, and growth-area-based density translation.

## Included files

- `index.html` — the integrated single-page CMBRL Biology Tools website.
- `assets/cell-culture.css` — scoped styling for the new cell-culture calculator so it does not interfere with the existing tools.
- `assets/cell-culture.js` — cell-culture calculation logic and interactions.
- `assets/cmbrl-logo.jpg` — CMBRL laboratory logo.
- `assets/amr-ahmed-walyeldeen.png` — developer photo for Amr Ahmed WalyEldeen.
- `.nojekyll` — keeps GitHub Pages from applying unwanted Jekyll processing.
- `ENHANCEMENTS.md` — summary of the website improvements.

## Cell-culture calculator modules

- Cell viability from live and dead counts.
- Hemocytometer cell counting with editable dilution and chamber factors, cells/mL and cells/µL output, plus direct stock-withdrawal volume calculation for a desired viable-cell number.
- Seeding and dilution calculations using cell-stock concentration, target cells, working volume, vessel capacity, and preparation overage.
- Multi-plate / multi-flask batch planning.
- Editable density helper converting cells/cm² into cells per well or vessel.
- Plate/flask visualizations.
- Print / Save PDF for the active result view.
- Direct stock withdrawal: enter a desired viable-cell number and calculate the exact original-stock volume in µL.
- Session handoff: the latest viable-cell concentration can be inserted directly into seeding and batch-planning workflows.

## Scientific configuration notes

The cell-culture tool includes editable/common starting values for vessel growth area and working volume. These can vary by manufacturer and laboratory SOP. Edit the `VESSELS` object near the top of `assets/cell-culture.js` when you need to match specific labware.

The density helper uses generic editable starting values (5,000 / 10,000 / 20,000 cells/cm²). These are geometry/planning examples rather than cell-line-specific recommendations.

The default Neubauer large-square chamber factor is `10,000` (10⁴), and the field remains editable for other chamber geometries or counting methods.

## Publish to GitHub Pages

1. Open the GitHub repository you want to publish.
2. Upload **the contents of this folder** to the repository root.
3. If an older website already exists, replace the old `index.html` and upload/replace the full `assets` folder.
4. Commit the changes.
5. Open **Settings → Pages** in GitHub.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select the publishing branch (usually `main`) and `/ (root)`, then save.
8. Wait for GitHub Pages to finish deployment.

## Technical notes

All three calculators run client-side in the browser. The cell-culture calculator is self-contained in local CSS/JavaScript files and sends no culture data to a server. The existing protein and qPCR tools continue to use their original browser-side logic and CDN libraries (Chart.js, SheetJS/XLSX, Plotly, and jStat).
