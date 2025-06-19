"use client"

import type React from "react"
import { useState, useCallback, useRef, useEffect } from "react"
import type { Artboard, ViewMode } from "@/types"
import { calculatePanLimits, constrainPan } from "@/utils/pan-constraints"

export function useZoomPan() {
  // 🎯 React state - for UI updates
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // 🚀 Refs for real-time DOM manipulation
  const currentZoom = useRef(1)
  const currentPan = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  // 🎯 Interaction state
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })

  // 🚀 Immediate sync (no debouncing for pan)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isZooming = useRef(false)

  // 🎯 Update transform based on view mode - IMMEDIATE, NO TRANSITIONS
  const updateTransform = useCallback((newZoom: number, newPan: { x: number; y: number }, viewMode: ViewMode) => {
    if (!contentRef.current) return

    currentZoom.current = newZoom
    currentPan.current = newPan

    // 🚀 IMMEDIATE DOM update - no transitions for pan
    if (viewMode === "grid") {
      // Grid mode: scale the entire grid and translate
      contentRef.current.style.transform = `scale(${newZoom}) translate(${newPan.x / newZoom}px, ${newPan.y / newZoom}px) translateZ(0)`
    } else {
      // Central mode: translate the artboard (zoom handled by CSS width/height)
      contentRef.current.style.transform = `translate(${newPan.x}px, ${newPan.y}px) translateZ(0)`
    }
  }, [])

  // 🎯 IMMEDIATE React state sync for pan, debounced for zoom
  const syncReactState = useCallback((immediate = false) => {
    if (immediate) {
      // Immediate sync for pan
      setZoom(currentZoom.current)
      setPan(currentPan.current)
      isZooming.current = false
      return
    }

    // Debounced sync for zoom
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    syncTimeoutRef.current = setTimeout(() => {
      setZoom(currentZoom.current)
      setPan(currentPan.current)
      isZooming.current = false
    }, 16) // ~60fps
  }, [])

  // 🚀 CURSOR-DIRECTED ZOOM - zoom towards cursor position
  const handleZoomAtPoint = useCallback(
    (
      delta: number,
      clientX: number,
      clientY: number,
      containerElement: React.RefObject<HTMLDivElement>,
      viewMode: ViewMode,
      artboard?: Artboard,
    ) => {
      if (!containerElement.current) return

      isZooming.current = true
      const rect = containerElement.current.getBoundingClientRect()

      // 🎯 Calculate cursor position relative to container
      const cursorX = clientX - rect.left
      const cursorY = clientY - rect.top

      const oldZoom = currentZoom.current
      const newZoom = Math.max(0.1, Math.min(5, oldZoom * delta))

      if (viewMode === "central" && artboard) {
        // 🎯 Central mode: zoom towards cursor with artboard constraints
        const newPan = {
          x: cursorX - (cursorX - currentPan.current.x) * (newZoom / oldZoom),
          y: cursorY - (cursorY - currentPan.current.y) * (newZoom / oldZoom),
        }
        const limits = calculatePanLimits(newZoom, artboard, rect.width, rect.height)
        const constrainedPan = constrainPan(newPan, limits)

        updateTransform(newZoom, constrainedPan, viewMode)
      } else {
        // 🎯 Grid mode: zoom towards cursor without constraints
        const newPan = {
          x: cursorX - (cursorX - currentPan.current.x) * (newZoom / oldZoom),
          y: cursorY - (cursorY - currentPan.current.y) * (newZoom / oldZoom),
        }

        updateTransform(newZoom, newPan, viewMode)
      }

      // 🎯 Debounced state sync for zoom
      syncReactState()
    },
    [updateTransform, syncReactState],
  )

  // 🚀 IMMEDIATE pan update - no smoothing
  const updatePanImmediate = useCallback(
    (newPan: { x: number; y: number }, viewMode: ViewMode, artboard?: Artboard) => {
      if (viewMode === "central" && artboard && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const limits = calculatePanLimits(currentZoom.current, artboard, rect.width, rect.height)
        const constrainedPan = constrainPan(newPan, limits)

        updateTransform(currentZoom.current, constrainedPan, viewMode)
      } else {
        updateTransform(currentZoom.current, newPan, viewMode)
      }

      // 🚀 IMMEDIATE sync for pan
      syncReactState(true)
    },
    [updateTransform, syncReactState],
  )

  // 🎯 Center-point zoom for buttons
  const zoomIn = useCallback(
    (viewMode: ViewMode, artboard?: Artboard) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      handleZoomAtPoint(1.2, centerX, centerY, containerRef, viewMode, artboard)
    },
    [handleZoomAtPoint],
  )

  const zoomOut = useCallback(
    (viewMode: ViewMode, artboard?: Artboard) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      handleZoomAtPoint(0.8, centerX, centerY, containerRef, viewMode, artboard)
    },
    [handleZoomAtPoint],
  )

  // 🎯 Reset with immediate update
  const resetView = useCallback(
    (viewMode: ViewMode) => {
      const resetZoom = 1
      const resetPan = { x: 0, y: 0 }

      updateTransform(resetZoom, resetPan, viewMode)

      // Immediate sync for reset
      setZoom(resetZoom)
      setPan(resetPan)
    },
    [updateTransform],
  )

  // 🚀 Mode transition without smooth animations
  const transitionToMode = useCallback(
    (newMode: ViewMode, artboard?: Artboard) => {
      if (newMode === "grid") {
        // Transition to grid: reset zoom, keep some pan
        const gridZoom = 1
        const gridPan = { x: currentPan.current.x * 0.5, y: currentPan.current.y * 0.5 }
        updateTransform(gridZoom, gridPan, newMode)
        syncReactState(true)
      } else if (newMode === "central" && artboard) {
        // Transition to central: maintain zoom, center artboard
        const centralZoom = Math.max(0.5, Math.min(2, currentZoom.current))
        const centralPan = { x: 0, y: 0 }
        updateTransform(centralZoom, centralPan, newMode)
        syncReactState(true)
      }
    },
    [updateTransform, syncReactState],
  )

  // 🎯 Cleanup
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])

  return {
    zoom,
    pan,
    isPanning,
    lastPanPoint,
    containerRef,
    contentRef,
    currentZoom: currentZoom.current,
    currentPan: currentPan.current,
    isZooming: isZooming.current,
    setZoom,
    setPan,
    updatePan: updatePanImmediate,
    setIsPanning,
    setLastPanPoint,
    handleZoomAtPoint,
    zoomIn,
    zoomOut,
    resetView,
    updateTransform,
    transitionToMode,
  }
}
