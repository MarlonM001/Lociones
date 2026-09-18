-- Consentimiento opcional de marketing capturado en el checkout. Se guarda
-- aunque hoy no exista un sistema de email/SMS que lo consuma, para no pedir
-- el dato y descartarlo.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
