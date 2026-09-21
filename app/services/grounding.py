from typing import Any


TRANSFER_FIELDS = (
    "article",
    "donor_store",
    "receiver_store",
    "proposed_transfer_qty",
)


def _normalize_value(
    value: Any,
) -> Any:
    """
    Normalize values without changing their business meaning.

    Numeric values and identifiers are deliberately preserved
    because they are authoritative operational facts.
    """
    if value is None:
        return None

    if isinstance(value, str):
        return value.strip()

    return value


def build_transfer_fact(
    record: dict[str, Any],
) -> dict[str, Any]:
    """
    Build one immutable business transfer fact from a source record.

    Product, donor store, receiver store and quantity must always
    remain associated with the same source record.
    """
    return {
        field: _normalize_value(
            record.get(field)
        )
        for field in TRANSFER_FIELDS
    }


def extract_transfer_facts(
    context: dict[str, Any],
) -> list[dict[str, Any]]:
    """
    Extract authoritative stock-transfer facts from the selected
    operational context.

    Only complete transfer records are returned.
    """
    records = context.get(
        "transfer_recommendations",
        [],
    )

    if not isinstance(records, list):
        return []

    facts: list[dict[str, Any]] = []

    for record in records:
        if not isinstance(record, dict):
            continue

        fact = build_transfer_fact(
            record,
        )

        if all(
            fact.get(field) is not None
            for field in TRANSFER_FIELDS
        ):
            facts.append(
                fact
            )

    return facts


def build_grounded_facts(
    context: dict[str, Any],
) -> dict[str, Any]:
    """
    Build structured authoritative facts that can safely be used
    by the AI response layer.

    The original selected context is not modified.
    """
    transfer_facts = extract_transfer_facts(
        context,
    )

    return {
        "transfer_facts": transfer_facts,
        "transfer_fact_count": len(
            transfer_facts
        ),
    }


def format_transfer_facts(
    transfer_facts: list[dict[str, Any]],
) -> str:
    """
    Format authoritative transfer facts into a compact representation
    suitable for grounding an LLM prompt.

    Each line represents exactly one source transfer relationship.
    """
    if not transfer_facts:
        return "No authoritative transfer facts available."

    lines = []

    for index, fact in enumerate(
        transfer_facts,
        start=1,
    ):
        lines.append(
            (
                f"{index}. "
                f"article={fact['article']} | "
                f"donor_store={fact['donor_store']} | "
                f"receiver_store={fact['receiver_store']} | "
                f"proposed_transfer_qty="
                f"{fact['proposed_transfer_qty']}"
            )
        )

    return "\n".join(
        lines
    )