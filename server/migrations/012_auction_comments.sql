-- Comentarios de la sala de subasta: los escriben los participantes (con cuenta) y el admin, y los ven
-- todos los que tengan abierta la sala. Se borran solos si se borra la subasta o la cuenta.
CREATE TABLE IF NOT EXISTS auction_comments (
    id          SERIAL PRIMARY KEY,
    auction_id  INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 300),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_comments_auction ON auction_comments(auction_id, id DESC);
