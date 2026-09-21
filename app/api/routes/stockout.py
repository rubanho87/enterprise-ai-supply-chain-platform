from fastapi import APIRouter, HTTPException, Query

from app.db.databricks import execute_query


router = APIRouter(
    prefix="/stockouts",
    tags=["Stockout Intelligence"],
)


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


@router.get("/alerts")
def get_stockout_alerts(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of stockout alerts to return",
    ),
    priority_rank: int | None = Query(
        default=None,
        ge=1,
        description="Optional priority rank filter",
    ),
    business_unit: str | None = Query(
        default=None,
        description="Optional business unit filter",
    ),
    store_key: str | None = Query(
        default=None,
        description="Optional store key filter",
    ),
    product_key: str | None = Query(
        default=None,
        description="Optional product key filter",
    ),
    store_name: str | None = Query(
        default=None,
        description="Optional store name filter",
    ),
):
    """
    Return stockout alerts from the Databricks serving layer.
    """

    conditions = []

    if priority_rank is not None:
        conditions.append(
            f"priority_rank = {priority_rank}"
        )

    if business_unit:
        safe_value = escape_sql_string(business_unit)
        conditions.append(
            f"store_business_unit = '{safe_value}'"
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

    if store_name:
        safe_value = escape_sql_string(store_name)
        conditions.append(
            f"LOWER(store_name) LIKE LOWER('%{safe_value}%')"
        )

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            product_key,
            store_key,
            inventory_key,
            store_code,
            store_name,
            store_business_unit,
            product_code,
            product_name,
            famille,
            sous_famille,
            stock_depart,
            stock_entree,
            stock_sortie,
            stock_disponible,
            stock_negatif,
            qty_sales_30d,
            revenue_30d,
            days_with_sales_30d,
            avg_daily_sales_30d,
            days_of_stock,
            inventory_status,
            alert_priority,
            stockout_priority,
            priority_rank
        FROM supply_chain.serving.stockout_alerts
        {where_clause}
        ORDER BY
            priority_rank ASC,
            qty_sales_30d DESC,
            revenue_30d DESC
        LIMIT {limit}
    """

    try:
        rows = execute_query(query)

        return {
            "status": "success",
            "count": len(rows),
            "filters": {
                "limit": limit,
                "priority_rank": priority_rank,
                "business_unit": business_unit,
                "store_key": store_key,
                "product_key": product_key,
                "store_name": store_name,
            },
            "data": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve stockout alerts: {exc}",
        ) from exc