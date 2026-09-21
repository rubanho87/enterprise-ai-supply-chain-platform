import json
import re
import unicodedata
from typing import Any

from app.services.ai_assistant import ask_supply_chain_ai


TEST_CASES = [
    {
        "name": "Stockout risk - French",
        "question": "Quels produits risquent une rupture de stock ?",
        "expected_intent": "STOCKOUT_RISK",
        "expected_language": "French",
    },
    {
        "name": "Stock transfer - French",
        "question": (
            "Quels transferts de stock devons-nous effectuer "
            "en priorité ?"
        ),
        "expected_intent": "STOCK_TRANSFER",
        "expected_language": "French",
    },
    {
        "name": "Inventory risk - English",
        "question": "Which stores have negative stock?",
        "expected_intent": "INVENTORY_RISK",
        "expected_language": "English",
    },
    {
        "name": "Critical actions - French",
        "question": "Que devons-nous faire en priorité ?",
        "expected_intent": "CRITICAL_ACTIONS",
        "expected_language": "French",
    },
    {
        "name": "Executive summary - French",
        "question": "Donne-moi un résumé pour le DG.",
        "expected_intent": "EXECUTIVE_SUMMARY",
        "expected_language": "French",
    },
    {
        "name": "General supply chain - English",
        "question": "What is the current supply chain situation?",
        "expected_intent": "GENERAL_SUPPLY_CHAIN",
        "expected_language": "English",
    },
]


FRENCH_MARKERS = {
    "le",
    "la",
    "les",
    "un",
    "une",
    "des",
    "du",
    "de",
    "dans",
    "avec",
    "pour",
    "sur",
    "aux",
    "au",
    "nous",
    "vous",
    "il",
    "ils",
    "elle",
    "elles",
    "ces",
    "cette",
    "ce",
    "qui",
    "que",
    "doit",
    "doivent",
    "devons",
    "faire",
    "effectuer",
    "produit",
    "produits",
    "magasin",
    "magasins",
    "risque",
    "risques",
    "rupture",
    "stock",
    "transfert",
    "transferts",
    "transferer",
    "priorite",
    "prioritaires",
    "prioriser",
    "resume",
    "situation",
    "recommandees",
    "recommandations",
    "actions",
    "quantite",
    "quantites",
    "donneur",
    "donateur",
    "receveur",
    "recepteur",
    "approvisionnement",
    "reapprovisionnement",
    "inventaire",
    "preuve",
    "preuves",
    "factuel",
    "factuels",
    "factuelle",
    "factuelles",
    "elements",
    "necessaire",
    "necessaires",
    "urgent",
    "urgente",
    "urgents",
    "urgentes",
    "raison",
    "demande",
    "manque",
    "forte",
    "suivants",
    "suivantes",
    "vers",
    "sont",
    "est",
    "etre",
}


ENGLISH_MARKERS = {
    "the",
    "a",
    "an",
    "of",
    "to",
    "and",
    "in",
    "for",
    "with",
    "from",
    "is",
    "are",
    "should",
    "must",
    "please",
    "based",
    "current",
    "following",
    "situation",
    "urgent",
    "needs",
    "required",
    "product",
    "products",
    "store",
    "stores",
    "risk",
    "risks",
    "stockout",
    "shortage",
    "transfer",
    "transfers",
    "priority",
    "prioritized",
    "summary",
    "evidence",
    "recommended",
    "recommendations",
    "inventory",
    "quantity",
    "quantities",
    "donor",
    "receiver",
    "replenishment",
    "operational",
    "actions",
}


# These expressions may legitimately appear in the generated answer because
# they originate from the structured supply-chain context. They should not
# determine the natural language of the response.
TECHNICAL_LABEL_PATTERNS = (
    r"\bdonor\s+store\b",
    r"\breceiver\s+store\b",
    r"\bdonor\s+stock\b",
    r"\breceiver\s+stock\b",
    r"\btransferable\s+stock\b",
    r"\buncovered\s+(?:qty|quantity)\b",
    r"\bproposed\s+transfer\s+(?:qty|quantity)\b",
    r"\bproduct\b(?=\s*:)",
    r"\barticle\b(?=\s*:)",
)


def normalize_text(text: str) -> str:
    """
    Normalize text for deterministic language analysis.

    Accents, punctuation, Markdown syntax and repeated whitespace
    are removed so that marker matching remains stable.
    """
    normalized = unicodedata.normalize(
        "NFKD",
        text.lower(),
    )

    normalized = "".join(
        character
        for character in normalized
        if not unicodedata.combining(character)
    )

    normalized = re.sub(
        r"[^a-z0-9\s]",
        " ",
        normalized,
    )

    normalized = re.sub(
        r"\s+",
        " ",
        normalized,
    ).strip()

    return normalized


def remove_technical_labels(text: str) -> str:
    """
    Remove English technical labels inherited from the structured
    supply-chain context before evaluating the answer language.

    Example:
        Donor Store: 64
        Receiver Store: 35
        Proposed Transfer Quantity: 54

    These labels describe fields from the source data and are not
    sufficient evidence that the natural-language answer is English.
    """
    cleaned_text = text

    for pattern in TECHNICAL_LABEL_PATTERNS:
        cleaned_text = re.sub(
            pattern,
            " ",
            cleaned_text,
            flags=re.IGNORECASE,
        )

    return cleaned_text


def calculate_language_scores(
    text: str,
) -> tuple[int, int]:
    """
    Calculate French and English lexical scores.
    """
    normalized = normalize_text(text)
    words = normalized.split()

    french_score = sum(
        1
        for word in words
        if word in FRENCH_MARKERS
    )

    english_score = sum(
        1
        for word in words
        if word in ENGLISH_MARKERS
    )

    return french_score, english_score


