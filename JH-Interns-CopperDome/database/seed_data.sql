-- Copper Dome Concierge — seed data (matches backend/menu/management/commands/seed_menu_data.py)
--
-- Loads the single Copper Dome venue, its three kitchens, and their full menus.
-- The Django management command is the source of truth (`python manage.py seed_menu_data`);
-- this file is a portable equivalent for seeding a Postgres database directly, e.g. in CI
-- or a throwaway trial environment without a Django runtime.
--
--   psql -U copperdome_user -d copperdome_dev -f database/schema.sql
--   psql -U copperdome_user -d copperdome_dev -f database/seed_data.sql
--
-- Safe to re-run: inserts are keyed by their Django-assigned id and skipped on conflict.

BEGIN;

INSERT INTO menu_venue (id, name, address, configuration, created_at, updated_at) VALUES (1, 'Copper Dome Concierge', '123 Main Street, Charleston, SC', '{"theme": "coastal", "single_venue": true}', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_kitchen (id, venue_id, name, cuisine_type, description, created_at, updated_at) VALUES (1, 1, 'The Copper Rail Kitchen', 'American coastal comfort', 'Grilled, smoked and wood-fired comfort food.', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_kitchen (id, venue_id, name, cuisine_type, description, created_at, updated_at) VALUES (2, 1, 'Dome Garden Kitchen', 'Globally inspired plant-forward', 'Bowls, wraps and small plates with bold flavor.', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_kitchen (id, venue_id, name, cuisine_type, description, created_at, updated_at) VALUES (3, 1, 'Fiamma & Co.', 'Italian-influenced street bites', 'Flatbreads, pasta and dolci with a street-food spin.', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (1, 1, 'Smoked Clam Chowder', 'House-smoked clams, roasted corn, potato, sourdough croutons', 9.00, 'Starters', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (2, 1, 'Grilled Artichoke', 'Charred artichoke, lemon aioli, herb salad', 11.00, 'Starters', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (3, 1, 'Crab Cake Sliders', 'Mini crab cakes, pickled slaw, lemon remoulade', 14.00, 'Starters', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (4, 1, 'Cedar Plank Salmon', 'Cedar-roasted salmon, fennel slaw, citrus glaze', 22.00, 'Mains', '["GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (5, 1, 'Smoked Half Chicken', 'Slow-smoked chicken, herb jus, charred lemon', 20.00, 'Mains', '["GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (6, 1, 'Rail Burger', 'House beef burger, cheddar, pickle, tomato jam', 18.00, 'Mains', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (7, 1, 'Mushroom & Brie Melt', 'Roasted mushrooms, brie, caramelized onion, sourdough', 16.00, 'Mains', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (8, 1, 'Wood-fired Fries', 'Crisp fries, smoked sea salt, parsley aioli', 6.00, 'Sides', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (9, 1, 'Roasted Corn Elote', 'Roasted corn, cotija, lime, chile', 5.00, 'Sides', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (10, 1, 'Draft Craft Beer', 'Local draft selection', 8.00, 'Drinks', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (11, 1, 'Sparkling Lemonade', 'Fresh lemon, mint, sparkling water', 5.00, 'Drinks', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (12, 2, 'Crispy Chickpea Bites', 'Crispy chickpeas, tahini drizzle, pickled onion', 8.00, 'Small Plates', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (13, 2, 'Miso Edamame Hummus', 'Creamy edamame hummus, sesame, cucumber ribbons', 10.00, 'Small Plates', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (14, 2, 'Cauliflower Shawarma Bites', 'Crispy cauliflower, shawarma spice, herb yogurt', 11.00, 'Small Plates', '["V", "GF", "SP"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (15, 2, 'Golden Grain Bowl', 'Herbed grains, roasted vegetables, tahini, pickles', 15.00, 'Bowls & Wraps', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (16, 2, 'Thai Peanut Wrap', 'Crispy tofu, peanut sauce, cabbage slaw', 14.00, 'Bowls & Wraps', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (17, 2, 'Mediterranean Chicken Bowl', 'Herb chicken, rice, cucumber, tomato, feta', 17.00, 'Bowls & Wraps', '["GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (18, 2, 'Korean BBQ Mushroom Bowl', 'Glazed mushrooms, rice, scallions, sesame greens', 15.00, 'Bowls & Wraps', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (19, 2, 'Miso Soup', 'Traditional miso broth with tofu and scallions', 4.00, 'Sides', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (20, 2, 'Kimchi Side', 'House kimchi with sesame and chili', 3.00, 'Sides', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (21, 2, 'Matcha Latte', 'Fresh matcha with steamed milk', 6.00, 'Drinks', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (22, 2, 'Hibiscus Agua Fresca', 'Bright hibiscus, lime, sparkling water', 5.00, 'Drinks', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (23, 3, 'Burrata & Heirloom Tomato', 'Creamy burrata, heirloom tomato, basil, olive oil', 13.00, 'Starters', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (24, 3, 'Arancini (x3)', 'Crispy risotto balls with parmesan and tomato basil sauce', 10.00, 'Starters', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (25, 3, 'Charcuterie Mista', 'Assorted cured meats, pickled vegetables, olives', 16.00, 'Starters', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (26, 3, 'Margherita', 'Tomato sauce, mozzarella, basil, olive oil', 14.00, 'Flatbreads', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (27, 3, 'Speck & Fig', 'Speck, fig jam, mozzarella, arugula', 17.00, 'Flatbreads', '["SP"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (28, 3, 'White Truffle Bianca', 'Garlic cream, mozzarella, white truffle oil', 18.00, 'Flatbreads', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (29, 3, 'Cacio e Pepe', 'Roman-style pasta with pecorino and black pepper', 16.00, 'Pasta', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (30, 3, 'Rigatoni all''Arrabbiata', 'Rigatoni in spicy tomato sauce with chili oil', 15.00, 'Pasta', '["V", "SP"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (31, 3, 'Tagliatelle Bolognese', 'Slow-simmered beef ragù, parmesan, herbs', 19.00, 'Pasta', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (32, 3, 'Tiramisu', 'Classic mascarpone dessert with espresso soak', 8.00, 'Dolci', '["V"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (33, 3, 'Affogato', 'Vanilla gelato with hot espresso', 7.00, 'Dolci', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (34, 3, 'Aperol Spritz', 'Aperol, sparkling wine, orange twist', 12.00, 'Drinks', '[]', now(), now()) ON CONFLICT (id) DO NOTHING;
INSERT INTO menu_menuitem (id, kitchen_id, name, description, price, category, dietary_tags, created_at, updated_at) VALUES (35, 3, 'San Pellegrino', 'Sparkling mineral water', 4.00, 'Drinks', '["V", "GF"]', now(), now()) ON CONFLICT (id) DO NOTHING;

-- Keep the identity sequences ahead of the explicit ids inserted above so the
-- next Django-created row doesn't collide with a seeded id.
SELECT setval(pg_get_serial_sequence('menu_venue', 'id'), COALESCE((SELECT MAX(id) FROM menu_venue), 1));
SELECT setval(pg_get_serial_sequence('menu_kitchen', 'id'), COALESCE((SELECT MAX(id) FROM menu_kitchen), 1));
SELECT setval(pg_get_serial_sequence('menu_menuitem', 'id'), COALESCE((SELECT MAX(id) FROM menu_menuitem), 1));

COMMIT;
