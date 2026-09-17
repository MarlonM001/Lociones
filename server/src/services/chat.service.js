import { pool } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'

function toPublicConversation(row) {
  return {
    id: row.id,
    userId: row.user_id,
    guestId: row.guest_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    status: row.status,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
  }
}

function toPublicMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function findOrCreateConversation({ userId, guestId, guestName, guestPhone }) {
  if (!userId && !guestId) {
    throw ApiError.badRequest('Falta identificar la conversación (sesión o id de invitado).')
  }

  const { rows: existingRows } = await pool.query(
    userId
      ? 'SELECT * FROM chat_conversations WHERE user_id = $1 ORDER BY id DESC LIMIT 1'
      : 'SELECT * FROM chat_conversations WHERE guest_id = $1 ORDER BY id DESC LIMIT 1',
    [userId ?? guestId],
  )

  if (existingRows[0]) {
    if (guestName || guestPhone) {
      const { rows } = await pool.query(
        `UPDATE chat_conversations
         SET guest_name = COALESCE($1, guest_name), guest_phone = COALESCE($2, guest_phone)
         WHERE id = $3 RETURNING *`,
        [guestName || null, guestPhone || null, existingRows[0].id],
      )
      return toPublicConversation(rows[0])
    }
    return toPublicConversation(existingRows[0])
  }

  const { rows } = await pool.query(
    `INSERT INTO chat_conversations (user_id, guest_id, guest_name, guest_phone)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId ?? null, userId ? null : guestId, guestName ?? null, guestPhone ?? null],
  )
  return toPublicConversation(rows[0])
}

export async function getConversationById(id) {
  const { rows } = await pool.query('SELECT * FROM chat_conversations WHERE id = $1', [id])
  return rows[0] ? toPublicConversation(rows[0]) : null
}

export async function listMessages(conversationId) {
  const { rows } = await pool.query(
    'SELECT * FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId],
  )
  return rows.map(toPublicMessage)
}

export async function addMessage({ conversationId, senderRole, body }) {
  if (!body?.trim()) throw ApiError.badRequest('El mensaje no puede estar vacío.')

  const { rows } = await pool.query(
    `INSERT INTO chat_messages (conversation_id, sender_role, body, read_by_admin)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [conversationId, senderRole, body.trim(), senderRole === 'admin'],
  )
  await pool.query('UPDATE chat_conversations SET last_message_at = NOW() WHERE id = $1', [conversationId])
  return toPublicMessage(rows[0])
}

export async function listConversationsAdmin() {
  const { rows } = await pool.query(
    `SELECT
       c.*,
       u.name AS account_name,
       (SELECT body FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.sender_role = 'customer' AND m.read_by_admin = FALSE)::int AS unread_count
     FROM chat_conversations c
     LEFT JOIN users u ON u.id = c.user_id
     ORDER BY c.last_message_at DESC`,
  )
  return rows.map((row) => ({
    ...toPublicConversation(row),
    displayName: row.account_name || row.guest_name || 'Visitante',
    lastMessage: row.last_message,
    unreadCount: row.unread_count,
  }))
}

export async function markConversationRead(conversationId) {
  await pool.query(
    `UPDATE chat_messages SET read_by_admin = TRUE WHERE conversation_id = $1 AND sender_role = 'customer'`,
    [conversationId],
  )
}
