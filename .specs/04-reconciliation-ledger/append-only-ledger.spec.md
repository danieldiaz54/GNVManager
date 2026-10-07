# Append-Only Reconciliation Ledger Spec

## Goal
Refactor the mutable database logic into an append-only Event Sourcing / Immutable Ledger pattern.

## Entities

### `ReconciliationRecord`
Represents the state of a manifold or module during a reconciliation lifecycle.

Fields:
- `id`: UUID
- `recordType`: "INDIVIDUAL" | "RACK_PARENT" | "RACK_CHILD" | "MANIFOLD_PARENT" | "MANIFOLD_CHILD"
- `moduleIdentifier`: String?
- `positionNumber`: Int?
- `operationType`: "CARGUE" o "DESCARGUE"
- `moduleCapacityLiters`: Float
- Initial & Final states (Pressure, Temp)
- Calculated mass and volume

### `ReconciliationEvent`
An append-only log of events affecting a `ReconciliationRecord`.

Fields:
- `id`: UUID
- `recordId`: UUID (foreign key)
- `eventType`: String (e.g. "TRANSFER_CALCULATED", "SALE_DISPENSED")
- `saleVolumeSm3`: Float?
- `createdAt`: DateTime

## Workflow
1. When a reconciliation calculation completes, instead of mutating fields like `saleVolumeSm3` directly in the record, a new `ReconciliationEvent` (e.g. `TRANSFER_CALCULATED` or `SALE_DISPENSED`) is appended.
2. Repositories and Use Cases query events and reduce them to compute the current total sale volume.
3. The `ReconciliationRecord` serves as the anchor entity.
