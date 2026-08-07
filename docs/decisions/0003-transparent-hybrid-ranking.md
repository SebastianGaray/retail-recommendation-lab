# ADR 0003: Separate transparent hybrid signals from business rules

## Decision

Use a deterministic weighted hybrid over normalized offline signals. Keep candidate generation and model score independent from inventory, cart exclusion, duplicate removal, category caps, diversity, and final tie-breaking.

## Consequences

Every rank can be traced to signal contributions and subsequent constraints. A few named configurations can be compared reproducibly without costly search. The approach is intentionally understandable and portfolio-sized; it is not optimized or validated for production traffic.
