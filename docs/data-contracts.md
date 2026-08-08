# Data contracts

The product contract is implemented in `pipeline/src/retail_recommendation_lab/contracts.py` and serialized as JSON. Python validates generated data; the browser validates the fields it consumes at load time.

| Field                 | Type                   | Constraint                              |
| --------------------- | ---------------------- | --------------------------------------- |
| `id`                  | string                 | Stable `prd_*` identifier               |
| `sku`                 | string                 | `AAA-0000` format                       |
| `name`, `description` | object                 | Non-empty `en` and `es` strings         |
| `category`            | string                 | Synthetic retail category               |
| `subcategory`         | string or null         | Optional                                |
| `price`               | decimal string         | Positive USD value                      |
| `original_price`      | decimal string or null | Greater than price when present         |
| `in_stock`            | boolean                | Must match positive inventory           |
| `inventory_quantity`  | integer                | Zero or greater                         |
| `rating`              | number                 | 0–5                                     |
| `review_count`        | integer                | Zero or greater                         |
| `image_url`           | string                 | Generated centrally from fictional name |
| `tags`                | string array           | Searchable synthetic attributes         |
| `popularity_score`    | integer                | Deterministic 0–100 score               |

Breaking changes require a documented contract version and coordinated pipeline/web update.

## Behavior and recommendation contracts

Customers contain only synthetic IDs, segment, category preferences, price sensitivity, activity, and repeat tendency. Events use UTC timestamps and the types `product_view`, `add_to_cart`, `remove_from_cart`, `checkout_started`, and `purchase`; keys and categorical fields are non-null except product references before quarantine.

The demo weights are view `1`, cart add `3`, removal `-1`, checkout `4`, and purchase `6`; negative aggregate strengths are clipped to zero intentionally. Recommendation JSON uses schema `1.0`, bounded candidate lists, stable score/ID ordering, and a `small-2026-08-06` dataset version.
