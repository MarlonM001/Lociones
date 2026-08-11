import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import { BottleModel } from './BottleModel'

/**
 * Frasco 3D interactivo: el usuario puede arrastrarlo con el mouse para
 * verlo de frente, de lado, por detrás y por debajo. Gira solo mientras
 * nadie interactúa, y el usuario retoma el control con el primer arrastre.
 */
export function Bottle3D({ colors, label }) {
  const [autoRotate, setAutoRotate] = useState(true)
  const resumeTimer = useRef(null)

  const handleDragStart = () => {
    clearTimeout(resumeTimer.current)
    setAutoRotate(false)
  }

  const handleDragEnd = () => {
    resumeTimer.current = setTimeout(() => setAutoRotate(true), 4000)
  }

  useEffect(() => () => clearTimeout(resumeTimer.current), [])

  return (
    <div
      className="h-[420px] w-[320px] cursor-grab active:cursor-grabbing"
      role="img"
      aria-label={`Frasco de perfume ${label} en 3D, arrastra para rotarlo`}
    >
      <Canvas camera={{ position: [0, 0.15, 5.2], fov: 30 }} shadows dpr={[1, 1.75]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2.5, 3, 2]} intensity={1.4} color="#fff2d6" castShadow />
        <directionalLight position={[-3, 1, -2]} intensity={0.5} color="#8fb3ff" />
        <pointLight position={[0, 1.8, 1.5]} intensity={0.6} color="#ffffff" />

        <Suspense fallback={null}>
          <BottleModel colors={colors} />
          <ContactShadows position={[0, -1.06, 0]} opacity={0.55} scale={4} blur={2.4} far={1.5} />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          autoRotate={autoRotate}
          autoRotateSpeed={1.1}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI - 0.05}
          onStart={handleDragStart}
          onEnd={handleDragEnd}
        />
      </Canvas>
    </div>
  )
}
