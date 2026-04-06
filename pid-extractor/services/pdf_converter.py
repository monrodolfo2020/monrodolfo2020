import logging
from typing import List

from pdf2image import convert_from_path
from pdf2image.exceptions import PDFPageCountError
from PIL import Image

logger = logging.getLogger(__name__)


def convert_pdf_to_images(pdf_path: str, dpi: int) -> List[Image.Image]:
    """Convert a PDF file to a list of PIL Images (one per page).

    Args:
        pdf_path: Absolute or relative path to the PDF file.
        dpi: Rendering resolution (dots per inch).

    Returns:
        List of PIL Image objects, one per page.

    Raises:
        ValueError: If the PDF is password-protected or cannot be read.
    """
    try:
        images = convert_from_path(pdf_path, dpi=dpi)
        logger.info("Converted PDF '%s' → %d page(s) at %d DPI", pdf_path, len(images), dpi)
        return images
    except PDFPageCountError as exc:
        raise ValueError(
            "This PDF is password-protected. Please provide an unencrypted PDF."
        ) from exc
    except Exception as exc:
        raise ValueError(
            "The uploaded file could not be read as a PDF."
        ) from exc
