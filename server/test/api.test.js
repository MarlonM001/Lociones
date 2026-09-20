import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { createApp } from '../src/server.js'
import { pool } from '../src/db/pool.js'
import { removeUploadedFile } from '../src/middleware/upload.js'
import { createOrder, getPendingOrdersSummary } from '../src/services/orders.service.js'

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
  customerEmail: 'cliente.prueba@example.com',
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

// 1x1 PNG válido, suficiente para probar la subida de fotos de referencia.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

async function removeTestUser(userId) {
  const { rows } = await pool.query('DELETE FROM delivery_references WHERE created_by = $1 RETURNING video_url', [userId])
  await Promise.all(rows.map((row) => removeUploadedFile(row.video_url)))
  await pool.query('DELETE FROM users WHERE id = $1', [userId])
}

async function registerTestUser(label) {
  const res = await postJson('/api/auth/register', {
    name: `Usuario ${label}`,
    email: `test-${label}-${Date.now()}@example.com`,
    phone: '3001234567',
    password: 'claveSegura123',
  })
  const { user, token } = await res.json()
  return { user, headers: { Authorization: `Bearer ${token}` } }
}

function uploadReference(headers, { filename, type, content = TINY_PNG, title = 'Mi entrega' }) {
  const form = new FormData()
  form.append('title', title)
  form.append('media', new Blob([content], { type }), filename)
  return fetch(`${baseUrl}/api/references`, { method: 'POST', headers, body: form })
}

test('referencias: cada cuenta puede subir máximo 2 fotos y puede borrarlas', async () => {
  const { user, headers } = await registerTestUser('fotos')
  const created = []
  try {
    for (const name of ['uno.png', 'dos.png']) {
      const res = await uploadReference(headers, { filename: name, type: 'image/png' })
      assert.equal(res.status, 201)
      const reference = await res.json()
      assert.equal(reference.mediaType, 'image')
      assert.equal(reference.status, 'pending')
      assert.match(reference.mediaUrl, /^\/uploads\/references\/.+\.png$/)
      created.push(reference)
    }

    const third = await uploadReference(headers, { filename: 'tres.png', type: 'image/png' })
    assert.equal(third.status, 409)

    const del = await fetch(`${baseUrl}/api/references/${created[0].id}`, { method: 'DELETE', headers })
    assert.equal(del.status, 204)

    const again = await uploadReference(headers, { filename: 'cuatro.png', type: 'image/png' })
    assert.equal(again.status, 201)
    created.push(await again.json())
  } finally {
    await removeTestUser(user.id)
  }
})

test('referencias: rechaza formatos no permitidos y solo el dueño (o admin) puede borrar', async () => {
  const owner = await registerTestUser('dueno')
  const stranger = await registerTestUser('ajeno')
  try {
    const html = await uploadReference(owner.headers, { filename: 'malo.html', type: 'text/html', content: '<script>1</script>' })
    assert.equal(html.status, 400)
    const svg = await uploadReference(owner.headers, { filename: 'malo.svg', type: 'image/svg+xml', content: '<svg/>' })
    assert.equal(svg.status, 400)
    const disguised = await uploadReference(owner.headers, { filename: 'foto.html', type: 'image/png' })
    assert.equal(disguised.status, 400)
    const noAuth = await uploadReference({}, { filename: 'a.png', type: 'image/png' })
    assert.equal(noAuth.status, 401)

    const ok = await uploadReference(owner.headers, { filename: 'a.png', type: 'image/png' })
    assert.equal(ok.status, 201)
    const { id } = await ok.json()

    const forbidden = await fetch(`${baseUrl}/api/references/${id}`, { method: 'DELETE', headers: stranger.headers })
    assert.equal(forbidden.status, 403)
    const deleted = await fetch(`${baseUrl}/api/references/${id}`, { method: 'DELETE', headers: owner.headers })
    assert.equal(deleted.status, 204)
  } finally {
    for (const { user } of [owner, stranger]) {
      await removeTestUser(user.id)
    }
  }
})

test('pedido de una cuenta: el detalle trae la foto y el sku de cada producto y los datos de la cuenta', async () => {
  const { user, headers } = await registerTestUser('detalle')
  const product = await firstProductWithStock()

  const createRes = await postJson(
    '/api/orders',
    { ...guestOrder, items: [{ productId: product.id, quantity: 2 }] },
    headers,
  )
  assert.equal(createRes.status, 201)
  const created = await createRes.json()
  try {
    const detailRes = await fetch(`${baseUrl}/api/orders/${created.id}`, { headers })
    assert.equal(detailRes.status, 200)
    const detail = await detailRes.json()

    assert.equal(detail.items.length, 1)
    assert.equal(detail.items[0].quantity, 2)
    assert.equal(detail.items[0].sku, product.sku)
    assert.equal(detail.items[0].slug, product.slug)
    assert.equal(detail.items[0].image, product.image)
    assert.deepEqual(detail.account, { id: user.id, name: user.name, email: user.email, phone: '3001234567' })
  } finally {
    await removeOrder(created.id)
    await removeTestUser(user.id)
  }
})

test('pedido de invitado: el detalle no trae cuenta', async () => {
  const { user, headers } = await registerTestUser('invitado')
  const product = await firstProductWithStock()

  const createRes = await postJson('/api/orders', { ...guestOrder, items: [{ productId: product.id, quantity: 1 }] })
  assert.equal(createRes.status, 201)
  const created = await createRes.json()
  try {
    assert.equal(created.account, null)
    // Un pedido de invitado no tiene dueño: un cliente cualquiera no puede leerlo.
    const otherRes = await fetch(`${baseUrl}/api/orders/${created.id}`, { headers })
    assert.equal(otherRes.status, 403)
  } finally {
    await removeOrder(created.id)
    await removeTestUser(user.id)
  }
})

test('pedido: el correo es obligatorio y debe tener formato válido', async () => {
  // Directo sobre el servicio: la validación corre antes de tocar la base y así
  // no gastamos el límite de pedidos por IP que ya usan los demás tests.
  const items = [{ productId: 1, quantity: 1 }]
  const { customerEmail: _omitted, ...withoutEmail } = guestOrder

  await assert.rejects(createOrder({ ...withoutEmail, items }), /correo/i)
  await assert.rejects(createOrder({ ...guestOrder, customerEmail: '   ', items }), /correo/i)
  await assert.rejects(createOrder({ ...guestOrder, customerEmail: 'no-es-un-correo', items }), /correo/i)
})

test('resumen de pedidos pendientes: solo admin, y refleja un pedido recién creado', async () => {
  // Sin sesión y con sesión de cliente no se puede consultar.
  assert.equal((await fetch(`${baseUrl}/api/orders/pending-summary`)).status, 401)
  const { user, headers } = await registerTestUser('resumen')
  const customerRes = await fetch(`${baseUrl}/api/orders/pending-summary`, { headers })
  assert.equal(customerRes.status, 403)
  await removeTestUser(user.id)

  const product = await firstProductWithStock()
  const before = await getPendingOrdersSummary()
  const created = await createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] })
  try {
    const after = await getPendingOrdersSummary()
    assert.equal(after.pending, before.pending + 1)
    assert.equal(after.latest.id, created.id)
    assert.equal(after.latest.customerName, guestOrder.customerName)
    assert.equal(after.latest.total, created.total)
  } finally {
    await removeOrder(created.id)
  }
})
