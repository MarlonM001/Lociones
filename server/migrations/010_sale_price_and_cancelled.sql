-- Precio en oferta por producto: el admin fija un precio menor y, si quiere, una fecha
-- hasta la que vale (inclusive, hora de Colombia). Sin fecha, la oferta dura hasta que la quite.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_price INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_ends_at DATE;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sale_price_check;
ALTER TABLE products ADD CONSTRAINT products_sale_price_check
    CHECK (sale_price IS NULL OR (sale_price > 0 AND sale_price < price));

-- Estado "cancelado" para pedidos: se conserva el registro (y los reportes lo excluyen)
-- en vez de borrarlo.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PEDIDO_RECIBIDO', 'PREPARANDO_ENVIO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'));
