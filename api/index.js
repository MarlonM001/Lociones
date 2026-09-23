import { createApp } from '../server/src/server.js'

// Express funciona directo como handler de una función de Vercel: la app ya sabe
// responder (req, res). vercel.json reescribe /api/* hacia esta única función
// (el catch-all por nombre de archivo [...path].js no capturaba rutas con más
// de un segmento, ej. /api/auth/login, bajo el preset "Other").
export default createApp()
