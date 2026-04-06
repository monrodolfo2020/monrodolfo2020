import json
import logging
import time
from typing import Tuple

import anthropic

logger = logging.getLogger(__name__)

_ISA_PROMPT = """\
You are an expert instrumentation engineer analyzing a P&ID (Piping and Instrumentation Diagram) engineering drawing. Your task is to identify and extract every instrument tag visible on this drawing.

BACKGROUND — ISA INSTRUMENT TAG STRUCTURE:
Instrument tags follow ISA-5.1 standard notation:
- Format: [Function Letters]-[Loop Number]  e.g. PT-101, FIC-202, LAHH-305
- First letter (measured variable):
    P = Pressure, T = Temperature, F = Flow, L = Level, A = Analyzer,
    D = Density/Viscosity, E = Voltage/EMF, H = Hand/Manual, I = Current,
    J = Power, K = Time/Schedule, M = Moisture, N = User Defined,
    Q = Quantity/Totalizer, R = Radiation, S = Speed/Frequency/Vibration,
    U = Multivariable, V = Vibration/Viscosity, W = Weight/Force,
    X = Unclassified, Y = Event/State, Z = Position/Safety
- Subsequent letters indicate function:
    I = Indicator, T = Transmitter, C = Controller, V = Valve,
    R = Recorder, E = Element/Sensor, S = Switch, A = Alarm,
    H = High, L = Low, HH = High-High, LL = Low-Low

WHAT TO EXTRACT:
For each instrument tag found, extract:
1. tag: Full instrument tag exactly as written (e.g., "PT-101", "FIC-202", "LAHH-305-A")
2. line_pipe: The pipeline label immediately adjacent to or connected to this instrument.
   Pipe labels look like "3\\"-P-1001-A1A", "6\\"-SS-2002-B2B", "DN100-W-3001".
   If not determinable, use null.
3. pid_number: Drawing number from the title block (bottom right of drawing).
   Often labeled "DWG NO." or "P&ID NO.". Use null if not visible.
4. system_title: System/process title from the title block, labeled "TITLE" or "SERVICE".
   Examples: "GAS MEASUREMENT SYSTEM", "COOLING WATER SYSTEM". Use null if not visible.
5. confidence: "high" if clearly readable, "medium" if partially obscured or ambiguous,
   "low" if mostly guessed.
6. notes: Any adjacent annotation (connection size, spec note). Use null if none.

RULES:
- Extract EVERY instrument tag visible, including at drawing edges.
- Do NOT invent or infer tag numbers — only report what is visually present.
- Instrument bubbles are circles, squares, hexagons, or diamonds containing tag letters and numbers.
- The tag may be split: function letters on top line, loop number on bottom line, inside the bubble.
- Include control valves (FV, PV, TV, LV, HV, XV) as they are part of instrument loops.
- Do not include plain manual valves (gate, globe, ball, butterfly) that have no instrument tag.

OUTPUT:
Respond with ONLY a valid JSON object. No markdown, no explanation, no code fences.

{
  "pid_number": "value or null",
  "system_title": "value or null",
  "instruments": [
    {
      "tag": "PT-101",
      "line_pipe": "3\\"-P-1001-A1A",
      "pid_number": "PID-001",
      "system_title": "GAS MEASUREMENT SYSTEM",
      "confidence": "high",
      "notes": null
    }
  ],
  "extraction_notes": "any notes about drawing quality or extraction challenges"
}

If no instruments are found:
{"pid_number": null, "system_title": null, "instruments": [], "extraction_notes": "reason"}\
"""

_JSON_REMINDER = (
    "IMPORTANT: Your previous response was not valid JSON. "
    "You MUST respond with ONLY a raw JSON object, nothing else.\n\n"
)


class ExtractionError(Exception):
    """Raised when the AI fails to return parseable JSON after all retries."""


def _call_api(
    image_b64: str,
    text_prompt: str,
    client: anthropic.Anthropic,
    model: str,
) -> str:
    """Make a single Claude Vision API call and return the raw response text."""
    response = client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": text_prompt,
                    },
                ],
            }
        ],
    )
    return response.content[0].text


