# pyright: reportUnknownMemberType=false
import hashlib
import json
import os
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime

from pyspark.sql import DataFrame, SparkSession, Window
from pyspark.sql import functions as F

from .catalog import ROOT, build_catalog
from .evaluation import CUTOFF as EVALUATION_CUTOFF
from .evaluation import HYBRID_CONFIGS, K_VALUES, SELECTED_CONFIG, evaluate
from .schemas import CUSTOMER_SCHEMA, EVENT_SCHEMA, EVENT_TYPES, INTERACTION_WEIGHTS, PRODUCT_SCHEMA
from .synthetic import RAW, write_raw

ARTIFACT_DIR = ROOT / "artifacts" / "demo"
PUBLIC_DIR = ROOT / "apps" / "web" / "public"
VALIDATED = ROOT / "data" / "validated"
CURATED = ROOT / "data" / "curated"
SEED = 20260801
CUTOFF = datetime(2026, 7, 6, tzinfo=UTC)


def spark_session(stage: str = "pipeline") -> SparkSession:
    os.environ.setdefault(
        "PYSPARK_PYTHON",
        os.environ.get("VIRTUAL_ENV", "")
        + ("\\Scripts\\python.exe" if os.name == "nt" else "/bin/python"),
    )
    spark = (
        SparkSession.builder.master("local[2]")
        .appName(f"retail-recommendation-lab-{stage}")
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.sql.adaptive.enabled", "true")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")
    return spark


def _products(spark: SparkSession) -> DataFrame:
    return spark.createDataFrame(
        [(p.id, p.category, float(p.price), p.in_stock) for p in build_catalog()], PRODUCT_SCHEMA
    )


def validate_events(spark: SparkSession) -> tuple[DataFrame, DataFrame, dict[str, int]]:
    events = spark.read.schema(EVENT_SCHEMA).parquet(str(RAW / "events"))
    customers = spark.read.schema(CUSTOMER_SCHEMA).parquet(str(RAW / "customers"))
    products = _products(spark)
    event_ids = Window.partitionBy("event_id").orderBy("event_timestamp", "session_id")
    joined = (
        events.withColumn("duplicate_rank", F.row_number().over(event_ids))
        .join(
            products.select(F.col("product_id").alias("known_product")),
            F.col("product_id") == F.col("known_product"),
            "left",
        )
        .join(
            customers.select(F.col("customer_id").alias("known_customer")),
            F.col("customer_id") == F.col("known_customer"),
            "left",
        )
    )
    reason = (
        F.when(~F.col("event_type").isin(sorted(EVENT_TYPES)), "invalid_event_type")
        .when(F.col("quantity") < 0, "invalid_quantity")
        .when(F.col("unit_price") < 0, "invalid_price")
        .when(F.col("known_product").isNull(), "missing_product")
        .when(F.col("known_customer").isNull(), "missing_customer")
        .when(F.col("duplicate_rank") > 1, "duplicate_event_id")
    )
    classified = joined.withColumn("quarantine_reason", reason)
    valid = classified.filter(F.col("quarantine_reason").isNull()).select(EVENT_SCHEMA.fieldNames())
    invalid = classified.filter(F.col("quarantine_reason").isNotNull()).select(
        *EVENT_SCHEMA.fieldNames(), "quarantine_reason"
    )
    valid.write.mode("overwrite").partitionBy("event_date").parquet(str(VALIDATED / "events"))
    invalid.write.mode("overwrite").parquet(str(VALIDATED / "quarantine"))
    return valid, invalid, {"valid_events": valid.count(), "quarantined_events": invalid.count()}


def sessionize(events: DataFrame) -> tuple[DataFrame, DataFrame]:
    order = Window.partitionBy("session_id").orderBy("event_timestamp", "event_id")
    indexed = (
        events.withColumn("event_index", F.row_number().over(order))
        .withColumn("previous_event", F.lag("event_type").over(order))
        .withColumn("next_event", F.lead("event_type").over(order))
    )
    sessions = (
        indexed.groupBy("session_id", "customer_id")
        .agg(
            F.min("event_timestamp").alias("session_start"),
            F.max("event_timestamp").alias("session_end"),
            F.count_distinct(
                F.when(F.col("event_type") == "product_view", F.col("product_id"))
            ).alias("viewed_product_count"),
            F.sum(F.when(F.col("event_type") == "add_to_cart", 1).otherwise(0)).alias(
                "cart_add_count"
            ),
            F.max(F.when(F.col("event_type") == "checkout_started", 1).otherwise(0))
            .cast("boolean")
            .alias("checkout_flag"),
            F.max(F.when(F.col("event_type") == "purchase", 1).otherwise(0))
            .cast("boolean")
            .alias("purchase_flag"),
        )
        .withColumn(
            "duration_seconds",
            (F.col("session_end").cast("long") - F.col("session_start").cast("long")).cast("int"),
        )
        .withColumn("abandonment_flag", (F.col("cart_add_count") > 0) & ~F.col("purchase_flag"))
    )
    indexed.write.mode("overwrite").parquet(str(CURATED / "events"))
    sessions.write.mode("overwrite").parquet(str(CURATED / "sessions"))
    return indexed, sessions


