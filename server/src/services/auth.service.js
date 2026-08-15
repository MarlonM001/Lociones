import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db/pool.js'
import { ApiError } from '../utils/ApiError.js'
import { isValidEmail, isValidPhone } from '../utils/validation.js'

const SALT_ROUNDS = 10

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    city: row.city ?? '',
    address: row.address ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  })
}

export async function registerUser({ name, email, phone, password, city, address }) {
  if (!name?.trim()) throw ApiError.badRequest('El nombre es obligatorio.')
  if (!isValidEmail(email)) throw ApiError.badRequest('Email inválido.')
  if (!isValidPhone(phone)) throw ApiError.badRequest('Teléfono inválido.')
  if (typeof password !== 'string' || password.trim().length < 8) {
    throw ApiError.badRequest('La contraseña debe tener al menos 8 caracteres.')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const { rows: existingRows } = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
  if (existingRows.length > 0) {
    throw ApiError.conflict('Ya existe una cuenta registrada con este email.')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, city, address)
     VALUES ($1, $2, $3, $4, 'customer', $5, $6)
     RETURNING *`,
    [name.trim(), normalizedEmail, phone.trim(), passwordHash, city?.trim() || '', address?.trim() || ''],
  )
  const user = toPublicUser(rows[0])
  return { user, token: signToken(user) }
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email?.trim().toLowerCase()
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [normalizedEmail])
  const row = rows[0]
  if (!row) throw ApiError.unauthorized('No existe una cuenta con este email.')

  const matches = await bcrypt.compare(password ?? '', row.password_hash)
  if (!matches) throw ApiError.unauthorized('Contraseña incorrecta.')

  const user = toPublicUser(row)
  return { user, token: signToken(user) }
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ? toPublicUser(rows[0]) : null
}

export async function listUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id ASC')
  return rows.map(toPublicUser)
}
