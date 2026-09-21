from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # -------------------------------------------------------------------------
    # Application
    # -------------------------------------------------------------------------
    app_name: str = "Enterprise AI Supply Chain Platform"
    app_env: str = "development"
    api_v1_prefix: str = "/api/v1"

    # -------------------------------------------------------------------------
    # Databricks
    # -------------------------------------------------------------------------
    databricks_server_hostname: str
    databricks_http_path: str
    databricks_access_token: str

    databricks_catalog: str = "supply_chain"
    databricks_schema: str = "serving"

    # -------------------------------------------------------------------------
    # Ollama / Local LLM
    # -------------------------------------------------------------------------
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"
    ollama_timeout: int = 120

    # -------------------------------------------------------------------------
    # Pydantic Settings
    # -------------------------------------------------------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()