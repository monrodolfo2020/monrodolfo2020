import logging
import traceback

logger = logging.getLogger(__name__)


def format_error(exc: Exception, context: str = "") -> str:
    """Return a user-friendly error message string.

    Logs the full traceback at ERROR level while returning a concise message
    suitable for API responses or Excel log cells.
    """
    tb = traceback.format_exc()
    prefix = f"[{context}] " if context else ""
    logger.error("%s%s\n%s", prefix, exc, tb)
    return f"{prefix}{type(exc).__name__}: {exc}"
