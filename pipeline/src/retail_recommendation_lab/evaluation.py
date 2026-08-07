# pyright: reportArgumentType=false, reportUnknownArgumentType=false, reportUnknownMemberType=false, reportUnknownVariableType=false, reportGeneralTypeIssues=false, reportAttributeAccessIssue=false
from __future__ import annotations

import math
from collections import Counter, defaultdict
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

from .catalog import build_catalog
from .synthetic import CustomerRow, generate_rows

K_VALUES = (3, 5, 10)
CUTOFF = datetime(2026, 7, 6, tzinfo=UTC)
HYBRID_CONFIGS = {
    "balanced": {
        "popularity": 0.25,
        "category": 0.25,
        "basket": 0.25,
        "similarity": 0.20,
        "novelty": 0.05,
    },
    "discovery": {
        "popularity": 0.15,
        "category": 0.20,
        "basket": 0.20,
        "similarity": 0.25,
        "novelty": 0.20,
    },
    "basket-first": {
        "popularity": 0.15,
        "category": 0.20,
        "basket": 0.40,
        "similarity": 0.20,
        "novelty": 0.05,
    },
}
SELECTED_CONFIG = "balanced"


@dataclass(frozen=True)
class Recommendation:
    product_id: str
    model_score: float
    final_rank: int
    reason_code: str
    source_product_id: str | None = None
    contributions: Mapping[str, float] | None = None


class Strategy(Protocol):
    name: str

    def recommend(self, context: EvaluationContext, limit: int) -> list[Recommendation]: ...


@dataclass(frozen=True)
class EvaluationContext:
    cart: frozenset[str]
    preferred_categories: frozenset[str]
    available: frozenset[str]
    product_categories: Mapping[str, str]


def normalize(values: Mapping[str, float]) -> dict[str, float]:
    if not values:
        return {}
    low, high = min(values.values()), max(values.values())
    if math.isclose(low, high):
        return {key: 1.0 for key in values}
    return {key: (value - low) / (high - low) for key, value in values.items()}


def apply_business_rules(
    scored: Iterable[Recommendation], context: EvaluationContext, limit: int, category_cap: int = 2
) -> list[Recommendation]:
    category_counts: Counter[str] = Counter()
    selected: list[Recommendation] = []
    seen: set[str] = set()
    for candidate in sorted(scored, key=lambda row: (-row.model_score, row.product_id)):
        category = context.product_categories[candidate.product_id]
        if (
            candidate.product_id in context.cart
            or candidate.product_id not in context.available
            or candidate.product_id in seen
            or category_counts[category] >= category_cap
        ):
            continue
        selected.append(
            Recommendation(
                candidate.product_id,
                candidate.model_score,
                len(selected) + 1,
                candidate.reason_code,
                candidate.source_product_id,
                candidate.contributions,
            )
        )
        seen.add(candidate.product_id)
        category_counts[category] += 1
        if len(selected) == limit:
            break
    return selected


class ListStrategy:
    def __init__(self, name: str, candidates: Sequence[Mapping[str, object]], reason: str) -> None:
        self.name, self.candidates, self.reason = name, candidates, reason

    def recommend(self, context: EvaluationContext, limit: int) -> list[Recommendation]:
        scored = [
            Recommendation(str(row["product_id"]), float(row["score"]), 0, self.reason)
            for row in self.candidates
        ]
        return apply_business_rules(scored, context, limit)


class MappingStrategy:
    def __init__(
        self, name: str, candidates: Mapping[str, Sequence[Mapping[str, object]]], reason: str
    ) -> None:
        self.name, self.candidates, self.reason = name, candidates, reason

    def recommend(self, context: EvaluationContext, limit: int) -> list[Recommendation]:
        scored = [
            Recommendation(str(row["product_id"]), float(row["score"]), 0, self.reason, source)
            for source in sorted(context.cart)
            for row in self.candidates.get(source, ())
        ]
        return apply_business_rules(scored, context, limit)


