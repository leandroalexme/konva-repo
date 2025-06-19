"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { ViewMode } from "@/types"

export function useTransitions() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [scaleTransition, setScaleTransition] = useState<{
    isActive: boolean
    scale: number
    easing: string
  }>({
    isActive: false,
    scale: 1,
    easing: "ease-out",
  })

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startTransition = useCallback((fromMode: ViewMode, toMode: ViewMode) => {
    // Limpar timeout anterior
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    setIsTransitioning(true)

    // Configurar escala inicial e easing baseado na transição
    const initialScale = toMode === "grid" ? 1.05 : 0.95
    const easing = toMode === "grid" ? "ease-in" : "ease-out"

    // Aplicar escala inicial imediatamente
    setScaleTransition({
      isActive: true,
      scale: initialScale,
      easing,
    })

    // Após um frame, animar para escala normal
    requestAnimationFrame(() => {
      setScaleTransition((prev) => ({
        ...prev,
        scale: 1,
      }))
    })

    // Finalizar transição após animação
    transitionTimeoutRef.current = setTimeout(() => {
      setScaleTransition({
        isActive: false,
        scale: 1,
        easing: "ease-out",
      })
      setIsTransitioning(false)
    }, 250)
  }, [])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTransitioning,
    scaleTransition,
    startTransition,
  }
}
