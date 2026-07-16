# API Reference

Base URL (local dev): `http://localhost:8000/api/`. The frontend talks to this through the
Vite dev proxy (`/api` → `localhost:8000`), so patron/staff UI code just calls relative paths.
All request/response bodies are JSON.

## Menu (`/api/menu/`)

| Method | Path | Description |
|---|---|---|
| GET | `/menu/venues/` | List venues |
| GET | `/menu/kitchens/` | List kitchens |
| GET | `/menu/menu-items/?kitchen=<id>` | List menu items, optionally filtered by kitchen |
| GET | `/menu/menu-items/<id>/` | Retrieve one menu item |
| GET, POST | `/menu/events/` | List / create event log rows (patron instrumentation) |
| GET | `/menu/analytics/` | Aggregated engagement metrics (see below) |

`POST /menu/events/` body:

```json
{
  "event_type": "menu_viewed",
  "session_id": "uuid-from-the-patron-session",
  "timestamp": "2026-07-15T20:00:00Z",
  "metadata": {}
}
```

`event_type` is one of the 8 types defined in `menu.models.EventLog.EVENT_TYPES`:
`session_started`, `menu_viewed`, `menu_item_viewed`, `ai_question_asked`,
`item_added_to_cart`, `mock_checkout_started`, `mock_checkout_completed`,
`service_request_created`. The last two (`ai_question_asked`, `service_request_created`) are
written server-side by the concierge endpoints below, not posted directly by the frontend.

`GET /menu/analytics/` response:

```json
{
  "total_sessions": 42,
  "concierge_open_rate": 0.62,
  "ai_queries_per_session": 1.8,
  "request_types_by_frequency": { "water": 12, "call_server": 5, "check": 9, "surprise_me": 2 },
  "menu_to_cart_drop_off": 0.31,
  "median_session_duration_seconds": 245.0
}
```

## Concierge (`/api/`)

| Method | Path | Description |
|---|---|---|
| GET | `/status/` | Health check |
| POST | `/concierge/ask/` | Ask the AI concierge a menu question |
| GET, POST | `/service-requests/?status=<status>` | List / create service requests |
| PATCH | `/service-requests/<id>/` | Update a service request's status |

`POST /concierge/ask/` — the server-side Claude proxy. The menu is injected as grounding
context on every call (see `backend/concierge/claude_client.py`); the Anthropic API key never
leaves the server.

```json
// request
{
  "session_id": "uuid-from-the-patron-session",
  "message": "What pairs well with the chowder?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }]
}
// response (200)
{ "reply": "The chowder pairs nicely with our sourdough..." }
// on Claude API failure (502)
{ "error": "The concierge is unavailable right now. Please ask your server." }
```

`POST /service-requests/` — fired by the one-tap Home tiles (Call Server, Water, Check,
Surprise Me) and by Order Status ("Request Service" → `call_server`). Writes a
`service_request_created` event and broadcasts to the staff feed over WebSocket.

```json
// request
{ "session_id": "uuid", "table_number": "04", "request_type": "water" }
// response (201)
{ "id": 17, "session_id": "uuid", "table_number": "04", "request_type": "water",
  "status": "pending", "created_at": "2026-07-15T20:00:00Z", "resolved_at": null }
```

`request_type` ∈ `call_server | water | check | surprise_me`.
`PATCH /service-requests/<id>/` accepts `{ "status": "acknowledged" | "resolved" }` and is
used by the staff floor view's Acknowledge / Resolve buttons; it also broadcasts the update.

## Real-time (WebSocket)

| Path | Description |
|---|---|
| `ws://localhost:8000/ws/staff/` | Staff floor-view feed |

No subscribe message is required — connecting joins the `staff_feed` broadcast group. Every
service-request create/update pushes a frame:

```json
{ "event": "service_request_created", "request": { "...": "ServiceRequest fields" } }
{ "event": "service_request_updated", "request": { "...": "ServiceRequest fields" } }
```

The frontend's `useStaffFeed()` hook (`frontend/src/lib/staffSocket.ts`) connects, reconnects
on drop, and merges these into `StaffFeedPage`'s local state. In dev, the Vite proxy forwards
`/ws` to the same Django dev server as `/api` — see `frontend/vite.config.ts`.

## Auth

**Gap:** none of these endpoints currently require authentication. The scope doc (§5.6) calls
for "Authenticated endpoints" as a security requirement, and that is not yet implemented — the
only auth-adjacent protection in place today is keeping the Claude API key server-side (§5.4).
Before any real trial with real patrons, add session/token auth (or at minimum an origin check
plus rate limiting) to the mutating endpoints (`/service-requests/`, `/concierge/ask/`,
`/menu/events/`) so the API isn't open to the public internet.
