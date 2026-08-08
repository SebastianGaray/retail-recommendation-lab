from retail_recommendation_lab.catalog import build_catalog, validate


def test_catalog_is_deterministic_and_valid() -> None:
    first = build_catalog()
    second = build_catalog()

    assert first == second
    assert len(first) == 40
    assert len({product.id for product in first}) == len(first)
    assert first == sorted(first, key=lambda product: product.popularity_score, reverse=True)


def test_published_catalog_matches_the_canonical_artifact() -> None:
    validate()
