from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.db.databricks import execute_query


router = APIRouter(
    prefix="/risk",
    tags=["Risk Intelligence"],
)


# ============================================================
# HELPERS
# ============================================================

def escape_sql_string(value: str) -> str:
    """
    Escape single quotes used inside SQL string literals.
    """
    return value.replace("'", "''")


def build_store_key_condition(store_key: str) -> str:
    """
    Build a safe exact store-key comparison.

    store_key is cast to STRING because Databricks store keys
    can be large signed BIGINT values and are easier to pass
    safely from the frontend as strings.
    """
    safe_store_key = escape_sql_string(store_key)

    return (
        f"CAST(store_key AS STRING) = "
        f"'{safe_store_key}'"
    )


# ============================================================
# EXECUTIVE RISK
# ============================================================

@router.get("/executive")
def get_executive_risk(
    store_key: Optional[str] = Query(
        default=None,
        description=(
            "Optional store key. When provided, executive KPI "
            "values are recalculated for the selected store."
        ),
    ),
):
    """
    Return executive supply-chain risk KPI.

    Global mode:
        Uses supply_chain.serving.executive_risk.

    Store mode:
        Uses supply_chain.serving.risk_by_store so the dashboard
        KPI values change when a store is selected.
    """

    # --------------------------------------------------------
    # GLOBAL VIEW
    # --------------------------------------------------------
    if not store_key:
        query = """
            SELECT *
            FROM supply_chain.serving.executive_risk
            ORDER BY generated_at DESC
            LIMIT 1
        """

        try:
            rows = execute_query(query)

            if not rows:
                raise HTTPException(
                    status_code=404,
                    detail="Executive risk data not found",
                )

            return {
                "status": "success",
                "scope": "global",
                "filters": {
                    "store_key": None,
                },
                "data": rows[0],
            }

        except HTTPException:
            raise

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to retrieve executive risk data: "
                    f"{exc}"
                ),
            ) from exc

    # --------------------------------------------------------
    # STORE VIEW
    # --------------------------------------------------------
    store_condition = build_store_key_condition(store_key)

    query = f"""
        SELECT
            CAST(store_key AS STRING) AS store_key,

            total_products AS total_store_products,

            products_at_risk AS store_products_at_risk,

            critical_risks,

            high_risks,

            medium_risks,

            GREATEST(
                total_products - products_at_risk,
                0
            ) AS no_risk,

            avg_risk_score,

            max_risk_score,

            risk_rate_pct,

            CASE
                WHEN total_products > 0
                THEN ROUND(
                    (
                        critical_risks * 100.0
                    ) / total_products,
                    2
                )
                ELSE 0.0
            END AS critical_rate_pct,

            CASE
                WHEN total_products > 0
                THEN ROUND(
                    (
                        high_risks * 100.0
                    ) / total_products,
                    2
                )
                ELSE 0.0
            END AS high_rate_pct,

            CASE
                WHEN total_products > 0
                THEN ROUND(
                    (
                        medium_risks * 100.0
                    ) / total_products,
                    2
                )
                ELSE 0.0
            END AS medium_rate_pct,

            CASE
                WHEN total_products > 0
                THEN ROUND(
                    (
                        GREATEST(
                            total_products - products_at_risk,
                            0
                        ) * 100.0
                    ) / total_products,
                    2
                )
                ELSE 0.0
            END AS healthy_rate_pct,

            CASE
                WHEN critical_risks > 0
                    OR max_risk_score >= 90
                    THEN 'ELEVATED'

                WHEN high_risks > 0
                    OR avg_risk_score >= 60
                    THEN 'HIGH'

                WHEN products_at_risk > 0
                    THEN 'WATCH'

                ELSE 'HEALTHY'
            END AS risk_status

        FROM supply_chain.serving.risk_by_store

        WHERE {store_condition}

        LIMIT 1
    """

    try:
        rows = execute_query(query)

        if not rows:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Risk data not found for store_key "
                    f"{store_key}"
                ),
            )

        return {
            "status": "success",
            "scope": "store",
            "filters": {
                "store_key": store_key,
            },
            "data": rows[0],
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve store executive risk data: "
                f"{exc}"
            ),
        ) from exc


# ============================================================
# STORE RISK
# ============================================================

@router.get("/stores")
def get_store_risks(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
        description="Maximum number of stores to return",
    ),
    min_risk_rate: float = Query(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Minimum store risk rate percentage",
    ),
    store_key: Optional[str] = Query(
        default=None,
        description="Optional exact store key filter",
    ),
):
    """
    Return stores ranked by supply-chain risk.
    """

    conditions = [
        f"risk_rate_pct >= {min_risk_rate}"
    ]

    if store_key:
        conditions.append(
            build_store_key_condition(store_key)
        )

    where_clause = (
        "WHERE " + " AND ".join(conditions)
    )

    query = f"""
        SELECT
            CAST(store_key AS STRING) AS store_key,
            total_products,
            products_at_risk,
            critical_risks,
            high_risks,
            medium_risks,
            avg_risk_score,
            max_risk_score,
            risk_rate_pct,

            GREATEST(
                total_products - products_at_risk,
                0
            ) AS healthy_products

        FROM supply_chain.serving.risk_by_store

        {where_clause}

        ORDER BY
            risk_rate_pct DESC,
            critical_risks DESC,
            high_risks DESC,
            avg_risk_score DESC

        LIMIT {limit}
    """

    try:
        rows = execute_query(query)

        return {
            "status": "success",
            "count": len(rows),
            "filters": {
                "limit": limit,
                "min_risk_rate": min_risk_rate,
                "store_key": store_key,
            },
            "data": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve store risk data: "
                f"{exc}"
            ),
        ) from exc


# ============================================================
# PRODUCT RISK
# ============================================================

@router.get("/products")
def get_product_risks(
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
        description="Maximum number of products to return",
    ),
    min_risk_rate: float = Query(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Minimum product risk rate percentage",
    ),
    product_key: Optional[str] = Query(
        default=None,
        description="Optional exact product key filter",
    ),
):
    """
    Return products ranked by supply-chain risk.
    """

    conditions = [
        f"risk_rate_pct >= {min_risk_rate}"
    ]

    if product_key:
        safe_product_key = escape_sql_string(
            product_key
        )

        conditions.append(
            "CAST(product_key AS STRING) = "
            f"'{safe_product_key}'"
        )

    where_clause = (
        "WHERE " + " AND ".join(conditions)
    )

    query = f"""
        SELECT
            CAST(product_key AS STRING) AS product_key,
            store_count,
            stores_at_risk,
            critical_risks,
            high_risks,
            avg_risk_score,
            max_risk_score,
            risk_rate_pct

        FROM supply_chain.serving.risk_by_product

        {where_clause}

        ORDER BY
            risk_rate_pct DESC,
            critical_risks DESC,
            high_risks DESC,
            avg_risk_score DESC

        LIMIT {limit}
    """

    try:
        rows = execute_query(query)

        return {
            "status": "success",
            "count": len(rows),
            "filters": {
                "limit": limit,
                "min_risk_rate": min_risk_rate,
                "product_key": product_key,
            },
            "data": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve product risk data: "
                f"{exc}"
            ),
        ) from exc