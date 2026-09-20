export const ORDER_STATUSES = {
  PEDIDO_RECIBIDO: 'PEDIDO_RECIBIDO',
  PREPARANDO_ENVIO: 'PREPARANDO_ENVIO',
  EN_CAMINO: 'EN_CAMINO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
}

export const ORDER_STATUS_SEQUENCE = [
  ORDER_STATUSES.PEDIDO_RECIBIDO,
  ORDER_STATUSES.PREPARANDO_ENVIO,
  ORDER_STATUSES.EN_CAMINO,
  ORDER_STATUSES.ENTREGADO,
]

// Todos los estados que puede ver el admin (filtros y selector). La secuencia de arriba es solo el
// recorrido normal de un pedido; "cancelado" queda aparte porque no es un paso más del envío.
export const ORDER_STATUS_ALL = [...ORDER_STATUS_SEQUENCE, ORDER_STATUSES.CANCELADO]

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUSES.PEDIDO_RECIBIDO]: 'Pedido recibido',
  [ORDER_STATUSES.PREPARANDO_ENVIO]: 'Preparando envío',
  [ORDER_STATUSES.EN_CAMINO]: 'En camino',
  [ORDER_STATUSES.ENTREGADO]: 'Entregado',
  [ORDER_STATUSES.CANCELADO]: 'Cancelado',
}
