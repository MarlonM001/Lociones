/**
 * Formas de pago que aceptamos. Hoy solo efectivo y transferencia, y siempre se
 * coordinan por WhatsApp (no se cobra en línea). Agregar o quitar una forma de
 * pago = editar esta lista; el carrito y los términos la leen de aquí.
 */
export const PAYMENT_METHODS = [
  {
    id: 'efectivo',
    label: 'Efectivo',
    description: 'Acordamos contigo por WhatsApp cómo y cuándo hacer el pago.',
  },
  {
    id: 'transferencia',
    label: 'Transferencia',
    description: 'Te enviamos por WhatsApp los datos de la cuenta para que hagas la transferencia.',
  },
]

/** "efectivo o transferencia", listo para insertar en medio de una frase. */
export const PAYMENT_METHODS_TEXT = PAYMENT_METHODS.map((method) => method.label.toLowerCase()).join(' o ')
