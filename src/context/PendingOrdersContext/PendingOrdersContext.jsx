import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPendingOrdersSummary } from '@/services/orders'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/utils/formatCurrency'
import { playNewOrderChime, unlockAudio } from '@/utils/notificationSound'

export const PendingOrdersContext = createContext(null)

const POLL_INTERVAL_MS = 60_000
const ALERT_TOAST_MS = 10_000
const SOUND_PREFERENCE_KEY = 'essence_admin_sound'

function readSoundPreference() {
  try {
    return localStorage.getItem(SOUND_PREFERENCE_KEY) !== 'off'
  } catch {
    return true
  }
}

/**
 * Vigila los pedidos sin atender mientras el admin tiene el sitio abierto (en
 * cualquier pestaña o página): mantiene el número para las insignias y avisa
 * con sonido y mensaje cuando llega un pedido nuevo.
 */
export function PendingOrdersProvider({ children }) {
  const { isAdmin } = useAuth()
  const { showToast } = useToast()
  const [summary, setSummary] = useState({ pending: 0, latest: null })
  const [soundEnabled, setSoundEnabled] = useState(readSoundPreference)
  // Último pedido que ya vimos. Es null hasta la primera consulta, que solo fija la
  // referencia: los pedidos que ya estaban al abrir el sitio se ven en la insignia, no suenan.
  const lastSeenIdRef = useRef(null)
  const soundEnabledRef = useRef(soundEnabled)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const refresh = useCallback(async () => {
    try {
      const next = await getPendingOrdersSummary()
      const latestId = next.latest?.id ?? 0
      const previousId = lastSeenIdRef.current
      lastSeenIdRef.current = latestId
      setSummary(next)

      if (previousId !== null && latestId > previousId) {
        showToast(
          `Nuevo pedido #${next.latest.id} de ${next.latest.customerName} por ${formatCurrency(next.latest.total)}`,
          'success',
          ALERT_TOAST_MS,
        )
        if (soundEnabledRef.current) playNewOrderChime()
      }
    } catch {
      // Sin red o sesión vencida: se reintenta en el siguiente ciclo.
    }
  }, [showToast])

  useEffect(() => {
    if (!isAdmin) return undefined

    lastSeenIdRef.current = null
    refresh()
    const intervalId = setInterval(refresh, POLL_INTERVAL_MS)
    // Los navegadores frenan los temporizadores de las pestañas ocultas: al volver, se consulta de inmediato.
    const handleVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', refresh)

    // El audio solo se puede activar tras un gesto del usuario.
    const handleGesture = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
    window.addEventListener('pointerdown', handleGesture)
    window.addEventListener('keydown', handleGesture)

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pointerdown', handleGesture)
      window.removeEventListener('keydown', handleGesture)
    }
  }, [isAdmin, refresh])

  const pending = isAdmin ? summary.pending : 0

  // Con el panel en otra pestaña, el número en el título avisa sin tener que mirarla.
  useEffect(() => {
    if (!isAdmin) return undefined
    const baseTitle = document.title.replace(/^\(\d+\) /, '')
    document.title = pending > 0 ? `(${pending}) ${baseTitle}` : baseTitle
    return () => {
      document.title = baseTitle
    }
  }, [isAdmin, pending])

  const toggleSound = useCallback(() => {
    const next = !soundEnabledRef.current
    setSoundEnabled(next)
    try {
      localStorage.setItem(SOUND_PREFERENCE_KEY, next ? 'on' : 'off')
    } catch {
      // la preferencia solo dura mientras la pestaña esté abierta
    }
    if (next) {
      // Es un clic del usuario: aprovecha para dejar el audio listo y dejar oír cómo suena.
      unlockAudio()
      playNewOrderChime()
    }
  }, [])

  const value = useMemo(
    () => ({ pending, latest: isAdmin ? summary.latest : null, soundEnabled, toggleSound, refresh }),
    [pending, isAdmin, summary.latest, soundEnabled, toggleSound, refresh],
  )

  return <PendingOrdersContext.Provider value={value}>{children}</PendingOrdersContext.Provider>
}
