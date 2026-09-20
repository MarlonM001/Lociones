import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getPendingOrdersSummary } from '@/services/orders'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { formatCurrency } from '@/utils/formatCurrency'
import { setTitleBadge } from '@/utils/documentTitle'
import {
  isAudioReady,
  onAudioReadyChange,
  playNewOrderChime,
  prepareAudio,
  unlockAudio,
} from '@/utils/notificationSound'

export const PendingOrdersContext = createContext(null)

const POLL_INTERVAL_MS = 60_000
const ALERT_TOAST_MS = 10_000
const SOUND_PREFERENCE_KEY = 'essence_admin_sound'
// Eventos que el navegador reconoce como "el usuario interactuó" y con los que deja activar el audio.
const GESTURE_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click']

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
  const [audioReady, setAudioReady] = useState(false)
  // Llegó un pedido mientras el admin no estaba mirando la pestaña: el título parpadea hasta que vuelva.
  const [attention, setAttention] = useState(false)
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
        if (document.hidden || !document.hasFocus()) setAttention(true)
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
    const handleBack = () => {
      if (document.visibilityState !== 'visible') return
      setAttention(false)
      refresh()
    }
    document.addEventListener('visibilitychange', handleBack)
    window.addEventListener('focus', handleBack)

    // El audio arranca bloqueado hasta que hay un gesto del usuario. El contexto se crea ya y se
    // reintenta desbloquear en cada gesto (no solo en el primero) hasta que el navegador lo deje.
    prepareAudio()
    setAudioReady(isAudioReady())
    const stopWatchingAudio = onAudioReadyChange(setAudioReady)
    GESTURE_EVENTS.forEach((name) => window.addEventListener(name, unlockAudio, { passive: true }))

    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleBack)
      window.removeEventListener('focus', handleBack)
      stopWatchingAudio()
      GESTURE_EVENTS.forEach((name) => window.removeEventListener(name, unlockAudio))
    }
  }, [isAdmin, refresh])

  const pending = isAdmin ? summary.pending : 0

  // Con el panel en otra pestaña, el título avisa sin tener que mirarla: muestra el número de pedidos sin
  // atender y, si llegó uno nuevo, parpadea con la campana hasta que vuelvas. Se hace por documentTitle
  // para convivir con los títulos propios de cada página.
  useEffect(() => {
    if (!isAdmin) return undefined
    setTitleBadge({ pending, alert: attention })
    return () => setTitleBadge({ pending: 0, alert: false })
  }, [isAdmin, pending, attention])

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

  // Botón "Activar sonido" del aviso de audio bloqueado: el clic destraba el audio y deja oír la campanita.
  const enableAudio = useCallback(() => {
    unlockAudio()
    playNewOrderChime()
  }, [])

  const value = useMemo(
    () => ({
      pending,
      latest: isAdmin ? summary.latest : null,
      soundEnabled,
      toggleSound,
      audioReady,
      enableAudio,
      refresh,
    }),
    [pending, isAdmin, summary.latest, soundEnabled, toggleSound, audioReady, enableAudio, refresh],
  )

  return <PendingOrdersContext.Provider value={value}>{children}</PendingOrdersContext.Provider>
}
