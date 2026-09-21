from enum import Enum
import re
import unicodedata


class SupplyChainIntent(str, Enum):
    EXECUTIVE_SUMMARY = "EXECUTIVE_SUMMARY"
    STOCKOUT_RISK = "STOCKOUT_RISK"
    INVENTORY_RISK = "INVENTORY_RISK"
    STOCK_TRANSFER = "STOCK_TRANSFER"
    CRITICAL_ACTIONS = "CRITICAL_ACTIONS"
    GENERAL_SUPPLY_CHAIN = "GENERAL_SUPPLY_CHAIN"


def normalize_text(text: str) -> str:
    """
    Normalize user text to make deterministic language and intent
    detection more reliable across English and French.
    """
    text = text.strip().lower()

    # Remove accents:
    # "négatif" -> "negatif"
    # "priorité" -> "priorite"
    text = unicodedata.normalize("NFKD", text)
    text = "".join(
        char
        for char in text
        if not unicodedata.combining(char)
    )

    # Keep letters, numbers and spaces only.
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Normalize repeated whitespace.
    text = re.sub(r"\s+", " ", text).strip()

    return text


def detect_intent(question: str) -> SupplyChainIntent:
    """
    Detect the business intent of a supply-chain question.

    Intent detection is deterministic and bilingual
    (English / French). It does not call the LLM.

    This keeps routing fast, predictable and inexpensive.
    """
    if not question or not question.strip():
        return SupplyChainIntent.GENERAL_SUPPLY_CHAIN

    text = normalize_text(question)

    intent_keywords = {
        SupplyChainIntent.STOCK_TRANSFER: (
            "transfer",
            "transfers",
            "stock transfer",
            "transfer stock",
            "transfer recommendation",
            "transfer recommendations",
            "donor store",
            "receiver store",
            "move stock",
            "redistribute stock",
            "transfert",
            "transferts",
            "transfert de stock",
            "transferts de stock",
            "transferer",
            "deplacer le stock",
            "redistribuer le stock",
            "magasin donneur",
            "magasin receveur",
        ),
        SupplyChainIntent.STOCKOUT_RISK: (
            "stockout",
            "stockouts",
            "stock out",
            "out of stock",
            "stock shortage",
            "stock shortages",
            "shortage",
            "shortages",
            "rupture",
            "ruptures",
            "rupture de stock",
            "ruptures de stock",
            "risque de rupture",
            "risques de rupture",
            "manque de stock",
            "epuisement du stock",
        ),
        SupplyChainIntent.INVENTORY_RISK: (
            "negative stock",
            "negative inventory",
            "inventory risk",
            "inventory risks",
            "inventory discrepancy",
            "inventory discrepancies",
            "stock discrepancy",
            "stock discrepancies",
            "stock negatif",
            "stocks negatifs",
            "inventaire negatif",
            "risque inventaire",
            "risques inventaire",
            "anomalie de stock",
            "anomalies de stock",
            "ecart de stock",
            "ecarts de stock",
        ),
        SupplyChainIntent.CRITICAL_ACTIONS: (
            "critical action",
            "critical actions",
            "urgent action",
            "urgent actions",
            "operational action",
            "operational actions",
            "what should we do",
            "what must we do",
            "what should i do",
            "priority action",
            "priority actions",
            "action critique",
            "actions critiques",
            "action urgente",
            "actions urgentes",
            "action prioritaire",
            "actions prioritaires",
            "que devons nous faire",
            "que faut il faire",
            "quoi faire",
            "que devons nous faire en priorite",
        ),
        SupplyChainIntent.EXECUTIVE_SUMMARY: (
            "executive summary",
            "management summary",
            "management report",
            "global summary",
            "overall situation",
            "supply chain summary",
            "summary for management",
            "summary for the ceo",
            "resume executif",
            "resume global",
            "situation globale",
            "rapport de gestion",
            "rapport pour la direction",
            "resume pour la direction",
            "resume pour le dg",
            "rapport pour le dg",
            "vue d ensemble",
        ),
    }

    # Score every intent instead of stopping at the first keyword.
    # Longer expressions receive more weight because they are
    # generally more specific than isolated words.
    scores = {
        intent: 0
        for intent in intent_keywords
    }

    for intent, keywords in intent_keywords.items():
        for keyword in keywords:
            if keyword in text:
                scores[intent] += max(
                    1,
                    len(keyword.split()),
                )

    best_intent = max(
        scores,
        key=scores.get,
    )

    if scores[best_intent] == 0:
        return SupplyChainIntent.GENERAL_SUPPLY_CHAIN

    return best_intent


def route_question(question: str) -> dict[str, str]:
    """
    Return the structured routing result consumed by
    the Supply Chain AI Assistant.
    """
    intent = detect_intent(question)

    return {
        "question": question,
        "intent": intent.value,
    }