# Backend - JH-Interns-CopperDome

Django REST + Channels backend for Copper Dome Concierge.

## Apps

- `menu` — `Venue`, `Kitchen`, `MenuItem`, `EventLog`, and the `/menu/analytics/` engagement
  dashboard endpoint.
- `concierge` — `ServiceRequest`, the server-side Claude proxy (`/concierge/ask/`), and the
  `ws/staff/` real-time consumer for the staff floor view.

Full endpoint reference: [`../docs/api.md`](../docs/api.md). Architecture overview:
[`../docs/architecture.md`](../docs/architecture.md).

## Local Development

1. Create a virtualenv and install dependencies:
   ```bash
   cd backend
   python3 -m venv ../.venv && ../.venv/bin/pip install -r requirements.txt
   ```
   (or run `../scripts/setup-backend.sh` from the repo root, which does this plus the steps
   below)

2. Copy the example environment file and add your Anthropic key:
   ```bash
   cp .env.example .env
   # edit .env: ANTHROPIC_API_KEY=sk-ant-...
   ```
   Local dev defaults to SQLite (`DB_ENGINE=sqlite3` in `.env`); unset it or switch to
   `postgresql` to match `docker-compose.yml` / production.

3. Apply migrations and seed the demo menu:
   ```bash
   python manage.py migrate
   python manage.py seed_menu_data
   ```

4. Run the development server:
   ```bash
   python manage.py runserver
   ```
   `daphne` is first in `INSTALLED_APPS`, so `runserver` serves both HTTP and the
   `ws/staff/` WebSocket — no separate ASGI server needed in dev.

5. Run tests:
   ```bash
   python manage.py test
   ```

## Key Files

- `backend/backend/settings.py` — INSTALLED_APPS, CHANNEL_LAYERS (in-memory for dev), DB config.
- `backend/backend/asgi.py` — `ProtocolTypeRouter` wiring HTTP + the staff WebSocket route.
- `requirements.txt` — Python dependencies.
- `.env.example` — environment configuration template.