class HybridStrategy:
    name = "hybrid"

    def __init__(self, artifacts: Mapping[str, object], weights: Mapping[str, float]) -> None:
        self.weights, self.artifacts = weights, artifacts

    def recommend(self, context: EvaluationContext, limit: int) -> list[Recommendation]:
        popularity = {
            str(row["product_id"]): float(row["score"]) for row in self.artifacts["popularity"]
        }  # type: ignore[index]
        pop_norm = normalize(popularity)
        basket, similarity = (
            _mapping_signal(self.artifacts["frequently-bought-together"], context.cart),
            _mapping_signal(self.artifacts["item-similarity"], context.cart),
        )  # type: ignore[arg-type]
        basket_norm, sim_norm = normalize(basket), normalize(similarity)
        scored = []
        for product_id in sorted(context.product_categories):
            category = (
                1.0
                if context.product_categories[product_id] in context.preferred_categories
                else 0.0
            )
            novelty = 1.0 - pop_norm.get(product_id, 0.0)
            contributions = {
                "popularity": self.weights["popularity"] * pop_norm.get(product_id, 0.0),
                "category": self.weights["category"] * category,
                "basket": self.weights["basket"] * basket_norm.get(product_id, 0.0),
                "similarity": self.weights["similarity"] * sim_norm.get(product_id, 0.0),
                "novelty": self.weights["novelty"] * novelty,
            }
            source = next(
                (
                    item
                    for item in sorted(context.cart)
                    if product_id
                    in {
                        str(row["product_id"])
                        for row in self.artifacts["frequently-bought-together"].get(item, [])
                    }
                ),
                None,
            )  # type: ignore[union-attr]
            scored.append(
                Recommendation(
                    product_id,
                    sum(contributions.values()),
                    0,
                    "hybrid_ranker",
                    source,
                    contributions,
                )
            )
        return apply_business_rules(scored, context, limit)


def _mapping_signal(raw: object, cart: Iterable[str]) -> dict[str, float]:
    mapping = raw if isinstance(raw, dict) else {}
    result: dict[str, float] = defaultdict(float)
    for source in cart:
        for row in mapping.get(source, []):
            result[str(row["product_id"])] = max(
                result[str(row["product_id"])], float(row["score"])
            )
    return dict(result)


def _metrics(
    recommendations: Sequence[str],
    relevant: set[str],
    k: int,
    popularity: Mapping[str, float],
    catalog_size: int,
) -> dict[str, float]:
    ranked = recommendations[:k]
    hits = [index for index, item in enumerate(ranked) if item in relevant]
    return {
        "precision": round(len(hits) / k, 6),
        "recall": round(len(hits) / len(relevant), 6),
        "hit_rate": float(bool(hits)),
        "mrr": round(1 / (hits[0] + 1), 6) if hits else 0.0,
        "coverage": round(len(set(ranked)) / catalog_size, 6),
        "diversity": round(len(set(ranked)) / max(1, len(ranked)), 6),
        "popularity_bias": round(
            sum(popularity.get(item, 0.0) for item in ranked) / max(1, len(ranked)), 6
        ),
    }


