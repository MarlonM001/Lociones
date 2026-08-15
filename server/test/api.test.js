import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { createApp } from '../src/server.js'
import { pool } from '../src/db/pool.js'

let baseUrl
let server

before(async () => {
  const app = createApp()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://localhost:${server.address().port}`
})

after(async () => {
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
})

test('registro + login: el usuario puede loguearse con la contraseña que registró', async () => {
  const email = `test-${Date.now()}@example.com`
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Usuario de Prueba',
      email,
      phone: '3001234567',
      password: 'claveSegura123',
      city: 'Bogotá',
      address: 'Calle 123',
    }),
  })
  assert.equal(registerRes.status, 201)
  const registerBody = await registerRes.json()
  assert.equal(registerBody.user.email, email)
  assert.equal(registerBody.user.role, 'customer')
  assert.ok(registerBody.token)

  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'claveSegura123' }),
  })
  assert.equal(loginRes.status, 200)
  const loginBody = await loginRes.json()
  assert.equal(loginBody.user.email, email)

  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${loginBody.token}` },
  })
  assert.equal(meRes.status, 200)
  const meBody = await meRes.json()
  assert.equal(meBody.email, email)
})

test('listar productos devuelve el catálogo sembrado', async () => {
  const res = await fetch(`${baseUrl}/api/products`)
  assert.equal(res.status, 200)
  const products = await res.json()
  assert.ok(Array.isArray(products))
  assert.ok(products.length > 0)
  assert.ok(products.every((product) => product.active))
})

test('crear un pedido de invitado calcula el total y devuelve los items', async () => {
  const productsRes = await fetch(`${baseUrl}/api/products`)
  const [product] = await productsRes.json()

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: product.id, name: product.name, quantity: 2, price: product.price }],
      customerName: 'Cliente de Prueba',
      customerPhone: '3000000000',
      city: 'Medellín',
      address: 'Carrera 45',
    }),
  })
  assert.equal(orderRes.status, 201)
  const order = await orderRes.json()
  assert.equal(order.status, 'PEDIDO_RECIBIDO')
  assert.equal(order.subtotal, product.price * 2)
  assert.equal(order.items.length, 1)
  assert.equal(order.items[0].productId, product.id)
})
