-- Chat en vivo: una conversación por visitante (con cuenta o invitado). Los
-- mensajes viajan por WebSocket en tiempo real (ver server/src/realtime/), pero
-- se persisten aquí para que el admin tenga historial y bandeja de entrada.
CREATE TABLE IF NOT EXISTS chat_conversations (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    guest_id         TEXT,                 -- id anónimo (localStorage) cuando no hay sesión
    guest_name       TEXT,
    guest_phone      TEXT,
    status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    last_message_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON chat_conversations(status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_guest ON chat_conversations(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS chat_messages (
    id              SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_role     TEXT NOT NULL CHECK (sender_role IN ('customer', 'admin')),
    body            TEXT NOT NULL,
    read_by_admin   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at ASC);
