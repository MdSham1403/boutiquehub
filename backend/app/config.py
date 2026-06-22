"""
Centralized application configuration.
Reads from environment variables / .env file via pydantic-settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "BoutiqueHub"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Telegram
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    # WhatsApp
    SELLER_WHATSAPP_NUMBER: str = ""

    # Inventory
    LOW_STOCK_THRESHOLD: int = 5

    # Admin seed account
    ADMIN_DEFAULT_EMAIL: str = "admin@boutiquehub.com"
    ADMIN_DEFAULT_PASSWORD: str = "changeme123"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:5174,https://boutiquehub.vercel.app,https://admin-boutiquehub.vercel.app"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
