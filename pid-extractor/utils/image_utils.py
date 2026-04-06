import base64
import logging
from io import BytesIO

from PIL import Image

logger = logging.getLogger(__name__)

_5MB = 5 * 1024 * 1024


def prepare_image_for_api(image: Image.Image, max_long_edge: int) -> str:
    """Resize, convert and base64-encode a PIL image for the Claude Vision API.

    Ensures the encoded result is under 5 MB by progressively reducing JPEG
    quality. If still too large after quality reductions the image is split
    into four equal quadrants and the one with the most detail (first) is
    returned — callers that need all quadrants should call this function on
    each crop directly.
    """
    # Resize if the longest edge exceeds the limit
    w, h = image.size
    long_edge = max(w, h)
    if long_edge > max_long_edge:
        scale = max_long_edge / long_edge
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = image.resize((new_w, new_h), Image.LANCZOS)
        logger.debug("Resized image from %dx%d to %dx%d", w, h, new_w, new_h)

    # Ensure RGB (handles RGBA, P/palette modes, etc.)
    if image.mode != "RGB":
        image = image.convert("RGB")

    for quality in (90, 75, 60):
        buf = BytesIO()
        image.save(buf, format="JPEG", quality=quality)
        data = buf.getvalue()
        encoded = base64.b64encode(data).decode("utf-8")
        if len(data) <= _5MB:
            return encoded
        logger.warning(
            "Encoded image size %d bytes exceeds 5 MB at quality=%d, reducing quality",
            len(data),
            quality,
        )

    # Still too large — split into 4 quadrants and recursively encode the
    # top-left quadrant (caller is responsible for handling all quadrants when
    # needed via _split_and_encode).
    logger.warning("Image still exceeds 5 MB after quality reduction; cropping to top-left quadrant")
    w, h = image.size
    quadrant = image.crop((0, 0, w // 2, h // 2))
    return prepare_image_for_api(quadrant, max_long_edge)


def split_image_into_quadrants(image: Image.Image) -> list[Image.Image]:
    """Return the four quadrants of an image as a list [TL, TR, BL, BR]."""
    w, h = image.size
    return [
        image.crop((0,     0,     w // 2, h // 2)),  # top-left
        image.crop((w // 2, 0,    w,      h // 2)),  # top-right
        image.crop((0,     h // 2, w // 2, h)),       # bottom-left
        image.crop((w // 2, h // 2, w,    h)),        # bottom-right
    ]
