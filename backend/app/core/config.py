
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "QA-Assistant API"
    API_V1_STR: str = "/api"
    
    # LLM Provider: "custom"
    LLM_PROVIDER: str = "custom"

    # Custom/Kaspersky API configuration
    CUSTOM_API_KEY: str = "mock-key-replace-with-your-real-key"
    CUSTOM_BASE_URL: str = "https://llm.kaspersky-labs.com/v1/"
    CUSTOM_MODEL: str = "llama-3.3-70B-instruct"
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS configuration
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        raise ValueError(v)
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
