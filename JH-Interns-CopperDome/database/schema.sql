-- Copper Dome Concierge — PostgreSQL schema reference
--
-- This mirrors the tables created by the Django migrations in backend/menu/migrations
-- and backend/concierge/migrations. It is a reference for anyone who needs the schema
-- without standing up Django (DB review, BI tooling, onboarding) — the migrations remain
-- the source of truth. Apply with `python manage.py migrate`; this file is not run by the
-- app itself.
--
-- Run manually only if you need a schema-only Postgres database outside Django, e.g.:
--   psql -U copperdome_user -d copperdome_dev -f database/schema.sql

-- ============================================================
-- menu app — venue, kitchens, menu items, event log
-- ============================================================

CREATE TABLE IF NOT EXISTS menu_venue (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS menu_kitchen (
    id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL REFERENCES menu_venue (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS menu_kitchen_venue_id_idx ON menu_kitchen (venue_id);

CREATE TABLE IF NOT EXISTS menu_menuitem (
    id BIGSERIAL PRIMARY KEY,
    kitchen_id BIGINT NOT NULL REFERENCES menu_kitchen (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(8, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    dietary_tags JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS menu_menuitem_kitchen_id_idx ON menu_menuitem (kitchen_id);

CREATE TABLE IF NOT EXISTS menu_eventlog (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL CHECK (
        event_type IN (
            'session_started',
            'menu_viewed',
            'menu_item_viewed',
            'ai_question_asked',
            'item_added_to_cart',
            'mock_checkout_started',
            'mock_checkout_completed',
            'service_request_created'
        )
    ),
    session_id VARCHAR(255),
    "timestamp" TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS menu_eventlog_session_id_idx ON menu_eventlog (session_id);
CREATE INDEX IF NOT EXISTS menu_eventlog_event_type_idx ON menu_eventlog (event_type);

-- ============================================================
-- concierge app — patron service requests (AI concierge Q&A is
-- stateless and not persisted beyond the menu_eventlog audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS concierge_servicerequest (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    table_number VARCHAR(32) NOT NULL,
    request_type VARCHAR(32) NOT NULL CHECK (
        request_type IN ('call_server', 'water', 'check', 'surprise_me')
    ),
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'acknowledged', 'resolved')
    ),
    created_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS concierge_servicerequest_session_id_idx ON concierge_servicerequest (session_id);
CREATE INDEX IF NOT EXISTS concierge_servicerequest_status_idx ON concierge_servicerequest (status);
