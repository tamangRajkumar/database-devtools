# Editing data

Edit mode applies changes to the **live database on the device**, not the browser snapshot.

## Enable edit mode

1. Open the browser UI and refresh a snapshot
2. Toggle **Edit** in the top bar
3. A transaction opens on the selected device

## Operations

- **Insert row** — Explorer toolbar
- **Edit row** — open row drawer, change fields, Save
- **Delete row** — row drawer

## Commit or discard

- **Commit** — applies all writes and refreshes the snapshot
- **Discard** — rolls back the transaction

The SQL Workspace remains read-only in v1.

## Safety

Writes use parameterized SQL on the device. Always review changes before committing.
