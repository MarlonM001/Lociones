-- La franja de promoción se conecta a un producto y un porcentaje: al guardarla, ese producto recibe su
-- precio con descuento (con la misma fecha de vencimiento). `sale_from_banner` marca las ofertas que puso
-- la franja, para poder quitarlas al cambiar de promoción sin borrar una oferta que el admin puso a mano.
ALTER TABLE promo_banner ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE promo_banner ADD COLUMN IF NOT EXISTS discount_percent INTEGER;
ALTER TABLE promo_banner DROP CONSTRAINT IF EXISTS promo_banner_discount_percent_check;
ALTER TABLE promo_banner ADD CONSTRAINT promo_banner_discount_percent_check
    CHECK (discount_percent IS NULL OR discount_percent BETWEEN 1 AND 90);

ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_from_banner BOOLEAN NOT NULL DEFAULT FALSE;
