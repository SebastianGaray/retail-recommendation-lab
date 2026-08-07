# Offline evaluation and hybrid ranking

Artifacts train only on events before `2026-07-06T00:00:00Z`. Purchases at or after that instant are held out. For each eligible synthetic customer, evaluation reconstructs only pre-cutoff cart/high-intent context and compares the held-out products with top 3, 5, and 10 recommendations. Customers without held-out targets are excluded and counted implicitly outside the eligible population; customers without pre-cutoff context are reported as cold start.

Reported metrics are precision, recall, hit rate, reciprocal rank, catalog coverage, within-list uniqueness, and average normalized popularity. Results are aggregated overall, by sparse/established history, and by synthetic value/balanced/premium segment when represented. Weak results remain visible. These small synthetic results are not production performance.

## Hybrid

The selected `balanced` configuration weights normalized popularity `0.25`, category affinity `0.25`, basket association `0.25`, item similarity `0.20`, and novelty `0.05`. `discovery` and `basket-first` are exported as predefined comparisons; there is no automated tuning.

The weighted sum is the model score. Final rank then excludes cart and unavailable products, caps a category at two results, removes duplicates, and uses product ID as a stable tie-break. Empty contexts use deterministic hybrid/popularity signals. Explanations use fixed reason codes and optional signal contributions, never generated prose.
