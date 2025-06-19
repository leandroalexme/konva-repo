"use client"

import type React from "react"

import { useState, useCallback } from "react"
import type { DragState, Artboard } from "@/types"
import { getCollisionIndex, reorderArtboards } from "@/utils/grid-calculations"

export function useDragDrop(artboards: Artboard[], onReorder: (newOrder: Artboard[]) => void) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    dragOffset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dropIndex: null,
    hoveredIndex: null,
    dragStartIndex: 0,
  })

  const startDrag = useCallback(
    (e: React.MouseEvent, artboardId: string) => {
      e.stopPropagation()
      const draggedIndex = artboards.findIndex((ab) => ab.id === artboardId)

      setDragState({
        isDragging: true,
        draggedId: artboardId,
        dragOffset: { x: e.clientX, y: e.clientY },
        currentPosition: { x: e.clientX, y: e.clientY },
        dropIndex: null,
        hoveredIndex: null,
        dragStartIndex: draggedIndex,
      })
    },
    [artboards],
  )

  const updateDrag = useCallback(
    (e: React.MouseEvent, gridRef: React.RefObject<HTMLDivElement>, zoom: number, pan: { x: number; y: number }) => {
      if (!dragState.isDragging || !gridRef.current) return

      const gridRect = gridRef.current.getBoundingClientRect()
      const relativeX = (e.clientX - gridRect.left) / zoom - pan.x / zoom
      const relativeY = (e.clientY - gridRect.top) / zoom - pan.y / zoom

      setDragState((prev) => ({
        ...prev,
        currentPosition: { x: e.clientX, y: e.clientY },
      }))

      const collisionIndex = getCollisionIndex(relativeX, relativeY, artboards.length)
      const hoveredIndex = collisionIndex !== null ? Math.floor(collisionIndex) : null

      setDragState((prev) => ({
        ...prev,
        dropIndex: collisionIndex,
        hoveredIndex: hoveredIndex,
      }))
    },
    [dragState.isDragging, artboards.length],
  )

  const endDrag = useCallback(() => {
    if (dragState.isDragging && dragState.dropIndex !== null) {
      const draggedIndex = artboards.findIndex((ab) => ab.id === dragState.draggedId)
      if (draggedIndex !== -1 && draggedIndex !== dragState.dropIndex) {
        const newArtboards = reorderArtboards(artboards, draggedIndex, dragState.dropIndex)
        onReorder(newArtboards)
      }
    }

    setDragState({
      isDragging: false,
      draggedId: null,
      dragOffset: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      dropIndex: null,
      hoveredIndex: null,
      dragStartIndex: 0,
    })
  }, [dragState, artboards, onReorder])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
  }
}
