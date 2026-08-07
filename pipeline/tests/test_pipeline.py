from datetime import UTC

from retail_recommendation_lab.schemas import (
    CUSTOMER_SCHEMA,
    EVENT_SCHEMA,
    EVENT_TYPES,
    INTERACTION_WEIGHTS,
)
from retail_recommendation_lab.synthetic import generate_rows


def test_generation_is_deterministic_and_contractual() -> None:
    first = generate_rows("small", 42)
    assert first == generate_rows("small", 42)
    customers, events = first
    assert len(customers) == 120
    assert len(events) > 1_200
    assert {row[1] for row in events} <= EVENT_TYPES
    assert all(row[2].replace(tzinfo=UTC).utcoffset().total_seconds() == 0 for row in events)
    assert all(row[7] >= 0 and row[6] >= 0 for row in events)


def test_explicit_schemas_and_weights() -> None:
    assert EVENT_SCHEMA["event_id"].nullable is False
    assert CUSTOMER_SCHEMA["customer_id"].nullable is False
    assert INTERACTION_WEIGHTS["purchase"] > INTERACTION_WEIGHTS["product_view"]
    assert INTERACTION_WEIGHTS["remove_from_cart"] < 0
