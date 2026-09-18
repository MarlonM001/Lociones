"""
Traza el contorno real de cada botella del hero (PNG con canal alpha, sin
fondo) y lo guarda como polígono normalizado (0..1) en
src/components/three/Bottle3D/bottleSilhouettes.json, que BottleModel.jsx usa
para extruir un sólido 3D con la silueta real del frasco en vez de una caja
rectangular genérica.

Uso: python scripts/trace-bottle-silhouettes.py
"""
import json
import os

import cv2
import numpy as np

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO_DIR = os.path.join(REPO_ROOT, "public", "images", "hero")
OUTPUT_PATH = os.path.join(
    REPO_ROOT, "src", "components", "three", "Bottle3D", "bottleSilhouettes.json"
)

# slide.id (heroSlides.js) -> archivo en public/images/hero/
SOURCES = {
    "essence": "essence.png",
    "arabia": "arabia.png",
    "mujeres": "mujeres.png",
    "caballero": "caballero.png",
}

# Cuántos puntos como máximo queda el contorno simplificado. Suficientes para
# que se note el cuello angosto y la tapa, pocos para que ExtrudeGeometry siga
# siendo liviana.
MAX_POINTS = 48


def trace_silhouette(path):
    image = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise FileNotFoundError(path)
    if image.shape[2] != 4:
        raise ValueError(f"{path} no tiene canal alpha (fondo no transparente)")

    height, width = image.shape[:2]
    alpha = image[:, :, 3]

    # Umbral bajo: hasta un borde levemente translúcido (antialiasing) cuenta
    # como parte del frasco, para no "comerse" el contorno real.
    _, mask = cv2.threshold(alpha, 12, 255, cv2.THRESH_BINARY)
    # Cierra huecos pequeños (ej. reflejos/brillo que perforan el alpha).
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        raise ValueError(f"No se encontró contorno en {path}")
    contour = max(contours, key=cv2.contourArea)

    perimeter = cv2.arcLength(contour, True)
    epsilon = 0.002 * perimeter
    simplified = cv2.approxPolyDP(contour, epsilon, True)

    # Si quedó con más puntos de los que queremos, relaja epsilon hasta que
    # entre en el presupuesto (mantiene la forma, solo baja el detalle).
    while len(simplified) > MAX_POINTS and epsilon < perimeter:
        epsilon *= 1.35
        simplified = cv2.approxPolyDP(contour, epsilon, True)

    points_px = simplified.reshape(-1, 2)

    # Pixel -> UV normalizado (0..1). Y se invierte porque en la imagen crece
    # hacia abajo y en el mapeo UV/shape usado acá crece hacia arriba.
    points_uv = [
        [round(float(px / width), 5), round(float(1 - py / height), 5)]
        for px, py in points_px
    ]

    # THREE.Shape espera el contorno exterior en sentido antihorario (área
    # con signo positiva); si OpenCV lo trazó al revés, se invierte acá.
    signed_area = sum(
        points_uv[i][0] * points_uv[(i + 1) % len(points_uv)][1]
        - points_uv[(i + 1) % len(points_uv)][0] * points_uv[i][1]
        for i in range(len(points_uv))
    )
    if signed_area < 0:
        points_uv.reverse()

    return {
        "points": points_uv,
        "aspect": round(width / height, 5),
        "sourcePoints": len(points_uv),
    }


def main():
    result = {}
    for key, filename in SOURCES.items():
        path = os.path.join(HERO_DIR, filename)
        data = trace_silhouette(path)
        result[key] = {"points": data["points"], "aspect": data["aspect"]}
        print(f"{key}: {data['sourcePoints']} puntos, aspect={data['aspect']}")

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(f"\nEscrito: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
