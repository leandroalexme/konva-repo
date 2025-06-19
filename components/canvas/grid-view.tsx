"use client"

import type React from "react"
import { useState } from "react"
import { Plus, ZoomIn, ZoomOut, Maximize2, Maximize, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArtboardCard } from "./artboard-card"
import type { ViewMode, Artboard, DragState } from "@/types"

interface TransitionState {
  isActive: boolean
  fromMode: ViewMode | null
  toMode: ViewMode | null
}

interface GridViewProps {
  artboards: Artboard[]
  activeArtboard: string
  dragState: DragState
  zoom: number
  pan: { x: number; y: number }
  isTransitioning: boolean
  transitionState: TransitionState
  viewMode: ViewMode
  canvasRef: React.RefObject<HTMLDivElement>
  gridRef: React.RefObject<HTMLDivElement>
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onFitToScreen: () => void
  onViewModeChange: (mode: ViewMode) => void
  onArtboardClick: (id: string) => void
  onArtboardDragStart: (e: React.MouseEvent, id: string) => void
  onAddArtboard: () => void
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function GridView({
  artboards,
  activeArtboard,
  dragState,
  zoom,
  pan,
  isTransitioning,
  transitionState,
  viewMode,
  canvasRef,
  gridRef,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToScreen,
  onViewModeChange,
  onArtboardClick,
  onArtboardDragStart,
  onAddArtboard,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: GridViewProps) {
  const [hoveredArtboard, setHoveredArtboard] = useState<string | null>(null)

  // Determinar classe CSS para animação
  const getAnimationClass = () => {
    if (!transitionState.isActive) return ""

    if (transitionState.fromMode === "central" && transitionState.toMode === "grid") {
      return "animate-scale-out" // 1.05 → 1 ease-in
    }

    return ""
  }

  return (
    <div className="flex-1 bg-gray-900 overflow-hidden relative flex flex-col">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button variant="secondary" size="sm" disabled={isTransitioning} onClick={onZoomOut}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={onResetView} disabled={isTransitioning}>
          {Math.round(zoom * 100)}%
        </Button>
        <Button variant="secondary" size="sm" disabled={isTransitioning} onClick={onZoomIn}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={onFitToScreen} disabled={isTransitioning}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* View Mode Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-1">
        <Button
          variant={viewMode === "central" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("central")}
          disabled={isTransitioning}
        >
          <Maximize className="w-4 h-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewModeChange("grid")}
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
                className="bg-white rounded-lg shadow-2xl border-2 border-blue-500 opacity-90 transition-transform duration-150"
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
        className={`flex-1 overflow-auto p-8 cursor-grab active:cursor-grabbing ${getAnimationClass()}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
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
              <ArtboardCard
                key={artboard.id}
                artboard={artboard}
                index={index}
                isActive={activeArtboard === artboard.id}
                isDragged={isDragged}
                isHovered={isHovered}
                shouldShowPlaceholder={shouldShowPlaceholder}
                shouldOffset={shouldOffset}
                hoveredArtboard={hoveredArtboard}
                onMouseDown={onArtboardDragStart}
                onClick={() => onArtboardClick(artboard.id)}
                onMouseEnter={() => setHoveredArtboard(artboard.id)}
                onMouseLeave={() => setHoveredArtboard(null)}
              />
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
            className="bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors duration-200"
            style={{
              width: 250,
              height: 180,
            }}
            onClick={onAddArtboard}
          >
            <div className="text-center text-gray-400">
              <Plus className="w-8 h-8 mx-auto mb-2" />
              <div className="text-sm">New Artboard</div>
              <div className="text-xs mt-1">#{artboards.length + 1}</div>
            </div>
          </div>
        </div>

        {/* Grid Info */}
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
