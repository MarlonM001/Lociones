import { createApp } from '../server/src/server.js'

// Express funciona directo como handler de una función de Vercel: la app ya sabe
// responder (req, res). Este archivo atrapa todo /api/* en una sola función.
export default createApp()
