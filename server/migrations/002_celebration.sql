-- Configuración del efecto de celebración (confeti) que se muestra al
-- entrar a la tienda. Fila única (id siempre 1), mismo patrón que
-- promo_banner.
CREATE TABLE IF NOT EXISTS celebration_config (
    id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
