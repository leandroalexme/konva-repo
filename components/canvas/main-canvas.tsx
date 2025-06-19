"use client"

import type React from "react"
import { useRef, useCallback, useEffect } from "react"
import { CentralView } from "./central-view"
import { GridView } from "./grid-view"
import { useZoomPan } from "@/hooks/use-zoom-pan"
import { useDragDrop } from "@/hooks/use-drag-drop"
import { useViewTransition } from "@/hooks/use-view-transition"
import type { ViewMode, Artboard } from "@/types"

interface MainCanvasProps {
  viewMode: ViewMode
  artboards: Artboard[]
  activeArtboard: string
  setActiveArtboard: (id: string) => void
  setViewMode: (mode: ViewMode) => void
  addArtboard: () => void
  updateArtboard: (id: string, updates: Partial<Artboard>) => void
  reorderArtboards: (newOrder: Artboard[]) => void
}

export function MainCanvas({
  viewMode,
  artboards,
  activeArtboard,
  setActiveArtboard,
  setViewMode,
  addArtboard,
  updateArtboard,
  reorderArtboards,
}: MainCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const {
    zoom,
    pan,
    isPanning,
    lastPanPoint,
    containerRef,
    contentRef,
    currentZoom,
    currentPan,
    isZooming,
    setIsPanning,
    setLastPanPoint,
    handleZoomAtPoint,
    zoomIn,
    zoomOut,
    resetView,
    updatePan,
    transitionToMode,
  } = useZoomPan()

  const { dragState, dragOverlayRef, startDrag, updateDrag, endDrag } = useDragDrop(artboards, reorderArtboards)
  const { isTransitioning, transitionState, startTransition } = useViewTransition()

  // 🚀 Enhanced wheel handler with CURSOR-DIRECTED zoom for both modes
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (dragState.isDragging || isTransitioning) return
      e.preventDefault()

      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const currentArtboard = viewMode === "central" ? artboards.find((ab) => ab.id === activeArtboard) : undefined

      // 🎯 CURSOR-DIRECTED ZOOM - zoom towards mouse cursor
      handleZoomAtPoint(delta, e.clientX, e.clientY, canvasRef, viewMode, currentArtboard)
    },
    [handleZoomAtPoint, dragState.isDragging, isTransitioning, viewMode, artboards, activeArtboard],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (dragState.isDragging || isTransitioning) return
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true)
        setLastPanPoint({ x: e.clientX, y: e.clientY })
        e.preventDefault()
      }
    },
    [dragState.isDragging, isTransitioning, setIsPanning, setLastPanPoint],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTransitioning) return

      if (dragState.isDragging) {
        updateDrag(e, gridRef, currentZoom, currentPan)
      } else if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y

        const newPan = {
          x: currentPan.x + deltaX,
          y: currentPan.y + deltaY,
        }

        const currentArtboard = viewMode === "central" ? artboards.find((ab) => ab.id === activeArtboard) : undefined

        // 🚀 Pan works in both modes
        updatePan(newPan, viewMode, currentArtboard)
        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [
      isTransitioning,
      dragState.isDragging,
      updateDrag,
      isPanning,
      lastPanPoint,
      viewMode,
      artboards,
      activeArtboard,
      currentPan,
      currentZoom,
      updatePan,
      setLastPanPoint,
    ],
  )

  const handleMouseUp = useCallback(() => {
    if (isTransitioning) return
    endDrag()
    setIsPanning(false)
  }, [isTransitioning, endDrag, setIsPanning])

  // 🎯 Enhanced view mode change with smooth transition
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (!dragState.isDragging && !isTransitioning) {
        const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)

        // 🚀 Start visual transition
        startTransition(viewMode, mode)

        // 🎯 Smooth zoom/pan transition
        transitionToMode(mode, currentArtboard)

        // 🚀 Change mode
        setViewMode(mode)
      }
    },
    [
      dragState.isDragging,
      isTransitioning,
      startTransition,
      viewMode,
      setViewMode,
      transitionToMode,
      artboards,
      activeArtboard,
    ],
  )

  const handleArtboardClick = useCallback(
    (id: string) => {
      if (!dragState.isDragging && !isTransitioning) {
        setActiveArtboard(id)
        handleViewModeChange("central")
      }
    },
    [dragState.isDragging, isTransitioning, setActiveArtboard, handleViewModeChange],
  )

  const handleArtboardDragStart = useCallback(
    (e: React.MouseEvent, artboardId: string) => {
      if (viewMode !== "grid" || isTransitioning) return
      startDrag(e, artboardId)
    },
    [viewMode, isTransitioning, startDrag],
  )

  const handleAddArtboard = useCallback(() => {
    if (isTransitioning) return
    addArtboard()
  }, [isTransitioning, addArtboard])

  // 🚀 Enhanced zoom handlers - center-point zoom for buttons
  const handleZoomIn = useCallback(() => {
    if (isTransitioning) return
    const currentArtboard = viewMode === "central" ? artboards.find((ab) => ab.id === activeArtboard) : undefined
    zoomIn(viewMode, currentArtboard)
  }, [isTransitioning, viewMode, artboards, activeArtboard, zoomIn])

  const handleZoomOut = useCallback(() => {
    if (isTransitioning) return
    const currentArtboard = viewMode === "central" ? artboards.find((ab) => ab.id === activeArtboard) : undefined
    zoomOut(viewMode, currentArtboard)
  }, [isTransitioning, viewMode, artboards, activeArtboard, zoomOut])

  const handleResetView = useCallback(() => {
    if (isTransitioning) return
    resetView(viewMode)
  }, [isTransitioning, resetView, viewMode])

  // 🎯 Set refs for zoom/pan hook
  useEffect(() => {
    containerRef.current = canvasRef.current
    if (viewMode === "grid") {
      contentRef.current = gridRef.current
    }
  }, [containerRef, contentRef, viewMode])

  if (viewMode === "central") {
    const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
    if (!currentArtboard) return null

    return (
      <CentralView
        artboard={currentArtboard}
        zoom={zoom}
        pan={pan}
        isZooming={isZooming}
        isTransitioning={isTransitioning}
        transitionState={transitionState}
        canvasRef={canvasRef}
        contentRef={contentRef}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    )
  }

  return (
    <GridView
      artboards={artboards}
      activeArtboard={activeArtboard}
      dragState={dragState}
      dragOverlayRef={dragOverlayRef}
      zoom={zoom}
      pan={pan}
      isZooming={isZooming}
      isTransitioning={isTransitioning}
      transitionState={transitionState}
      viewMode={viewMode}
      canvasRef={canvasRef}
      gridRef={gridRef}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onResetView={handleResetView}
      onViewModeChange={handleViewModeChange}
      onArtboardClick={handleArtboardClick}
      onArtboardDragStart={handleArtboardDragStart}
      onAddArtboard={handleAddArtboard}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  )
}
