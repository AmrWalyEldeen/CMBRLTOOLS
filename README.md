# Biology Tools Website

GitHub Pages-ready static website for laboratory biology tools.

## Current tool

- Protein Concentration Calculator for Bradford, BCA, and ELISA-style workflows.
- Supports manual data entry.
- Supports Excel template download and workbook upload.
- Supports linear, quadratic, and 4PL curve fitting.
- Exports curve metadata, standard data, and sample results to Excel.

## Credits

Biology tools made by **Amr Ahmed WalyEldeen**: https://amrwalyeldeen.github.io  
Part of **CMBRL** laboratory resources: https://cmbrl.github.io

## How to publish with GitHub Pages

1. Create a GitHub repository, for example `biology-tools` or use the repository that will host the tools.
2. Upload these files to the root of the repository:
   - `index.html`
   - `README.md`
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Save.

The website is a static single-page app, so no build command or server is required.

## Adding more tools later

The homepage already has placeholder cards for future tools. To add a new tool:

1. Add a new tool card in the `#tools-home` section.
2. Add a new `<section class="tool-view" id="your-tool-id">`.
3. Add a navigation button or card button with `data-open-tool="your-tool-id"`.
4. Add the JavaScript logic for that tool below the existing script.

