# ADR 0001: Run public recommendations in the browser

- Status: Accepted
- Date: 2026-07-27

## Context

The public demo needs interactive cart-aware recommendations, but its educational workload does not justify an always-on backend, database, or request-time model inference.

## Decision

Offline jobs export validated, browser-sized artifacts. The static application stores its cart and runs lightweight deterministic ranking in the visitor's browser.

## Consequences

Hosting remains static, free, reproducible, private by default, and resilient to backend outages. Algorithms and datasets must fit practical browser limits. Larger or sensitive workloads would require revisiting this decision.
