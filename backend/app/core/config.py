import os
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
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
