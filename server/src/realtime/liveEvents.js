/**
 * Avisos en vivo hacia los navegadores. El servidor de sockets se registra una vez al arrancar
 * (`attachChatSocket`); el resto del backend solo llama a estas funciones. Si no hay servidor de
 * sockets (por ejemplo en las pruebas) no hacen nada.
 */
let io = null

/** Sala a la que se une quien tiene abierta la sala de subasta en la tienda. */
export const AUCTION_ROOM = 'auction-room'

export function setRealtimeServer(server) {
  io = server
}

/** Avisa a todos los que miran la sala que entró una puja nueva. */
export function broadcastAuctionBid(event) {
  io?.to(AUCTION_ROOM).emit('auction:bid', event)
}

/** Avisa a la sala que hay un comentario nuevo. */
export function broadcastAuctionComment(event) {
  io?.to(AUCTION_ROOM).emit('auction:comment', event)
}

/** Avisa a la sala que el admin quitó un comentario, para que desaparezca en todas las pantallas. */
export function broadcastAuctionCommentDeleted(event) {
  io?.to(AUCTION_ROOM).emit('auction:comment-deleted', event)
}
