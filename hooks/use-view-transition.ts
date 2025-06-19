"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { ViewMode } from "@/types"

export function useViewTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean
    fromMode: ViewMode | null
    toMode: ViewMode | null
    phase: "start" | "middle" | "end"
  }>({
    isActive: false,
    fromMode: null,
    toMode: null,
    phase: "start",
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startTransition = useCallback((fromMode: ViewMode, toMode: ViewMode) => {
    // 🚀 Clear previous transitions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current)
      phaseTimeoutRef.current = null
    }

    // 🎯 Start transition
    setIsTransitioning(true)
    setTransitionState({
      isActive: true,
      fromMode,
      toMode,
      phase: "start",
    })

    // 🚀 Middle phase for smooth transition
    phaseTimeoutRef.current = setTimeout(() => {
      setTransitionState((prev) => ({
        ...prev,
        phase: "middle",
      }))
    }, 100) // 100ms into transition

    // 🎯 End transition
    timeoutRef.current = setTimeout(() => {
      setTransitionState({
        isActive: false,
        fromMode: null,
        toMode: null,
        phase: "end",
      })
      setIsTransitioning(false)
      timeoutRef.current = null
      phaseTimeoutRef.current = null
    }, 250) // Total transition time
  }, [])

  const clearTransition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current)
      phaseTimeoutRef.current = null
    }
    setIsTransitioning(false)
    setTransitionState({
      isActive: false,
      fromMode: null,
      toMode: null,
      phase: "end",
    })
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTransitioning,
    transitionState,
    startTransition,
    clearTransition,
  }
}
