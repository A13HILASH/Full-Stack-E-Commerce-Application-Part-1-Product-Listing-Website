-- Relational schema for the product catalogue (SQLite).
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    slug  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    description  TEXT    NOT NULL,
    price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),  -- money stored as integer minor units
    image_url    TEXT    NOT NULL,
    category_id  INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name     ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price    ON products(price_cents);
