import { createClient } from '@supabase/supabase-js'

let client = null

function getClient() {
  if (client) return client
  client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  return client
}

/** Sube el buffer de un archivo (ya viene de multer con memoryStorage) a un bucket público y devuelve su URL pública completa. */
export async function uploadToSupabaseStorage(bucket, subdir, file) {
  const ext = file.originalname ? file.originalname.match(/\.[a-z0-9]+$/i)?.[0] ?? '' : ''
  const key = `${subdir}/${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(key, file.buffer, { contentType: file.mimetype, upsert: false })
  if (error) throw new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`)
  const { data } = getClient().storage.from(bucket).getPublicUrl(key)
  return data.publicUrl
}

/** Borra un archivo de Storage a partir de su URL pública completa. No falla si la URL no coincide con ningún bucket conocido. */
export async function removeUploadedFile(publicUrl) {
  const match = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/.exec(publicUrl ?? '')
  if (!match) return
  const [, bucket, key] = match
  await getClient().storage.from(bucket).remove([key]).catch(() => {})
}
