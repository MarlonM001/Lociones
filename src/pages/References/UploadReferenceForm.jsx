import { useCallback, useEffect, useRef, useState } from 'react'
import { addReference, getReferencesByUser, MAX_IMAGES_PER_USER } from '@/services/references'
import { useAuth } from '@/hooks/useAuth'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useToast } from '@/hooks/useToast'
import { isNonEmpty, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = { title: '', description: '', city: '' }

const RULES = {
  title: (value) => (!isNonEmpty(value) ? 'Ingresa un título' : null),
}

const FILE_ACCEPT = 'image/jpeg,image/png,image/webp'
const FILE_HINT = `JPG, PNG o WEBP, máx. 8 MB. Hasta ${MAX_IMAGES_PER_USER} fotos por cuenta.`

const inputClass =
  'w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none'

export function UploadReferenceForm({ onUploaded }) {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [imagesUsed, setImagesUsed] = useState(0)

  const isAdmin = user?.role === 'admin'
  const imagesLeft = MAX_IMAGES_PER_USER - imagesUsed
  const photoLimitReached = !isAdmin && Boolean(user) && imagesLeft <= 0

  const loadImagesUsed = useCallback(async () => {
    if (!user) {
      setImagesUsed(0)
      return
    }
    const mine = await getReferencesByUser().catch(() => [])
    setImagesUsed(mine.filter((reference) => reference.mediaType === 'image').length)
  }, [user])

  useEffect(() => {
    loadImagesUsed()
  }, [loadImagesUsed])

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const upload = async () => {
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    const file = fileInputRef.current?.files?.[0]
    setErrors(fieldErrors)
    setFileError(!file ? 'Selecciona una foto' : null)
    if (!valid || !file) return

    setSubmitting(true)
    try {
      await addReference({ ...values, file })
      setValues(INITIAL_VALUES)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('¡Gracias! Tu foto quedó en revisión y se publicará cuando sea aprobada.')
      loadImagesUsed()
      onUploaded?.()
    } catch (error) {
      setFileError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    requireAuth(upload)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
      <h2 className="font-display text-xl text-ivory">Comparte tu entrega</h2>
      <p className="mt-1 text-sm text-ivory-dim">
        Necesitas iniciar sesión. Todo lo que subas pasa por revisión antes de aparecer en la galería.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="reference-title" className="mb-1 block text-sm text-ivory-dim">Título</label>
          <input
            id="reference-title"
            type="text"
            value={values.title}
            onChange={handleChange('title')}
            placeholder="Ej. Entrega en Yopal"
            className={inputClass}
          />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="reference-city" className="mb-1 block text-sm text-ivory-dim">Ciudad (opcional)</label>
          <input id="reference-city" type="text" value={values.city} onChange={handleChange('city')} className={inputClass} />
        </div>

        <div>
          <label htmlFor="reference-description" className="mb-1 block text-sm text-ivory-dim">Descripción (opcional)</label>
          <textarea
            id="reference-description"
            value={values.description}
            onChange={handleChange('description')}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="reference-file" className="mb-1 block text-sm text-ivory-dim">Foto</label>
          <input
            id="reference-file"
            ref={fileInputRef}
            type="file"
            accept={FILE_ACCEPT}
            disabled={photoLimitReached}
            className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-ivory-dim">{FILE_HINT}</p>
          {user && !isAdmin && (
            <p className={`mt-1 text-xs ${photoLimitReached ? 'text-danger' : 'text-gold'}`}>
              {photoLimitReached
                ? 'Ya subiste tus 2 fotos. Elimina una para subir otra.'
                : imagesLeft === 1
                  ? 'Te queda 1 foto por subir.'
                  : `Te quedan ${imagesLeft} fotos por subir.`}
            </p>
          )}
          {fileError && <p className="mt-1 text-xs text-danger">{fileError}</p>}
        </div>
      </div>

      <Button type="submit" variant="primary" className="mt-6" fullWidth disabled={submitting || photoLimitReached}>
        {submitting ? 'Subiendo...' : 'Subir foto'}
      </Button>
    </form>
  )
}
