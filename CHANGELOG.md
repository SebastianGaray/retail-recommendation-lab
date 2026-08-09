# Changelog

## 1.0.0 - 2026-08-09

First stable release of Retail Recommendation Lab.

### Included

- Deterministic synthetic retail event generation and validated PySpark artifacts.
- Five explainable recommendation strategies with chronological offline evaluation.
- Bilingual static Astro storefront with local cart state and strategy inspection.
- Schema validation, checksums, reproducibility checks, strict typing, and browser coverage.
- Escaped dynamic storefront content and automated Python, Node, CodeQL, and dependency checks.

### Known limitations

- All behavioral data and evaluation results are synthetic.
- Product images are delivered by the external DummyJSON CDN.
- Offline ranking metrics do not establish production recommendation quality.
- Spark pipeline execution is best supported on Linux or WSL.
