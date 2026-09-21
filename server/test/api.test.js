import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'dotenv/config'
import { createApp } from '../src/server.js'
import { pool } from '../src/db/pool.js'
import { removeUploadedFile } from '../src/middleware/upload.js'
import {
  createOrder,
  getPendingOrdersSummary,
  updateOrderStatus,
  deleteOrder,
  getOrderTracking,
} from '../src/services/orders.service.js'
import {
  createProduct,
  updateProduct,
  getProductBySlug,
  getProductById,
  SALE_ACTIVE_SQL,
} from '../src/services/products.service.js'
import { savePromoBanner, discountedPrice } from '../src/services/promotions.service.js'
import { addMessage, findOrCreateConversation, isValidGuestId } from '../src/services/chat.service.js'
import { assertCanUpload, addReference } from '../src/services/references.service.js'
import {
  placeBid,
  createAuction,
  deleteAuction,
  getAuctionConfig,
  setAuctionConfig,
  getPublicBidFeed,
  maskBidderName,
} from '../src/services/auctions.service.js'
import { setRealtimeServer } from '../src/realtime/liveEvents.js'
import { addComment } from '../src/services/auctionComments.service.js'
import { registerUser, signToken } from '../src/services/auth.service.js'

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

// Borra un pedido de prueba devolviendo antes el stock que descontó (salvo que ya estuviera cancelado,
// que devuelve el stock por sí solo), para que las pruebas no vayan gastando el inventario real.
async function removeOrder(id) {
  await pool.query(
    `UPDATE products p SET stock = p.stock + oi.quantity
     FROM order_items oi JOIN orders o ON o.id = oi.order_id
     WHERE oi.order_id = $1 AND oi.product_id = p.id AND o.status <> 'CANCELADO'`,
    [id],
  )
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

// Crea la cuenta directo por el servicio (no por HTTP) para no gastar el límite de 10 registros por hora
// por IP: el conjunto de pruebas crea más cuentas que eso.
async function registerTestUser(label) {
  const { user, token } = await registerUser({
    name: `Usuario ${label}`,
    email: `test-${label}-${Date.now()}@example.com`,
    phone: '3001234567',
    password: 'claveSegura123',
  })
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

// ---------------------------------------------------------------------------------------------
// Ofertas, stock, cancelación y seguimiento de pedidos
// ---------------------------------------------------------------------------------------------

const TEST_PRODUCT_BASE = { name: 'Producto de Prueba Oferta', categoryId: 'caballero', price: 50000, stock: 5 }

/** Crea un producto de prueba, corre `fn` con él y lo borra al final (con sus pedidos). */
async function withTestProduct(overrides, fn) {
  const product = await createProduct({ ...TEST_PRODUCT_BASE, ...overrides })
  try {
    return await fn(product)
  } finally {
    await pool.query('DELETE FROM orders WHERE id IN (SELECT order_id FROM order_items WHERE product_id = $1)', [product.id])
    await pool.query('DELETE FROM products WHERE id = $1', [product.id])
  }
}

test('oferta: el precio vigente es el de oferta, y el pedido cobra ese precio aunque el cliente mande otro', async () => {
  await withTestProduct({}, async (product) => {
    assert.equal(product.price, 50000)
    assert.equal(product.onSale, false)

    const onSale = await updateProduct(product.id, { salePrice: '40000' })
    assert.equal(onSale.price, 40000)
    assert.equal(onSale.regularPrice, 50000)
    assert.equal(onSale.onSale, true)

    const order = await createOrder({
      ...guestOrder,
      items: [{ productId: product.id, quantity: 2, price: 1 }],
    })
    assert.equal(order.items[0].price, 40000)
    assert.equal(order.total, 80000)
  })
})

test('oferta: vencida vuelve al precio normal y se puede quitar', async () => {
  await withTestProduct({}, async (product) => {
    const expired = await updateProduct(product.id, { salePrice: '30000', saleEndsOn: '2020-01-01' })
    assert.equal(expired.onSale, false)
    assert.equal(expired.price, 50000)

    const active = await updateProduct(product.id, { saleEndsOn: '2999-12-31' })
    assert.equal(active.onSale, true)
    assert.equal(active.price, 30000)

    const cleared = await updateProduct(product.id, { salePrice: '' })
    assert.equal(cleared.onSale, false)
    assert.equal(cleared.salePrice, null)
    assert.equal(cleared.saleEndsOn, null)
  })
})

test('productos: precios inválidos se rechazan (no se crean productos a $0 ni ofertas mayores al precio)', async () => {
  await assert.rejects(createProduct({ ...TEST_PRODUCT_BASE, price: '0' }), /precio/i)
  await assert.rejects(createProduct({ ...TEST_PRODUCT_BASE, price: 'abc' }), /precio/i)
  await assert.rejects(createProduct({ ...TEST_PRODUCT_BASE, price: '-5' }), /precio/i)
  await withTestProduct({}, async (product) => {
    await assert.rejects(updateProduct(product.id, { salePrice: '50000' }), /menor al precio normal/i)
    await assert.rejects(updateProduct(product.id, { salePrice: '60000' }), /menor al precio normal/i)
    await assert.rejects(updateProduct(product.id, { salePrice: '40000', saleEndsOn: 'mañana' }), /fecha/i)
    await updateProduct(product.id, { salePrice: '40000' })
    await assert.rejects(updateProduct(product.id, { price: '30000' }), /menor al precio normal/i)
  })
})

test('stock: el pedido lo descuenta, no deja vender de más y cancelar lo devuelve', async () => {
  await withTestProduct({ stock: 3 }, async (product) => {
    await assert.rejects(createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 4 }] }), /Solo quedan 3/)

    const first = await createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 2 }] })
    assert.equal((await getProductById(product.id)).stock, 1)
    await assert.rejects(createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 2 }] }), /Solo quedan 1/)

    const second = await createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] })
    assert.equal((await getProductById(product.id)).stock, 0)
    await assert.rejects(createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] }), /agotado/)

    await updateOrderStatus(first.id, 'CANCELADO')
    assert.equal((await getProductById(product.id)).stock, 2)
    // Cancelar dos veces no devuelve el stock dos veces.
    await updateOrderStatus(first.id, 'CANCELADO')
    assert.equal((await getProductById(product.id)).stock, 2)
    await updateOrderStatus(second.id, 'CANCELADO')
    assert.equal((await getProductById(product.id)).stock, 3)
  })
})

