"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import type { DragState, Artboard } from "@/types"
import { getCollisionIndex, reorderArtboards } from "@/utils/grid-calculations"

export function useDragDrop(artboards: Artboard[], onReorder: (newOrder: Artboard[]) => void) {
  // 🎯 Minimal React state - only essential data
  const [dragState, setDragState] = useState<Omit<DragState, "currentPosition">>({
    isDragging: false,
    draggedId: null,
    dragOffset: { x: 0, y: 0 },
    dropIndex: null,
    hoveredIndex: null,
    dragStartIndex: 0,
  })

  // 🚀 Real-time position via ref (no re-renders)
  const currentPosition = useRef({ x: 0, y: 0 })
  const dragOverlayRef = useRef<HTMLDivElement | null>(null)

  // 🎯 Debounced collision detection
  const collisionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startDrag = useCallback(
    (e: React.MouseEvent, artboardId: string) => {
      e.stopPropagation()
      const draggedIndex = artboards.findIndex((ab) => ab.id === artboardId)

      currentPosition.current = { x: e.clientX, y: e.clientY }

      setDragState({
        isDragging: true,
        draggedId: artboardId,
        dragOffset: { x: e.clientX, y: e.clientY },
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

      // 🚀 Update position immediately via ref (no React re-render)
      currentPosition.current = { x: e.clientX, y: e.clientY }

      // 🚀 Update drag overlay position directly
      if (dragOverlayRef.current) {
        dragOverlayRef.current.style.transform = `translate(${e.clientX - 125}px, ${e.clientY - 90}px) rotate(-5deg) translateZ(0)`
      }

      // 🎯 Debounced collision detection (reduce React updates)
      if (collisionTimeoutRef.current) {
        clearTimeout(collisionTimeoutRef.current)
      }

      collisionTimeoutRef.current = setTimeout(() => {
        const gridRect = gridRef.current!.getBoundingClientRect()
        const relativeX = (e.clientX - gridRect.left) / zoom - pan.x / zoom
        const relativeY = (e.clientY - gridRect.top) / zoom - pan.y / zoom

        const collisionIndex = getCollisionIndex(relativeX, relativeY, artboards.length)
        const hoveredIndex = collisionIndex !== null ? Math.floor(collisionIndex) : null

        setDragState((prev) => ({
          ...prev,
          dropIndex: collisionIndex,
          hoveredIndex: hoveredIndex,
        }))
      }, 16) // ~60fps collision detection
    },
    [dragState.isDragging, artboards.length],
  )

  const endDrag = useCallback(() => {
    if (collisionTimeoutRef.current) {
      clearTimeout(collisionTimeoutRef.current)
    }

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
      dropIndex: null,
      hoveredIndex: null,
      dragStartIndex: 0,
    })
  }, [dragState, artboards, onReorder])

  return {
    dragState: {
      ...dragState,
      currentPosition: currentPosition.current,
    },
    currentPosition,
    dragOverlayRef,
    startDrag,
    updateDrag,
    endDrag,
  }
}
