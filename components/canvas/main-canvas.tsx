"use client"

import type React from "react"

import { useRef, useCallback, useEffect } from "react"
import { CentralView } from "./central-view"
import { GridView } from "./grid-view"
import { useZoomPan } from "@/hooks/use-zoom-pan"
import { useDragDrop } from "@/hooks/use-drag-drop"
import { useViewTransition } from "@/hooks/use-view-transition"
import type { ViewMode, Artboard } from "@/types"
import { calculatePanLimits, constrainPan } from "@/utils/pan-constraints"
import { GRID_CONFIG } from "@/utils/grid-calculations"

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
    setZoom,
    updatePan,
    setIsPanning,
    setLastPanPoint,
    handleZoomAtPoint,
    centerArtboard,
    resetView,
  } = useZoomPan()

  const { dragState, startDrag, updateDrag, endDrag } = useDragDrop(artboards, reorderArtboards)
  const { isTransitioning, transitionState, startTransition } = useViewTransition()

  // Centraliza prancheta específica no modo grid
  const centerArtboardInGrid = useCallback(
    (artboardIndex: number) => {
      if (!canvasRef.current || !gridRef.current) return

      const container = canvasRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const row = Math.floor(artboardIndex / GRID_CONFIG.COLS)
      const col = artboardIndex % GRID_CONFIG.COLS

      const artboardX =
        col * (GRID_CONFIG.ITEM_WIDTH + GRID_CONFIG.ITEM_GAP) * zoom + (GRID_CONFIG.ITEM_WIDTH * zoom) / 2
      const artboardY =
        row * (GRID_CONFIG.ITEM_HEIGHT + GRID_CONFIG.ITEM_GAP) * zoom + (GRID_CONFIG.ITEM_HEIGHT * zoom) / 2

      const targetPanX = containerWidth / 2 - artboardX
      const targetPanY = containerHeight / 2 - artboardY

      updatePan({ x: targetPanX, y: targetPanY })
    },
    [updatePan, zoom],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (dragState.isDragging || isTransitioning) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const currentArtboard = viewMode === "central" ? artboards.find((ab) => ab.id === activeArtboard) : undefined
      handleZoomAtPoint(delta, e.clientX, e.clientY, canvasRef, currentArtboard)
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
        updateDrag(e, gridRef, zoom, pan)
      } else if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y

        if (viewMode === "central" && canvasRef.current) {
          const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
          if (currentArtboard) {
            const newPan = { x: pan.x + deltaX, y: pan.y + deltaY }
            const rect = canvasRef.current.getBoundingClientRect()
            const limits = calculatePanLimits(zoom, currentArtboard, rect.width, rect.height)
            const constrainedPan = constrainPan(newPan, limits)
            updatePan(constrainedPan)
          }
        } else {
          updatePan({ x: pan.x + deltaX, y: pan.y + deltaY })
        }

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
      pan,
      zoom,
      updatePan,
      setLastPanPoint,
    ],
  )

  const handleMouseUp = useCallback(() => {
    if (isTransitioning) return
    endDrag()
    setIsPanning(false)
  }, [isTransitioning, endDrag, setIsPanning])

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (!dragState.isDragging && !isTransitioning) {
        startTransition(viewMode, mode, (newMode) => {
          if (newMode === "grid") {
            setZoom(1)
            const targetIndex = artboards.findIndex((ab) => ab.id === activeArtboard)
            if (targetIndex !== -1) {
              centerArtboardInGrid(targetIndex)
            }
          } else if (newMode === "central") {
            const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
            if (currentArtboard) {
              centerArtboard(currentArtboard, canvasRef)
            }
          }
        })
        setViewMode(mode)
      }
    },
    [
      dragState.isDragging,
      isTransitioning,
      startTransition,
      viewMode,
      setViewMode,
      artboards,
      activeArtboard,
      setZoom,
      centerArtboardInGrid,
      centerArtboard,
    ],
  )

  const handleArtboardClick = useCallback(
    (id: string) => {
      if (!dragState.isDragging && !isTransitioning) {
        setActiveArtboard(id)
        startTransition(viewMode, "central", (_newMode) => {
          // _newMode will always be "central" here
          const currentArtboard = artboards.find((ab) => ab.id === id) // Use id directly
          if (currentArtboard) {
            centerArtboard(currentArtboard, canvasRef)
          }
        })
        setViewMode("central")
      }
    },
    [
      dragState.isDragging,
      isTransitioning,
      setActiveArtboard,
      startTransition,
      viewMode,
      setViewMode,
      artboards, // Add artboards to dependency array
      centerArtboard, // Add centerArtboard to dependency array
    ],
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

  const handleZoomIn = useCallback(() => {
    if (isTransitioning) return
    if (viewMode === "central" && canvasRef.current) {
      const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
      if (currentArtboard) {
        const rect = canvasRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        handleZoomAtPoint(1.1, centerX, centerY, canvasRef, currentArtboard)
      }
    } else if (viewMode === "grid" && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      handleZoomAtPoint(1.1, centerX, centerY, canvasRef)
    }
  }, [viewMode, artboards, activeArtboard, handleZoomAtPoint, isTransitioning, canvasRef])

  const handleZoomOut = useCallback(() => {
    if (isTransitioning) return
    if (viewMode === "central" && canvasRef.current) {
      const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
      if (currentArtboard) {
        const rect = canvasRef.current.getBoundingClientRect()
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        handleZoomAtPoint(0.9, centerX, centerY, canvasRef, currentArtboard)
      }
    } else if (viewMode === "grid" && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      handleZoomAtPoint(0.9, centerX, centerY, canvasRef)
    }
  }, [viewMode, artboards, activeArtboard, handleZoomAtPoint, isTransitioning, canvasRef])

  const handleFitToScreen = useCallback(() => {
    if (isTransitioning) return
    if (viewMode === "central") {
      const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
      if (currentArtboard) {
        centerArtboard(currentArtboard, canvasRef)
      }
    } else {
      resetView()
    }
  }, [isTransitioning, viewMode, artboards, activeArtboard, centerArtboard, resetView])

  // Ajustes pós-transição
  // This useEffect is no longer needed as centering is handled by the transition callback.
  // useEffect(() => {
  //   if (!isTransitioning) {
  //     if (viewMode === "grid") {
  //       setZoom(1)
  //       const targetIndex = artboards.findIndex((ab) => ab.id === activeArtboard)
  //       if (targetIndex !== -1) {
  //         setTimeout(() => centerArtboardInGrid(targetIndex), 50)
  //       }
  //     } else if (viewMode === "central") {
  //       const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
  //       if (currentArtboard) {
  //         setTimeout(() => centerArtboard(currentArtboard, canvasRef), 50)
  //       }
  //     }
  //   }
  // }, [viewMode, isTransitioning, activeArtboard, artboards, setZoom, centerArtboardInGrid, centerArtboard])

  if (viewMode === "central") {
    const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
    if (!currentArtboard) return null

    return (
      <CentralView
        artboard={currentArtboard}
        zoom={zoom}
        pan={pan}
        isTransitioning={isTransitioning}
        transitionState={transitionState}
        canvasRef={canvasRef}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={() => resetView()}
        onFitToScreen={handleFitToScreen}
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
      zoom={zoom}
      pan={pan}
      isTransitioning={isTransitioning}
      transitionState={transitionState}
      viewMode={viewMode}
      canvasRef={canvasRef}
      gridRef={gridRef}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onResetView={() => resetView()}
      onFitToScreen={handleFitToScreen}
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