test('stock: varios pedidos a la vez por la última unidad, solo uno se la lleva', async () => {
  await withTestProduct({ stock: 1 }, async (product) => {
    const attempts = await Promise.allSettled([
      createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] }),
      createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] }),
      createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] }),
    ])
    assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1)
    assert.equal((await getProductById(product.id)).stock, 0)
  })
})

test('pedidos: solo se eliminan los cancelados y un cancelado no se reactiva', async () => {
  await withTestProduct({}, async (product) => {
    const order = await createOrder({ ...guestOrder, items: [{ productId: product.id, quantity: 1 }] })
    await assert.rejects(deleteOrder(order.id), /Solo se pueden eliminar pedidos cancelados/)
    await updateOrderStatus(order.id, 'ENTREGADO')
    await assert.rejects(deleteOrder(order.id), /Solo se pueden eliminar pedidos cancelados/)

    await updateOrderStatus(order.id, 'CANCELADO')
    await assert.rejects(updateOrderStatus(order.id, 'PEDIDO_RECIBIDO'), /no se puede reactivar/)
    await deleteOrder(order.id)
    await assert.rejects(deleteOrder(order.id), /no encontrado/i)
  })
})

test('seguimiento: con número de pedido y teléfono se ve el estado, con datos ajenos no', async () => {
  await withTestProduct({}, async (product) => {
    const order = await createOrder({ ...guestOrder, customerPhone: '3001234567', items: [{ productId: product.id, quantity: 1 }] })

    for (const phone of ['3001234567', '300 123 4567', '+57 300 123 4567']) {
      const tracking = await getOrderTracking({ orderId: order.id, phone })
      assert.equal(tracking.status, 'PEDIDO_RECIBIDO')
      assert.equal(tracking.items[0].name, product.name)
      assert.equal(tracking.address, undefined, 'no debe exponer la dirección')
      assert.equal(tracking.customerName, undefined, 'no debe exponer el nombre')
      assert.equal(tracking.customerEmail, undefined, 'no debe exponer el correo')
    }
    await assert.rejects(getOrderTracking({ orderId: order.id, phone: '3009999999' }), /No encontramos un pedido/)
    await assert.rejects(getOrderTracking({ orderId: 999999999, phone: '3001234567' }), /No encontramos un pedido/)
    await assert.rejects(getOrderTracking({ orderId: 'abc', phone: '3001234567' }), /número de pedido/)
    await assert.rejects(getOrderTracking({ orderId: order.id, phone: '123' }), /número de pedido/)

    const res = await postJson('/api/orders/track', { orderId: order.id, phone: '3001234567' })
    assert.equal(res.status, 200)
    assert.equal((await res.json()).id, order.id)
    assert.equal((await postJson('/api/orders/track', { orderId: order.id, phone: '3000000001' })).status, 404)
  })
})

