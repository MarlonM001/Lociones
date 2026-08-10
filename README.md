# Essence Polar — Tienda online de lociones

Tienda de perfumería (ARABA, Mujeres, Caballero) construida con React + Vite + Tailwind CSS. El flujo de compra se confirma por WhatsApp; incluye cuentas de cliente, panel de administración, moderación de referencias en video y reportes de ventas en PDF.

## Stack

- React 19 + Vite + React Router
- Tailwind CSS v4 (modo día/noche vía variables CSS)
- jsPDF (reportes mensuales, cargado bajo demanda)
- Persistencia local: `localStorage` (carrito, usuarios, pedidos) e `IndexedDB` (fotos de producto, videos de referencia) — no hay backend todavía; ver `docs/DATABASE_SCHEMA.sql` para el esquema pensado para cuando se conecte uno.

## Desarrollo

```bash
npm install
npm run dev
```

## Cuenta de administrador

Se crea automáticamente la primera vez que corre la app:

- Email: `admin@essencepolar.com`
- Contraseña: `Admin123!`

**Importante:** esta contraseña queda visible en el código fuente (`src/services/auth/index.js`) porque todavía no hay backend. Antes de usar esta tienda en producción con datos reales, cambia esas credenciales o reemplaza el mecanismo de login por uno con backend real.

## Estructura

- `src/pages` — páginas públicas y de administración (`src/pages/admin`)
- `src/services` — capa de datos (products, orders, auth, references, reports), pensada para reemplazarse por llamadas a una API real sin tocar los componentes
- `src/config` — configuración central (nombre de tienda, número de WhatsApp, ciudades de envío, categorías)
- `docs/DATABASE_SCHEMA.sql` — esquema de base de datos de referencia para el futuro backend
