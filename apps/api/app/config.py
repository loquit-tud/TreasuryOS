"""Centralised, validated configuration (fail fast at import / app startup)."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "production", "test"] = Field(
        default="development",
        validation_alias="APP_ENV",
    )
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/treasuryos",
        validation_alias="DATABASE_URL",
    )
    cors_allow_origins: str = Field(
        default="*",
        validation_alias="CORS_ALLOW_ORIGINS",
        description="Comma-separated origins, or * in development/test only.",
    )
    cors_allow_credentials: bool = Field(
        default=False,
        validation_alias="CORS_ALLOW_CREDENTIALS",
    )
    auto_create_schema: bool | None = Field(
        default=None,
        validation_alias="AUTO_CREATE_SCHEMA",
        description="Override schema bootstrap. If unset: auto-create only in development/test.",
    )
    redis_url: str | None = Field(
        default=None,
        validation_alias="REDIS_URL",
        description="Redis URL for decision event stream (optional). e.g. redis://localhost:6379/0",
    )
    api_keys: str | None = Field(
        default=None,
        validation_alias="API_KEYS",
        description="Comma-separated API keys. If set, requests must include X-API-Key. Recommended in production.",
    )
    allow_public_api_in_production: bool = Field(
        default=False,
        validation_alias="ALLOW_PUBLIC_API_IN_PROD",
        description="If true, production allows unauthenticated requests even when API_KEYS is unset.",
    )
    expose_db_error_detail: bool = Field(
        default=False,
        validation_alias="EXPOSE_DB_ERROR_DETAIL",
        description="If true, SQL error fragments may be returned in 503 responses (debug only).",
    )

    @field_validator("database_url", mode="after")
    @classmethod
    def normalize_postgres_driver(cls, url: str) -> str:
        if url.startswith("postgresql://") and "+psycopg" not in url:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    def _parsed_origins(self) -> list[str]:
        raw = self.cors_allow_origins.strip()
        if self.app_env == "production":
            if not raw or raw == "*":
                return []
            return [part.strip() for part in raw.split(",") if part.strip()]
        if not raw or raw == "*":
            return ["*"]
        return [part.strip() for part in raw.split(",") if part.strip()]

    @model_validator(mode="after")
    def validate_cors(self) -> "Settings":
        origins = self._parsed_origins()
        if self.app_env == "production" and not origins:
            raise ValueError(
                "APP_ENV=production requires explicit CORS_ALLOW_ORIGINS "
                "(comma-separated list, no wildcard)."
            )
        if self.app_env == "production" and not self.allow_public_api_in_production:
            keys = (self.api_keys or "").strip()
            if not keys:
                raise ValueError(
                    "APP_ENV=production requires API_KEYS (comma-separated) "
                    "or explicitly set ALLOW_PUBLIC_API_IN_PROD=true."
                )
        if self.cors_allow_credentials and "*" in origins:
            raise ValueError(
                "CORS_ALLOW_CREDENTIALS=true is incompatible with wildcard origins; "
                "set explicit CORS_ALLOW_ORIGINS."
            )
        return self

    @property
    def api_key_set(self) -> set[str]:
        raw = (self.api_keys or "").strip()
        if not raw:
            return set()
        return {part.strip() for part in raw.split(",") if part.strip()}

    @property
    def cors_origins_list(self) -> list[str]:
        return self._parsed_origins()

    @property
    def should_auto_create_schema(self) -> bool:
        if self.auto_create_schema is not None:
            return self.auto_create_schema
        return self.app_env in ("development", "test")


@lru_cache
def get_settings() -> Settings:
    return Settings()
