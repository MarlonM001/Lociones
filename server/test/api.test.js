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

const guestOrder = {
  customerName: 'Cliente de Prueba',
  customerPhone: '3000000000',
  city: 'Medellín',
  address: 'Carrera 45',
}

const postJson = (path, body, headers = {}) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })

async function firstProductWithStock(minStock = 2) {
  const products = await (await fetch(`${baseUrl}/api/products`)).json()
  return products.find((product) => product.stock >= minStock)
}

async function removeOrder(id) {
  await pool.query('DELETE FROM orders WHERE id = $1', [id])
}

test('crear un pedido de invitado calcula el total y devuelve los items', async () => {
  const product = await firstProductWithStock()

  const orderRes = await postJson('/api/orders', {
    ...guestOrder,
    items: [{ productId: product.id, name: product.name, quantity: 2, price: product.price }],
  })
  assert.equal(orderRes.status, 201)
  const order = await orderRes.json()
  try {
    assert.equal(order.status, 'PEDIDO_RECIBIDO')
    assert.equal(order.subtotal, product.price * 2)
    assert.equal(order.items.length, 1)
    assert.equal(order.items[0].productId, product.id)
  } finally {
    await removeOrder(order.id)
  }
})

test('pedido: el servidor ignora el precio, el nombre y el envío que manda el cliente', async () => {
  const product = await firstProductWithStock()

  const res = await postJson('/api/orders', {
    ...guestOrder,
    shipping: -50000,
    items: [{ productId: product.id, name: 'otro nombre', quantity: 1, price: 1 }],
  })
  assert.equal(res.status, 201)
  const order = await res.json()
  try {
    assert.equal(order.items[0].price, product.price)
    assert.equal(order.subtotal, product.price)
    assert.equal(order.shipping, 0)
    assert.equal(order.total, product.price)
    assert.equal(order.items[0].name, product.name)
  } finally {
    await removeOrder(order.id)
  }
})

test('pedido: rechaza cantidades inválidas, productos inexistentes y stock insuficiente', async () => {
  const product = await firstProductWithStock()
  const bad = async (items) => {
    const res = await postJson('/api/orders', { ...guestOrder, items })
    assert.equal(res.status, 400, JSON.stringify(items))
    assert.ok((await res.json()).error)
  }

  await bad([{ productId: product.id, quantity: -3, price: 50000 }])
  await bad([{ productId: product.id, quantity: 0 }])
  await bad([{ productId: product.id, quantity: 1.5 }])
  await bad([{ productId: product.id, quantity: '2; DROP TABLE orders' }])
  await bad([{ productId: 999999, quantity: 1 }])
  await bad([{ productId: 'abc', quantity: 1 }])
  await bad([{ productId: product.id, quantity: product.stock + 1 }])
  // Repetir el producto en varias líneas no permite saltarse el stock.
  await bad([
    { productId: product.id, quantity: product.stock },
    { productId: product.id, quantity: 1 },
  ])
  await bad([])

  const wrongTypes = await postJson('/api/orders', {
    ...guestOrder,
    customerName: { $ne: null },
    items: [{ productId: product.id, quantity: 1 }],
  })
  assert.equal(wrongTypes.status, 400)
})

test('login: el mensaje de error no revela si el email existe', async () => {
  const email = `test-enum-${Date.now()}@example.com`
  await postJson('/api/auth/register', {
    name: 'Usuario Enum',
    email,
    phone: '3001234567',
    password: 'claveSegura123',
  })

  const wrongPassword = await postJson('/api/auth/login', { email, password: 'incorrecta123' })
  const unknownEmail = await postJson('/api/auth/login', { email: `nadie-${Date.now()}@example.com`, password: 'incorrecta123' })
  assert.equal(wrongPassword.status, 401)
  assert.equal(unknownEmail.status, 401)
  assert.equal((await wrongPassword.json()).error, (await unknownEmail.json()).error)

  const notStrings = await postJson('/api/auth/login', { email: { $gt: '' }, password: ['x'] })
  assert.equal(notStrings.status, 401)
})

test('login: tras 5 intentos fallidos la cuenta se bloquea temporalmente, incluso con la clave correcta', async () => {
  const email = `test-lock-${Date.now()}@example.com`
  await postJson('/api/auth/register', {
    name: 'Usuario Lock',
    email,
    phone: '3001234567',
    password: 'claveSegura123',
  })

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await postJson('/api/auth/login', { email, password: `mala-${attempt}` })
    assert.equal(res.status, 401)
  }

  const locked = await postJson('/api/auth/login', { email, password: 'claveSegura123' })
  assert.equal(locked.status, 429)
  assert.ok(Number(locked.headers.get('retry-after')) > 0)
})
