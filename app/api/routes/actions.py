from fastapi import APIRouter, HTTPException, Query

from app.db.databricks import execute_query


router = APIRouter(
    prefix="/actions",
    tags=["Critical Action Intelligence"],
)


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


@router.get("/critical")
def get_critical_actions(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of critical actions to return",
    ),
    risk_severity: str | None = Query(
        default=None,
        description="Optional risk severity filter",
    ),
    primary_risk: str | None = Query(
        default=None,
        description="Optional primary risk filter",
    ),
    min_risk_score: int = Query(
        default=0,
        ge=0,
        le=100,
        description="Minimum risk score",
    ),
    store_key: str | None = Query(
        default=None,
        description="Optional store key filter",
    ),
    product_key: str | None = Query(
        default=None,
        description="Optional product key filter",
    ),
):
    """
    Return prioritized operational actions generated
    from critical supply-chain risks.
    """

    conditions = [
        f"risk_score >= {min_risk_score}"
    ]

    if risk_severity:
        safe_value = escape_sql_string(risk_severity)
        conditions.append(
            f"risk_severity = '{safe_value}'"
        )

    if primary_risk:
        safe_value = escape_sql_string(primary_risk)
        conditions.append(
            f"primary_risk = '{safe_value}'"
        )

    if store_key:
        safe_value = escape_sql_string(store_key)
        conditions.append(
            f"CAST(store_key AS STRING) = '{safe_value}'"
        )

    if product_key:
        safe_value = escape_sql_string(product_key)
        conditions.append(
            f"CAST(product_key AS STRING) = '{safe_value}'"
        )

    where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            store_key,
            product_key,
            stock_disponible,
            qty_30d,
            avg_daily_demand_30d,
            stock_coverage_days,
            days_since_last_sale,
            risk_score,
            risk_severity,
            primary_risk,
            recommended_action
        FROM supply_chain.serving.critical_risk_actions
        {where_clause}
        ORDER BY
            risk_score DESC,
            stock_disponible ASC
        LIMIT {limit}
    """

    try:
        rows = execute_query(query)

        return {
            "status": "success",
            "count": len(rows),
            "filters": {
                "limit": limit,
                "risk_severity": risk_severity,
                "primary_risk": primary_risk,
                "min_risk_score": min_risk_score,
                "store_key": store_key,
                "product_key": product_key,
            },
            "data": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve critical risk "
                f"actions: {exc}"
            ),
        ) from exc