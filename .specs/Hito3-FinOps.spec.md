# Hito 3: Agregaciones FinOps sobre Ledger Inmutable y Reportería PDF/CSV

## Domain Rules (Sabanas / Thermodynamics Context)
- **GetReconciliationSummary**:
  1. Retrieve a `ReconciliationRecord` by ID.
  2. Throw `RecordNotFoundError` if not found.
  3. Throw `InvalidReconciliationDataError` if pressure delta is zero or negative when computing Aforo.
  4. **totalDispensed**: Sum of all `ReconciliationEvent` volumes where `eventType === 'SALE_DISPENSED'`.
  5. **variationSm3**: `calculatedVolumeSm3 - totalDispensed`.
  6. **aforoSm3PerBar**: `calculatedVolumeSm3 / (initialPressureBar - finalPressureBar)`.
  7. **certified**: Rule: `Math.abs(variationSm3 / calculatedVolumeSm3) <= 0.02` (within 2% deviation threshold).

- **GenerateReconciliationReport**:
  1. Leverage `GetReconciliationSummary` to fetch the processed stats.
  2. Export to `pdf` using `pdfkit` or to `csv` using `json2csv`.
  3. Return a raw Buffer or string depending on format.
