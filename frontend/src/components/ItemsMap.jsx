import { useEffect, useMemo, useRef, useState } from 'react'
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
 * Design: Geniestudio daylight notebook style — Bone-white card at 32px radius,
 * charcoal popup button, pastel status chips.
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
  const mappedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item &&
          item.latitude !== null &&
          item.latitude !== undefined &&
          item.longitude !== null &&
          item.longitude !== undefined &&
          !isNaN(Number(item.latitude)) &&
          !isNaN(Number(item.longitude))
      ),
    [items]
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
      const badgeBg = isLost ? '#fff1f2' : '#d3f6e3'
      const badgeText = isLost ? '#be123c' : '#047857'

      const safeTitle = escapeHtml(item.title)
      const safeCategory = escapeHtml(item.category)
      const safeLoc = escapeHtml(item.locationText || '')

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${badgeBg}; color: ${badgeText}; font-weight: 600; font-size: 10px; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">
              ${item.type}
            </span>
            <span style="color: #93979f; font-size: 11px;">${safeCategory}</span>
          </div>
          <p style="font-weight: 600; color: #0a0d12; margin: 4px 0 2px 0; font-size: 13px;">${safeTitle}</p>
          ${safeLoc ? `<p style="color: #535862; margin: 2px 0 10px 0; font-size: 11px;">📍 ${safeLoc}</p>` : '<div style="margin-bottom: 8px;"></div>'}
          <a href="/items/${item.id}" id="map-popup-link-${item.id}" style="display: inline-block; width: 100%; text-align: center; background: #181d27; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 9999px; font-weight: 500; font-size: 11px;">
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
      className="overflow-hidden transition-all mb-6"
      style={{
        background: '#fafdff',
        borderRadius: '32px',
        boxShadow: 'rgba(4, 69, 144, 0.05) 0px 4px 16px 0px',
      }}
    >
      {/* Header Bar */}
      <div
        className="px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: '#e8f1f8' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium flex items-center gap-2" style={{ color: '#0a0d12' }}>
            <span>🗺️</span> Campus Map View
          </span>
          <span
            id="map-count-badge"
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{ background: '#cce7ff', color: '#0069e0' }}
          >
            {mappedItems.length} {mappedItems.length === 1 ? 'item' : 'items'} mapped
          </span>
        </div>

        <button
          id="toggle-map-btn"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
          style={{ background: '#ebf5ff', color: '#535862' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0a0d12')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#535862')}
        >
          {isOpen ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Map Container */}
      <div className={`relative ${isOpen ? 'block' : 'hidden'}`}>
        <div
          id="campus-map-container"
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-0"
          style={{ background: '#ebf5ff' }}
        />

        {/* Informative overlay when 0 items on current view have coordinates */}
        {mappedItems.length === 0 && (
          <div
            id="map-empty-overlay"
            className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm pointer-events-none z-[400] p-3 rounded-2xl flex items-center gap-2.5 shadow-sm"
            style={{ background: '#fafdff', border: '1px solid #e8f1f8', color: '#535862' }}
          >
            <span className="text-sm">📍</span>
            <p className="text-xs leading-relaxed">
              No items in the current page/filter selection have campus landmark coordinates. Showing general campus view.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
