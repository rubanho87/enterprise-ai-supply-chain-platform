from typing import Any


INTENT_CONTEXT_MAP = {
    "STOCKOUT_RISK": (
        "stockout_alerts",
        "transfer_recommendations",
    ),
    "STOCK_TRANSFER": (
        "transfer_recommendations",
    ),
    "INVENTORY_RISK": (
        "critical_actions",
        "stockout_alerts",
    ),
    "CRITICAL_ACTIONS": (
        "critical_actions",
        "stockout_alerts",
        "transfer_recommendations",
    ),
    "EXECUTIVE_SUMMARY": (
        "executive_summary",
        "critical_actions",
        "stockout_alerts",
        "transfer_recommendations",
    ),
    "GENERAL_SUPPLY_CHAIN": (
        "executive_summary",
        "critical_actions",
        "stockout_alerts",
        "transfer_recommendations",
    ),
}


def select_context_for_intent(
    context: dict[str, Any],
    intent: str,
) -> dict[str, Any]:
    """
    Select only the sections of the supply-chain decision context
    that are relevant to the detected business intent.

    This reduces unnecessary context sent to the language model
    while preserving the information required to answer the question.
    """
    selected_sections = INTENT_CONTEXT_MAP.get(
        intent,
        INTENT_CONTEXT_MAP["GENERAL_SUPPLY_CHAIN"],
    )

    selected_context = {
        key: context[key]
        for key in selected_sections
        if key in context
    }

    return selected_context