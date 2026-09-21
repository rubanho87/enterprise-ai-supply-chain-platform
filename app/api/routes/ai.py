from typing import Any

from fastapi import APIRouter, HTTPException, status

from app.schemas.ai import (
    AIQuestionRequest,
    AIQuestionResponse,
)
from app.services.ai_assistant import ask_supply_chain_ai
from app.services.ai_decision import generate_supply_chain_decision


router = APIRouter(
    prefix="/ai",
    tags=["AI Decision Intelligence"],
)


@router.get(
    "/decision",
    status_code=status.HTTP_200_OK,
    summary="Generate AI Supply Chain Decision",
    description=(
        "Generate an AI-assisted supply-chain management decision "
        "using the current Databricks serving-layer operational "
        "context and the configured local AI model."
    ),
)
def get_ai_decision() -> dict[str, Any]:
    """
    Generate an AI-assisted supply-chain management decision.

    Processing pipeline:
    1. Read the current Databricks serving-layer context.
    2. Build the operational decision context.
    3. Send the grounded context to the configured AI model.
    4. Return the generated management decision.

    This endpoint is intended for automatic management-level
    decision generation without requiring a user question.
    """
    try:
        result = generate_supply_chain_decision()

        if not isinstance(result, dict):
            raise RuntimeError(
                "AI decision service returned an invalid response."
            )

        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to generate AI supply-chain "
                f"decision: {exc}"
            ),
        ) from exc


@router.post(
    "/ask",
    response_model=AIQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Supply Chain AI Assistant",
    description=(
        "Ask a natural-language question about current "
        "supply-chain operations. The assistant detects the "
        "business intent and response language, selects the "
        "relevant Databricks operational context, grounds the "
        "request in factual supply-chain data, queries the "
        "configured local AI model, and returns a structured "
        "response suitable for frontend applications."
    ),
    response_description=(
        "Structured grounded AI response containing the answer, "
        "detected intent, language, context sections, engine "
        "information, and frontend-oriented metadata."
    ),
)
def ask_ai_assistant(
    request: AIQuestionRequest,
) -> AIQuestionResponse:
    """
    Ask a natural-language supply-chain question.

    Processing pipeline:
    1. Validate the incoming question.
    2. Normalize the question.
    3. Detect the business intent.
    4. Detect the required response language.
    5. Build the current Databricks decision context.
    6. Select the operational context relevant to the intent.
    7. Ground the answer in factual serving-layer information.
    8. Generate the answer using the configured local AI model.
    9. Return a structured response with frontend metadata.
    """
    try:
        result = ask_supply_chain_ai(
            request.question,
        )

        if not isinstance(result, dict):
            raise RuntimeError(
                "AI assistant service returned an invalid response."
            )

        return AIQuestionResponse.model_validate(
            result,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to answer supply-chain "
                f"question: {exc}"
            ),
        ) from exc