def detect_answer_language(
    answer: str,
) -> dict[str, Any]:
    """
    Estimate the natural language of a generated answer.

    Technical field labels inherited from the source data are excluded
    from the primary language score. The raw score is retained only for
    diagnostics.

    This avoids false failures when a French management answer contains
    English source-field names such as "Donor Store" or
    "Proposed Transfer Quantity".
    """
    raw_french_score, raw_english_score = (
        calculate_language_scores(answer)
    )

    narrative_text = remove_technical_labels(
        answer,
    )

    french_score, english_score = (
        calculate_language_scores(
            narrative_text,
        )
    )

    if french_score > english_score:
        detected_language = "French"

    elif english_score > french_score:
        detected_language = "English"

    else:
        detected_language = "Unknown"

    return {
        "language": detected_language,
        "french_score": french_score,
        "english_score": english_score,
        "raw_french_score": raw_french_score,
        "raw_english_score": raw_english_score,
    }


def validate_case(
    test_case: dict[str, str],
) -> bool:
    """
    Execute and validate one AI Assistant functional scenario.
    """
    print()
    print("=" * 90)
    print(f"TEST: {test_case['name']}")
    print("=" * 90)

    result = ask_supply_chain_ai(
        test_case["question"],
    )

    expected_intent = test_case[
        "expected_intent"
    ]

    expected_language = test_case[
        "expected_language"
    ]

    actual_intent = result.get(
        "intent"
    )

    declared_language = result.get(
        "language"
    )

    answer = result.get(
        "answer",
        "",
    )

    context_sections = result.get(
        "context_sections",
        [],
    )

    metadata = result.get(
        "metadata",
        {},
    )

    intent_ok = (
        actual_intent
        == expected_intent
    )

    language_routing_ok = (
        declared_language
        == expected_language
    )

    answer_ok = bool(
        answer.strip()
    )

    answer_language_result = (
        detect_answer_language(
            answer,
        )
    )

    detected_answer_language = (
        answer_language_result[
            "language"
        ]
    )

    answer_language_ok = (
        detected_answer_language
        == expected_language
    )

    print(
        f"Question          : "
        f"{result.get('question')}"
    )
    print(
        f"Intent            : "
        f"{actual_intent}"
    )
    print(
        f"Expected intent   : "
        f"{expected_intent}"
    )
    print(
        f"Expected language : "
        f"{expected_language}"
    )
    print(
        f"Declared language : "
        f"{declared_language}"
    )
    print(
        f"Answer language   : "
        f"{detected_answer_language}"
    )

    print(
        "Context           :",
        json.dumps(
            context_sections,
            ensure_ascii=False,
        ),
    )

    if metadata:
        print(
            "Metadata          :",
            json.dumps(
                metadata,
                ensure_ascii=False,
            ),
        )

    print()
    print("LANGUAGE SCORES")
    print(
        "Raw French markers       :",
        answer_language_result[
            "raw_french_score"
        ],
    )
    print(
        "Raw English markers      :",
        answer_language_result[
            "raw_english_score"
        ],
    )
    print(
        "Narrative French markers :",
        answer_language_result[
            "french_score"
        ],
    )
    print(
        "Narrative English markers:",
        answer_language_result[
            "english_score"
        ],
    )

    print()
    print("VALIDATION")
    print(
        "Intent routing   :",
        "PASS"
        if intent_ok
        else "FAIL",
    )
    print(
        "Language routing :",
        "PASS"
        if language_routing_ok
        else "FAIL",
    )
    print(
        "Answer language  :",
        "PASS"
        if answer_language_ok
        else "FAIL",
    )
    print(
        "Answer content   :",
        "PASS"
        if answer_ok
        else "FAIL",
    )

    print()
    print("ANSWER")
    print("-" * 90)
    print(answer)

    return all(
        (
            intent_ok,
            language_routing_ok,
            answer_language_ok,
            answer_ok,
        )
    )


def main() -> None:
    """
    Run the complete AI Assistant functional validation suite.
    """
    print()
    print("=" * 90)
    print(
        "ENTERPRISE AI SUPPLY CHAIN PLATFORM"
    )
    print(
        "AI ASSISTANT FUNCTIONAL VALIDATION"
    )
    print("=" * 90)

    passed = 0
    failed = 0

    failed_tests: list[str] = []

    for test_case in TEST_CASES:
        try:
            test_passed = validate_case(
                test_case,
            )

            if test_passed:
                passed += 1

            else:
                failed += 1

                failed_tests.append(
                    test_case["name"],
                )

        except Exception as exc:
            failed += 1

            failed_tests.append(
                test_case["name"],
            )

            print()
            print(
                "ERROR: "
                f"{type(exc).__name__}: "
                f"{exc}"
            )

    total = len(
        TEST_CASES
    )

    print()
    print("=" * 90)
    print("FINAL RESULT")
    print("=" * 90)

    print(
        f"Passed: {passed}/{total}"
    )
    print(
        f"Failed: {failed}/{total}"
    )

    if failed_tests:
        print()
        print("FAILED TESTS")

        for test_name in failed_tests:
            print(
                f"- {test_name}"
            )

    print()

    if passed == total:
        print(
            "AI ASSISTANT CORE VALIDATION: PASS"
        )

    else:
        print(
            "AI ASSISTANT CORE VALIDATION: FAIL"
        )


if __name__ == "__main__":
    main()