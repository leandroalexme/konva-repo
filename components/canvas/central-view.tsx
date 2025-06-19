"use client"

import type React from "react"

import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Artboard, ViewMode } from "@/types"
import { MIN_ZOOM_FOR_FREE_PAN } from "@/utils/pan-constraints"

interface TransitionState {
  isActive: boolean
  fromMode: ViewMode | null
  toMode: ViewMode | null
}

interface CentralViewProps {
  artboard: Artboard
  zoom: number
  pan: { x: number; y: number }
  isTransitioning: boolean
  transitionState: TransitionState
  canvasRef: React.RefObject<HTMLDivElement>
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onFitToScreen: () => void
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function CentralView({
  artboard,
  zoom,
  pan,
  isTransitioning,
  transitionState,
  canvasRef,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFitToScreen,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: CentralViewProps) {
  // Determinar classe CSS para animação
  const getAnimationClass = () => {
    if (!transitionState.isActive) return ""

    if (transitionState.fromMode === "grid" && transitionState.toMode === "central") {
      return "animate-scale-in" // 0.95 → 1 ease-out
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

      {/* Pan Status Indicator */}
      {zoom >= MIN_ZOOM_FOR_FREE_PAN && !isTransitioning && (
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
        className={`flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing ${getAnimationClass()}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl relative border-2 border-gray-600"
          style={{
            width: artboard.width * zoom,
            height: artboard.height * zoom,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <div className="absolute -top-8 left-0 text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded">
            {artboard.name} • {Math.round(zoom * 100)}%
          </div>

          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-lg mb-2">Empty Artboard</div>
              <div className="text-sm">
                {artboard.width} × {artboard.height}px
              </div>
              {zoom < MIN_ZOOM_FOR_FREE_PAN && (
                <div className="text-xs mt-2 text-blue-400">
                  Zoom para {Math.round(MIN_ZOOM_FOR_FREE_PAN * 100)}% para pan livre
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
