# pyright: reportUnknownMemberType=false
import json
import random
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from pyspark.sql import SparkSession

from .catalog import ROOT, build_catalog
from .schemas import CUSTOMER_SCHEMA, EVENT_SCHEMA

RAW = ROOT / "data" / "raw"


@dataclass(frozen=True)
class Profile:
    customers: int
    sessions: int


PROFILES = {
    "small": Profile(48, 240),
    "medium": Profile(500, 5_000),
    "large-local": Profile(5_000, 80_000),
}

CustomerRow = tuple[str, str, list[str], float, str, float]
EventRow = tuple[str, str, datetime, str, str, str, int, float, str, str, str]


def generate_rows(
    profile: str = "small", seed: int = 20260801
) -> tuple[list[CustomerRow], list[EventRow]]:
    cfg = PROFILES[profile]
    rng = random.Random(seed)
    products = build_catalog()
    categories = sorted({p.category for p in products})
    customers: list[CustomerRow] = []
    for index in range(cfg.customers):
        activity = rng.choices(["low", "medium", "high"], [3, 5, 2])[0]
        preferred = rng.sample(categories, k=2)
        customers.append(
            (
                f"cust_{index:06d}",
                rng.choice(["value", "balanced", "premium"]),
                preferred,
                round(rng.uniform(0.15, 0.95), 3),
                activity,
                round(rng.uniform(0.1, 0.8), 3),
            )
        )
    complements = {
        "prd_auris_headphones": "prd_senda_notebook",
        "prd_nexo_blender": "prd_marea_bottle",
        "prd_luma_lamp": "prd_senda_notebook",
        "prd_vento_backpack": "prd_marea_bottle",
    }
    events: list[EventRow] = []
    event_number = 0
    start = datetime(2026, 7, 1, tzinfo=UTC)
    for session_index in range(cfg.sessions):
        customer = customers[rng.randrange(len(customers))]
        customer_id, _, preferred, sensitivity, activity, repeat = customer
        timestamp = start + timedelta(minutes=session_index * 43 + rng.randrange(20))
        session_id = f"sess_{timestamp:%Y%m%d}_{session_index:06d}"
        pool = [
            p
            for p in products
            if p.category in preferred and (float(p.price) < 70 or sensitivity < 0.55)
        ] or products
        primary = rng.choice(pool)
        choices = [primary]
        if primary.id in complements and rng.random() < 0.68:
            choices.append(next(p for p in products if p.id == complements[primary.id]))
        if rng.random() < 0.25:
            choices.append(rng.choice(products))
        channel = rng.choices(["web", "mobile_web"], [6, 4])[0]
        device = rng.choices(["desktop", "mobile", "tablet"], [5, 4, 1])[0]
        purchased = rng.random() < (
            {"low": 0.22, "medium": 0.42, "high": 0.58}[activity] + repeat * 0.12
        )
        unique_choices = {product.id: product for product in choices}
        for product in unique_choices.values():
            sequence = ["product_view"]
            if rng.random() < 0.75:
                sequence.append("add_to_cart")
            if rng.random() < 0.10:
                sequence.append("remove_from_cart")
            if purchased and "add_to_cart" in sequence:
                sequence += ["checkout_started", "purchase"]
            for event_type in sequence:
                event_number += 1
                timestamp += timedelta(seconds=rng.randrange(12, 180))
                quantity = 1 if event_type != "checkout_started" else 0
                events.append(
                    (
                        f"evt_{event_number:010d}",
                        event_type,
                        timestamp.replace(tzinfo=None),
                        session_id,
                        customer_id,
                        product.id,
                        quantity,
                        float(product.price),
                        channel,
                        device,
                        timestamp.date().isoformat(),
                    )
                )
    return customers, events


def write_raw(spark: SparkSession, profile: str = "small", seed: int = 20260801) -> dict[str, int]:
    customers, events = generate_rows(profile, seed)
    spark.createDataFrame(customers, CUSTOMER_SCHEMA).orderBy("customer_id").write.mode(
        "overwrite"
    ).parquet(str(RAW / "customers"))
    spark.createDataFrame(events, EVENT_SCHEMA).repartition("event_date").write.mode(
        "overwrite"
    ).partitionBy("event_date").parquet(str(RAW / "events"))
    return {"customers": len(customers), "events": len(events)}


def generate_events() -> None:
    from .spark_pipeline import spark_session

    spark = spark_session("generate")
    try:
        print(json.dumps(write_raw(spark), sort_keys=True))
    finally:
        spark.stop()
