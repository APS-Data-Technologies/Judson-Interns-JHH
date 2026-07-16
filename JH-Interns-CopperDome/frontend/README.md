# Frontend - JH-Interns-CopperDome

React PWA frontend for Copper Dome Concierge — the patron app and the staff floor view share
this codebase (see `src/app/App.tsx` for the route split).

## Routes

- `/`, `/home`, `/menu`, `/menu/:id`, `/cart`, `/checkout`, `/order-status`, `/concierge` —
  patron flow, gated behind a QR/table session (`src/lib/session.tsx`).
- `/staff`, `/staff/analytics` — staff floor view and trial analytics, no patron session
  required, live-updated over WebSocket (`src/lib/staffSocket.ts`).

## Local Development

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
   (or `../scripts/setup-frontend.sh` from the repo root)

2. Start the dev server (backend must be running on `:8000` — `/api` and `/ws` are proxied
   there, see `vite.config.ts`):
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` for the patron app, `http://localhost:3000/staff` for the
   staff floor view.

4. Type-check + build / run tests:
   ```bash
   npm run build
   npm test
   ```

## Key Directories

- `src/app/` - route/layout structure (`App.tsx`).
- `src/components/` - shared UI components (nav, headers, icons, async states).
- `src/features/<name>/` - one page (or small group) per screen, each with a colocated
  `.test.tsx`.
- `src/lib/` - the API client (`api.ts`), session/cart/toast context, and the staff WebSocket
  hook.
- `public/` - static assets and the PWA manifest.

See [`../docs/architecture.md`](../docs/architecture.md) for how this fits with the backend.
