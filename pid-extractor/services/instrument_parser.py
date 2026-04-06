import logging
from typing import List

from models.instrument import Instrument, MEASURED_VARIABLE_MAP

logger = logging.getLogger(__name__)

_CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1}


def enrich_instrument(raw: dict, page_number: int, source_pdf: str) -> Instrument:
    """Create an enriched Instrument from a raw AI-response dict.

    Parses the ISA tag to derive function_letters, loop_number and
    measured_variable.  All other fields are taken directly from *raw*.
    """
    tag = (raw.get("tag") or "").strip()

    # Parse function_letters and loop_number from the tag
    if "-" in tag:
        parts = tag.split("-", 1)
        function_letters = parts[0].upper()
        loop_number = parts[1]
    else:
        function_letters = tag.upper()
        loop_number = None

    # Derive measured variable from the first letter of the function letters
    first_letter = function_letters[0] if function_letters else ""
    measured_variable = MEASURED_VARIABLE_MAP.get(first_letter, "Unknown")

    confidence_raw = raw.get("confidence", "high")
    if confidence_raw not in ("high", "medium", "low"):
        confidence_raw = "low"

    return Instrument(
        tag=tag,
        line_pipe=raw.get("line_pipe"),
        pid_number=raw.get("pid_number"),
        system_title=raw.get("system_title"),
        measured_variable=measured_variable,
        function_letters=function_letters,
        loop_number=loop_number,
        confidence=confidence_raw,
        notes=raw.get("notes"),
        page_number=page_number,
        source_pdf=source_pdf,
    )


def deduplicate_instruments(instruments: List[Instrument]) -> List[Instrument]:
    """Remove duplicate instruments, keeping the highest-confidence occurrence.

    Two instruments are duplicates if they share the same *tag* AND
    *pid_number*.  When confidence is equal the one from the lower page
    number is kept.  A note is appended to the kept instrument for each
    duplicate page.
    """
    # key → best Instrument
    best: dict[tuple, Instrument] = {}
    # key → list of duplicate page numbers (for note appending)
    dup_pages: dict[tuple, list[int]] = {}

    for inst in instruments:
        key = (inst.tag.upper(), (inst.pid_number or "").upper())
        if key not in best:
            best[key] = inst
            dup_pages[key] = []
        else:
            existing = best[key]
            existing_rank = _CONFIDENCE_RANK[existing.confidence]
            new_rank = _CONFIDENCE_RANK[inst.confidence]

            if new_rank > existing_rank or (
                new_rank == existing_rank and inst.page_number < existing.page_number
            ):
                # New one wins — record existing page as a duplicate
                dup_pages[key].append(existing.page_number)
                best[key] = inst
            else:
                # Existing wins — record new page as a duplicate
                dup_pages[key].append(inst.page_number)

    # Append duplicate-page notes
    result: List[Instrument] = []
    for key, inst in best.items():
        pages = dup_pages.get(key, [])
        if pages:
            dup_note = "; ".join(f"Also found on page {p}" for p in sorted(pages))
            if inst.notes:
                inst.notes = f"{inst.notes}; {dup_note}"
            else:
                inst.notes = dup_note
        result.append(inst)

    logger.info(
        "Deduplication: %d → %d instruments", len(instruments), len(result)
    )
    return result
