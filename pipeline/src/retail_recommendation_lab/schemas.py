from pyspark.sql.types import (
    ArrayType,
    BooleanType,
    DoubleType,
    IntegerType,
    StringType,
    StructField,
    StructType,
    TimestampType,
)

PRODUCT_SCHEMA = StructType(
    [
        StructField("product_id", StringType(), False),
        StructField("category", StringType(), False),
        StructField("price", DoubleType(), False),
        StructField("in_stock", BooleanType(), False),
    ]
)
CUSTOMER_SCHEMA = StructType(
    [
        StructField("customer_id", StringType(), False),
        StructField("segment", StringType(), False),
        StructField("preferred_categories", ArrayType(StringType(), False), False),
        StructField("price_sensitivity", DoubleType(), False),
        StructField("activity_level", StringType(), False),
        StructField("repeat_purchase_tendency", DoubleType(), False),
    ]
)
EVENT_SCHEMA = StructType(
    [
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("event_timestamp", TimestampType(), False),
        StructField("session_id", StringType(), False),
        StructField("customer_id", StringType(), False),
        StructField("product_id", StringType(), True),
        StructField("quantity", IntegerType(), False),
        StructField("unit_price", DoubleType(), False),
        StructField("channel", StringType(), False),
        StructField("device_type", StringType(), False),
        StructField("event_date", StringType(), False),
    ]
)
SESSION_SCHEMA = StructType(
    [
        StructField("session_id", StringType(), False),
        StructField("customer_id", StringType(), False),
        StructField("session_start", TimestampType(), False),
        StructField("session_end", TimestampType(), False),
        StructField("duration_seconds", IntegerType(), False),
        StructField("viewed_product_count", IntegerType(), False),
        StructField("cart_add_count", IntegerType(), False),
        StructField("checkout_flag", BooleanType(), False),
        StructField("purchase_flag", BooleanType(), False),
        StructField("abandonment_flag", BooleanType(), False),
    ]
)
INTERACTION_SCHEMA = StructType(
    [
        StructField("customer_id", StringType(), False),
        StructField("product_id", StringType(), False),
        StructField("interaction_strength", DoubleType(), False),
        StructField("event_count", IntegerType(), False),
    ]
)

EVENT_TYPES = {"product_view", "add_to_cart", "remove_from_cart", "checkout_started", "purchase"}
INTERACTION_WEIGHTS = {
    "product_view": 1.0,
    "add_to_cart": 3.0,
    "remove_from_cart": -1.0,
    "checkout_started": 4.0,
    "purchase": 6.0,
}
