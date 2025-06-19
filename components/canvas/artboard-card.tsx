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

export function ArtboardCard({
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
}: ArtboardCardProps) {
  return (
    <React.Fragment>
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
          isActive ? "ring-2 ring-blue-500" : ""
        } ${isDragged ? "opacity-30 scale-95 rotate-2" : ""} ${
          isHovered ? "shadow-xl scale-105" : "hover:shadow-xl"
        } ${shouldOffset ? "transform translate-x-2" : ""}`}
        style={{
          width: 250,
          height: Math.max(180, (artboard.height / artboard.width) * 250),
          maxHeight: 300,
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Drag Handle - Header Area */}
        <div
          className={`absolute top-0 left-0 right-0 h-8 rounded-t-lg flex items-center justify-between px-2 transition-all duration-200 ${
            hoveredArtboard === artboard.id || isDragged
              ? "bg-gradient-to-b from-blue-500/20 to-transparent cursor-move"
              : "bg-gradient-to-b from-black/5 to-transparent cursor-pointer"
          }`}
          onMouseDown={(e) => onMouseDown(e, artboard.id)}
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
}
