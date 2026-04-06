import logging
from typing import List

import fitz  # PyMuPDF — no poppler dependency
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
        doc = fitz.open(pdf_path)
        if doc.needs_pass:
            raise ValueError(
                "This PDF is password-protected. Please provide an unencrypted PDF."
            )
        zoom = dpi / 72.0  # fitz default is 72 DPI
        mat = fitz.Matrix(zoom, zoom)
        images: List[Image.Image] = []
        for page in doc:
            pix = page.get_pixmap(matrix=mat, alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
        doc.close()
        logger.info("Converted PDF '%s' → %d page(s) at %d DPI", pdf_path, len(images), dpi)
        return images
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError(
            "The uploaded file could not be read as a PDF."
        ) from exc
