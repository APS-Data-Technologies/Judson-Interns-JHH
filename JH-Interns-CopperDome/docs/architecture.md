# Architecture

## System overview

```
┌─────────────────────┐        ┌───────────────────────────────────────────┐
│  Patron PWA (React) │  HTTP  │  Django REST API                          │
│  /home /menu /cart   │───────▶│  - menu app: Venue, Kitchen, MenuItem,    │
│  /checkout /concierge│  WS    │    EventLog, /menu/analytics/             │
│  /order-status        │───────▶│  - concierge app: ServiceRequest,        │
└─────────────────────┘        │    /concierge/ask/ (Claude proxy)         │
                                 │  - Django Channels: ws/staff/ consumer   │
┌─────────────────────┐  HTTP  │    (in-memory channel layer, dev)         │
│  Staff Floor View     │───────▶│                                         │
│  /staff /staff/analytics│ WS   └──────────────┬──────────────────────────┘
└─────────────────────┘                        │
                                                 │ server-side only
                                                 ▼
                                        ┌─────────────────┐
                                        │  Claude API      │
                                        │  (claude-opus-4-8)│
                                        └─────────────────┘
```

Both the patron PWA and the staff floor view are routes in the same React app (see
`frontend/src/app/App.tsx`) — the staff routes just skip the patron session gate and bottom
nav. Both talk to the same Django backend.

## Backend — two Django apps

- **`menu`** — the read side: `Venue` → `Kitchen` → `MenuItem` (the grounding data for both
  the patron menu browse and the AI concierge), plus `EventLog` (the instrumentation spine —
  every one of the 8 event types the scope doc calls for lands here) and `AnalyticsView`,
  which aggregates `EventLog` rows into the 5 required engagement metrics.
- **`concierge`** — the write/interaction side: `ServiceRequest` (the 4 quick-action request
  types), the Claude proxy (`claude_client.py` + `ConciergeAskView`), and the WebSocket
  consumer that fans service-request changes out to the staff feed.

Real-time delivery is Django Channels: `ServiceRequestViewSet.perform_create/update` writes
the DB row, logs the `EventLog` event, then `group_send`s to the `staff_feed` channel group;
`StaffFeedConsumer` relays that to every connected staff socket. Local dev uses
`channels.layers.InMemoryChannelLayer` (single-process, no Redis needed) — see
`backend/backend/settings.py`. `daphne` sits first in `INSTALLED_APPS` so `manage.py
runserver` speaks ASGI/WebSockets in dev instead of Django's default WSGI-only dev server.

## AI concierge

`concierge/claude_client.py` builds a system prompt from the *current* `MenuItem` rows on
every request (no caching, no stale menu), then calls `client.messages.create(...)` via the
`anthropic` SDK. The API key is read from the server environment (`ANTHROPIC_API_KEY`) and
never appears in any response payload or client bundle — the client only ever calls
`POST /api/concierge/ask/` on our own backend. See `docs/api.md` for the request/response
shape.

## Frontend structure

`frontend/src/features/<name>/` holds one page (or a small group) per screen, each with a
colocated `.test.tsx`. Shared state lives in `frontend/src/lib/`:

- `session.tsx` — the patron's QR/table session (localStorage-backed)
- `cart.tsx` — cart lines and derived totals
- `toast.tsx` — the one-line confirmation toasts used by the service-request tiles
- `api.ts` — the typed Axios client for every backend endpoint
- `staffSocket.ts` — the `useStaffFeed()` WebSocket hook (reconnect with backoff) used only by
  the staff routes

## Data flow: a service request end to end

1. Patron taps "Need Water" on `/home` → `createServiceRequest(...)` → `POST /service-requests/`
2. Backend creates the row, logs `service_request_created` to `EventLog`, broadcasts over
   `staff_feed`
3. `StaffFeedPage`, already holding an open `ws/staff/` connection, receives the frame and
   prepends the new request — no polling, no page reload
4. Staff taps Acknowledge → Resolve, each a `PATCH /service-requests/<id>/`, which broadcasts
   again so every connected staff client stays in sync

## Deliberately out of scope (Phase 1)

Matches the project scope doc §4: no real payments (checkout is mocked), no live
Toast/Incentivio integration, no real loyalty ledger (points are computed client-side for
display only), no multi-kitchen order routing. See `docs/api.md` → Auth for the one
known security gap before a real trial (no endpoint authentication yet).
