"use client"

export function TopHeader() {
  return (
    <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="text-lg font-semibold">Design Editor</div>
        <div className="text-sm text-gray-400">Untitled Project</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-sm font-medium">U</div>
      </div>
    </div>
  )
}
