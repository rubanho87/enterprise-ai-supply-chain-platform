import json
from typing import Any

import requests

from app.core.config import settings


class OllamaError(RuntimeError):
    """Raised when the local Ollama service cannot complete a request."""


def _generate_url() -> str:
    return f"{settings.ollama_base_url.rstrip('/')}/api/generate"


def check_ollama() -> dict[str, Any]:
    """
    Check whether the configured Ollama server is reachable.
    """

    url = f"{settings.ollama_base_url.rstrip('/')}/api/tags"

    try:
        response = requests.get(
            url,
            timeout=settings.ollama_timeout,
        )
        response.raise_for_status()

        payload = response.json()

        models = [
            item.get("name")
            for item in payload.get("models", [])
            if item.get("name")
        ]

        return {
            "status": "healthy",
            "base_url": settings.ollama_base_url,
            "configured_model": settings.ollama_model,
            "configured_model_available": settings.ollama_model in models,
            "models": models,
        }

    except requests.RequestException as exc:
        raise OllamaError(
            f"Unable to connect to Ollama at "
            f"{settings.ollama_base_url}: {exc}"
        ) from exc


def generate_text(
    prompt: str,
    *,
    system_prompt: str | None = None,
    temperature: float = 0.1,
) -> str:
    """
    Generate a text response using the configured local Ollama model.
    """

    if not prompt or not prompt.strip():
        raise ValueError("Prompt cannot be empty.")

    payload: dict[str, Any] = {
        "model": settings.ollama_model,
        "prompt": prompt.strip(),
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }

    if system_prompt:
        payload["system"] = system_prompt.strip()

    try:
        response = requests.post(
            _generate_url(),
            json=payload,
            timeout=settings.ollama_timeout,
        )
        response.raise_for_status()

        data = response.json()

    except requests.RequestException as exc:
        raise OllamaError(
            f"Ollama generation request failed: {exc}"
        ) from exc

    except ValueError as exc:
        raise OllamaError(
            "Ollama returned an invalid JSON response."
        ) from exc

    generated_text = data.get("response")

    if not generated_text:
        raise OllamaError(
            "Ollama returned an empty generation response."
        )

    return generated_text.strip()


def generate_json(
    prompt: str,
    *,
    system_prompt: str | None = None,
    temperature: float = 0.0,
) -> dict[str, Any]:
    """
    Ask Ollama to generate a JSON object and return it as a Python dict.
    """

    payload: dict[str, Any] = {
        "model": settings.ollama_model,
        "prompt": prompt.strip(),
        "stream": False,
        "format": "json",
        "options": {
            "temperature": temperature,
        },
    }

    if system_prompt:
        payload["system"] = system_prompt.strip()

    try:
        response = requests.post(
            _generate_url(),
            json=payload,
            timeout=settings.ollama_timeout,
        )
        response.raise_for_status()

        data = response.json()
        generated_text = data.get("response")

        if not generated_text:
            raise OllamaError(
                "Ollama returned an empty JSON generation response."
            )

        parsed = json.loads(generated_text)

        if not isinstance(parsed, dict):
            raise OllamaError(
                "Ollama JSON response is not an object."
            )

        return parsed

    except requests.RequestException as exc:
        raise OllamaError(
            f"Ollama JSON generation request failed: {exc}"
        ) from exc

    except json.JSONDecodeError as exc:
        raise OllamaError(
            f"Ollama returned malformed JSON: {exc}"
        ) from exc