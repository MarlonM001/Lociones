-- Email de contacto opcional en el pedido. El negocio sigue confirmando todo
-- por WhatsApp (no se envían correos), pero el checkout ahora lo pide junto
-- al resto de datos del cliente y vale la pena guardarlo para el registro,
-- en vez de pedirlo y tirarlo.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
