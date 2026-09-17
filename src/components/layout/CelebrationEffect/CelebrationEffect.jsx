import { useEffect, useRef, useState } from 'react'
import { getCelebrationConfig } from '@/services/celebration'

const TOTAL_DURATION_MS = 90 * 1000
const SPAWN_INTERVAL_MS = 350
// Tonos dorados/marfil de la propia marca (en vez de confeti multicolor de
// fiesta infantil), para que el efecto de bienvenida se sienta como un
// destello o bruma de atomizador, acorde a una perfumería de lujo.
const COLORS = ['#c8a45c', '#e4c988', '#f6f2ea', '#9c7c3d']

function makeParticle(id) {
  return {
    id,
    leftPercent: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 3 + Math.random() * 5,
    duration: 4 + Math.random() * 3,
    drift: `${(Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 18)}vw`,
    delay: Math.random() * 0.6,
  }
}

/**
 * Destellos dorados que suben lentamente desde el borde inferior, como una
 * bruma de perfume atomizada, al entrar a la tienda. Se activa solo si el
 * admin lo enciende en /admin/celebracion y no tiene forma de cerrarse desde
 * la tienda: corre sola durante TOTAL_DURATION_MS.
 */
export function CelebrationEffect() {
  const [running, setRunning] = useState(false)
  const [particles, setParticles] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    let spawnTimer
    let stopTimer

    getCelebrationConfig()
      .then((config) => {
        if (!config.enabled) return

        setRunning(true)
        spawnTimer = setInterval(() => {
          idRef.current += 1
          const particle = makeParticle(idRef.current)
          setParticles((current) => [...current.slice(-60), particle])
        }, SPAWN_INTERVAL_MS)

        stopTimer = setTimeout(() => {
          clearInterval(spawnTimer)
          setRunning(false)
        }, TOTAL_DURATION_MS)
      })
      .catch(() => {})

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
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${particle.leftPercent}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 8px 2px ${particle.color}`,
            animation: `sparkle-rise ${particle.duration}s ease-out ${particle.delay}s forwards`,
            '--sparkle-drift': particle.drift,
          }}
        />
      ))}
    </div>
  )
}
