import json
from typing import Any

from app.core.config import settings
from app.services.decision_context import build_decision_context
from app.services.ollama import generate_json


SYSTEM_PROMPT = """
You are an Enterprise Supply Chain AI Decision Engine.

Your job is to analyze ONLY the operational data supplied in the context.

The data originates from the Databricks serving layer and must be treated
as the source of truth.

STRICT RULES:

1. Never invent stores, products, quantities, KPIs, risks, or events.
2. Never modify numerical values from the supplied context.
3. Do not assume information that is absent from the context.
4. Distinguish clearly between observed facts and recommendations.
5. Prioritize CRITICAL risks before HIGH, MEDIUM, and lower risks.
6. Give operational recommendations that are supported by the context.
7. Stock-transfer recommendations must use only the supplied transfer data.
8. If the supplied information is insufficient, explicitly say so.
9. Return valid JSON only.
10. Do not include markdown around the JSON.

Your response must follow this structure:

{
  "overall_status": "string",
  "executive_summary": "string",
  "top_priorities": [
    {
      "priority": 1,
      "severity": "string",
      "issue": "string",
      "evidence": "string",
      "recommended_action": "string"
    }
  ],
  "stockout_assessment": {
    "summary": "string",
    "recommended_actions": []
  },
  "transfer_assessment": {
    "summary": "string",
    "recommended_transfers": []
  },
  "management_recommendations": [],
  "data_limitations": []
}
""".strip()


def _serialize_context(context: dict[str, Any]) -> str:
    """
    Serialize the Databricks decision context into JSON that can be
    safely supplied to the local LLM.
    """

    return json.dumps(
        context,
        ensure_ascii=False,
        indent=2,
        default=str,
    )


def build_decision_prompt(
    context: dict[str, Any],
) -> str:
    """
    Build the user prompt supplied to the AI decision engine.
    """

    serialized_context = _serialize_context(context)

    return f"""
Analyze the following enterprise supply-chain decision context.

Use ONLY the information contained in this context.

DATABRICKS DECISION CONTEXT:

{serialized_context}

Produce the requested structured executive decision report.

Focus especially on:

- overall supply-chain risk,
- critical operational risks,
- negative or unavailable stock,
- stockout exposure,
- urgent operational actions,
- possible stock transfers,
- management priorities.

Do not invent identifiers, quantities, stores, products, or events.

Return JSON only.
""".strip()


def generate_supply_chain_decision() -> dict[str, Any]:
    """
    Build the latest Databricks decision context and use the configured
    Ollama model to generate an executive supply-chain decision report.
    """

    context = build_decision_context()

    if not context:
        raise RuntimeError(
            "Decision context is empty. "
            "Unable to generate supply-chain decision."
        )

    prompt = build_decision_prompt(context)

    decision = generate_json(
        prompt,
        system_prompt=SYSTEM_PROMPT,
        temperature=0.0,
    )

    return {
        "status": "success",
        "engine": {
            "provider": "ollama",
            "model": settings.ollama_model,
        },
        "decision": decision,
    }