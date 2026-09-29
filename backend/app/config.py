from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Charlotte Smart Grid API"
    app_version: str = "0.1.0"
    debug: bool = True

    database_url: str = "sqlite+aiosqlite:///./charlotte.db"
    redis_url: str = "redis://localhost:6379/0"
    mqtt_broker: str = "mqtt://localhost:1883"

    secret_key: str = "charlotte-dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    kumo_nim_url: str = "http://127.0.0.1:8001"
    kumo_nim_timeout_seconds: float = 60.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
