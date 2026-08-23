# Enhancement summary

- Integrated the supplied Cell Line Calculator into the existing CMBRL Biology Tools website as a third live tool.
- Added a Cell Culture navigation link, homepage tool card, and hero shortcut.
- Added cell viability, hemocytometer counting, seeding/dilution, multi-vessel batch planning, and density-helper interfaces.
- Added plate/flask visualization and Print / Save PDF support.
- Preserved the cell tool's editable chamber factor, vessel parameters, density values, and local-browser calculations.
- Restyled the supplied cell-culture interface to match the existing CMBRL blue/teal/violet visual system.
- Scoped the new CSS and wrapped the new JavaScript module to prevent interference with the protein and qPCR calculators.
- Preserved CMBRL laboratory branding and the developer identity/photo for Amr Ahmed WalyEldeen.
- Kept the package static and GitHub Pages-ready with no build step or backend.

## Cell counting update — 2026-08-23

- Added a **Desired viable cells from original stock** input to hemocytometer counting.
- Added viable and total cell concentration output in both **cells/mL** and **cells/µL**.
- Added an automatic **stock withdrawal volume** result in µL/mL for the requested viable-cell number.
- Added a warning when the calculated withdrawal volume is below 1 µL.
- Added human-readable cell-count summaries (thousand / million / billion) while preserving exact numeric output.
