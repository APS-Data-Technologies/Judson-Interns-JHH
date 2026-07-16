# Database - JH-Interns-CopperDome

This directory contains database schema references and seed data for Copper Dome Concierge.

## Files

- `schema.sql` — PostgreSQL DDL for every table (`menu_venue`, `menu_kitchen`, `menu_menuitem`,
  `menu_eventlog`, `concierge_servicerequest`), reference-only and hand-kept in sync with the
  Django models in `backend/menu/models.py` and `backend/concierge/models.py`.
- `seed_data.sql` — the same venue/kitchens/menu data as
  `backend/menu/management/commands/seed_menu_data.py`, as portable `INSERT` statements.

**The Django migrations are the source of truth for schema, and the management command is the
source of truth for seed data.** These SQL files are a convenience for anyone who needs the
database outside a Django runtime (schema review, BI tooling, a throwaway CI/trial database).
If you change a model or the seed command, update the matching file here in the same change.

## Usage

Normal local development doesn't need these files — `python manage.py migrate` and
`python manage.py seed_menu_data` from `backend/` do the same thing and stay guaranteed
in sync with the models. Use the SQL files directly only when you're standing up a database
without Django, e.g.:

```bash
psql -U copperdome_user -d copperdome_dev -f database/schema.sql
psql -U copperdome_user -d copperdome_dev -f database/seed_data.sql
```

Both files were verified against a real PostgreSQL 15 instance before being committed. Both
are idempotent — `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, `seed_data.sql` uses
`ON CONFLICT (id) DO NOTHING` — safe to re-run.
