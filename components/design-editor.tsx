"\"use client"

import { useState } from "react"
import { LeftSidebar } from "./layout/left-sidebar"
import { MainCanvas } from "./canvas/main-canvas"
import { TopHeader } from "./layout/top-header"
import type { ViewMode, Tool, Artboard } from "@/types"

export function DesignEditor() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [artboards, setArtboards] = useState<Artboard[]>([
    { id: "1", name: "Artboard 1", width: 800, height: 600 },
    { id: "2", name: "Artboard 2", width: 800, height: 600 },
    { id: "3", name: "Artboard 3", width: 1200, height: 800 },
  ])
  const [activeArtboard, setActiveArtboard] = useState<string>("1")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const addArtboard = () => {
    const newId = (artboards.length + 1).toString()
    const newArtboard: Artboard = {
      id: newId,
      name: `Artboard ${newId}`,
      width: 800,
      height: 600,
    }
    setArtboards([...artboards, newArtboard])
    setActiveArtboard(newId)
  }

  const updateArtboard = (id: string, updates: Partial<Artboard>) => {
    setArtboards(artboards.map((ab) => (ab.id === id ? { ...ab, ...updates } : ab)))
  }

  const deleteArtboard = (id: string) => {
    if (artboards.length > 1) {
      const filtered = artboards.filter((ab) => ab.id !== id)
      setArtboards(filtered)
      if (activeArtboard === id) {
        setActiveArtboard(filtered[0].id)
      }
    }
  }

  const reorderArtboards = (newOrder: Artboard[]) => {
    setArtboards(newOrder)
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white">
      <TopHeader />

      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          artboards={artboards}
          activeArtboard={activeArtboard}
          setActiveArtboard={setActiveArtboard}
          addArtboard={addArtboard}
          updateArtboard={updateArtboard}
          deleteArtboard={deleteArtboard}
        />

        <MainCanvas
          viewMode={viewMode}
          artboards={artboards}
          activeArtboard={activeArtboard}
          setActiveArtboard={setActiveArtboard}
          setViewMode={setViewMode}
          addArtboard={addArtboard}
          updateArtboard={updateArtboard}
          reorderArtboards={reorderArtboards}
        />
      </div>
    </div>
  )
}

export type ViewMode = "central" | "grid"

export interface Artboard {
  id: string
  name: string
  width: number
  height: number
}
