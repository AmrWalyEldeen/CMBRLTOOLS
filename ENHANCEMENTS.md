# Integration update

## Added: Buffer & Solution Preparation Calculator

The BioBuffer Lab tool has been integrated as a fourth live CMBRL tool.

### Functions included
- Prepare solution from a solid
- C1V1 = C2V2 stock dilution
- Find unknown concentration
- Henderson–Hasselbalch buffer design
- Multi-component stock mixer
- Molecular-weight calculator from chemical formulas
- Concentration and volume converters
- Common reagent and buffer-system reference data
- Print / Save PDF

### Integration work
- Added homepage card, main navigation link, hero action, and ToolHub route
- Scoped the BioBuffer CSS to prevent collisions with the Protein, qPCR, and Cell Culture interfaces
- Scoped BioBuffer JavaScript to its own section
- Prevented BioBuffer internal tabs from overwriting the website route hash
- Renamed conflicting Print/Reset IDs
- Kept all calculations browser-local and GitHub Pages compatible
