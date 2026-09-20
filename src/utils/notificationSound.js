let audioContext = null

function getContext() {
  if (audioContext) return audioContext
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  audioContext = new Ctor()
  return audioContext
}

/**
 * Los navegadores solo dejan sonar audio después de un gesto del usuario
 * (clic o tecla). Se llama en el primer gesto para dejar el audio listo, de
 * modo que el aviso de un pedido nuevo pueda sonar más tarde sin interacción.
 */
export function unlockAudio() {
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
}

/** Campanita de tres notas ascendentes, generada con Web Audio (sin archivo de audio). */
export function playNewOrderChime() {
  const ctx = getContext()
  if (!ctx || ctx.state !== 'running') return false

  const notes = [
    { frequency: 880, offset: 0 },
    { frequency: 1174.66, offset: 0.18 },
    { frequency: 1318.51, offset: 0.36 },
  ]
  for (const { frequency, offset } of notes) {
    const start = ctx.currentTime + offset
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.55)
  }
  return true
}
