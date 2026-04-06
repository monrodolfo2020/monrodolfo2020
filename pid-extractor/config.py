import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise ValueError(
        "ANTHROPIC_API_KEY environment variable is not set. "
        "Please copy .env.example to .env and provide your API key."
    )

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-5")

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

PDF_DPI = int(os.getenv("PDF_DPI", "300"))

MAX_IMAGE_LONG_EDGE = int(os.getenv("MAX_IMAGE_LONG_EDGE", "2048"))

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./data/uploads")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "./data/outputs")

PORT = int(os.getenv("PORT", "8080"))
