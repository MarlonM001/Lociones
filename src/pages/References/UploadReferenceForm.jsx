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

const KINDS = {
  video: {
    label: 'Video',
    accept: 'video/*',
    hint: 'Formatos de video comunes, máx. 100 MB.',
    fileError: 'Selecciona un video',
    done: '¡Gracias! Tu video quedó en revisión y se publicará cuando sea aprobado.',
  },
  image: {
    label: 'Foto',
    accept: 'image/jpeg,image/png,image/webp',
    hint: `JPG, PNG o WEBP, máx. 8 MB. Hasta ${MAX_IMAGES_PER_USER} fotos por cuenta.`,
    fileError: 'Selecciona una foto',
    done: '¡Gracias! Tu foto quedó en revisión y se publicará cuando sea aprobada.',
  },
}

const inputClass =
  'w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none'

export function UploadReferenceForm({ onUploaded }) {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [kind, setKind] = useState('video')
  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [imagesUsed, setImagesUsed] = useState(0)

  const isAdmin = user?.role === 'admin'
  const imagesLeft = MAX_IMAGES_PER_USER - imagesUsed
  const photoLimitReached = kind === 'image' && !isAdmin && Boolean(user) && imagesLeft <= 0

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

  const switchKind = (nextKind) => {
    setKind(nextKind)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const upload = async () => {
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    const file = fileInputRef.current?.files?.[0]
    setErrors(fieldErrors)
    setFileError(!file ? KINDS[kind].fileError : null)
    if (!valid || !file) return

    setSubmitting(true)
    try {
      await addReference({ ...values, file })
      setValues(INITIAL_VALUES)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast(KINDS[kind].done)
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

      <div
        className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-ivory/10 bg-ink p-1"
        role="tablist"
        aria-label="Tipo de archivo"
      >
        {Object.entries(KINDS).map(([key, option]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={kind === key}
            onClick={() => switchKind(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              kind === key ? 'bg-gold text-on-gold' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

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
          <label htmlFor="reference-file" className="mb-1 block text-sm text-ivory-dim">{KINDS[kind].label}</label>
          <input
            id="reference-file"
            key={kind}
            ref={fileInputRef}
            type="file"
            accept={KINDS[kind].accept}
            disabled={photoLimitReached}
            className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-ivory-dim">{KINDS[kind].hint}</p>
          {kind === 'image' && user && !isAdmin && (
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
        {submitting ? 'Subiendo...' : kind === 'image' ? 'Subir foto' : 'Subir video'}
      </Button>
    </form>
  )
}
