# Implementation plan

## Offline pipeline

Python creates a pinned bilingual catalog and deterministic synthetic events. PySpark validates event
schemas and produces popularity, category, co-occurrence, similarity, hybrid, quality, and evaluation
artifacts. Pydantic contracts, stable serialization, manifests, and checksums define the publication
boundary.

## Static application

Astro publishes English and Spanish routes under the repository base path. TypeScript loads only
versioned JSON artifacts, keeps cart state locally, calculates cart-aware rankings, and degrades to
safe fallbacks when images or artifacts are unavailable. The deployed application has no compute
service or customer-data dependency.

Mapped strategies aggregate candidate scores across cart products and multiply each source score by
its cart quantity. Valid strategy candidates retain their reason code. If fewer than three survive,
the browser fills only the remaining positions from deterministic popularity and labels why. Artifact
files load independently so one unavailable strategy does not disable the others.

## Recommendation coverage

Category popularity starts from unbounded product interaction totals and ranks within each category.
The synthetic generator defines two stable complementary pairs per four-product category. Repeated
seeded sessions provide purchase co-occurrence coverage without lowering the minimum support rule.

## Verification

Python tests cover generation, schemas, ranking rules, hybrid contributions, and artifact parity.
Vitest covers localized catalog behavior and fallback ranking. Playwright exercises production-preview
flows, mobile behavior, invalid artifacts, and axe accessibility checks. CI adds coverage thresholds,
reproducibility checks, dependency audits, CodeQL, pinned actions, and Pages deployment.

## Repository presentation

The README keeps English and Spanish in one rendered document. Its sections match the Demand
Intelligence project where useful while retaining recommendation-specific data and runtime details.

## Engineering process view

The static application adds a fourth content view to its existing sidebar navigation. The view
connects specification, AI assistance, human decisions, and validation evidence using concrete
examples from artifact contracts, hybrid ranking, failure recovery, and production-preview tests.
Repository links point to the versioned SDD documents. The view uses the existing locale catalog,
responsive layout, focus handling, and hash-based navigation without introducing runtime services.
