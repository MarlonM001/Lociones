-- Módulo "Top Ventas": permite marcar productos como más vendidos, darles un
-- orden manual dentro del módulo y (opcionalmente) una foto curada distinta
-- a la foto normal del producto, pensada para lucir mejor en ese carrusel.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller_rank INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller_image TEXT;

CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_bestseller) WHERE is_bestseller = TRUE;
