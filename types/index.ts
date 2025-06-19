export type ViewMode = "central" | "grid"
export type Tool = "select" | "rectangle" | "circle" | "text"

export interface Artboard {
  id: string
  name: string
  width: number
  height: number
}

export interface DragState {
  isDragging: boolean
  draggedId: string | null
  dragOffset: { x: number; y: number }
  currentPosition: { x: number; y: number }
  dropIndex: number | null
  hoveredIndex: number | null
  dragStartIndex: number
}

export interface GridPosition {
  row: number
  col: number
  index: number
}

export interface PanConstraints {
  minX: number
  maxX: number
  minY: number
  maxY: number
}
