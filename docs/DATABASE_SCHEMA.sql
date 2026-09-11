-- =====================================================================
-- ESQUEMA DE BASE DE DATOS — Tienda de Lociones
-- =====================================================================
-- Contrato de referencia para cuando se construya el backend (Fase futura).
-- Los mocks y localStorage del frontend (Fase 1) usan exactamente estos
-- mismos nombres de campo para que migrar a una API real sea mecánico.
--
-- Compatible con SQLite; para PostgreSQL cambiar:
--   INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL / GENERATED ALWAYS AS IDENTITY
--   TEXT CHECK (...) -> se puede mantener igual o usar tipos ENUM nativos
-- =====================================================================

CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT NOT NULL,
    password_hash TEXT NOT NULL,          -- nunca texto plano; bcrypt/argon2 en el backend
    role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    city          TEXT,
    address       TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE categories (
    id          TEXT PRIMARY KEY,          -- slug estable, ej. 'arabia', 'mujeres', 'caballero'
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    image       TEXT,
    active      INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE products (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    name               TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    category_id        TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku                TEXT NOT NULL UNIQUE,
    price              INTEGER NOT NULL CHECK (price >= 0),   -- COP, sin decimales
    description        TEXT,
    short_description  TEXT,
    image              TEXT,
    images             TEXT,               -- JSON array de URLs
    stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active             INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_at         TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

CREATE TABLE orders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL = pedido de invitado
    customer_name  TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    subtotal    INTEGER NOT NULL CHECK (subtotal >= 0),
    shipping    INTEGER NOT NULL DEFAULT 0,
    total       INTEGER NOT NULL CHECK (total >= 0),
    city        TEXT NOT NULL,
    address     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'PEDIDO_RECIBIDO'
                CHECK (status IN ('PEDIDO_RECIBIDO', 'PREPARANDO_ENVIO', 'EN_CAMINO', 'ENTREGADO')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    price       INTEGER NOT NULL CHECK (price >= 0),   -- precio unitario al momento de la compra
    subtotal    INTEGER NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE delivery_references (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    description   TEXT,
    city          TEXT,
    video_url     TEXT NOT NULL,   -- en producción: URL en almacenamiento de archivos (S3/Cloudinary), no el binario
    thumbnail_url TEXT,
    created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_delivery_references_created_by ON delivery_references(created_by);

-- =====================================================================
-- Notas de mapeo Fase 1 (frontend con localStorage) -> backend futuro
-- =====================================================================
-- - src/data/generateProducts.js  -> tabla `products` (mismos nombres de campo, camelCase en JS)
-- - src/config/categories.js      -> tabla `categories`
-- - services/orders (localStorage)-> tablas `orders` + `order_items`
-- - Login/Registro (Fase 2)       -> tabla `users`, password_hash generado por el backend
-- - services/references (Fase 2) -> tabla `delivery_references`. El video hoy se guarda como
--   Blob en IndexedDB (src/services/references/db.js) porque no hay backend; en producción
--   el archivo se sube a almacenamiento de objetos y solo se guarda `video_url`.
-- =====================================================================
