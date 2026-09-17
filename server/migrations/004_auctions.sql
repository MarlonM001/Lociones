-- Módulo de subastas: el switch general (auction_config) vive aparte de cada
-- subasta individual porque el admin puede querer apagar TODO el módulo
-- (ocultar el enlace "Subastas" de la tienda) sin tener que cancelar cada
-- subasta programada una por una. Mismo patrón que promo_banner /
-- celebration_config (fila única, id siempre 1).
CREATE TABLE IF NOT EXISTS auction_config (
    id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- `status` solo distingue 'active' (normal) de 'cancelled' (el admin la dio
-- de baja antes de tiempo). La fase real que ve el cliente (programada / en
-- curso / cerrada) se calcula en el servicio a partir de starts_at/ends_at
-- en cada lectura — no hay tarea programada (cron) en este backend, así que
-- el cierre automático es "cerrada en cuanto se consulta después de la
-- fecha", no un evento que dispare algo en ese instante exacto.
CREATE TABLE IF NOT EXISTS auctions (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    slug           TEXT NOT NULL UNIQUE,
    description    TEXT,
    image          TEXT,
    kind           TEXT NOT NULL DEFAULT 'product' CHECK (kind IN ('product', 'combo')),
    starting_price INTEGER NOT NULL CHECK (starting_price >= 0),
    min_increment  INTEGER NOT NULL DEFAULT 5000 CHECK (min_increment > 0),
    status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    starts_at      TIMESTAMPTZ NOT NULL,
    ends_at        TIMESTAMPTZ NOT NULL CHECK (ends_at > starts_at),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_ends_at ON auctions(ends_at);

-- Productos que componen la subasta. Para kind='product' hay una sola fila
-- (quantity casi siempre 1); para kind='combo' hay varias, una por producto
-- del paquete.
CREATE TABLE IF NOT EXISTS auction_items (
    id          SERIAL PRIMARY KEY,
    auction_id  INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_auction_items_auction ON auction_items(auction_id);

CREATE TABLE IF NOT EXISTS auction_bids (
    id          SERIAL PRIMARY KEY,
    auction_id  INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount      INTEGER NOT NULL CHECK (amount >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_amount ON auction_bids(auction_id, amount DESC);
