import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { UPLOAD_DIR } from './middleware/upload.js'
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import productsRoutes from './routes/products.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import referencesRoutes from './routes/references.routes.js'
import promotionsRoutes from './routes/promotions.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    next()
  })

  const allowedOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
  app.use(
    cors({
      origin: allowedOrigins.length ? allowedOrigins : false,
    }),
  )

  app.use(express.json())
  app.use('/uploads', express.static(UPLOAD_DIR))

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  app.use('/api/auth', authRoutes)
  app.use('/api/products', productsRoutes)
  app.use('/api/orders', ordersRoutes)
  app.use('/api/references', referencesRoutes)
  app.use('/api/promotions', promotionsRoutes)

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