test('productos inactivos: no salen a quien no es admin ni con includeInactive', async () => {
  await withTestProduct({}, async (product) => {
    await updateProduct(product.id, { active: false })
    const list = await (await fetch(`${baseUrl}/api/products?includeInactive=true`)).json()
    assert.equal(list.some((item) => item.id === product.id), false)
    assert.equal((await fetch(`${baseUrl}/api/products/${product.slug}`)).status, 404)
    assert.ok(await getProductBySlug(product.slug, { includeInactive: true }), 'el admin sí lo ve')
    assert.equal(await getProductBySlug(product.slug), null)
  })
})

test('entradas mal formadas dan 400 (o se ignoran), no 500', async () => {
  const broken = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"malformado',
  })
  assert.equal(broken.status, 400)
  assert.match((await broken.json()).error, /JSON/)

  for (const path of ['/api/products?search[]=a&search[]=b', '/api/products/featured?limit=abc', '/api/products/bestsellers?limit=-4']) {
    assert.equal((await fetch(`${baseUrl}${path}`)).status, 200, path)
  }
  const capped = await (await fetch(`${baseUrl}/api/products/featured?limit=99999`)).json()
  assert.ok(capped.length <= 100)

  const prices = await (await fetch(`${baseUrl}/api/products/prices?ids=1,2,abc`)).json()
  assert.deepEqual(prices.map((item) => item.id).sort(), [1, 2])
  assert.ok(prices.every((item) => Number.isInteger(item.price) && 'onSale' in item && 'stock' in item))
})

