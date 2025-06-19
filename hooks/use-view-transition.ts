"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { ViewMode } from "@/types"

export function useViewTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionState, setTransitionState] = useState<{
    isActive: boolean
    fromMode: ViewMode | null
    toMode: ViewMode | null
  }>({
    isActive: false,
    fromMode: null,
    toMode: null,
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startTransition = useCallback((fromMode: ViewMode, toMode: ViewMode) => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Iniciar transição
    setIsTransitioning(true)
    setTransitionState({
      isActive: true,
      fromMode,
      toMode,
    })

    // Finalizar após 300ms
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false)
      setTransitionState({
        isActive: false,
        fromMode: null,
        toMode: null,
      })
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isTransitioning,
    transitionState,
    startTransition,
  }
}
