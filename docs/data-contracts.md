# Data contracts

The product contract is implemented in `pipeline/src/retail_recommendation_lab/contracts.py` and serialized as JSON. Python validates generated data; the browser validates the fields it consumes at load time.

| Field | Type | Constraint |
| --- | --- | --- |
| `id` | string | Stable `prd_*` identifier |
| `sku` | string | `AAA-0000` format |
| `name`, `description` | object | Non-empty `en` and `es` strings |
| `category` | string | Synthetic retail category |
| `subcategory` | string or null | Optional |
| `price` | decimal string | Positive USD value |
| `original_price` | decimal string or null | Greater than price when present |
| `in_stock` | boolean | Must match positive inventory |
| `inventory_quantity` | integer | Zero or greater |
| `rating` | number | 0–5 |
| `review_count` | integer | Zero or greater |
| `image_url` | string | Generated centrally from fictional name |
| `tags` | string array | Searchable synthetic attributes |
| `popularity_score` | integer | Deterministic 0–100 score |

Breaking changes require a documented contract version and coordinated pipeline/web update.