def interactions(events: DataFrame) -> DataFrame:
    mapping = F.create_map(
        *[item for pair in INTERACTION_WEIGHTS.items() for item in (F.lit(pair[0]), F.lit(pair[1]))]
    )
    result = (
        events.filter(F.col("event_timestamp") < F.lit(CUTOFF.replace(tzinfo=None)))
        .withColumn("weight", mapping[F.col("event_type")])
        .groupBy("customer_id", "product_id")
        .agg(
            F.sum("weight").alias("interaction_strength"),
            F.count("*").cast("int").alias("event_count"),
        )
        .withColumn("interaction_strength", F.greatest(F.col("interaction_strength"), F.lit(0.0)))
    )
    result.write.mode("overwrite").parquet(str(CURATED / "interactions"))
    return result


def _ranked(rows: DataFrame, partition: str | None, score: str, limit: int = 5) -> DataFrame:
    keys = [F.col(partition)] if partition else []
    window = Window.partitionBy(*keys).orderBy(F.desc(score), F.asc("product_id"))
    return rows.withColumn("rank", F.row_number().over(window)).filter(F.col("rank") <= limit)


def build_recommendations(
    events: DataFrame, strengths: DataFrame, products: DataFrame
) -> dict[str, Mapping[str, object] | Sequence[object]]:
    training = events.filter(F.col("event_timestamp") < F.lit(CUTOFF.replace(tzinfo=None)))
    popularity = _ranked(
        training.groupBy("product_id").agg(
            F.sum(
                F.when(F.col("event_type") == "purchase", 6)
                .when(F.col("event_type") == "add_to_cart", 3)
                .otherwise(1)
            ).alias("score")
        ),
        None,
        "score",
    )
    category = _ranked(
        popularity.join(products, "product_id").select("category", "product_id", "score"),
        "category",
        "score",
    )
    purchased = (
        training.filter(F.col("event_type") == "purchase")
        .select("session_id", "product_id")
        .distinct()
    )
    pairs = (
        purchased.alias("a")
        .join(
            purchased.alias("b"),
            (F.col("a.session_id") == F.col("b.session_id"))
            & (F.col("a.product_id") < F.col("b.product_id")),
        )
        .groupBy(F.col("a.product_id").alias("left"), F.col("b.product_id").alias("right"))
        .count()
        .filter(F.col("count") >= 2)
    )
    directed = pairs.select(
        F.col("left").alias("product_id"),
        F.col("right").alias("candidate_id"),
        F.col("count").alias("score"),
    ).unionByName(
        pairs.select(
            F.col("right").alias("product_id"),
            F.col("left").alias("candidate_id"),
            F.col("count").alias("score"),
        )
    )
    fbt = _ranked(directed, "product_id", "score", 4)
    norms = strengths.groupBy("product_id").agg(
        F.sqrt(F.sum(F.pow("interaction_strength", 2))).alias("norm")
    )
    sim = (
        strengths.alias("a")
        .join(
            strengths.alias("b"),
            (F.col("a.customer_id") == F.col("b.customer_id"))
            & (F.col("a.product_id") < F.col("b.product_id")),
        )
        .groupBy(F.col("a.product_id").alias("left"), F.col("b.product_id").alias("right"))
        .agg(F.sum(F.col("a.interaction_strength") * F.col("b.interaction_strength")).alias("dot"))
        .join(norms.alias("ln"), F.col("left") == F.col("ln.product_id"))
        .join(norms.alias("rn"), F.col("right") == F.col("rn.product_id"))
        .select(
            "left", "right", (F.col("dot") / (F.col("ln.norm") * F.col("rn.norm"))).alias("score")
        )
        .filter(F.col("score") > 0)
    )
    sim_directed = sim.select(
        F.col("left").alias("product_id"), F.col("right").alias("candidate_id"), "score"
    ).unionByName(
        sim.select(
            F.col("right").alias("product_id"),
            F.col("left").alias("candidate_id"),
            "score",
        )
    )
    similarity = _ranked(sim_directed, "product_id", "score", 4)
    return {
        "popularity": [
            {"product_id": r.product_id, "score": round(float(r.score), 6), "rank": r.rank}
            for r in popularity.orderBy("rank", "product_id").collect()
        ],
        "category-popularity": [
            {
                "category": r.category,
                "product_id": r.product_id,
                "score": round(float(r.score), 6),
                "rank": r.rank,
            }
            for r in category.orderBy("category", "rank").collect()
        ],
        "frequently-bought-together": _mapping(fbt),
        "item-similarity": _mapping(similarity),
    }


