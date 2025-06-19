import type { GridPosition } from "@/types"

export const GRID_CONFIG = {
  COLS: 10,
  ITEM_WIDTH: 250,
  ITEM_GAP: 32,
  ITEM_HEIGHT: 220,
} as const

export const TOTAL_ITEM_WIDTH = GRID_CONFIG.ITEM_WIDTH + GRID_CONFIG.ITEM_GAP

export function getGridPosition(x: number, y: number, artboardsLength: number): GridPosition {
  const col = Math.max(0, Math.min(GRID_CONFIG.COLS - 1, Math.floor(x / TOTAL_ITEM_WIDTH)))
  const row = Math.max(0, Math.floor(y / (GRID_CONFIG.ITEM_HEIGHT + GRID_CONFIG.ITEM_GAP)))
  const index = row * GRID_CONFIG.COLS + col

  return { row, col, index: Math.min(index, artboardsLength) }
}

export function getCollisionIndex(x: number, y: number, artboardsLength: number): number | null {
  const position = getGridPosition(x, y, artboardsLength)
  const targetIndex = Math.min(position.index, artboardsLength - 1)

  if (targetIndex >= 0 && targetIndex < artboardsLength) {
    const targetRow = Math.floor(targetIndex / GRID_CONFIG.COLS)
    const targetCol = targetIndex % GRID_CONFIG.COLS

    const targetX = targetCol * TOTAL_ITEM_WIDTH
    const targetY = targetRow * (GRID_CONFIG.ITEM_HEIGHT + GRID_CONFIG.ITEM_GAP)

    const distanceX = Math.abs(x - (targetX + GRID_CONFIG.ITEM_WIDTH / 2))
    const distanceY = Math.abs(y - (targetY + GRID_CONFIG.ITEM_HEIGHT / 2))

    if (distanceX < GRID_CONFIG.ITEM_WIDTH * 0.6 && distanceY < GRID_CONFIG.ITEM_HEIGHT * 0.6) {
      const insertAfter = x > targetX + GRID_CONFIG.ITEM_WIDTH / 2
      return insertAfter ? targetIndex + 1 : targetIndex
    }
  }

  return position.index
}

export function reorderArtboards<T>(array: T[], sourceIndex: number, targetIndex: number): T[] {
  const newArray = [...array]
  const [draggedItem] = newArray.splice(sourceIndex, 1)
  const adjustedTargetIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex
  newArray.splice(adjustedTargetIndex, 0, draggedItem)
  return newArray
}
