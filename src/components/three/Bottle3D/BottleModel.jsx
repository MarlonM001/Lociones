import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

const TARGET_HEIGHT = 2.2

/**
 * En vez de un frasco genérico (caja/cilindro sin relación con el producto
 * real), esto mapea la foto real de cada botella (PNG sin fondo) como
 * textura sobre las caras frontal y trasera de una caja 3D delgada. De
 * frente se ve exactamente la foto real; al girar, a diferencia de rotar la
 * foto plana sola, la caja tiene volumen real — nunca se deforma ni
 * desaparece de canto, aunque los lados no tengan detalle fotográfico.
 */
export function BottleModel({ image, colors }) {
  const texture = useTexture(image)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const aspect = texture.image.width / texture.image.height
  const height = TARGET_HEIGHT
  const width = height * aspect
  const depth = Math.min(width, height) * 0.22

  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial attach="material-0" color={colors.from} metalness={0.5} roughness={0.45} />
      <meshStandardMaterial attach="material-1" color={colors.from} metalness={0.5} roughness={0.45} />
      <meshStandardMaterial attach="material-2" color={colors.to} metalness={0.5} roughness={0.45} />
      <meshStandardMaterial attach="material-3" color={colors.to} metalness={0.5} roughness={0.45} />
      <meshBasicMaterial attach="material-4" map={texture} transparent alphaTest={0.3} toneMapped={false} />
      <meshBasicMaterial attach="material-5" map={texture} transparent alphaTest={0.3} toneMapped={false} />
    </mesh>
  )
}
