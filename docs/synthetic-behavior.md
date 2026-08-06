# Synthetic behavior methodology

The seeded generator creates noisy category preferences, price sensitivity, activity differences, complementary products, abandonment, removals, repeat tendency, and random exploration. Profiles are `small`, `medium`, and `large-local`; only compact outputs from `small` are committed.

Raw events are date-partitioned Parquet. Spark deduplicates IDs, validates references and values, quarantines invalid rows, derives ordered sessions, and calculates non-negative customer-product strengths. Co-purchase mappings require support of two sessions. Item similarity is cosine similarity over sparse customer-product strengths with four neighbors per item; sparse and cold-start products fall back to popularity.

The training boundary is `2026-07-06T00:00:00Z`; later events are reserved for evaluation. All behavior is fictional, no visitor activity is collected, and synthetic results do not establish production quality.
