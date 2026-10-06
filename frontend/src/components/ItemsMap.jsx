import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default Leaflet marker icons in Vite/bundler environments
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

// Central campus default coordinates (Main Library landmark anchor)
const DEFAULT_CAMPUS_CENTER = [12.9716, 77.5946]
const DEFAULT_ZOOM = 15

/**
 * Escapes HTML characters for safe injection into Leaflet popup strings.
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Renders an interactive Leaflet/OpenStreetMap view plotting markers for all items
 * that possess valid campus latitude/longitude coordinates in the current result set.
 *
 * @param {Object} props
 * @param {Array<Object>} props.items - List of items currently displayed on BrowsePage
 */
export default function ItemsMap({ items = [] }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersGroupRef = useRef(null)
  const [isOpen, setIsOpen] = useState(true)

  // Filter items that have real, non-null numeric coordinates
  const mappedItems = items.filter(
    (item) =>
      item &&
      item.latitude !== null &&
      item.latitude !== undefined &&
      item.longitude !== null &&
      item.longitude !== undefined &&
      !isNaN(Number(item.latitude)) &&
      !isNaN(Number(item.longitude))
  )

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      const markersGroup = L.layerGroup().addTo(map)
      markersGroupRef.current = markersGroup
      mapInstanceRef.current = map
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markersGroupRef.current = null
      }
    }
  }, [])

  // Invalidate map dimensions when map visibility is toggled
  useEffect(() => {
    if (isOpen && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 100)
    }
  }, [isOpen])

  // Update markers whenever mappedItems changes (reflects search/filters/page)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return

    markersGroupRef.current.clearLayers()

    const bounds = []

    mappedItems.forEach((item) => {
      const lat = Number(item.latitude)
      const lng = Number(item.longitude)
      bounds.push([lat, lng])

      const isLost = item.type === 'LOST'
      const badgeBg = isLost ? '#fef3c7' : '#d1fae5'
      const badgeText = isLost ? '#92400e' : '#065f46'

      const safeTitle = escapeHtml(item.title)
      const safeCategory = escapeHtml(item.category)
      const safeLoc = escapeHtml(item.locationText || '')

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 170px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${badgeBg}; color: ${badgeText}; font-weight: 700; font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
              ${item.type}
            </span>
            <span style="color: #64748b; font-size: 10px;">${safeCategory}</span>
          </div>
          <p style="font-weight: 600; color: #0f172a; margin: 4px 0; font-size: 12px;">${safeTitle}</p>
          ${safeLoc ? `<p style="color: #64748b; margin: 2px 0 8px 0; font-size: 11px;">📍 ${safeLoc}</p>` : '<div style="margin-bottom: 6px;"></div>'}
          <a href="/items/${item.id}" id="map-popup-link-${item.id}" style="display: inline-block; width: 100%; text-align: center; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">
            View Details &rarr;
          </a>
        </div>
      `

      const marker = L.marker([lat, lng])
      marker.bindPopup(popupHtml)
      markersGroupRef.current.addLayer(marker)
    })

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 16)
      } else {
        mapInstanceRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 })
      }
    } else {
      mapInstanceRef.current.setView(DEFAULT_CAMPUS_CENTER, DEFAULT_ZOOM)
    }
  }, [mappedItems])

  return (
    <div
      id="campus-items-map-card"
      className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden transition-all"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            🗺️ Campus Map View
          </span>
          <span
            id="map-count-badge"
            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
          >
            {mappedItems.length} {mappedItems.length === 1 ? 'item' : 'items'} mapped
          </span>
        </div>

        <button
          id="toggle-map-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 transition"
        >
          {isOpen ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Map Container */}
      <div className={`relative ${isOpen ? 'block' : 'hidden'}`}>
        <div
          id="campus-map-container"
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-0 bg-slate-100"
        />

        {/* Informative overlay when 0 items on current view have coordinates */}
        {mappedItems.length === 0 && (
          <div
            id="map-empty-overlay"
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm pointer-events-none z-[400] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2.5 shadow-md flex items-center gap-2"
          >
            <span className="text-slate-400 text-sm">ℹ️</span>
            <p className="text-xs text-slate-600">
              No items in the current page/filter selection have campus landmark coordinates. Showing general campus view.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
