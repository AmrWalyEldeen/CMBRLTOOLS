# CMBRL Online Biology Tools — Enhanced GitHub Pages Package

This package is ready to publish as a static GitHub Pages website.

## Included

- `index.html` — enhanced single-page application with the original calculator logic preserved.
- `assets/cmbrl-logo.jpg` — CMBRL laboratory logo supplied for the site.
- `assets/amr-ahmed-walyeldeen.png` — developer photo supplied for the site.
- `.nojekyll` — prevents GitHub Pages/Jekyll processing from interfering with static assets.

## Main improvements

- CMBRL-branded visual system using blue, teal, and violet tones from the laboratory identity.
- CMBRL logo in navigation, hero identity card, favicon, and footer.
- Developer photo placed beside **Amr Ahmed WalyEldeen** in the navigation/hero/footer.
- Redesigned hero, tool cards, buttons, panels, tables, and status elements.
- Refined typography using Manrope + Source Serif 4.
- Updated protein/qPCR chart palettes and chart typography.
- Responsive/mobile navigation and layout refinements.
- Accessibility improvements: skip link, focus states, reduced-motion support, clearer contrast.
- SEO/social metadata and browser theme color.

## Publish to GitHub Pages

1. Open the GitHub repository you want to use.
2. Upload **the contents of this folder** to the repository root (not the enclosing folder itself).
3. Commit the files.
4. In GitHub, open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select your publishing branch (usually `main`) and `/ (root)`, then save.
7. Wait for the GitHub Pages deployment to complete.

If the repository already contains the old website, replace its old `index.html` with this one and upload the `assets` folder.

## Technical note

The calculators continue to use the original browser-side JavaScript logic and existing CDN libraries (Chart.js, SheetJS/XLSX, Plotly, and jStat). The enhancement package focuses on visual design, branding, responsive behavior, accessibility, and presentation without restructuring the calculation modules.
