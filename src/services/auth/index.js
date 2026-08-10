import { hashPassword } from './crypto'

/**
 * Capa de autenticación. Hoy persiste en localStorage con la misma forma que
 * la tabla `users` (ver docs/DATABASE_SCHEMA.sql); cuando exista backend,
 * estas funciones pasan a llamar la API y dejan de tocar localStorage.
 */
const USERS_KEY = 'essence_users'
const SESSION_KEY = 'essence_session'
const SIMULATED_LATENCY_MS = 300

// Credenciales de la cuenta admin sembrada automáticamente (ver ensureAdminSeed).
// Solo para esta fase sin backend: en producción el admin se crea desde el
// servidor, nunca hardcodeado en el cliente.
export const SEEDED_ADMIN_EMAIL = 'admin@essencepolar.com'
export const SEEDED_ADMIN_PASSWORD = 'Admin123!'

function delay(ms = SIMULATED_LATENCY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user
  return publicUser
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export async function registerUser({ name, email, phone, password, city, address }) {
  await delay()
  const users = readUsers()
  const alreadyExists = users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())
  if (alreadyExists) {
    throw new Error('Ya existe una cuenta registrada con este email.')
  }

  const now = new Date().toISOString()
  const user = {
    id: users.reduce((max, existing) => Math.max(max, existing.id), 0) + 1,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    passwordHash: await hashPassword(password),
    role: 'customer',
    city: city.trim(),
    address: address.trim(),
    createdAt: now,
    updatedAt: now,
  }

  writeUsers([...users, user])
  const publicUser = toPublicUser(user)
  setSession(publicUser)
  return publicUser
}

export async function loginUser({ email, password }) {
  await delay()
  const users = readUsers()
  const user = users.find((existing) => existing.email === email.trim().toLowerCase())
  if (!user) {
    throw new Error('No existe una cuenta con este email.')
  }

  const passwordHash = await hashPassword(password)
  if (passwordHash !== user.passwordHash) {
    throw new Error('Contraseña incorrecta.')
  }

  const publicUser = toPublicUser(user)
  setSession(publicUser)
  return publicUser
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Crea la cuenta admin si todavía no existe ninguna. Se llama una vez al
 * cargar la app (ver AuthContext). Idempotente: no hace nada si ya hay admin.
 */
export async function ensureAdminSeed() {
  const users = readUsers()
  if (users.some((user) => user.role === 'admin')) return

  const now = new Date().toISOString()
  const admin = {
    id: users.reduce((max, existing) => Math.max(max, existing.id), 0) + 1,
    name: 'Administrador',
    email: SEEDED_ADMIN_EMAIL,
    phone: '3000000000',
    passwordHash: await hashPassword(SEEDED_ADMIN_PASSWORD),
    role: 'admin',
    city: '',
    address: '',
    createdAt: now,
    updatedAt: now,
  }

  writeUsers([...users, admin])
}

export async function getAllUsers() {
  await delay(0)
  return readUsers().map(toPublicUser)
}
