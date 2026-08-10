import { useRef, useState } from 'react'
import { addReference } from '@/services/references'
import { useAuth } from '@/hooks/useAuth'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useToast } from '@/hooks/useToast'
import { isNonEmpty, validateFields } from '@/utils/validation'
import { Button } from '@/components/ui/Button'

const INITIAL_VALUES = { title: '', description: '', city: '' }

const RULES = {
  title: (value) => (!isNonEmpty(value) ? 'Ingresa un título para el video' : null),
}

export function UploadReferenceForm({ onUploaded }) {
  const { user } = useAuth()
  const requireAuth = useRequireAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [values, setValues] = useState(INITIAL_VALUES)
  const [errors, setErrors] = useState({})
  const [fileError, setFileError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  const uploadVideo = async () => {
    const { valid, errors: fieldErrors } = validateFields(values, RULES)
    const file = fileInputRef.current?.files?.[0]
    setErrors(fieldErrors)
    setFileError(!file ? 'Selecciona un video' : null)
    if (!valid || !file) return

    setSubmitting(true)
    try {
      await addReference({ ...values, file, createdBy: user.id })
      setValues(INITIAL_VALUES)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('¡Gracias! Tu video quedó en revisión y se publicará cuando sea aprobado.')
      onUploaded?.()
    } catch (error) {
      setFileError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    requireAuth(uploadVideo)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ivory/5 bg-charcoal p-6">
      <h2 className="mb-1 font-display text-xl text-ivory">Sube tu video de entrega</h2>
      <p className="mb-4 text-sm text-ivory-dim">
        Necesitas iniciar sesión para publicar un video. Todo video pasa por revisión antes de
        aparecer en la galería pública. Formatos de video comunes, máx. 100MB.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Título</label>
          <input
            type="text"
            value={values.title}
            onChange={handleChange('title')}
            placeholder="Ej. Entrega en Bogotá"
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory placeholder:text-ivory-dim/50 focus:border-gold focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm text-ivory-dim">Ciudad (opcional)</label>
          <input
            type="text"
            value={values.city}
            onChange={handleChange('city')}
            className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-ivory-dim">Descripción (opcional)</label>
        <textarea
          value={values.description}
          onChange={handleChange('description')}
          rows={2}
          className="w-full rounded-lg border border-ivory/10 bg-ink px-3 py-2 text-ivory focus:border-gold focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm text-ivory-dim">Video</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="w-full text-sm text-ivory-dim file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-medium file:text-on-gold"
        />
        {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
      </div>

      <Button type="submit" variant="primary" className="mt-5" disabled={submitting}>
        {submitting ? 'Subiendo...' : 'Subir video'}
      </Button>
    </form>
  )
}
