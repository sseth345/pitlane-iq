"""
PitLane IQ — Configuration
Centralized settings loaded from environment variables.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
_project_root = Path(__file__).parent.parent
load_dotenv(_project_root / ".env")


class Settings:
    """Application settings from environment."""

    # LLM
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "groq")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    GRANITE_MODEL: str = os.getenv("GRANITE_MODEL", "ibm-granite/granite-4.1-8b")

    # Langflow
    LANGFLOW_URL: str = os.getenv("LANGFLOW_URL", "http://localhost:7860")
    LANGFLOW_FLOW_ID: str = os.getenv("LANGFLOW_FLOW_ID", "")

    # Database
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./data/pitlane.db")

    # FastF1
    FASTF1_CACHE: str = os.getenv("FASTF1_CACHE", "./data/cache")

    # Server
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

    @property
    def database_abs_path(self) -> Path:
        p = Path(self.DATABASE_PATH)
        if not p.is_absolute():
            p = _project_root / p
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def fastf1_cache_abs_path(self) -> Path:
        p = Path(self.FASTF1_CACHE)
        if not p.is_absolute():
            p = _project_root / p
        p.mkdir(parents=True, exist_ok=True)
        return p


settings = Settings()
