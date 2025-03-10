from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str = "secret"
    verification_token_expire_minutes: int = 120
    access_token_expire_minutes: int = 120
    refresh_token_expire_minutes: int = 10080
    max_page_size: int = 10

    pg_db_host: str
    pg_db_port: int = 5432
    pg_db_name: str
    pg_db_user: str
    pg_db_password: str

    model_config = SettingsConfigDict(env_file=".env")

@lru_cache
def get_settings() -> Settings:
    # NOTE: ignore LSP error
    return Settings()
