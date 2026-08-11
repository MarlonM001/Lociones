import { useEffect, useRef, useState } from 'react'
import { getCelebrationConfig } from '@/services/celebration'

const TOTAL_DURATION_MS = 2 * 60 * 1000
const SPAWN_INTERVAL_MS = 250
const COLORS = ['#c8a45c', '#e4c988', '#f6f2ea', '#9c7c3d', '#ffffff']

function makeParticle(side, id) {
  return {
    id,
    side,
    edgePercent: Math.random() * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 6,
    duration: 3 + Math.random() * 2,
    spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360)}deg`,
    drift: side === 'left' ? `${40 + Math.random() * 30}vw` : `${-(40 + Math.random() * 30)}vw`,
  }
}

/**
 * Confeti que cae desde ambos bordes de la pantalla al entrar a la tienda.
 * Se activa solo si el admin lo enciende en /admin/celebracion y no tiene
 * forma de cerrarse desde la tienda: corre sola durante TOTAL_DURATION_MS.
 */
export function CelebrationEffect() {
  const [running, setRunning] = useState(false)
  const [particles, setParticles] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!getCelebrationConfig().enabled) return

    setRunning(true)
    const spawnTimer = setInterval(() => {
      idRef.current += 1
      const left = makeParticle('left', idRef.current)
      idRef.current += 1
      const right = makeParticle('right', idRef.current)
      setParticles((current) => [...current.slice(-120), left, right])
    }, SPAWN_INTERVAL_MS)

    const stopTimer = setTimeout(() => {
      clearInterval(spawnTimer)
      setRunning(false)
    }, TOTAL_DURATION_MS)

    return () => {
      clearInterval(spawnTimer)
      clearTimeout(stopTimer)
    }
  }, [])

  if (!running && particles.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          onAnimationEnd={() => setParticles((current) => current.filter((item) => item.id !== particle.id))}
          className="absolute top-0 rounded-sm"
          style={{
            [particle.side]: `${particle.edgePercent}%`,
            width: particle.size,
            height: particle.size * 1.6,
            backgroundColor: particle.color,
            animation: `confetti-fall ${particle.duration}s linear forwards`,
            '--confetti-drift': particle.drift,
            '--confetti-spin': particle.spin,
          }}
        />
      ))}
    </div>
  )
}
