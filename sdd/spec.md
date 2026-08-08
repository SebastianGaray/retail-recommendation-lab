# Specification

## Visitor experience

- Explain that the application is a synthetic technical demonstration with no tracking or checkout.
- Provide bilingual catalog browsing, search, filtering, sorting, product details, and image fallback.
- Open the cart when a product is added and support quantities, removal, persistence, and reset.
- Provide popularity, category, co-occurrence, similarity, and hybrid recommendation strategies.
- Explain every result and expose the normalized signals and weights used by the hybrid strategy.
- Provide desktop and mobile navigation, System/Light/Dark themes, and accessible controls.
- Provide a dedicated bilingual engineering process view in the application navigation.
- Explain how SDD structured the work, where AI-assisted tools helped, what remained a human
  responsibility, and which automated checks supplied evidence.

## Data and artifacts

- Generate deterministic synthetic behavior without publishing raw events or customer histories.
- Use explicit schemas, stable ordering, dataset versions, checksums, and size limits.
- Keep all strategies compatible with the same catalog and cutoff.
- Report synthetic offline metrics without production-performance claims.
- Require no Python, Spark, database, paid API, login, payment, or visitor tracking at runtime.

## Delivery

- Validate Python and TypeScript types, formatting, unit tests, integration behavior, accessibility,
  production output, reproducibility, and dependency safety.
- Deploy only validated pushes to `main` with least-privilege Pages permissions.
- Maintain dependencies with Dependabot and scan Python and TypeScript with CodeQL.
- Provide a bilingual README with a table of contents and the same core structure as related projects.
- Link the public process explanation to the versioned specification, plan, and task documents.
