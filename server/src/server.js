import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import productsRoutes from './routes/products.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import referencesRoutes from './routes/references.routes.js'
import promotionsRoutes from './routes/promotions.routes.js'
import celebrationRoutes from './routes/celebration.routes.js'
import auctionsRoutes from './routes/auctions.routes.js'
import chatRoutes from './routes/chat.routes.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    // Solo si la petición llegó por HTTPS (directo o vía el proxy/túnel), para no forzarlo en pruebas locales.
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })

  const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : false,
    }),
  )

  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRoutes)
  app.use('/api/products', productsRoutes)
  app.use('/api/orders', ordersRoutes)
  app.use('/api/references', referencesRoutes)
  app.use('/api/promotions', promotionsRoutes)
  app.use('/api/celebration', celebrationRoutes)
  app.use('/api/auctions', auctionsRoutes)
  app.use('/api/chat', chatRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMainModule) {
  const app = createApp()
  const port = process.env.PORT ?? 4000
  app.listen(port, () => console.log(`API escuchando en http://localhost:${port}`))
}
