# Append-Only Ledger for Reconciliation Records

## Architecture Overview

To maintain a strict audit trail and prevent the loss of historical information, the system implements an append-only architecture (Event Sourcing / Immutable Ledger) for handling operations on `ReconciliationRecord` entities.

Instead of mutating existing database records (e.g., updating the `saleVolumeSm3` field directly when a sale is dispensed), the system appends new events to a related `ReconciliationEvent` table.

## Data Model

- **ReconciliationRecord**: The core ledger record describing the initial and final states of a volume transfer. This record is immutable once created.
- **ReconciliationEvent**: An append-only table linking to a `ReconciliationRecord`. Each time a business action occurs (such as registering the dispensed sale volume), a new event is inserted.
  - `eventType`: Describes the action (e.g., `SALE_DISPENSED`).
  - `saleVolumeSm3`: The volume associated with the event.
  - `createdAt`: Timestamp of the event.

## Use Case Refactoring

The `UpdateSaleVolumeUseCase` has been refactored to:
1. Validate the input.
2. Ensure the record exists.
3. Call the repository to append a `SALE_DISPENSED` event.

The repository's `updateSaleVolume` method no longer executes a SQL `UPDATE` on the `ReconciliationRecord`. Instead, it inserts a new `ReconciliationEvent` and re-fetches the record with its associated events to dynamically calculate or provide the latest state.