def evaluate(
    artifacts: Mapping[str, object], seed: int = 20260801
) -> tuple[
    Mapping[str, object],
    Mapping[str, object],
    Mapping[str, object],
    Mapping[str, object],
    Mapping[str, object],
]:
    customers, events = generate_rows("small", seed)
    products = build_catalog()
    customer_data = {row[0]: row for row in customers}
    categories = {p.id: p.category for p in products}
    available = frozenset(p.id for p in products if p.in_stock)
    history: dict[str, set[str]] = defaultdict(set)
    targets: dict[str, set[str]] = defaultdict(set)
    for event in events:
        customer_id, product_id, timestamp, event_type = (
            event[4],
            event[5],
            event[2].replace(tzinfo=UTC),
            event[1],
        )
        if timestamp < CUTOFF and event_type in {"add_to_cart", "purchase"}:
            history[customer_id].add(product_id)
        elif timestamp >= CUTOFF and event_type == "purchase":
            targets[customer_id].add(product_id)
    popularity_rows = artifacts["popularity"]
    popularity = {str(row["product_id"]): float(row["score"]) for row in popularity_rows}  # type: ignore[index]
    pop_scale = normalize(popularity)
    strategies: list[Strategy] = [
        ListStrategy("global-popularity", popularity_rows, "global_popularity"),  # type: ignore[arg-type]
        ListStrategy(
            "category-popularity", artifacts["category-popularity"], "category_popularity"
        ),  # type: ignore[arg-type]
        MappingStrategy(
            "frequently-bought-together",
            artifacts["frequently-bought-together"],
            "frequently_bought_together",
        ),  # type: ignore[arg-type]
        MappingStrategy("item-similarity", artifacts["item-similarity"], "item_similarity"),  # type: ignore[arg-type]
        HybridStrategy(artifacts, HYBRID_CONFIGS[SELECTED_CONFIG]),
    ]
    eligible = sorted(customer_id for customer_id, target in targets.items() if target)
    rows: list[dict[str, object]] = []
    segment_rows: dict[tuple[str, str, int], list[dict[str, float]]] = defaultdict(list)
    recommended_catalog: dict[tuple[str, int], set[str]] = defaultdict(set)
    for customer_id in eligible:
        customer: CustomerRow = customer_data[customer_id]
        sparse = len(history[customer_id]) < 2
        group = "sparse_or_new" if sparse else "established"
        context = EvaluationContext(
            frozenset(history[customer_id]), frozenset(customer[2]), available, categories
        )
        for strategy in strategies:
            ranked = [row.product_id for row in strategy.recommend(context, max(K_VALUES))]
            for k in K_VALUES:
                metrics = _metrics(ranked, targets[customer_id], k, pop_scale, len(products))
                rows.append(
                    {
                        "strategy": strategy.name,
                        "customer_id": customer_id,
                        "group": group,
                        "segment": customer[1],
                        "k": k,
                        **metrics,
                    }
                )
                segment_rows[(strategy.name, group, k)].append(metrics)
                segment_rows[(strategy.name, f"segment:{customer[1]}", k)].append(metrics)
                recommended_catalog[(strategy.name, k)].update(ranked[:k])
    cold_start_count = sum(1 for customer_id in eligible if not history[customer_id])
    summary = _aggregate(rows, eligible, cold_start_count, recommended_catalog, len(products))
    by_segment = _aggregate_segments(segment_rows)
    comparisons: dict[str, object] = {
        "selected": SELECTED_CONFIG,
        "configs": [
            {
                "name": name,
                "weights": weights,
                "selection_note": "Balanced signal mix selected for transparent tradeoffs; no automated tuning.",
            }
            for name, weights in HYBRID_CONFIGS.items()
        ],
    }
    hybrid = HybridStrategy(artifacts, HYBRID_CONFIGS[SELECTED_CONFIG])
    hybrid_mapping: dict[str, object] = {}
    for source in sorted(categories):
        context = EvaluationContext(
            frozenset({source}), frozenset({categories[source]}), available, categories
        )
        hybrid_mapping[source] = [
            _public_recommendation(row) for row in hybrid.recommend(context, 5)
        ]
    cold_context = EvaluationContext(frozenset(), frozenset(), available, categories)
    hybrid_mapping["cold_start"] = [
        _public_recommendation(row) for row in hybrid.recommend(cold_context, 5)
    ]
    card: dict[str, object] = {
        "intended_use": "Educational offline recommendation comparison on synthetic retail behavior.",
        "non_intended_use": "Production decisions, personalization claims, or visitor profiling.",
        "training_cutoff": CUTOFF.isoformat(),
        "privacy": "No visitor events are collected; the deployed application is static.",
        "business_rules": [
            "cart exclusion",
            "inventory filtering",
            "two-per-category cap",
            "stable ID tie-breaking",
            "popularity fallback",
        ],
        "limitations": [
            "small synthetic catalog",
            "short evaluation window",
            "offline associations are not production performance",
        ],
    }
    return summary, by_segment, comparisons, hybrid_mapping, card


def _aggregate(
    rows: Sequence[Mapping[str, object]],
    eligible: Sequence[str],
    cold_start_count: int,
    coverage: Mapping[tuple[str, int], set[str]],
    catalog_size: int,
) -> dict[str, object]:
    groups: dict[tuple[str, int], list[Mapping[str, object]]] = defaultdict(list)
    for row in rows:
        groups[(str(row["strategy"]), int(row["k"]))].append(row)
    metrics = []
    for (strategy, k), items in sorted(groups.items()):
        metric: dict[str, object] = {
            name: round(sum(float(item[name]) for item in items) / len(items), 6)
            for name in ("precision", "recall", "hit_rate", "mrr", "diversity", "popularity_bias")
        }
        metric.update(
            {
                "strategy": strategy,
                "k": k,
                "catalog_coverage": round(len(coverage[(strategy, k)]) / catalog_size, 6),
            }
        )
        metrics.append(metric)
    return {
        "cutoff": CUTOFF.isoformat(),
        "k_values": list(K_VALUES),
        "eligible_user_count": len(eligible),
        "cold_start_user_count": cold_start_count,
        "metrics": metrics,
        "limitations": "Synthetic offline evaluation; not production performance.",
    }


def _aggregate_segments(
    groups: Mapping[tuple[str, str, int], Sequence[Mapping[str, float]]],
) -> dict[str, object]:
    rows = []
    for (strategy, group, k), items in sorted(groups.items()):
        rows.append(
            {
                "strategy": strategy,
                "group": group,
                "k": k,
                "eligible_count": len(items),
                **{
                    name: round(sum(item[name] for item in items) / len(items), 6)
                    for name in ("precision", "recall", "hit_rate", "mrr")
                },
            }
        )
    return {"segments": rows}


def _public_recommendation(row: Recommendation) -> dict[str, object]:
    return {
        "product_id": row.product_id,
        "score": round(row.model_score, 6),
        "rank": row.final_rank,
        "reason_code": row.reason_code,
        "source_product_id": row.source_product_id,
        "contributions": row.contributions,
    }
