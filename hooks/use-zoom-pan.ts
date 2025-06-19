"use client"

import type React from "react"

import { useState, useCallback } from "react"
import type { Artboard } from "@/types"
import { calculatePanLimits, constrainPan, SAFETY_MARGIN } from "@/utils/pan-constraints"

export function useZoomPan() {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  const handleZoomAtPoint = useCallback(
    (
      delta: number,
      clientX: number,
      clientY: number,
      containerRef: React.RefObject<HTMLDivElement>,
      artboard?: Artboard,
    ) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const cursorX = clientX - rect.left
      const cursorY = clientY - rect.top

      const newZoom = Math.max(0.1, Math.min(5, zoom * delta))

      if (artboard) {
        const newPan = {
          x: cursorX - (cursorX - pan.x) * (newZoom / zoom),
          y: cursorY - (cursorY - pan.y) * (newZoom / zoom),
        }
        setZoom(newZoom)
        const limits = calculatePanLimits(newZoom, artboard, rect.width, rect.height)
        const constrainedPan = constrainPan(newPan, limits)
        setPan(constrainedPan)
      } else {
        const newPan = {
          x: cursorX - (cursorX - pan.x) * (newZoom / zoom),
          y: cursorY - (cursorY - pan.y) * (newZoom / zoom),
        }
        setZoom(newZoom)
        setPan(newPan)
      }
    },
    [zoom, pan],
  )

  const centerArtboard = useCallback((artboard: Artboard, containerRef: React.RefObject<HTMLDivElement>) => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight

    const idealZoomX = (containerWidth - SAFETY_MARGIN * 2) / artboard.width
    const idealZoomY = (containerHeight - SAFETY_MARGIN * 2) / artboard.height
    const idealZoom = Math.min(idealZoomX, idealZoomY, 1)

    const finalZoom = Math.max(idealZoom, 0.2)

    setZoom(finalZoom)
    setPan({ x: 0, y: 0 })
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const updatePan = useCallback((newPan: { x: number; y: number }) => {
    setPan(newPan)
  }, [])

  return {
    zoom,
    pan,
    isPanning,
    lastPanPoint,
    setZoom,
    setPan,
    updatePan,
    setIsPanning,
    setLastPanPoint,
    handleZoomAtPoint,
    centerArtboard,
    resetView,
  }
}
