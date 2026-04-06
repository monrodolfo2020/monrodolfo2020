import logging
import os
import uuid
from pathlib import Path

import anthropic
from flask import Blueprint, jsonify, request, send_file

import config
from models.instrument import ExtractionResult
from services.ai_extractor import ExtractionError, extract_instruments_from_page_with_backoff
from services.excel_exporter import export_to_excel
from services.instrument_parser import deduplicate_instruments, enrich_instrument
from services.pdf_converter import convert_pdf_to_images
from utils.error_utils import format_error
from utils.image_utils import prepare_image_for_api, split_image_into_quadrants

logger = logging.getLogger(__name__)

pid_bp = Blueprint("pid", __name__, url_prefix="/api/pid")

# In-memory job store: job_id → absolute xlsx path
job_store: dict[str, str] = {}

# One shared Anthropic client (re-used across requests)
_anthropic_client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


# ---------------------------------------------------------------------------
# POST /api/pid/upload
# ---------------------------------------------------------------------------
@pid_bp.route("/upload", methods=["POST"])
def upload():
    # --- Validate presence ---
    if "pid_file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded. Use field name 'pid_file'."}), 400

    file = request.files["pid_file"]

    if not file.filename:
        return jsonify({"success": False, "error": "No file selected."}), 400

    # --- Validate extension ---
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "Only PDF files are accepted."}), 400

    # --- Validate size ---
    file.seek(0, 2)  # Seek to end
    file_size = file.tell()
    file.seek(0)     # Reset
    if file_size > config.MAX_FILE_SIZE_BYTES:
        return jsonify({
            "success": False,
            "error": f"File exceeds the {config.MAX_FILE_SIZE_MB} MB limit.",
        }), 413

    # --- Save upload ---
    job_id = str(uuid.uuid4())
    safe_name = Path(file.filename).name
    saved_filename = f"{job_id}_{safe_name}"
    upload_path = os.path.join(config.UPLOAD_DIR, saved_filename)

    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)

    file.save(upload_path)
    logger.info("Saved upload to '%s'", upload_path)

    # --- Run pipeline ---
    result = ExtractionResult(
        job_id=job_id,
        source_pdf=safe_name,
        total_pages=0,
    )

    try:
        images = convert_pdf_to_images(upload_path, dpi=config.PDF_DPI)
    except ValueError as exc:
        return jsonify({"success": False, "error": str(exc)}), 422

    result.total_pages = len(images)

    all_instruments = []

    for page_number, image in enumerate(images, start=1):
        try:
            image_b64 = prepare_image_for_api(image, config.MAX_IMAGE_LONG_EDGE)
            raw_instruments, _ = extract_instruments_from_page_with_backoff(
                image_b64=image_b64,
                page_number=page_number,
                source_pdf=safe_name,
                client=_anthropic_client,
                model=config.CLAUDE_MODEL,
            )
            for raw in raw_instruments:
                instrument = enrich_instrument(raw, page_number, safe_name)
                all_instruments.append(instrument)

        except ExtractionError as exc:
            err_msg = f"Page {page_number}: {exc}"
            logger.error(err_msg)
            result.errors.append(err_msg)
        except Exception as exc:
            err_msg = format_error(exc, context=f"Page {page_number}")
            result.errors.append(err_msg)

    # Deduplicate across pages
    result.instruments = deduplicate_instruments(all_instruments)

    if not result.instruments:
        result.warnings.append("No instruments were found in any page of this P&ID.")

    # Export to Excel
    xlsx_filename = f"pid_extraction_{job_id}.xlsx"
    xlsx_path = os.path.join(config.OUTPUT_DIR, xlsx_filename)
    try:
        export_to_excel(result, xlsx_path)
        result.xlsx_path = xlsx_path
        job_store[job_id] = xlsx_path
    except Exception as exc:
        err_msg = format_error(exc, context="Excel export")
        return jsonify({"success": False, "error": f"Failed to generate Excel report: {err_msg}"}), 500

    # Build summary response
    pid_numbers = sorted({
        inst.pid_number for inst in result.instruments if inst.pid_number
    })
    system_titles = sorted({
        inst.system_title for inst in result.instruments if inst.system_title
    })
    low_conf_count = sum(1 for i in result.instruments if i.confidence == "low")

    return jsonify({
        "success": True,
        "job_id": job_id,
        "download_url": f"/api/pid/download/{job_id}",
        "summary": {
            "total_instruments": len(result.instruments),
            "total_pages": result.total_pages,
            "pid_numbers": pid_numbers,
            "system_titles": system_titles,
            "low_confidence_count": low_conf_count,
            "warnings": result.warnings,
            "errors": result.errors,
        },
    })


# ---------------------------------------------------------------------------
# GET /api/pid/download/<job_id>
# ---------------------------------------------------------------------------
@pid_bp.route("/download/<job_id>", methods=["GET"])
def download(job_id: str):
    xlsx_path = job_store.get(job_id)
    if not xlsx_path or not os.path.isfile(xlsx_path):
        return jsonify({"success": False, "error": "Report not found. It may have expired."}), 404

    return send_file(
        xlsx_path,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=f"pid_extraction_{job_id}.xlsx",
    )


# ---------------------------------------------------------------------------
# GET /api/health
# ---------------------------------------------------------------------------
@pid_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "pid-extractor"})
