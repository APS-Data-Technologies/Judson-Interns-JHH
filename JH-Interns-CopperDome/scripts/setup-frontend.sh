#!/usr/bin/env bash
# Installs frontend dependencies. Run once per machine (or after pulling a change to package.json).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

(cd "$ROOT_DIR/frontend" && npm install)

echo "Frontend setup complete. Run scripts/dev-frontend.sh to start the Vite dev server."
