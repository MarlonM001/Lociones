let audioContext = null
const stateListeners = new Set()

function getContext() {
  if (audioContext) return audioContext
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  audioContext = new Ctor()
  audioContext.addEventListener('statechange', () => {
    const ready = isAudioReady()
    stateListeners.forEach((listener) => listener(ready))
  })
  return audioContext
}

export function isAudioReady() {
  return audioContext?.state === 'running'
}

/** Avisa cuando el audio pasa a estar listo o bloqueado (el navegador puede volver a suspenderlo). */
export function onAudioReadyChange(listener) {
  stateListeners.add(listener)
  return () => stateListeners.delete(listener)
}

/**
 * Crea el contexto de audio desde el principio. Hasta que el usuario haga un
 * clic o toque una tecla en la página el navegador lo deja "suspended"; en
 * cuanto hay un gesto, `unlockAudio` lo activa. Crearlo tarde, justo cuando
 * llega un pedido, no sirve: nace suspendido y tarda unos milisegundos en
 * arrancar aunque el usuario ya haya interactuado con la página antes.
 */
export function prepareAudio() {
  getContext()
}

/** Se llama en cada gesto del usuario; no hace nada si el audio ya está activo. */
export function unlockAudio() {
  const ctx = getContext()
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {})
}

/**
 * Campanita de tres notas ascendentes, dos veces seguidas para que no pase
 * inadvertida; generada con Web Audio (sin archivo de audio). Devuelve false
 * si el navegador tiene el audio bloqueado (todavía no hubo ningún gesto).
 */
export async function playNewOrderChime() {
  const ctx = getContext()
  if (!ctx) return false

  if (ctx.state !== 'running') {
    // Con interacción previa el navegador lo activa en unos milisegundos; sin ella
    // resume() se queda pendiente para siempre, por eso no se espera más de un instante.
    await Promise.race([ctx.resume().catch(() => {}), new Promise((resolve) => setTimeout(resolve, 400))])
  }
  if (ctx.state !== 'running') return false

  const notes = [880, 1174.66, 1318.51]
  for (const round of [0, 1.2]) {
    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + round + index * 0.18
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.65)
    })
  }
  return true
}
