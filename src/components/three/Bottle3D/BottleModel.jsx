import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Perfil del frasco (radio, altura) que LatheGeometry gira 360° sobre el eje Y
// para generar el cuerpo de vidrio con hombros redondeados y cuello angosto.
// Centrado verticalmente en y=0 para que la cámara orbite alrededor del frasco.
const BOTTLE_PROFILE = [
  [0, -1.05],
  [0.42, -1.05],
  [0.44, -1.02],
  [0.44, 0.45],
  [0.4, 0.58],
  [0.28, 0.68],
  [0.14, 0.74],
  [0.14, 0.86],
  [0.14, 1.0],
  [0, 1.0],
].map(([x, y]) => new THREE.Vector2(x, y))

export function BottleModel({ colors }) {
  const bodyRef = useRef(null)
  const capRef = useRef(null)
  const targetColor = useRef(new THREE.Color(colors.from))
  const targetCapAccent = useRef(new THREE.Color(colors.to))

  const latheGeometry = useMemo(() => new THREE.LatheGeometry(BOTTLE_PROFILE, 64), [])

  useMemo(() => {
    targetColor.current.set(colors.from)
    targetCapAccent.current.set(colors.to)
  }, [colors.from, colors.to])

  useFrame((_, delta) => {
    if (bodyRef.current) {
      bodyRef.current.material.color.lerp(targetColor.current, Math.min(delta * 3, 1))
    }
    if (capRef.current) {
      capRef.current.material.emissive.lerp(targetCapAccent.current, Math.min(delta * 3, 1))
    }
  })

  return (
    <group>
      {/* Cuerpo de vidrio: material transmisivo (refracta lo que hay detrás) tintado con el color de la colección. */}
      <mesh ref={bodyRef} geometry={latheGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={colors.from}
          transmission={0.88}
          thickness={0.6}
          roughness={0.06}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
          attenuationColor={colors.to}
          attenuationDistance={1.2}
        />
      </mesh>

      {/* Tapón dorado metálico */}
      <mesh ref={capRef} position={[0, 1.16, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.17, 0.32, 32]} />
        <meshStandardMaterial color="#c8a45c" metalness={1} roughness={0.25} emissive={colors.to} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <torusGeometry args={[0.15, 0.02, 16, 32]} />
        <meshStandardMaterial color="#e4c988" metalness={1} roughness={0.2} />
      </mesh>
    </group>
  )
}
