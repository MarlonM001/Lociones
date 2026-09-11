-- =====================================================================
-- ESQUEMA DE BASE DE DATOS — Tienda de Lociones (Postgres)
-- =====================================================================
-- Adaptado de docs/DATABASE_SCHEMA.sql (referencia original en SQLite) a
-- sintaxis Postgres real. Mismos nombres de tabla/columna, para que el
-- mapeo con src/services/* del frontend sea directo.
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    city          TEXT,
    address       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id          TEXT PRIMARY KEY,          -- slug estable, ej. 'arabia', 'mujeres', 'caballero'
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    image       TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id                 SERIAL PRIMARY KEY,
    name               TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    category_id        TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku                TEXT NOT NULL UNIQUE,
    price              INTEGER NOT NULL CHECK (price >= 0),   -- COP, sin decimales
    description        TEXT,
    short_description  TEXT,
    image              TEXT,
    images             JSONB,               -- array de URLs
    stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

CREATE TABLE IF NOT EXISTS orders (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL = pedido de invitado
    customer_name  TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    subtotal       INTEGER NOT NULL CHECK (subtotal >= 0),
    shipping       INTEGER NOT NULL DEFAULT 0,
    total          INTEGER NOT NULL CHECK (total >= 0),
    city           TEXT NOT NULL,
    address        TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'PEDIDO_RECIBIDO'
                   CHECK (status IN ('PEDIDO_RECIBIDO', 'PREPARANDO_ENVIO', 'EN_CAMINO', 'ENTREGADO')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    price       INTEGER NOT NULL CHECK (price >= 0),   -- precio unitario al momento de la compra
    subtotal    INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE TABLE IF NOT EXISTS delivery_references (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT,
    city          TEXT,
    video_url     TEXT NOT NULL,   -- URL pública servida por el propio backend (uploads/references)
    thumbnail_url TEXT,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_references_created_by ON delivery_references(created_by);
CREATE INDEX IF NOT EXISTS idx_delivery_references_status ON delivery_references(status);

-- Tabla nueva (no existía en el esquema original): configuración del banner
-- de promociones. Fila única (id siempre 1) en vez de una tabla key-value
-- genérica, porque hoy solo hay un banner activo a la vez.
CREATE TABLE IF NOT EXISTS promo_banner (
    id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    message     TEXT NOT NULL DEFAULT '',
    link_label  TEXT NOT NULL DEFAULT '',
    link_to     TEXT NOT NULL DEFAULT '',
    expires_at  DATE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
