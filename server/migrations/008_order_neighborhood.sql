-- Barrio de entrega capturado en el checkout, para ubicar mejor la dirección.
-- Nullable: los pedidos anteriores no lo tienen.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS neighborhood TEXT;
