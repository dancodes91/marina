from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Render and other hosts often provide postgresql:// without asyncpg driver."""
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if "render.com" in url and "ssl=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}ssl=require"
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = Field(
        default="postgresql+asyncpg://marina:marina@localhost:5432/marina_portal",
        alias="DATABASE_URL",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        return normalize_database_url(value)
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    jwt_secret_key: str = Field(default="change-me", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(default=14, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    public_app_url: str = Field(default="http://localhost:3000", alias="PUBLIC_APP_URL")
    api_public_url: str = Field(default="http://localhost:8000", alias="API_PUBLIC_URL")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    sendgrid_api_key: str = Field(default="", alias="SENDGRID_API_KEY")
    sendgrid_from_email: str = Field(default="noreply@example.com", alias="SENDGRID_FROM_EMAIL")
    manager_alert_emails: str = Field(default="", alias="MANAGER_ALERT_EMAILS")

    twilio_account_sid: str = Field(default="", alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="", alias="TWILIO_AUTH_TOKEN")
    twilio_messaging_service_sid: str = Field(default="", alias="TWILIO_MESSAGING_SERVICE_SID")

    s3_endpoint_url: str = Field(default="http://localhost:9000", alias="S3_ENDPOINT_URL")
    s3_access_key: str = Field(default="minioadmin", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field(default="minioadmin", alias="S3_SECRET_KEY")
    s3_bucket: str = Field(default="marina-portal", alias="S3_BUCKET")
    s3_region: str = Field(default="us-east-1", alias="S3_REGION")
    s3_use_ssl: bool = Field(default=False, alias="S3_USE_SSL")

    wallace_export_dir: str = Field(default="/data/wallace_exports", alias="WALLACE_EXPORT_DIR")
    wallace_sync_interval_seconds: int = Field(default=900, alias="WALLACE_SYNC_INTERVAL_SECONDS")
    wallace_upload_api_key: str = Field(default="", alias="WALLACE_UPLOAD_API_KEY")
    bootstrap_api_key: str = Field(default="", alias="BOOTSTRAP_API_KEY")
    default_marina_slug: str = Field(default="your-dealership-name", alias="DEFAULT_MARINA_SLUG")
    default_marina_name: str = Field(default="Your Dealership Name", alias="DEFAULT_MARINA_NAME")
    default_marina_contact_email: str = Field(
        default="service@example.com", alias="DEFAULT_MARINA_CONTACT_EMAIL"
    )
    default_marina_contact_phone: str = Field(
        default="(410) 555-0100", alias="DEFAULT_MARINA_CONTACT_PHONE"
    )
    gravity_stub_mode: bool = Field(default=True, alias="GRAVITY_STUB_MODE")
    gravity_webhook_secret: str = Field(default="change-me-webhook", alias="GRAVITY_WEBHOOK_SECRET")

    @property
    def database_url_sync(self) -> str:
        u = self.database_url
        if "+asyncpg" in u:
            return u.replace("postgresql+asyncpg://", "postgresql://")
        return u

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
