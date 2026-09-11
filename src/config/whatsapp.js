import { STORE_CONFIG } from './store'

/**
 * Configuración de WhatsApp derivada de STORE_CONFIG. El número vive en un
 * solo lugar (STORE_CONFIG.whatsappNumber); este archivo solo expone la base
 * del enlace para que services/whatsapp construya los mensajes.
 */
export const WHATSAPP_NUMBER = STORE_CONFIG.whatsappNumber
export const WHATSAPP_BASE_URL = `https://wa.me/${WHATSAPP_NUMBER}`
