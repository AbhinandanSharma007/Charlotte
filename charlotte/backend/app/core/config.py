from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "CHARLOTTE"
    version: str = "1.0.0"
    description: str = "AI-Powered Predictive Smart Grid Intelligence Platform"

    postgres_db: str = "charlotte"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    redis_host: str = "redis"
    redis_port: int = 6379

    mqtt_host: str = "mqtt"
    mqtt_port: int = 1883

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
