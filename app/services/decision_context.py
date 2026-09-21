from app.db.databricks import execute_query


def build_decision_context() -> dict:
    """
    Build a compact decision context from the Databricks serving layer.

    This context will later be supplied to the AI decision assistant.
    """

    executive_query = """
        SELECT *
        FROM supply_chain.serving.executive_risk
        ORDER BY generated_at DESC
        LIMIT 1
    """

    critical_actions_query = """
        SELECT *
        FROM supply_chain.serving.critical_risk_actions
        ORDER BY risk_score DESC
        LIMIT 10
    """

    stockout_query = """
        SELECT *
        FROM supply_chain.serving.stockout_alerts
        ORDER BY priority_rank ASC, days_with_sales_30d DESC
        LIMIT 10
    """

    transfer_query = """
        SELECT *
        FROM supply_chain.serving.stock_transfer_recommendations
        ORDER BY priority_rank ASC, proposed_transfer_qty DESC
        LIMIT 10
    """

    executive = execute_query(executive_query)
    critical_actions = execute_query(critical_actions_query)
    stockout_alerts = execute_query(stockout_query)
    transfer_recommendations = execute_query(transfer_query)

    return {
        "executive_summary": executive[0] if executive else None,
        "critical_actions": critical_actions,
        "stockout_alerts": stockout_alerts,
        "transfer_recommendations": transfer_recommendations,
    }