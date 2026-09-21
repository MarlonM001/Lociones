-- Las pujas ya no tienen un incremento mínimo fijo: cada participante puja el monto que quiera mientras
-- supere la puja más alta. La columna deja de usarse.
ALTER TABLE auctions DROP COLUMN IF EXISTS min_increment;
