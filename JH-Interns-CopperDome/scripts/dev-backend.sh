#!/usr/bin/env bash
# Runs the Django dev server (daphne-backed via `runserver`, so WebSockets work).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PY="$ROOT_DIR/.venv/bin/python"

if [ ! -x "$VENV_PY" ]; then
  echo "No virtualenv found at .venv — run scripts/setup-backend.sh first." >&2
  exit 1
fi

cd "$ROOT_DIR/backend"
exec "$VENV_PY" manage.py runserver
