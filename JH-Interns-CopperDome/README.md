# JH-Interns-CopperDome

This repository provides scaffolding for the Copper Dome Concierge project, including separate frontend, backend, database, documentation, and scripting directories.

## Structure

- `frontend/` - React Progressive Web App (PWA) front end.
- `backend/` - Django REST API and WebSocket backend.
- `database/` - SQL schema reference and seed data.
- `docs/` - Architecture, deployment, and API documentation.
- `scripts/` - Development, build, and deployment utilities.

## Getting Started

Each package is organized independently. Clone the repository and open the workspace in your editor.

For instructions, start with the README files in `frontend/` and `backend/`.

## Local Development with Docker

This scaffold also includes a workspace-level `docker-compose.yml` for quick local startup.

1. From the `JH-Interns-CopperDome` root:
   ```bash
   docker compose up --build
   ```

2. After startup, open:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/status/`

3. To stop and remove containers:
   ```bash
   docker compose down
   ```

## Notes

- The backend service uses PostgreSQL and depends on `db`.
- The frontend service mounts `frontend/` so local code changes are reflected immediately.
