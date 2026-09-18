import { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import SILHOUETTES from './bottleSilhouettes.json'

const TARGET_HEIGHT = 2.2
const DEPTH_UV = 0.1

/**
 * En vez de un frasco genérico o una caja rectangular lisa (que de perfil se
 * ve como una tarjeta, no como una botella), esto extruye la silueta REAL de
 * cada frasco — trazada por contorno a partir del PNG sin fondo con OpenCV
 * (ver bottleSilhouettes.json) — en un sólido 3D. De frente y de atrás se ve
 * la foto real del producto (mapeada como textura, con las UV coincidiendo
 * exactamente con el contorno); de perfil se ve el volumen siguiendo esa
 * misma silueta (más angosto en el cuello, ancho en el cuerpo), no un
 * rectángulo.
 */
export function BottleModel({ image, colors, silhouetteKey }) {
  const texture = useTexture(image)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  const geometry = useMemo(() => {
    const data = SILHOUETTES[silhouetteKey]
    if (!data) return new THREE.BoxGeometry(1, TARGET_HEIGHT, TARGET_HEIGHT * 0.22)

    const shape = new THREE.Shape()
    data.points.forEach(([x, y], i) => {
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: DEPTH_UV,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
      curveSegments: 1,
    })
    // Centra el sólido en el origen y lo escala de la unidad UV (0..1) al
    // tamaño real en la escena, respetando el aspect ratio de la foto.
    geo.translate(-0.5, -0.5, -DEPTH_UV / 2)
    geo.scale(data.aspect * TARGET_HEIGHT, TARGET_HEIGHT, TARGET_HEIGHT)
    return geo
  }, [silhouetteKey])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {/* ExtrudeGeometry asigna el grupo de material 0 a las tapas (frente +
          atrás) y el grupo 1 a las paredes laterales de la extrusión. */}
      <meshBasicMaterial attach="material-0" map={texture} transparent alphaTest={0.3} toneMapped={false} />
      <meshStandardMaterial attach="material-1" color={colors.from} metalness={0.6} roughness={0.35} />
    </mesh>
  )
}
