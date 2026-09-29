from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    CALLMISSED_API_KEY: str = Field(default="", description="CallMissed cm_ API key")
    CALLMISSED_BASE_URL: str = Field(default="https://api.callmissed.com", description="CallMissed base URL")
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    ALLOWED_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
        description="Comma-separated allowed CORS origins"
    )
    CALLMISSED_MOCK_MODE: bool = Field(
        default=False,
        description="If True or if API key is empty, use mock service for local development/testing"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if self.ALLOWED_ORIGINS.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def is_mock_enabled(self) -> bool:
        return self.CALLMISSED_MOCK_MODE or not bool(self.CALLMISSED_API_KEY and self.CALLMISSED_API_KEY.strip())


settings = Settings()
