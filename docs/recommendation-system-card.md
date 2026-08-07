# Recommendation system card

- Intended use: educational comparison of offline recommenders on synthetic retail behavior.
- Non-intended use: production ranking, commercial decisions, user profiling, or claims about real shoppers.
- Strategies: global/category popularity, co-purchase, item cosine similarity, and weighted hybrid.
- Training boundary: events before `2026-07-06T00:00:00Z`; later purchases are evaluation targets.
- Business rules: cart and stock exclusion, duplicate removal, category cap, diversity, stable ties, and deterministic fallback.
- Cold start: explicitly counted and served by context-free popularity/novelty signals.
- Privacy/deployment: no visitor data, backend, database, authentication, or request-time training; static JSON on GitHub Pages.
- Limitations: small synthetic catalog, short horizon, noisy generated behavior, and no evidence of production performance.
