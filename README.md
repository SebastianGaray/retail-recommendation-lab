# Retail Recommendation Lab

An interactive, public portfolio demo showing how deterministic product recommendations react to a visitor's shopping cart. It is an educational system, not a production recommendation service.

All catalog products, prices, inventory, ratings, reviews, popularity scores, and shopping behavior are synthetic.

## Current scope

- Deterministic Python catalog generation with a validated Pydantic contract
- Static JSON artifact shared at the pipeline/browser boundary
- English and Spanish Astro storefronts
- Browser-local persistent cart and explainable popularity recommendations
- Light, dark, and system themes with accessible responsive UI
- Python, TypeScript, browser, build, and contract checks in CI

## Architecture

The Python pipeline generates and validates `artifacts/demo/catalog.json`, then publishes the identical artifact to Astro's `public` directory. The static Astro application reads it and ranks available products in the browser. GitHub Actions validates both sides and deploys static files to GitHub Pages. See [architecture](docs/architecture.md), [data contracts](docs/data-contracts.md), and [ADR 0001](docs/decisions/0001-browser-side-recommendations.md).

## Stack

Python 3.12+, uv, Pydantic, PyArrow, PySpark, pytest, Ruff, Pyright, Astro, strict TypeScript, Vitest, Playwright, npm, and GitHub Actions. PySpark and PyArrow are pinned as the planned offline processing stack but are intentionally not used in the first generator.

## Setup and commands

Requirements: Python 3.12+, uv, Java 17+, Node.js 20+, and npm. PySpark uses
`JAVA_HOME`; point it to your JDK installation if your system does not configure it automatically.

```bash
make install        # locked Python and Node dependencies
make generate       # generate canonical and public catalog JSON
make pipeline       # reproduce all committed small-profile artifacts with offline PySpark
make validate-artifacts # verify artifact contracts, checksums, copies, and size limits
make validate       # validate both artifact copies
make dev            # local Astro server
make test-python    # pytest
make test-web       # Vitest
make test-e2e       # Playwright (run `npx playwright install chromium` once)
uv run --project pipeline pre-commit install  # install Git hooks
make lint           # Ruff, formatting, and Prettier
make typecheck      # Pyright, Astro, and TypeScript
make build          # static production build
```

The underlying `uv` and `npm` commands work without Make and are visible in the Makefile.

## Deployment

The site has no backend, database, secrets, tracking, or request-time training. CI builds precomputed data and the static web app, then deploys `apps/web/dist` from `main` to GitHub Pages at:

https://sebastiangaray.github.io/retail-recommendation-lab/

In repository settings, select **GitHub Actions** as the Pages source.

## Roadmap

- Add deterministic event generation and PySpark transformations
- Compare collaborative, content-based, and hybrid strategies
- Export explanations and offline evaluation metrics
- Add catalog search and category filters

## Limitations

The dataset is deliberately small and entirely synthetic. Chronological metrics compare five transparent strategies at K=3, 5, and 10; they are not production benchmarks. PySpark never runs in the browser, no visitor behavior is collected, and cart data never leaves the device. See [evaluation methodology](docs/evaluation.md).
