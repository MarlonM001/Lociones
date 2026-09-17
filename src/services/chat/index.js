import { apiFetch } from '../api/client'

export { getChatSocket, getGuestId } from './socket'

export async function getChatConversationsAdmin() {
  return apiFetch('/api/chat/conversations')
}

export async function getChatMessagesAdmin(conversationId) {
  return apiFetch(`/api/chat/conversations/${conversationId}/messages`)
}
