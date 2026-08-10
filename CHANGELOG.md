# Changelog

## 1.0.3 - 2026-08-09

- Expanded the desktop project navigation while retaining the compact mobile menu.
- Added the active theme label and a direct GitHub shortcut to the header.
- Aligned the responsive footer and shared application chrome with the main portfolio.
- Added desktop and mobile regression coverage for the updated navigation.

## 1.0.2 - 2026-08-09

### Fixed

- Removed the programmatic focus that drew a full-section outline on initial load.

### Changed

- Removed the redundant Home view and made the product catalog the default entry point.

## 1.0.1 - 2026-08-09

### Changed

- Reworked the header cart control with a clear cart icon, an unobtrusive label, and a compact quantity badge.
- Removed the boxed button treatment while retaining keyboard focus, dialog semantics, and mobile touch sizing.

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
