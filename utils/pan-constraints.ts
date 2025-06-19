import type { Artboard, PanConstraints } from "@/types"

const MIN_ZOOM_FOR_FREE_PAN = 0.6
const SAFETY_MARGIN = 100

export function calculatePanLimits(
  currentZoom: number,
  artboard: Artboard,
  containerWidth: number,
  containerHeight: number,
): PanConstraints {
  const artboardWidth = artboard.width * currentZoom
  const artboardHeight = artboard.height * currentZoom

  if (currentZoom >= MIN_ZOOM_FOR_FREE_PAN) {
    const maxPanX = Math.max(0, (artboardWidth - containerWidth) / 2 + SAFETY_MARGIN)
    const maxPanY = Math.max(0, (artboardHeight - containerHeight) / 2 + SAFETY_MARGIN)

    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
    }
  } else {
    const maxPanX = Math.max(0, (artboardWidth - containerWidth + SAFETY_MARGIN * 2) / 2)
    const maxPanY = Math.max(0, (artboardHeight - containerHeight + SAFETY_MARGIN * 2) / 2)

    return {
      minX: -maxPanX,
      maxX: maxPanX,
      minY: -maxPanY,
      maxY: maxPanY,
    }
  }
}

export function constrainPan(newPan: { x: number; y: number }, limits: PanConstraints): { x: number; y: number } {
  return {
    x: Math.max(limits.minX, Math.min(limits.maxX, newPan.x)),
    y: Math.max(limits.minY, Math.min(limits.maxY, newPan.y)),
  }
}

export { MIN_ZOOM_FOR_FREE_PAN, SAFETY_MARGIN }
