"use client"

import type React from "react"
import { useMemo, useEffect } from "react"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Artboard, ViewMode } from "@/types"
import { MIN_ZOOM_FOR_FREE_PAN } from "@/utils/pan-constraints"

interface TransitionState {
  isActive: boolean
  fromMode: ViewMode | null
  toMode: ViewMode | null
  phase: "start" | "middle" | "end"
}

interface CentralViewProps {
  artboard: Artboard
  zoom: number
  pan: { x: number; y: number }
  isZooming: boolean
  isTransitioning: boolean
  transitionState: TransitionState
  canvasRef: React.RefObject<HTMLDivElement>
  contentRef: React.RefObject<HTMLDivElement>
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onWheel: (e: React.WheelEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
}

export function CentralView({
  artboard,
  zoom,
  pan,
  isZooming,
  isTransitioning,
  transitionState,
  canvasRef,
  contentRef,
  onZoomIn,
  onZoomOut,
  onResetView,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: CentralViewProps) {
  // 🎯 Memoized animation class
  const containerAnimationClass = useMemo(() => {
    if (!transitionState.isActive) return ""

    if (transitionState.fromMode === "grid" && transitionState.toMode === "central") {
      return "transition-to-central"
    }

    return ""
  }, [transitionState.isActive, transitionState.fromMode, transitionState.toMode])

  // 🎯 Set contentRef to the artboard element
  useEffect(() => {
    const artboardElement = canvasRef.current?.querySelector("[data-artboard]") as HTMLDivElement
    if (artboardElement && contentRef) {
      contentRef.current = artboardElement
    }
  }, [canvasRef, contentRef])

  return (
    <div className="flex-1 bg-gray-900 overflow-hidden relative flex flex-col">
      {/* 🚀 Enhanced Zoom Controls with visual feedback */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isTransitioning}
          onClick={onZoomOut}
          className={`zoom-indicator ${isZooming ? "scale-feedback" : ""}`}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onResetView}
          disabled={isTransitioning}
          className="zoom-indicator"
        >
          {Math.round(zoom * 100)}%
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isTransitioning}
          onClick={onZoomIn}
          className={`zoom-indicator ${isZooming ? "scale-feedback" : ""}`}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* 🎯 Pan status with smooth fade */}
      {zoom >= MIN_ZOOM_FOR_FREE_PAN && !isTransitioning && (
        <div className="absolute top-4 left-4 z-10 bg-blue-600 text-white px-2 py-1 rounded text-xs fade-in">
          Pan Livre
        </div>
      )}

      {/* 🚀 Smooth transition indicator */}
      {isTransitioning && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-3 py-1 rounded text-xs fade-in">
          {transitionState.phase === "start"
            ? "Focalizando..."
            : transitionState.phase === "middle"
              ? "Centralizando..."
              : "Finalizando..."}
        </div>
      )}

      <div
        ref={canvasRef}
        className={`flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing gpu-container ${containerAnimationClass}`}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div
          data-artboard
          className={`bg-white rounded-lg shadow-2xl relative border-2 border-gray-600 zoom-immediate ${isZooming ? "scale-feedback" : ""}`}
          style={{
            width: artboard.width * zoom,
            height: artboard.height * zoom,
          }}
        >
          {/* 🎯 Enhanced artboard info */}
          <div className="absolute -top-8 left-0 text-sm text-gray-400 bg-gray-800 px-2 py-1 rounded fade-in">
            {artboard.name} • {Math.round(zoom * 100)}% • {artboard.width} × {artboard.height}px
          </div>

          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center fade-in">
              <div className="text-lg mb-2">Artboard Vazia</div>
              <div className="text-sm mb-2">
                {artboard.width} × {artboard.height}px
              </div>
              {zoom < MIN_ZOOM_FOR_FREE_PAN && (
                <div className="text-xs mt-2 text-blue-400">
                  Zoom para {Math.round(MIN_ZOOM_FOR_FREE_PAN * 100)}% para pan livre
                </div>
              )}
              <div className="text-xs mt-2 text-gray-500">
                🖱️ Roda do mouse: zoom direcionado ao cursor
                <br />🔘 Botões: zoom centralizado
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
