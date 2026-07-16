#!/usr/bin/env bash
# Creates the backend virtualenv, installs dependencies, and applies migrations.
# Run once per machine (or after pulling a change to requirements.txt / migrations).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$ROOT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtualenv at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

echo "Installing backend dependencies"
"$VENV_DIR/bin/pip" install -q --upgrade pip
"$VENV_DIR/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "Creating backend/.env from .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "  -> add your ANTHROPIC_API_KEY to backend/.env before using the AI concierge"
fi

echo "Applying migrations"
(cd "$BACKEND_DIR" && "$VENV_DIR/bin/python" manage.py migrate)

echo "Backend setup complete. Run scripts/seed.sh to load the demo menu."
