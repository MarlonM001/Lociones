import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Frasco rectangular (cuerpo en bloque + tapón cuadrado grande) inspirado en
// los frascos reales del catálogo (Ilmin Monastery, Ahli Vega/Karpos, Baccarat
// Rouge 540) en vez de la decantadora redonda genérica anterior. Centrado
// verticalmente en y=0 para que la cámara orbite alrededor del frasco, y con
// una altura total similar a la del modelo previo para no tener que reajustar
// la cámara/las sombras en Bottle3D.jsx.
const BODY_WIDTH = 0.6
const BODY_HEIGHT = 1.55
const BODY_DEPTH = 0.4
const BODY_BOTTOM_Y = -1.05
const BODY_TOP_Y = BODY_BOTTOM_Y + BODY_HEIGHT
const NECK_HEIGHT = 0.18
const CAP_WIDTH = 0.46
const CAP_HEIGHT = 0.62
const CAP_DEPTH = 0.34

export function BottleModel({ colors }) {
  const bodyRef = useRef(null)
  const capRef = useRef(null)
  const targetColor = useRef(new THREE.Color(colors.from))
  const targetCapAccent = useRef(new THREE.Color(colors.to))

  const bodyGeometry = useMemo(
    () => new THREE.BoxGeometry(BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH, 1, 1, 1),
    [],
  )

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
      {/* Cuerpo de vidrio en bloque: material transmisivo (refracta lo que hay detrás) tintado con el color de la colección. */}
      <mesh
        ref={bodyRef}
        geometry={bodyGeometry}
        position={[0, BODY_BOTTOM_Y + BODY_HEIGHT / 2, 0]}
        castShadow
        receiveShadow
      >
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

      {/* Cuello */}
      <mesh position={[0, BODY_TOP_Y + NECK_HEIGHT / 2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, NECK_HEIGHT, 32]} />
        <meshPhysicalMaterial
          color={colors.from}
          transmission={0.88}
          thickness={0.4}
          roughness={0.06}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Collar metálico entre el cuello y el cuerpo */}
      <mesh position={[0, BODY_TOP_Y, 0]}>
        <torusGeometry args={[0.14, 0.018, 16, 32]} />
        <meshStandardMaterial color="#e4c988" metalness={1} roughness={0.2} />
      </mesh>

      {/* Tapón dorado metálico en bloque, como los frascos reales del catálogo */}
      <mesh
        ref={capRef}
        position={[0, BODY_TOP_Y + NECK_HEIGHT + CAP_HEIGHT / 2, 0]}
        castShadow
      >
        <boxGeometry args={[CAP_WIDTH, CAP_HEIGHT, CAP_DEPTH]} />
        <meshStandardMaterial color="#c8a45c" metalness={1} roughness={0.25} emissive={colors.to} emissiveIntensity={0.12} />
      </mesh>
    </group>
  )
}