def extract_instruments_from_page(
    image_b64: str,
    page_number: int,
    source_pdf: str,
    client: anthropic.Anthropic,
    model: str,
) -> Tuple[list, str]:
    """Call the Claude Vision API and return (instruments_list, extraction_notes).

    Retries up to 2 times if the response is not valid JSON, and applies
    exponential backoff (2 s / 4 s / 8 s) on RateLimitError.

    Args:
        image_b64:   Base64-encoded JPEG image string.
        page_number: 1-based page index (used only for logging).
        source_pdf:  Original filename (used only for logging).
        client:      Instantiated Anthropic client.
        model:       Claude model identifier string.

    Returns:
        Tuple of (list[dict], str) — raw instrument dicts and extraction notes.

    Raises:
        ExtractionError: If the API never returns parseable JSON.
    """
    text_prompt = _ISA_PROMPT
    last_raw: str = ""
    rate_limit_attempts = 0

    for attempt in range(3):  # up to 3 JSON-parse attempts
        try:
            raw = _call_api(image_b64, text_prompt, client, model)
        except anthropic.RateLimitError as exc:
            rate_limit_attempts += 1
            if rate_limit_attempts > 3:
                raise ExtractionError(
                    f"Rate limit exceeded for page {page_number} of '{source_pdf}' "
                    f"after 3 backoff attempts."
                ) from exc
            wait = 2 ** rate_limit_attempts  # 2, 4, 8 seconds
            logger.warning(
                "Rate limit hit for page %d of '%s'; waiting %ds (attempt %d/3)",
                page_number, source_pdf, wait, rate_limit_attempts,
            )
            time.sleep(wait)
            # Retry the same attempt index
            attempt -= 1  # This won't work directly; use a while loop approach below
            continue

        last_raw = raw

        # Strip markdown fences if Claude wraps the JSON anyway
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            # Remove first and last fence lines
            inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
            cleaned = "\n".join(inner).strip()

        try:
            parsed = json.loads(cleaned)
            instruments = parsed.get("instruments", [])
            extraction_notes = parsed.get("extraction_notes", "")
            logger.info(
                "Page %d of '%s': extracted %d instrument(s)",
                page_number, source_pdf, len(instruments),
            )
            return instruments, extraction_notes
        except json.JSONDecodeError:
            logger.warning(
                "JSON parse failure on attempt %d for page %d of '%s'",
                attempt + 1, page_number, source_pdf,
            )
            # Prepend JSON reminder for next attempt
            text_prompt = _JSON_REMINDER + _ISA_PROMPT

    raise ExtractionError(
        f"Failed to obtain valid JSON from Claude for page {page_number} of "
        f"'{source_pdf}' after 3 attempts. Last response:\n{last_raw}"
    )


def extract_instruments_from_page_with_backoff(
    image_b64: str,
    page_number: int,
    source_pdf: str,
    client: anthropic.Anthropic,
    model: str,
) -> Tuple[list, str]:
    """Wrapper that adds full exponential backoff around RateLimitError.

    This is the function that handlers should call.
    """
    text_prompt = _ISA_PROMPT
    last_raw: str = ""

    def _attempt_with_json_retry() -> Tuple[list, str]:
        nonlocal text_prompt, last_raw
        prompt = text_prompt
        for json_attempt in range(3):
            raw = _call_api(image_b64, prompt, client, model)
            last_raw = raw

            cleaned = raw.strip()
            if cleaned.startswith("```"):
                lines = cleaned.splitlines()
                inner = lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:]
                cleaned = "\n".join(inner).strip()

            try:
                parsed = json.loads(cleaned)
                instruments = parsed.get("instruments", [])
                extraction_notes = parsed.get("extraction_notes", "")
                logger.info(
                    "Page %d of '%s': extracted %d instrument(s)",
                    page_number, source_pdf, len(instruments),
                )
                return instruments, extraction_notes
            except json.JSONDecodeError:
                logger.warning(
                    "JSON parse failure on attempt %d for page %d of '%s'",
                    json_attempt + 1, page_number, source_pdf,
                )
                prompt = _JSON_REMINDER + _ISA_PROMPT

        raise ExtractionError(
            f"Failed to obtain valid JSON from Claude for page {page_number} of "
            f"'{source_pdf}' after 3 attempts. Last response:\n{last_raw}"
        )

    for rate_attempt in range(3):
        try:
            return _attempt_with_json_retry()
        except anthropic.RateLimitError:
            wait = 2 ** (rate_attempt + 1)  # 2, 4, 8 seconds
            logger.warning(
                "Rate limit hit for page %d of '%s'; waiting %ds (attempt %d/3)",
                page_number, source_pdf, wait, rate_attempt + 1,
            )
            time.sleep(wait)

    # Final attempt after backoff
    return _attempt_with_json_retry()
