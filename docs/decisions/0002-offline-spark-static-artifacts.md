# ADR 0002: Run Spark offline and publish static artifacts

## Decision

PySpark runs only during local development and lightweight CI. It writes bounded, checksummed JSON consumed by the static Astro application.

## Consequences

The public site needs no Python, Spark, database, backend, authentication, tracking, or paid runtime. Recommendations cannot learn from visitors and update only when artifacts are regenerated. This is appropriate for a transparent portfolio demonstration, not a production recommender.
