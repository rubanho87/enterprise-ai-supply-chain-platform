from fastapi import APIRouter, HTTPException, Query

from app.db.databricks import execute_query


router = APIRouter(
    prefix="/transfers",
    tags=["Stock Transfer Intelligence"],
)


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


@router.get("/recommendations")
def get_transfer_recommendations(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
        description="Maximum number of transfer recommendations to return",
    ),
    priority_rank: int | None = Query(
        default=None,
        ge=1,
        description="Optional replenishment priority rank filter",
    ),
    receiver_store: str | None = Query(
        default=None,
        description="Optional receiver store code filter",
    ),
    donor_store: str | None = Query(
        default=None,
        description="Optional donor store code filter",
    ),
    product_key: str | None = Query(
        default=None,
        description="Optional product key filter",
    ),
):
    """
    Return stock-transfer recommendations from the Databricks
    serving layer, enriched with human-readable store names.
    """

    conditions = []

    if priority_rank is not None:
        conditions.append(
            f"t.priority_rank = {priority_rank}"
        )

    if receiver_store:
        safe_value = escape_sql_string(receiver_store)
        conditions.append(
            f"t.receiver_store = '{safe_value}'"
        )

    if donor_store:
        safe_value = escape_sql_string(donor_store)
        conditions.append(
            f"t.donor_store = '{safe_value}'"
        )

    if product_key:
        safe_value = escape_sql_string(product_key)
        conditions.append(
            f"CAST(t.product_key AS STRING) = '{safe_value}'"
        )

    where_clause = ""

    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)

    query = f"""
        SELECT
            t.product_key,
            t.article,

            t.donor_store_key,
            t.donor_store,
            COALESCE(
                d.nom_magasin,
                t.donor_store
            ) AS donor_store_name,

            t.donor_stock,
            t.donor_status,
            t.transferable_stock,

            t.receiver_store_key,
            t.receiver_store,
            COALESCE(
                r.nom_magasin,
                t.receiver_store
            ) AS receiver_store_name,

            t.receiver_stock,
            t.receiver_sales_30d,
            t.current_days_cover,
            t.replenishment_priority,
            t.priority_rank,
            t.uncovered_qty,
            t.proposed_transfer_qty

        FROM supply_chain.serving.stock_transfer_recommendations t

        LEFT JOIN supply_chain.gold.dim_store d
            ON t.donor_store_key = d.store_key

        LEFT JOIN supply_chain.gold.dim_store r
            ON t.receiver_store_key = r.store_key

        {where_clause}

        ORDER BY
            t.priority_rank ASC,
            t.proposed_transfer_qty DESC,
            t.receiver_sales_30d DESC

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
                "receiver_store": receiver_store,
                "donor_store": donor_store,
                "product_key": product_key,
            },
            "data": rows,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to retrieve stock transfer "
                f"recommendations: {exc}"
            ),
        ) from exc