test('token falsificado con algoritmo "none" no da acceso', async () => {
  const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const forged = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 1, role: 'admin' })}.`
  const res = await fetch(`${baseUrl}/api/orders`, { headers: { Authorization: `Bearer ${forged}` } })
  assert.equal(res.status, 401)
})

test('chat: mensajes y datos con límites, y solo identificadores de invitado sencillos', async () => {
  assert.equal(isValidGuestId('0b13a684-909f-4e66-87fb-98fe939a2a6c'), true)
  for (const bad of ['', 'a', "x'; DROP TABLE users;--", '../../etc/passwd', 'a'.repeat(100), null, 12345678, {}]) {
    assert.equal(isValidGuestId(bad), false, String(bad))
  }
  await assert.rejects(findOrCreateConversation({ guestId: 'no valido!' }), /identificar la conversación/)
  await assert.rejects(addMessage({ conversationId: 1, senderRole: 'customer', body: 'x'.repeat(1001) }), /demasiado largo/)
  await assert.rejects(addMessage({ conversationId: 1, senderRole: 'customer', body: '   ' }), /vacío/)
  await assert.rejects(addMessage({ conversationId: 1, senderRole: 'customer', body: { $ne: 1 } }), /vacío/)
})

test('pujas: solo montos enteros y con tope', async () => {
  for (const amount of [1.5, 0, -10, 1e12, 'abc', null]) {
    await assert.rejects(placeBid({ auctionId: 1, userId: 1, amount }), /monto de la puja/, String(amount))
  }
})

test('referencias: archivos falsos se rechazan aunque el nombre y el tipo declarado parezcan válidos', async () => {
  const { user, headers } = await registerTestUser('falsos')
  try {
    const fakeVideo = await uploadReference(headers, {
      filename: 'video.mp4',
      type: 'video/mp4',
      content: Buffer.from('#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:0\nfile:///etc/passwd\n'),
    })
    assert.equal(fakeVideo.status, 400)
    assert.match((await fakeVideo.json()).error, /video ni una foto válidos/)

    const svgAsPng = await uploadReference(headers, {
      filename: 'foto.png',
      type: 'image/png',
      content: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    })
    assert.equal(svgAsPng.status, 400)

    assert.equal((await (await fetch(`${baseUrl}/api/references/mine`, { headers })).json()).length, 0, 'no debe quedar nada guardado')
  } finally {
    await removeTestUser(user.id)
  }
})

test('referencias: cada cuenta tiene tope de videos, y el admin no', async () => {
  const { user } = await registerTestUser('videos')
  try {
    for (let i = 0; i < 3; i += 1) {
      await addReference({ title: `Video ${i}`, mediaUrl: `/uploads/references/prueba-${i}.mp4`, mediaType: 'video', createdBy: user.id })
    }
    await assert.rejects(assertCanUpload({ userId: user.id, isAdmin: false, mediaType: 'video' }), /máximo por cuenta/)
    await assertCanUpload({ userId: user.id, isAdmin: true, mediaType: 'video' })
    await assertCanUpload({ userId: user.id, isAdmin: false, mediaType: 'image' })
    await assert.rejects(
      addReference({ title: 'x'.repeat(121), mediaUrl: '/uploads/references/a.mp4', mediaType: 'video', createdBy: user.id }),
      /demasiado largo/,
    )
  } finally {
    await removeTestUser(user.id)
  }
})

// ---------------------------------------------------------------------------------------------
// Franja de promoción sincronizada con el producto en oferta
// ---------------------------------------------------------------------------------------------

async function saleState(client, id) {
  const { rows } = await client.query(
    `SELECT price, sale_price, sale_from_banner, ${SALE_ACTIVE_SQL} AS active FROM products WHERE id = $1`,
    [id],
  )
  return rows[0]
}

/** Corre `fn` con un cliente dentro de una transacción que se deshace: la franja real no se toca. */
async function inRolledBackTransaction(fn) {
  const client = await pool.connect()
  await client.query('BEGIN')
  try {
    return await fn(client)
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
}

test('promoción: el descuento se calcula redondeando a los 100 pesos más cercanos', () => {
  assert.equal(discountedPrice(211000, 20), 168800)
  assert.equal(discountedPrice(50000, 20), 40000)
  assert.equal(discountedPrice(99000, 15), 84200)
  assert.equal(discountedPrice(120000, 90), 12000)
})

test('promoción: el producto elegido baja de precio y lo recupera al cambiar de promoción o apagarla', async () => {
  await withTestProduct({ name: 'Producto Promo A', price: 50000 }, async (a) => {
    await withTestProduct({ name: 'Producto Promo B', price: 80000 }, async (b) => {
      await inRolledBackTransaction(async (client) => {
        const base = { enabled: true, message: '20% DESCUENTO', linkLabel: 'COMPRAR', expiresAt: '2999-12-31' }

        const saved = await savePromoBanner({ ...base, productId: a.id, discountPercent: 20 }, { client })
        assert.equal(saved.linkTo, `/producto/${a.slug}`, 'el enlace apunta al producto')
        assert.equal(saved.product.id, a.id)
        assert.equal(saved.discountPercent, 20)
        let stateA = await saleState(client, a.id)
        assert.deepEqual([stateA.sale_price, stateA.active, stateA.sale_from_banner], [40000, true, true])

        // Se cambia de promoción: A vuelve a su precio y B recibe el descuento.
        await savePromoBanner({ ...base, productId: b.id, discountPercent: 15 }, { client })
        stateA = await saleState(client, a.id)
        assert.deepEqual([stateA.sale_price, stateA.sale_from_banner], [null, false])
        let stateB = await saleState(client, b.id)
        assert.deepEqual([stateB.sale_price, stateB.active], [68000, true])

        // Se apaga la franja: B también vuelve a su precio.
        await savePromoBanner({ ...base, enabled: false, productId: b.id, discountPercent: 15 }, { client })
        stateB = await saleState(client, b.id)
        assert.deepEqual([stateB.sale_price, stateB.sale_from_banner], [null, false])

        // Se vuelve a encender y luego se deja la franja solo como mensaje (sin producto).
        await savePromoBanner({ ...base, productId: b.id, discountPercent: 30 }, { client })
        assert.equal((await saleState(client, b.id)).sale_price, 56000)
        const textOnly = await savePromoBanner({ ...base, linkTo: '/catalogo' }, { client })
        assert.equal(textOnly.product, null)
        assert.equal(textOnly.linkTo, '/catalogo')
        assert.equal((await saleState(client, b.id)).sale_price, null)
      })
    })
  })
})

test('promoción: una oferta puesta a mano en otro producto no la borra la franja', async () => {
  await withTestProduct({ name: 'Producto Promo Manual', price: 50000 }, async (manual) => {
    await withTestProduct({ name: 'Producto Promo C', price: 60000 }, async (c) => {
      await updateProduct(manual.id, { salePrice: '45000' })
      assert.equal((await getProductById(manual.id)).saleFromBanner, false)

      await inRolledBackTransaction(async (client) => {
        const base = { enabled: true, message: 'x', expiresAt: '' }
        await savePromoBanner({ ...base, productId: c.id, discountPercent: 10 }, { client })
        await savePromoBanner({ ...base, enabled: false, productId: c.id, discountPercent: 10 }, { client })
        assert.equal((await saleState(client, manual.id)).sale_price, 45000, 'la oferta manual sigue')
        assert.equal((await saleState(client, c.id)).sale_price, null)
      })
    })
  })
})

test('promoción: entradas inválidas se rechazan', async () => {
  await withTestProduct({ name: 'Producto Promo D', price: 60 }, async (cheap) => {
    await inRolledBackTransaction(async (client) => {
      const base = { enabled: true, message: 'x' }
      await assert.rejects(savePromoBanner({ ...base, productId: cheap.id, discountPercent: 0 }, { client }), /entre 1 y 90/)
      await assert.rejects(savePromoBanner({ ...base, productId: cheap.id, discountPercent: 91 }, { client }), /entre 1 y 90/)
      await assert.rejects(savePromoBanner({ ...base, productId: cheap.id, discountPercent: 'abc' }, { client }), /entre 1 y 90/)
      await assert.rejects(savePromoBanner({ ...base, productId: cheap.id }, { client }), /porcentaje/)
      await assert.rejects(savePromoBanner({ ...base, discountPercent: 10 }, { client }), /Elige el producto/)
      await assert.rejects(savePromoBanner({ ...base, productId: 999999999, discountPercent: 10 }, { client }), /no existe/)
      await assert.rejects(savePromoBanner({ ...base, productId: cheap.id, discountPercent: 1 }, { client }), /no cambia el precio/)
      await assert.rejects(savePromoBanner({ ...base, expiresAt: 'mañana' }, { client }), /fecha/)
    })
  })
})

test('sala de subasta: los nombres se abrevian y no se filtra ningún dato de contacto', () => {
  assert.equal(maskBidderName('Ana Pérez Gómez'), 'Ana P.')
  assert.equal(maskBidderName('  marlon   morales '), 'marlon M.')
  assert.equal(maskBidderName('Ana'), 'Ana')
  for (const empty of ['', '   ', null, undefined]) assert.equal(maskBidderName(empty), 'Participante')
  assert.ok(maskBidderName('x'.repeat(200)).length <= 20)
})

test('sala de subasta: cada puja se anuncia en vivo y el feed público la muestra sin datos privados', async () => {
  const product = await firstProductWithStock(1)
  const { user, headers } = await registerTestUser('sala')
  const wasEnabled = (await getAuctionConfig()).enabled
  let auctionId
  const announced = []
  setRealtimeServer({ to: (room) => ({ emit: (event, payload) => announced.push({ room, event, payload }) }) })
  try {
    if (!wasEnabled) await setAuctionConfig(true)
    const now = Date.now()
    const auction = await createAuction({
      title: 'Subasta de prueba sala',
      startingPrice: 50000,
      minIncrement: 5000,
      startsAt: new Date(now - 60_000).toISOString(),
      endsAt: new Date(now + 3_600_000).toISOString(),
      items: [{ productId: product.id, quantity: 1 }],
    })
    auctionId = auction.id

    const first = await postJson(`/api/auctions/${auctionId}/bids`, { amount: 50000 }, headers)
    assert.equal(first.status, 201)
    const body = await first.json()
    assert.equal(body.lastBid, undefined, 'la respuesta no lleva el aviso interno')

    assert.equal(announced.length, 1)
    assert.equal(announced[0].room, 'auction-room')
    assert.equal(announced[0].event, 'auction:bid')
    assert.equal(announced[0].payload.auctionId, auctionId)
    assert.equal(announced[0].payload.bid.amount, 50000)
    assert.equal(announced[0].payload.bid.bidder, 'Usuario S.')
    assert.equal(announced[0].payload.currentPrice, 50000)
    assert.equal(announced[0].payload.nextMinBid, 55000)

    // Una puja rechazada no se anuncia.
    const rejected = await postJson(`/api/auctions/${auctionId}/bids`, { amount: 50001 }, headers)
    assert.equal(rejected.status, 400)
    assert.equal(announced.length, 1)

    await postJson(`/api/auctions/${auctionId}/bids`, { amount: 55000 }, headers)
    const feedRes = await fetch(`${baseUrl}/api/auctions/${auctionId}/feed`)
    assert.equal(feedRes.status, 200)
    const feed = await feedRes.json()
    assert.deepEqual(feed.map((bid) => bid.amount), [55000, 50000], 'la más reciente primero')
    assert.deepEqual(Object.keys(feed[0]).sort(), ['amount', 'bidder', 'createdAt', 'id'])
    assert.ok(!JSON.stringify(feed).includes(user.email))

    assert.equal((await getPublicBidFeed(auctionId)).length, 2)
    assert.equal((await fetch(`${baseUrl}/api/auctions/abc/feed`)).status, 400)
  } finally {
    setRealtimeServer(null)
    if (auctionId) await deleteAuction(auctionId)
    if (!wasEnabled) await setAuctionConfig(false)
    await removeTestUser(user.id)
  }
})

async function withLiveAuction(run, { closed = false } = {}) {
  const product = await firstProductWithStock(1)
  const wasEnabled = (await getAuctionConfig()).enabled
  const announced = []
  setRealtimeServer({ to: (room) => ({ emit: (event, payload) => announced.push({ room, event, payload }) }) })
  let auctionId
  try {
    if (!wasEnabled) await setAuctionConfig(true)
    const now = Date.now()
    const auction = await createAuction({
      title: 'Subasta de prueba comentarios',
      startingPrice: 50000,
      minIncrement: 5000,
      startsAt: new Date(now - (closed ? 7_200_000 : 60_000)).toISOString(),
      endsAt: new Date(now + (closed ? -3_600_000 : 3_600_000)).toISOString(),
      items: [{ productId: product.id, quantity: 1 }],
    })
    auctionId = auction.id
    await run({ auctionId, announced })
  } finally {
    setRealtimeServer(null)
    if (auctionId) await deleteAuction(auctionId)
    if (!wasEnabled) await setAuctionConfig(false)
  }
}

test('comentarios: sin sesion no se comenta, el publico ve nombres abreviados y el admin sale como la tienda', async () => {
  const { user, headers } = await registerTestUser('coment')
  const admin = await registerTestUser('admincoment')
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [admin.user.id])
  const adminHeaders = { Authorization: `Bearer ${signToken({ id: admin.user.id, role: 'admin' })}` }
  try {
    await withLiveAuction(async ({ auctionId, announced }) => {
      const url = `/api/auctions/${auctionId}/comments`
      assert.equal((await postJson(url, { body: 'hola' })).status, 401)

      const mine = await postJson(url, { body: '  Ojalá   gano   esta  ' }, headers)
      assert.equal(mine.status, 201)
      const created = await mine.json()
      assert.equal(created.body, 'Ojalá gano esta', 'se limpian los espacios')
      assert.equal(created.author, 'Usuario C.')
      assert.equal(created.isAdmin, false)
      assert.equal(announced.at(-1).event, 'auction:comment')
      assert.equal(announced.at(-1).payload.comment.id, created.id)

      // Un desconocido no puede meter enlaces; el admin si.
      assert.equal((await postJson(url, { body: 'entra a www.estafa.com' }, headers)).status, 400)
      const promo = await postJson(url, { body: 'Mas info en https://essencepolar.com' }, adminHeaders)
      assert.equal(promo.status, 201)
      const promoBody = await promo.json()
      assert.equal(promoBody.author, 'Essence Polar')
      assert.equal(promoBody.isAdmin, true)

      const list = await (await fetch(`${baseUrl}${url}`)).json()
      assert.deepEqual(list.map((c) => c.id), [promoBody.id, created.id], 'el mas reciente primero')
      assert.deepEqual(Object.keys(list[0]).sort(), ['author', 'body', 'createdAt', 'id', 'isAdmin'])
      assert.ok(!JSON.stringify(list).includes(user.email))

      // Solo el admin ve nombre completo y contacto.
      assert.equal((await fetch(`${baseUrl}${url}/admin`)).status, 401)
      assert.equal((await fetch(`${baseUrl}${url}/admin`, { headers })).status, 403)
      const full = await (await fetch(`${baseUrl}${url}/admin`, { headers: adminHeaders })).json()
      assert.equal(full.find((c) => c.id === created.id).author.email, user.email)

      // Borrar: solo el admin, se avisa a la sala y desaparece.
      const del = (id, h) => fetch(`${baseUrl}${url}/${id}`, { method: 'DELETE', headers: h })
      assert.equal((await del(created.id, headers)).status, 403)
      assert.equal((await del(created.id, adminHeaders)).status, 204)
      assert.equal(announced.at(-1).event, 'auction:comment-deleted')
      assert.equal(announced.at(-1).payload.commentId, created.id)
      assert.equal((await del(created.id, adminHeaders)).status, 404)
      assert.equal((await (await fetch(`${baseUrl}${url}`)).json()).length, 1)
      assert.equal((await fetch(`${baseUrl}/api/auctions/abc/comments`)).status, 400)
    })
  } finally {
    await removeTestUser(user.id)
    await removeTestUser(admin.user.id)
  }
})

test('comentarios: texto invalido, subasta cerrada y limite de velocidad', async () => {
  const { user, headers } = await registerTestUser('comentlim')
  try {
    await withLiveAuction(async ({ auctionId }) => {
      for (const bad of [undefined, null, '', '   ', String.fromCharCode(10, 9), 12345, {}, 'x'.repeat(301), 'x'.repeat(2001)]) {
        await assert.rejects(addComment({ auctionId, userId: user.id, body: bad }), { status: 400 }, String(bad).slice(0, 20))
      }
      await assert.rejects(addComment({ auctionId: 999999, userId: user.id, body: 'hola' }), { status: 404 })

      // Cinco comentarios seguidos: el quinto se frena.
      const statuses = []
      for (let i = 0; i < 5; i += 1) {
        statuses.push((await postJson(`/api/auctions/${auctionId}/comments`, { body: `mensaje ${i}` }, headers)).status)
      }
      assert.deepEqual(statuses, [201, 201, 201, 201, 429])
    })

    await withLiveAuction(async ({ auctionId }) => {
      await assert.rejects(addComment({ auctionId, userId: user.id, body: 'tarde' }), { status: 400 })
    }, { closed: true })
  } finally {
    await removeTestUser(user.id)
  }
})
