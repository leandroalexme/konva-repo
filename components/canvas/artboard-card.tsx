"use client"

import React from "react"
import type { Artboard } from "@/types"

interface ArtboardCardProps {
  artboard: Artboard
  index: number
  isActive: boolean
  isDragged: boolean
  isHovered: boolean
  shouldShowPlaceholder: boolean
  shouldOffset: boolean
  hoveredArtboard: string | null
  onMouseDown: (e: React.MouseEvent, artboardId: string) => void
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

// 🚀 OTIMIZAÇÃO CRÍTICA: React.memo com comparação otimizada
export const ArtboardCard = React.memo<ArtboardCardProps>(
  ({
    artboard,
    index,
    isActive,
    isDragged,
    isHovered,
    shouldShowPlaceholder,
    shouldOffset,
    hoveredArtboard,
    onMouseDown,
    onClick,
    onMouseEnter,
    onMouseLeave,
  }) => {
    // 🎯 Cálculos memoizados para evitar recálculos desnecessários
    const cardHeight = React.useMemo(
      () => Math.max(180, (artboard.height / artboard.width) * 250),
      [artboard.width, artboard.height],
    )

    const isCardHovered = React.useMemo(
      () => hoveredArtboard === artboard.id || isDragged,
      [hoveredArtboard, artboard.id, isDragged],
    )

    // 🎯 Classes CSS memoizadas para evitar recálculos
    const cardClasses = React.useMemo(() => {
      const baseClasses =
        "bg-white rounded-lg shadow-lg cursor-pointer transition-transform duration-200 will-change-transform"
      const activeClasses = isActive ? "ring-2 ring-blue-500" : ""
      const draggedClasses = isDragged ? "opacity-30 scale-95 rotate-2" : ""
      const hoveredClasses = isHovered ? "shadow-xl scale-105" : "hover:shadow-xl"
      const offsetClasses = shouldOffset ? "transform translate-x-2" : ""

      return `${baseClasses} ${activeClasses} ${draggedClasses} ${hoveredClasses} ${offsetClasses}`.trim()
    }, [isActive, isDragged, isHovered, shouldOffset])

    const headerClasses = React.useMemo(() => {
      const baseClasses =
        "absolute top-0 left-0 right-0 h-8 rounded-t-lg flex items-center justify-between px-2 transition-all duration-200"
      const hoverClasses = isCardHovered
        ? "bg-gradient-to-b from-blue-500/20 to-transparent cursor-move"
        : "bg-gradient-to-b from-black/5 to-transparent cursor-pointer"

      return `${baseClasses} ${hoverClasses}`
    }, [isCardHovered])

    const titleClasses = React.useMemo(() => {
      const baseClasses = "text-xs font-medium px-2 py-1 rounded transition-all duration-200"
      const hoverClasses = isCardHovered ? "text-blue-700 bg-blue-50/90 shadow-sm" : "text-gray-700 bg-white/80"

      return `${baseClasses} ${hoverClasses}`
    }, [isCardHovered])

    return (
      <React.Fragment>
        {/* Placeholder fantasma otimizado */}
        {shouldShowPlaceholder && (
          <div
            className="bg-blue-500/10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center animate-pulse will-change-transform"
            style={{
              width: 250,
              height: Math.min(cardHeight, 300),
            }}
          >
            <div className="text-blue-400 text-sm font-medium">Drop aqui</div>
          </div>
        )}

        <div
          className={cardClasses}
          style={{
            width: 250,
            height: Math.min(cardHeight, 300),
          }}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Header otimizado */}
          <div className={headerClasses} onMouseDown={(e) => onMouseDown(e, artboard.id)}>
            <div className={titleClasses}>{artboard.name}</div>
            <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded">#{index + 1}</div>
          </div>

          {/* Conteúdo otimizado */}
          <div className="w-full h-full p-4 flex items-center justify-center text-gray-500 relative pt-8">
            <div className="text-center">
              <div className="text-sm mb-1">Empty</div>
              <div className="text-xs">
                {artboard.width} × {artboard.height}px
              </div>
            </div>
          </div>

          {/* Indicador de hover otimizado */}
          {(isCardHovered || isHovered) && !isDragged && (
            <div className="absolute inset-0 bg-blue-500/5 rounded-lg pointer-events-none will-change-transform" />
          )}
        </div>
      </React.Fragment>
    )
  },
  (prevProps, nextProps) => {
    // 🎯 Comparação otimizada para React.memo
    return (
      prevProps.artboard.id === nextProps.artboard.id &&
      prevProps.artboard.name === nextProps.artboard.name &&
      prevProps.artboard.width === nextProps.artboard.width &&
      prevProps.artboard.height === nextProps.artboard.height &&
      prevProps.index === nextProps.index &&
      prevProps.isActive === nextProps.isActive &&
      prevProps.isDragged === nextProps.isDragged &&
      prevProps.isHovered === nextProps.isHovered &&
      prevProps.shouldShowPlaceholder === nextProps.shouldShowPlaceholder &&
      prevProps.shouldOffset === nextProps.shouldOffset &&
      prevProps.hoveredArtboard === nextProps.hoveredArtboard
    )
  },
)

ArtboardCard.displayName = "ArtboardCard"
