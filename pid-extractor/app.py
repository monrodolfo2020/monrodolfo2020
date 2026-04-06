import logging
import os
import sys

# Ensure the project root is on the Python path so all local packages resolve.
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS

import config
from handlers.pid_handler import pid_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="web/templates",
        static_folder="web/static",
        static_url_path="/static",
    )

    CORS(app)

    # Register blueprint
    app.register_blueprint(pid_bp)

    # Serve index.html at root
    @app.route("/")
    def index():
        return send_from_directory("web/templates", "index.html")

    # Ensure data directories exist
    os.makedirs(config.UPLOAD_DIR, exist_ok=True)
    os.makedirs(config.OUTPUT_DIR, exist_ok=True)

    return app


def _print_startup_info(port: int) -> None:
    print("\n" + "=" * 60)
    print("  PID Extractor — starting up")
    print("=" * 60)
    print(f"  Base URL : http://0.0.0.0:{port}")
    print(f"  Endpoints:")
    print(f"    GET  /                         → Web UI")
    print(f"    POST /api/pid/upload           → Upload & extract")
    print(f"    GET  /api/pid/download/<id>    → Download Excel report")
    print(f"    GET  /api/pid/health           → Health check")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    app = create_app()
    _print_startup_info(config.PORT)
    app.run(host="0.0.0.0", port=config.PORT, debug=False)