def _mapping(frame: DataFrame) -> dict[str, list[dict[str, object]]]:
    result: dict[str, list[dict[str, object]]] = {}
    for row in frame.orderBy("product_id", "rank").collect():
        result.setdefault(row.product_id, []).append(
            {"product_id": row.candidate_id, "score": round(float(row.score), 6), "rank": row.rank}
        )
    return result


def _write(name: str, data: Mapping[str, object] | Sequence[object]) -> dict[str, object]:
    payload = (
        json.dumps(
            {
                "schema_version": "1.0",
                "dataset_version": "small-2026-08-01",
                "seed": SEED,
                "data": data,
            },
            sort_keys=True,
            indent=2,
        )
        + "\n"
    ).encode()
    for directory in (ARTIFACT_DIR, PUBLIC_DIR):
        directory.mkdir(parents=True, exist_ok=True)
        (directory / f"{name}.json").write_bytes(payload)
    return {
        "name": f"{name}.json",
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "record_count": len(data),
    }


def run_pipeline() -> None:
    spark = spark_session()
    try:
        counts = write_raw(spark, "small", SEED)
        valid, _invalid, quality = validate_events(spark)
        _indexed, sessions = sessionize(valid)
        strength = interactions(valid)
        recs = build_recommendations(valid, strength, _products(spark))
        manifests: list[dict[str, object]] = [_write(name, data) for name, data in recs.items()]
        quality.update(counts)
        quality.update({"sessions": sessions.count(), "interactions": strength.count()})
        manifests.append(_write("quality-report", quality))
        metadata = {
            "training_cutoff": CUTOFF.isoformat(),
            "evaluation_start": CUTOFF.isoformat(),
            "profile": "small",
            "interaction_weights": INTERACTION_WEIGHTS,
            "shuffle_partitions": 4,
        }
        manifests.append(_write("pipeline-metadata", metadata))
        evaluation = evaluate(recs, SEED)
        evaluation_names = (
            "evaluation-summary",
            "evaluation-by-segment",
            "strategy-comparison",
            "hybrid-recommendations",
            "recommendation-system-card",
        )
        for name, data in zip(evaluation_names, evaluation, strict=True):
            manifests.append(_write(name, data))
        manifests.append(
            _write(
                "hybrid-config",
                {
                    "selected": SELECTED_CONFIG,
                    "weights": HYBRID_CONFIGS[SELECTED_CONFIG],
                    "k_values": list(K_VALUES),
                    "cutoff": EVALUATION_CUTOFF.isoformat(),
                    "category_cap": 2,
                    "score_definition": "weighted sum of normalized signals before business rules",
                },
            )
        )
        ordered_manifests: list[dict[str, object]] = sorted(
            manifests, key=lambda item: str(item["name"])
        )
        _write("manifest", ordered_manifests)
    finally:
        spark.stop()


def validate_artifacts() -> None:
    manifest = json.loads((ARTIFACT_DIR / "manifest.json").read_text())["data"]
    total = 0
    for item in manifest:
        path = ARTIFACT_DIR / item["name"]
        if not path.exists() or hashlib.sha256(path.read_bytes()).hexdigest() != item["sha256"]:
            raise ValueError(f"Invalid artifact: {path.name}")
        if path.stat().st_size > 1_000_000:
            raise ValueError(f"Artifact too large: {path.name}")
        if path.read_bytes() != (PUBLIC_DIR / path.name).read_bytes():
            raise ValueError(f"Published artifact differs: {path.name}")
        total += path.stat().st_size
    if total > 3_000_000:
        raise ValueError("Recommendation artifacts exceed 3 MB")


def pipeline() -> None:
    run_pipeline()
    validate_artifacts()
