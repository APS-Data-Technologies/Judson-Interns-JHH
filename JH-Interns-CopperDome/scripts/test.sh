#!/usr/bin/env bash
# Runs the backend (Django) and frontend (Vitest) test suites.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_PY="$ROOT_DIR/.venv/bin/python"

if [ ! -x "$VENV_PY" ]; then
  echo "No virtualenv found at .venv — run scripts/setup-backend.sh first." >&2
  exit 1
fi

echo "== Backend tests =="
(cd "$ROOT_DIR/backend" && "$VENV_PY" manage.py test)

echo
echo "== Frontend tests =="
(cd "$ROOT_DIR/frontend" && npm test)
