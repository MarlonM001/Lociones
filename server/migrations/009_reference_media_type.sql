-- Las referencias de entrega ahora pueden ser un video o una foto.
-- La columna video_url guarda la URL del archivo en ambos casos (el nombre
-- quedó de cuando solo había videos); media_type dice cómo mostrarlo.
ALTER TABLE delivery_references
    ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'video'
    CHECK (media_type IN ('video', 'image'));
