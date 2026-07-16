#!/usr/bin/env bash
# Runs the Vite dev server for the patron PWA and staff view.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/frontend"
exec npm run dev
