"""
Configuration settings for the Image Compression Lab backend
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings using environment variables"""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # App settings
    app_name: str = "Interactive Image Compression Lab"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000

    # File upload settings
    max_upload_size: int = 500 * 1024 * 1024  # 500 MB
    allowed_extensions: list = ["jpg", "jpeg", "jfif", "png", "bmp", "webp", "gif", "tif", "tiff"]

    # Storage settings
    upload_dir: Path = Path(__file__).parent / "storage" / "uploads"
    compressed_dir: Path = Path(__file__).parent / "storage" / "compressed"

    # CORS: local dev origins always allowed; set FRONTEND_URL in the
    # deployment environment (e.g. Render) to the deployed frontend origin,
    # e.g. FRONTEND_URL=https://your-app.vercel.app
    frontend_url: str = ""
    cors_origins: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
    ]

    @property
    def allowed_origins(self) -> list:
        origins = list(self.cors_origins)
        if self.frontend_url:
            origins.append(self.frontend_url.rstrip("/"))
        return origins


settings = Settings()

# Ensure storage directories exist
settings.upload_dir.mkdir(parents=True, exist_ok=True)
settings.compressed_dir.mkdir(parents=True, exist_ok=True)
