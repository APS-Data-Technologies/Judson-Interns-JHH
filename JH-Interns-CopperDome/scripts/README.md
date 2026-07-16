# Scripts - JH-Interns-CopperDome

Helper scripts for local development. All are run from anywhere (they resolve paths relative
to the repo root) and are safe to re-run.

## First-time setup

```bash
./scripts/setup-backend.sh   # creates .venv, installs deps, copies .env.example, runs migrations
./scripts/setup-frontend.sh  # npm install
./scripts/seed.sh            # loads the demo venue, kitchens, and menu (idempotent)
```

Add your `ANTHROPIC_API_KEY` to `backend/.env` after setup to enable the AI concierge.

## Day to day

```bash
./scripts/dev-backend.sh     # Django dev server on :8000 (daphne-backed, serves WebSockets)
./scripts/dev-frontend.sh    # Vite dev server on :3000
./scripts/test.sh            # backend (Django) + frontend (Vitest) test suites
```

Run `dev-backend.sh` and `dev-frontend.sh` in separate terminals, or use the root
`docker compose up --build` instead — see the root `README.md`.

## Notes

Keep scripts small and focused, `set -euo pipefail`, and resolve paths from `${BASH_SOURCE[0]}`
rather than assuming a working directory.
