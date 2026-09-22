/**
 * Configuración central de la tienda. Único lugar donde viven estos valores —
 * ningún componente debe hardcodear el nombre, moneda o número de WhatsApp.
 */
export const STORE_CONFIG = {
  name: 'Essence Polar',
  tagline: 'Perfumería de lujo',
  whatsappNumber: '573227034187', // formato internacional sin '+' ni espacios (57 = Colombia)
  currency: 'COP',
  locale: 'es-CO',
  email: 'Essencepolar7@gmail.com',
  // Redes sociales: solo se muestran las que tienen dirección. Instagram y TikTok están vacías a propósito:
  // antes apuntaban a cuentas de relleno (/essence) que no son las de la tienda. Pon aquí las direcciones reales.
  instagram: '',
  facebook: 'https://www.facebook.com/profile.php?id=61594174995209',
  tiktok: '',
  hours: 'Lunes a sábado, 9:00 a.m. – 7:00 p.m.',
  shippingCoverage: 'toda Colombia',
  // Datos del vendedor para los textos legales (la ley pide identificar quién vende). Los campos vacíos no se muestran.
  legal: {
    businessName: '', // razón social o nombre completo del titular, tal como aparece en el RUT
    nit: '', // NIT o cédula, con dígito de verificación
    address: '', // dirección física, para notificaciones
  },
}
