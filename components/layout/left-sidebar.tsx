"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Grid3X3, Maximize, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import type { ViewMode, Artboard } from "@/types"

interface LeftSidebarProps {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  artboards: Artboard[]
  activeArtboard: string
  setActiveArtboard: (id: string) => void
  addArtboard: () => void
  updateArtboard: (id: string, updates: Partial<Artboard>) => void
  deleteArtboard: (id: string) => void
}

export function LeftSidebar({
  viewMode,
  setViewMode,
  artboards,
  activeArtboard,
  setActiveArtboard,
  addArtboard,
  updateArtboard,
  deleteArtboard,
}: LeftSidebarProps) {
  const [editingName, setEditingName] = useState<string | null>(null)

  const handleNameEdit = (artboard: Artboard, newName: string) => {
    updateArtboard(artboard.id, { name: newName })
    setEditingName(null)
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* View Mode Toggle */}
      <div className="p-4">
        <div className="text-xs font-medium text-gray-400 mb-3">VIEW MODE</div>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "central" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("central")}
            className="flex-1"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Central
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="flex-1"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Artboards */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-medium text-gray-400">ARTBOARDS</div>
          <Button variant="ghost" size="sm" onClick={addArtboard} className="h-6 w-6 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {artboards.map((artboard) => (
            <div
              key={artboard.id}
              className={`group p-3 rounded cursor-pointer transition-colors ${
                activeArtboard === artboard.id ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => setActiveArtboard(artboard.id)}
            >
              {/* Thumbnail */}
              <div className="w-full h-12 bg-white rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                {artboard.width} × {artboard.height}
              </div>

              {/* Name */}
              {editingName === artboard.id ? (
                <Input
                  defaultValue={artboard.name}
                  className="text-sm bg-gray-600 border-gray-500 h-6"
                  autoFocus
                  onBlur={(e) => handleNameEdit(artboard, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNameEdit(artboard, e.currentTarget.value)
                    }
                    if (e.key === "Escape") {
                      setEditingName(null)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div
                    className="text-sm flex-1"
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      setEditingName(artboard.id)
                    }}
                  >
                    {artboard.name}
                  </div>
                  {artboards.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteArtboard(artboard.id)
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
