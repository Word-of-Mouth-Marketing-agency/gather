'use client'

import { useState, useRef } from 'react'
import type { MediaAsset } from '@/types'

// Mock media library
const MOCK_MEDIA: MediaAsset[] = [
  { id: 'm1', filename: 'hero-bg.jpg', url: '/images/hero-bg.jpg', alt: 'Hero background', mimeType: 'image/jpeg', size: 248000, width: 1920, height: 1080, uploadedAt: '2026-06-01T00:00:00Z' },
  { id: 'm2', filename: 'gift-boxes.jpg', url: '/images/categories/gift-boxes.jpg', alt: 'Gift Boxes category', mimeType: 'image/jpeg', size: 124000, width: 800, height: 800, uploadedAt: '2026-06-01T00:00:00Z' },
  { id: 'm3', filename: 'flowers.jpg', url: '/images/categories/flowers.jpg', alt: 'Flowers category', mimeType: 'image/jpeg', size: 118000, width: 800, height: 800, uploadedAt: '2026-06-01T00:00:00Z' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>(MOCK_MEDIA)
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList) {
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file)
      const newAsset: MediaAsset = {
        id: `m-${Date.now()}-${Math.random()}`,
        filename: file.name,
        url,
        alt: file.name.replace(/\.[^.]+$/, ''),
        mimeType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      }
      setAssets((prev) => [newAsset, ...prev])
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-400 mt-0.5">{assets.length} assets</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="gather-btn-primary text-sm py-2.5 px-5 shadow-md"
        >
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#ff7a1a] bg-[#fff4e8]' : 'border-gray-200 hover:border-[#ff7a1a]/50 hover:bg-gray-50'
        }`}
      >
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-sm font-semibold text-gray-600">Drop images here or click to upload</p>
        <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WebP, GIF</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => setSelected(selected === asset.id ? null : asset.id)}
            className={`group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 transition-all ${
              selected === asset.id ? 'border-[#ff7a1a] shadow-lg' : 'border-transparent hover:border-[#ff7a1a]/40'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.url}
              alt={asset.alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-[10px] text-white truncate font-medium">{asset.filename}</p>
              <p className="text-[10px] text-white/70">{formatBytes(asset.size)}</p>
            </div>
            {selected === asset.id && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#ff7a1a] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected asset details */}
      {selected && (() => {
        const asset = assets.find((a) => a.id === selected)
        if (!asset) return null
        return (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-5">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.alt} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="font-bold text-gray-900">{asset.filename}</p>
              <p className="text-sm text-gray-400">{asset.mimeType} · {formatBytes(asset.size)}</p>
              {asset.width && <p className="text-sm text-gray-400">{asset.width} × {asset.height}px</p>}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigator.clipboard.writeText(asset.url)}
                  className="text-xs text-[#ff7a1a] font-bold border border-[#ff7a1a]/30 px-3 py-1.5 rounded-lg hover:bg-[#fff4e8] transition-colors"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => { setAssets((prev) => prev.filter((a) => a.id !== selected)); setSelected(null) }}
                  className="text-xs text-red-400 font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
