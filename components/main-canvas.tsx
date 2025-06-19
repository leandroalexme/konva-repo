"use client"

import React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { Plus, ZoomIn, ZoomOut, Maximize2, Maximize, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ViewMode, Artboard } from "./design-editor"

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

interface DragState {
  isDragging: boolean
  draggedId: string | null
  dragOffset: { x: number; y: number }
  currentPosition: { x: number; y: number }
  dropIndex: number | null
  hoveredIndex: number | null
  dragStartIndex: number
}

interface GridPosition {
  row: number
  col: number
  index: number
}

interface TransitionState {
  isTransitioning: boolean
  fromMode: ViewMode | null
  toMode: ViewMode | null
  scale: number
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [hoveredArtboard, setHoveredArtboard] = useState<string | null>(null)

  // Estado de transição simplificado
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Configurações de grid
  const GRID_COLS = 10
  const ITEM_WIDTH = 250
  const ITEM_GAP = 32
  const ITEM_HEIGHT = 220
  const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_GAP

  // Configurações de pan inteligente
  const MIN_ZOOM_FOR_FREE_PAN = 0.6
  const SAFETY_MARGIN = 100

  // Configurações de transição
  const TRANSITION_DURATION = 200 // 200ms

  // Drag & Drop state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    dragOffset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    dropIndex: null,
    hoveredIndex: null,
    dragStartIndex: 0,
  })

  // Calcula posição no grid baseado em coordenadas
  const getGridPosition = useCallback(
    (x: number, y: number): GridPosition => {
      const col = Math.max(0, Math.min(GRID_COLS - 1, Math.floor(x / TOTAL_ITEM_WIDTH)))
      const row = Math.max(0, Math.floor(y / (ITEM_HEIGHT + ITEM_GAP)))
      const index = row * GRID_COLS + col

      return { row, col, index: Math.min(index, artboards.length) }
    },
    [artboards.length],
  )

  // Calcula se há colisão com uma prancheta
  const getCollisionIndex = useCallback(
    (x: number, y: number): number | null => {
      const position = getGridPosition(x, y)

      // Verifica se está dentro dos limites de uma prancheta existente
      const targetIndex = Math.min(position.index, artboards.length - 1)

      if (targetIndex >= 0 && targetIndex < artboards.length) {
        const targetRow = Math.floor(targetIndex / GRID_COLS)
        const targetCol = targetIndex % GRID_COLS

        // Calcula posição exata da prancheta alvo
        const targetX = targetCol * TOTAL_ITEM_WIDTH
        const targetY = targetRow * (ITEM_HEIGHT + ITEM_GAP)

        // Verifica se está próximo o suficiente
        const distanceX = Math.abs(x - (targetX + ITEM_WIDTH / 2))
        const distanceY = Math.abs(y - (targetY + ITEM_HEIGHT / 2))

        if (distanceX < ITEM_WIDTH * 0.6 && distanceY < ITEM_HEIGHT * 0.6) {
          // Determina se deve inserir antes ou depois
          const insertAfter = x > targetX + ITEM_WIDTH / 2
          return insertAfter ? targetIndex + 1 : targetIndex
        }
      }

      return position.index
    },
    [artboards.length],
  )

  // Reorganiza array considerando limite de 10 por linha
  const reorderWithLineLimit = useCallback(
    (sourceIndex: number, targetIndex: number): Artboard[] => {
      const newArtboards = [...artboards]
      const [draggedItem] = newArtboards.splice(sourceIndex, 1)

      // Ajusta índice se necessário
      const adjustedTargetIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex
      newArtboards.splice(adjustedTargetIndex, 0, draggedItem)

      return newArtboards
    },
    [artboards],
  )

  // Calcula os limites de pan baseado no zoom atual
  const calculatePanLimits = useCallback((currentZoom: number, artboard: Artboard) => {
    if (!canvasRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }

    const container = canvasRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

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
  }, [])

  const constrainPan = useCallback(
    (newPan: { x: number; y: number }, currentZoom: number, artboard: Artboard) => {
      const limits = calculatePanLimits(currentZoom, artboard)

      return {
        x: Math.max(limits.minX, Math.min(limits.maxX, newPan.x)),
        y: Math.max(limits.minY, Math.min(limits.maxY, newPan.y)),
      }
    },
    [calculatePanLimits],
  )

  const centerArtboard = useCallback((artboard: Artboard, targetZoom?: number) => {
    if (!canvasRef.current) return

    const container = canvasRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const idealZoomX = (containerWidth - SAFETY_MARGIN * 2) / artboard.width
    const idealZoomY = (containerHeight - SAFETY_MARGIN * 2) / artboard.height
    const idealZoom = Math.min(idealZoomX, idealZoomY, 1)

    const finalZoom = targetZoom || Math.max(idealZoom, 0.2)

    setZoom(finalZoom)
    setPan({ x: 0, y: 0 })
  }, [])

  // Centraliza prancheta específica no modo grid
  const centerArtboardInGrid = useCallback((artboardIndex: number) => {
    if (!canvasRef.current || !gridRef.current) return

    const container = canvasRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    // Calcula posição da prancheta no grid
    const row = Math.floor(artboardIndex / GRID_COLS)
    const col = artboardIndex % GRID_COLS

    // Posição absoluta da prancheta no grid (sempre com zoom 1 no grid)
    const artboardX = col * TOTAL_ITEM_WIDTH + ITEM_WIDTH / 2
    const artboardY = row * (ITEM_HEIGHT + ITEM_GAP) + ITEM_HEIGHT / 2

    // Calcula o pan necessário para centralizar a prancheta na viewport
    const targetPanX = containerWidth / 2 - artboardX
    const targetPanY = containerHeight / 2 - artboardY

    // Aplica o pan suavemente
    setPan({ x: targetPanX, y: targetPanY })
  }, [])

  const handleZoomAtPoint = useCallback(
    (delta: number, clientX: number, clientY: number) => {
      if (!canvasRef.current || isTransitioning) return

      const rect = canvasRef.current.getBoundingClientRect()
      const cursorX = clientX - rect.left
      const cursorY = clientY - rect.top

      const newZoom = Math.max(0.1, Math.min(5, zoom * delta))

      if (viewMode === "central") {
        const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
        if (currentArtboard) {
          const newPan = {
            x: cursorX - (cursorX - pan.x) * (newZoom / zoom),
            y: cursorY - (cursorY - pan.y) * (newZoom / zoom),
          }
          setZoom(newZoom)
          const constrainedPan = constrainPan(newPan, newZoom, currentArtboard)
          setPan(constrainedPan)
        }
      } else {
        const newPan = {
          x: cursorX - (cursorX - pan.x) * (newZoom / zoom),
          y: cursorY - (cursorY - pan.y) * (newZoom / zoom),
        }
        setZoom(newZoom)
        setPan(newPan)
      }
    },
    [zoom, pan, viewMode, activeArtboard, artboards, constrainPan, isTransitioning],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (dragState.isDragging || isTransitioning) return

      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      handleZoomAtPoint(delta, e.clientX, e.clientY)
    },
    [handleZoomAtPoint, dragState.isDragging, isTransitioning],
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
    [dragState.isDragging, isTransitioning],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTransitioning) return

      if (dragState.isDragging && gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect()
        const relativeX = (e.clientX - gridRect.left) / zoom - pan.x / zoom
        const relativeY = (e.clientY - gridRect.top) / zoom - pan.y / zoom

        // Atualizar posição atual do drag
        setDragState((prev) => ({
          ...prev,
          currentPosition: { x: e.clientX, y: e.clientY },
        }))

        // Calcular nova posição de drop com colisão
        const collisionIndex = getCollisionIndex(relativeX, relativeY)
        const hoveredIndex = collisionIndex !== null ? Math.floor(collisionIndex) : null

        setDragState((prev) => ({
          ...prev,
          dropIndex: collisionIndex,
          hoveredIndex: hoveredIndex,
        }))
      } else if (isPanning) {
        const deltaX = e.clientX - lastPanPoint.x
        const deltaY = e.clientY - lastPanPoint.y

        if (viewMode === "central") {
          const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
          if (currentArtboard) {
            const newPan = {
              x: pan.x + deltaX,
              y: pan.y + deltaY,
            }
            const constrainedPan = constrainPan(newPan, zoom, currentArtboard)
            setPan(constrainedPan)
          }
        } else {
          setPan((prev) => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY,
          }))
        }

        setLastPanPoint({ x: e.clientX, y: e.clientY })
      }
    },
    [
      dragState.isDragging,
      isPanning,
      lastPanPoint,
      viewMode,
      activeArtboard,
      artboards,
      pan,
      zoom,
      constrainPan,
      getCollisionIndex,
      isTransitioning,
    ],
  )

  const handleMouseUp = useCallback(() => {
    if (isTransitioning) return

    if (dragState.isDragging && dragState.dropIndex !== null) {
      const draggedIndex = artboards.findIndex((ab) => ab.id === dragState.draggedId)
      if (draggedIndex !== -1 && draggedIndex !== dragState.dropIndex) {
        const newArtboards = reorderWithLineLimit(draggedIndex, dragState.dropIndex)
        reorderArtboards(newArtboards)
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
    setIsPanning(false)
  }, [dragState, artboards, reorderArtboards, reorderWithLineLimit, isTransitioning])

  // Drag handlers para pranchetas
  const handleArtboardDragStart = useCallback(
    (e: React.MouseEvent, artboardId: string) => {
      if (viewMode !== "grid" || isTransitioning) return

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
    [viewMode, artboards, isTransitioning],
  )

  const resetView = () => {
    if (isTransitioning) return

    if (viewMode === "central") {
      const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
      if (currentArtboard) {
        centerArtboard(currentArtboard)
      }
    } else {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const fitToScreen = () => {
    if (isTransitioning) return

    if (viewMode === "central") {
      const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
      if (currentArtboard) {
        centerArtboard(currentArtboard)
      }
    } else {
      resetView()
    }
  }

  const handleAddArtboard = () => {
    if (isTransitioning) return

    addArtboard()
    setTimeout(() => {
      if (viewMode === "central") {
        const newArtboard = artboards[artboards.length - 1]
        if (newArtboard) {
          centerArtboard(newArtboard)
        }
      }
    }, 50)
  }

  // Função para iniciar transição
  const startTransition = useCallback(() => {
    setIsTransitioning(true)

    // Limpa timeout anterior se existir
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    // Timeout de segurança para garantir que sempre termina
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false)
      transitionTimeoutRef.current = null
    }, 300) // 300ms de segurança
  }, [])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  // Efeito para ajustes pós-mudança de viewMode
  useEffect(() => {
    if (!isTransitioning) {
      if (viewMode === "grid") {
        // Ajusta zoom e centraliza no grid
        setZoom(1)
        const targetIndex = artboards.findIndex((ab) => ab.id === activeArtboard)
        if (targetIndex !== -1) {
          setTimeout(() => centerArtboardInGrid(targetIndex), 100)
        }
      } else if (viewMode === "central") {
        // Centraliza prancheta no modo central
        const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)
        if (currentArtboard) {
          setTimeout(() => centerArtboard(currentArtboard), 100)
        }
      }
    }
  }, [viewMode, isTransitioning, activeArtboard, artboards])

  if (viewMode === "central") {
    const currentArtboard = artboards.find((ab) => ab.id === activeArtboard)

    return (
      <div className="flex-1 bg-gray-900 overflow-hidden relative flex flex-col">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isTransitioning}
            onClick={() => {
              const newZoom = Math.max(0.1, zoom * 0.9)
              setZoom(newZoom)
              if (viewMode === "central" && currentArtboard) {
                const constrainedPan = constrainPan(pan, newZoom, currentArtboard)
                setPan(constrainedPan)
              }
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={resetView} disabled={isTransitioning}>
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isTransitioning}
            onClick={() => {
              const newZoom = Math.min(5, zoom * 1.1)
              setZoom(newZoom)
              if (viewMode === "central" && currentArtboard) {
                const constrainedPan = constrainPan(pan, newZoom, currentArtboard)
                setPan(constrainedPan)
              }
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={fitToScreen} disabled={isTransitioning}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Pan Status Indicator */}
        {zoom >= MIN_ZOOM_FOR_FREE_PAN && (
          <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-2 py-1 rounded text-xs">Pan Livre</div>
        )}

        {/* Indicador de transição */}
        {isTransitioning && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-3 py-1 rounded text-xs">
            Transitioning...
          </div>
        )}

        <div
          ref={canvasRef}
          className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {currentArtboard && (
            <div
              className="bg-white rounded-lg shadow-2xl relative border-2 border-gray-600"
              style={{
                width: currentArtboard.width * zoom,
                height: currentArtboard.height * zoom,
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <div className="absolute -top-8 left-0 text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
                {currentArtboard.name} • {Math.round(zoom * 100)}%
              </div>

              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-lg mb-2">Empty Artboard</div>
                  <div className="text-sm">
                    {currentArtboard.width} × {currentArtboard.height}px
                  </div>
                  {zoom < MIN_ZOOM_FOR_FREE_PAN && (
                    <div className="text-xs mt-2 text-blue-400">
                      Zoom para {Math.round(MIN_ZOOM_FOR_FREE_PAN * 100)}% para pan livre
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid View com transição
  return (
    <div className="flex-1 bg-gray-900 overflow-hidden relative flex flex-col">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isTransitioning}
          onClick={() => setZoom((prev) => Math.max(0.1, prev * 0.9))}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={resetView} disabled={isTransitioning}>
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isTransitioning}
          onClick={() => setZoom((prev) => Math.min(5, prev * 1.1))}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={fitToScreen} disabled={isTransitioning}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Controls - apenas no modo grid */}
      <div className="absolute top-4 left-4 z-10 flex gap-1">
        <Button
          variant={viewMode === "central" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            if (!dragState.isDragging && !isTransitioning) {
              startTransition()
              setViewMode("central")
            }
          }}
          disabled={isTransitioning}
        >
          <Maximize className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            if (!dragState.isDragging && !isTransitioning) {
              startTransition()
              setViewMode("grid")
            }
          }}
          disabled={isTransitioning}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Indicador de transição */}
      {isTransitioning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-3 py-1 rounded text-xs">
          Transitioning...
        </div>
      )}

      {/* Prancheta sendo arrastada - overlay */}
      {dragState.isDragging && dragState.draggedId && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragState.currentPosition.x - 125,
            top: dragState.currentPosition.y - 90,
            transform: "rotate(-5deg)",
          }}
        >
          {(() => {
            const draggedArtboard = artboards.find((ab) => ab.id === dragState.draggedId)
            if (!draggedArtboard) return null

            return (
              <div
                className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 opacity-90"
                style={{
                  width: 250,
                  height: Math.max(180, (draggedArtboard.height / draggedArtboard.width) * 250),
                  maxHeight: 300,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-blue-500/20 to-transparent rounded-t-lg flex items-center justify-between px-2">
                  <div className="text-xs font-medium text-gray-700 bg-white/90 px-2 py-1 rounded">
                    {draggedArtboard.name}
                  </div>
                </div>
                <div className="w-full h-full p-4 flex items-center justify-center text-gray-500 relative pt-8">
                  <div className="text-center">
                    <div className="text-sm mb-1">Dragging...</div>
                    <div className="text-xs">
                      {draggedArtboard.width} × {draggedArtboard.height}px
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div
        ref={canvasRef}
        className="flex-1 overflow-auto p-8 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={gridRef}
          className="grid gap-8 min-w-max"
          style={{
            gridTemplateColumns: "repeat(10, minmax(250px, 1fr))",
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "top left",
            width: "fit-content",
          }}
        >
          {artboards.map((artboard, index) => {
            const isDragged = dragState.draggedId === artboard.id
            const isHovered = dragState.hoveredIndex === index && !isDragged
            const shouldShowPlaceholder = dragState.dropIndex === index && !isDragged
            const shouldOffset =
              dragState.isDragging &&
              !isDragged &&
              dragState.hoveredIndex !== null &&
              Math.abs(index - dragState.hoveredIndex) <= 1 &&
              index !== dragState.dragStartIndex

            return (
              <React.Fragment key={artboard.id}>
                {/* Placeholder fantasma para indicar posição de drop */}
                {shouldShowPlaceholder && (
                  <div
                    className="bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center animate-pulse"
                    style={{
                      width: 250,
                      height: Math.max(180, (artboard.height / artboard.width) * 250),
                      maxHeight: 300,
                    }}
                  >
                    <div className="text-blue-400 text-sm font-medium">Drop aqui</div>
                  </div>
                )}

                <div
                  className={`bg-white rounded-lg shadow-lg cursor-pointer transition-all duration-200 ${
                    activeArtboard === artboard.id ? "ring-2 ring-blue-500" : ""
                  } ${isDragged ? "opacity-30 scale-95 rotate-2" : ""} ${
                    isHovered ? "shadow-xl scale-105" : "hover:shadow-xl"
                  } ${shouldOffset ? "transform translate-x-2" : ""}`}
                  style={{
                    width: 250,
                    height: Math.max(180, (artboard.height / artboard.width) * 250),
                    maxHeight: 300,
                  }}
                  onClick={() => {
                    if (!dragState.isDragging && !isTransitioning) {
                      setActiveArtboard(artboard.id)
                      startTransition()
                      setViewMode("central")
                    }
                  }}
                  onMouseEnter={() => setHoveredArtboard(artboard.id)}
                  onMouseLeave={() => setHoveredArtboard(null)}
                >
                  {/* Drag Handle - Header Area com hover melhorado */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-8 rounded-t-lg flex items-center justify-between px-2 transition-all duration-200 ${
                      hoveredArtboard === artboard.id || isDragged
                        ? "bg-gradient-to-b from-blue-500/20 to-transparent cursor-move"
                        : "bg-gradient-to-b from-black/5 to-transparent cursor-pointer"
                    }`}
                    onMouseDown={(e) => handleArtboardDragStart(e, artboard.id)}
                  >
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded transition-all duration-200 ${
                        hoveredArtboard === artboard.id || isDragged
                          ? "text-blue-700 bg-blue-50/90 shadow-sm"
                          : "text-gray-700 bg-white/80"
                      }`}
                    >
                      {artboard.name}
                    </div>
                    <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">#{index + 1}</div>
                  </div>

                  <div className="w-full h-full p-4 flex items-center justify-center text-gray-500 relative pt-8">
                    <div className="text-center">
                      <div className="text-sm mb-1">Empty</div>
                      <div className="text-xs">
                        {artboard.width} × {artboard.height}px
                      </div>
                    </div>
                  </div>

                  {/* Indicador de elevação quando hover */}
                  {(hoveredArtboard === artboard.id || isHovered) && !isDragged && (
                    <div className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none" />
                  )}
                </div>
              </React.Fragment>
            )
          })}

          {/* Placeholder final para drop no final */}
          {dragState.dropIndex === artboards.length && (
            <div
              className="bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center animate-pulse"
              style={{
                width: 250,
                height: 180,
              }}
            >
              <div className="text-blue-400 text-sm font-medium">Drop aqui</div>
            </div>
          )}

          {/* Add New Artboard */}
          <div
            className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
            style={{
              width: 250,
              height: 180,
            }}
            onClick={handleAddArtboard}
          >
            <div className="text-center text-gray-400">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">New Artboard</div>
              <div className="text-xs mt-1">#{artboards.length + 1}</div>
            </div>
          </div>
        </div>

        {/* Grid Info melhorado */}
        <div className="absolute bottom-4 left-4 z-10 bg-gray-800 text-white px-3 py-2 rounded text-sm">
          {artboards.length} artboard{artboards.length !== 1 ? "s" : ""} • {Math.ceil((artboards.length + 1) / 10)} row
          {Math.ceil((artboards.length + 1) / 10) !== 1 ? "s" : ""}
          {dragState.isDragging && (
            <span className="text-blue-400 ml-2">
              • Reorganizando... ({dragState.dragStartIndex + 1} → {(dragState.dropIndex ?? 0) + 1})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
