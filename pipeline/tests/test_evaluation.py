from retail_recommendation_lab.evaluation import (
    EvaluationContext,
    HybridStrategy,
    Recommendation,
    apply_business_rules,
    normalize,
)


def context() -> EvaluationContext:
    return EvaluationContext(
        cart=frozenset({"cart"}),
        preferred_categories=frozenset({"home"}),
        available=frozenset({"a", "b", "c", "cart"}),
        product_categories={
            "a": "home",
            "b": "home",
            "c": "sports",
            "cart": "home",
            "sold": "sports",
        },
    )


def test_normalization_is_bounded_and_handles_equal_values() -> None:
    assert normalize({"a": 2, "b": 4}) == {"a": 0, "b": 1}
    assert normalize({"a": 2, "b": 2}) == {"a": 1, "b": 1}


def test_business_rules_filter_and_tie_break_deterministically() -> None:
    candidates = [
        Recommendation("sold", 10, 0, "hybrid_ranker"),
        Recommendation("cart", 9, 0, "hybrid_ranker"),
        Recommendation("b", 5, 0, "hybrid_ranker"),
        Recommendation("a", 5, 0, "hybrid_ranker"),
        Recommendation("c", 4, 0, "hybrid_ranker"),
    ]
    ranked = apply_business_rules(candidates, context(), 3, category_cap=1)
    assert [row.product_id for row in ranked] == ["a", "c"]
    assert [row.final_rank for row in ranked] == [1, 2]


def test_hybrid_has_typed_reasons_and_normalized_contributions() -> None:
    artifacts = {
        "popularity": [{"product_id": "a", "score": 2}, {"product_id": "b", "score": 1}],
        "frequently-bought-together": {"cart": [{"product_id": "c", "score": 3}]},
        "item-similarity": {"cart": [{"product_id": "b", "score": 0.8}]},
    }
    weights = {"popularity": 0.2, "category": 0.2, "basket": 0.3, "similarity": 0.2, "novelty": 0.1}
    first = HybridStrategy(artifacts, weights).recommend(context(), 3)
    second = HybridStrategy(artifacts, weights).recommend(context(), 3)
    assert first == second
    assert all(row.reason_code == "hybrid_ranker" for row in first)
    assert all(0 <= value <= 1 for row in first for value in (row.contributions or {}).values())
