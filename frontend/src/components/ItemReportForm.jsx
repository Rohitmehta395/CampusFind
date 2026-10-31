import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createItemRequest } from '../api/items'
import ImageUploader from './ImageUploader'
import { CAMPUS_LANDMARKS } from '../constants/landmarks'

/**
 * Shared form component for reporting either a lost or found item.
 *
 * Enhanced Geniestudio visual design:
 * - Segmented visual type switcher (Lost vs Found)
 * - Tap-friendly category pill chips with icons
 * - Popular landmark shortcut chips + full selector
 * - Quick color tags + brand input
 * - High-polish 32px card framing and charcoal submit CTA
 *
 * @param {Object} props
 * @param {'LOST'|'FOUND'} props.type - The item classification
 */
export default function ItemReportForm({ type: initialType = 'LOST' }) {
  const [currentType, setCurrentType] = useState(initialType)
  const isLost = currentType === 'LOST'

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    color: '',
    brand: '',
    description: '',
    locationText: '',
    eventDate: '',
  })
  const [selectedLandmark, setSelectedLandmark] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const categoryMeta = [
    { name: 'Electronics', icon: '💻' },
    { name: 'Bags & Backpacks', icon: '🎒' },
    { name: 'ID Cards & Wallets', icon: '🪪' },
    { name: 'Keys', icon: '🔑' },
    { name: 'Books & Notebooks', icon: '📚' },
    { name: 'Clothing & Apparel', icon: '👕' },
    { name: 'Jewelry & Watches', icon: '⌚' },
    { name: 'Bottles & Containers', icon: '🧴' },
    { name: 'Other Possessions', icon: '📦' },
  ]

  const popularColors = ['Black', 'Silver', 'Blue', 'White', 'Red', 'Gray', 'Gold']
  const popularLandmarks = CAMPUS_LANDMARKS.slice(0, 5)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errorField === name) {
      setErrorField('')
    }
  }

  const handleCategorySelect = (catName) => {
    setFormData((prev) => ({ ...prev, category: catName }))
    if (errorField === 'category') setErrorField('')
  }

  const handleColorSelect = (c) => {
    setFormData((prev) => ({ ...prev, color: prev.color === c ? '' : c }))
  }

  const handleLandmarkSelect = (lmName) => {
    setSelectedLandmark((prev) => (prev === lmName ? '' : lmName))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorField('')
    setSuccessMsg('')

    if (!formData.title.trim()) {
      setError('Please provide a title for the item.')
      setErrorField('title')
      return
    }

    if (!formData.category) {
      setError('Please select an item category.')
      setErrorField('category')
      return
    }

    setLoading(true)

    try {
      const landmarkObj = CAMPUS_LANDMARKS.find((lm) => lm.name === selectedLandmark)
      const payload = {
        type: currentType,
        ...formData,
        imageUrl: imageUrl.trim() || undefined,
      }

      if (landmarkObj) {
        payload.latitude = landmarkObj.latitude
        payload.longitude = landmarkObj.longitude
      }

      await createItemRequest(payload)

      setSuccessMsg(
        isLost
          ? 'Lost item report submitted! Our proximity engine is scanning for matches…'
          : 'Found item report submitted! Thank you for helping fellow campus students.'
      )

      setTimeout(() => {
        navigate('/my-listings')
      }, 1400)
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to submit item report'
      const field = err.response?.data?.field || ''
      setError(message)
      setErrorField(field)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="max-w-2xl w-full p-7 sm:p-11 transition-all"
      style={{
        background: '#fafdff',
        borderRadius: '32px',
        boxShadow: 'rgba(4, 69, 144, 0.08) 0px 16px 36px 0px',
        border: '1px solid #e8f1f8',
      }}
    >
      {/* ── Type Switcher Pill ── */}
      <div className="flex justify-center mb-8">
        <div
          className="inline-flex p-1.5 rounded-full border"
          style={{ background: '#ebf5ff', borderColor: '#d5e6f0' }}
        >
          <button
            type="button"
            onClick={() => setCurrentType('LOST')}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: isLost ? '#181d27' : 'transparent',
              color: isLost ? '#ffffff' : '#535862',
              boxShadow: isLost ? 'rgba(10, 13, 18, 0.4) 0px 2px 4px' : 'none',
            }}
          >
            <span>🔍</span>
            <span>I Lost Something</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentType('FOUND')}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: !isLost ? '#181d27' : 'transparent',
              color: !isLost ? '#ffffff' : '#535862',
              boxShadow: !isLost ? 'rgba(10, 13, 18, 0.4) 0px 2px 4px' : 'none',
            }}
          >
            <span>📦</span>
            <span>I Found Something</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl sm:text-3xl font-medium tracking-tight"
          style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
        >
          {isLost ? 'Report a Lost Possession' : 'Register a Found Possession'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed" style={{ color: '#535862' }}>
          {isLost
            ? 'Provide key identifying details so honest finders and campus security can verify your ownership.'
            : 'Log where and when you found this item so its owner can submit proof and reclaim it.'}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl text-xs flex items-start gap-2.5"
          style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-6 p-4 rounded-2xl text-xs flex items-start gap-2.5"
          style={{ background: '#d3f6e3', color: '#047857', border: '1px solid #a7f3d0' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* 1. Title Input */}
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
          >
            Item Name / Title <span style={{ color: '#be123c' }}>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder={
              isLost
                ? 'e.g. Blue Hydro Flask 32oz, Silver MacBook Pro 14"'
                : 'e.g. Casio Scientific Calculator, Set of Keys with Blue Lanyard'
            }
            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              background: '#ebf5ff',
              border: errorField === 'title' ? '1.5px solid #be123c' : '1.5px solid #e8f1f8',
              color: '#0a0d12',
              outlineColor: '#0069e0',
            }}
          />
        </div>

        {/* 2. Interactive Category Pill Grid */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
          >
            Select Category <span style={{ color: '#be123c' }}>*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categoryMeta.map((cat) => {
              const isSelected = formData.category === cat.name
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className="flex items-center gap-2 p-3 rounded-2xl text-xs font-medium border text-left transition-all cursor-pointer"
                  style={{
                    background: isSelected ? '#181d27' : '#ebf5ff',
                    color: isSelected ? '#ffffff' : '#0a0d12',
                    borderColor: isSelected ? '#181d27' : '#e8f1f8',
                    transform: isSelected ? 'scale(1.02)' : 'none',
                  }}
                >
                  <span className="text-base select-none">{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              )
            })}
          </div>
          {errorField === 'category' && (
            <p className="mt-1.5 text-xs" style={{ color: '#be123c' }}>Please pick a category</p>
          )}
        </div>

        {/* 3. Primary Color & Brand Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="color"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Primary Color <span style={{ color: '#93979f' }}>(optional)</span>
            </label>
            <input
              id="color"
              name="color"
              type="text"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g. Matte Black, Navy"
              className="w-full px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all mb-2"
              style={{
                background: '#ebf5ff',
                border: '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
            {/* Quick color chips */}
            <div className="flex flex-wrap gap-1.5">
              {popularColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorSelect(c)}
                  className="text-[11px] px-2.5 py-0.5 rounded-full border transition-all cursor-pointer"
                  style={{
                    background: formData.color === c ? '#cce7ff' : '#ffffff',
                    color: formData.color === c ? '#0069e0' : '#535862',
                    borderColor: formData.color === c ? '#0069e0' : '#e8f1f8',
                    fontWeight: formData.color === c ? 600 : 400,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="brand"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Brand / Make <span style={{ color: '#93979f' }}>(optional)</span>
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Apple, Nike, Casio, Hydro Flask"
              className="w-full px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                background: '#ebf5ff',
                border: '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>
        </div>

        {/* 4. Campus Landmark Proximity Selector */}
        <div>
          <label
            htmlFor="landmark"
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
          >
            Campus Landmark Anchor <span style={{ color: '#93979f' }}>(for GPS proximity engine)</span>
          </label>

          {/* Quick landmark chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {popularLandmarks.map((lm) => (
              <button
                key={lm.name}
                type="button"
                onClick={() => handleLandmarkSelect(lm.name)}
                className="text-[11px] px-3 py-1 rounded-full border transition-all cursor-pointer"
                style={{
                  background: selectedLandmark === lm.name ? '#181d27' : '#ebf5ff',
                  color: selectedLandmark === lm.name ? '#ffffff' : '#0a0d12',
                  borderColor: selectedLandmark === lm.name ? '#181d27' : '#e8f1f8',
                  fontWeight: selectedLandmark === lm.name ? 600 : 400,
                }}
              >
                📍 {lm.name}
              </button>
            ))}
          </div>

          <select
            id="landmark"
            name="landmark"
            value={selectedLandmark}
            onChange={(e) => setSelectedLandmark(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 transition-all cursor-pointer"
            style={{
              background: '#ebf5ff',
              border: '1.5px solid #e8f1f8',
              color: selectedLandmark ? '#0a0d12' : '#93979f',
              outlineColor: '#0069e0',
            }}
          >
            <option value="">Or select from all campus landmarks…</option>
            {CAMPUS_LANDMARKS.map((lm) => (
              <option key={lm.name} value={lm.name}>
                {lm.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs" style={{ color: '#93979f' }}>
            Selecting a landmark triggers proximity matching within a 200m zone.
          </p>
        </div>

        {/* 5. Specific Location Description & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="locationText"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Exact Room / Spot <span style={{ color: '#93979f' }}>(optional)</span>
            </label>
            <input
              id="locationText"
              name="locationText"
              type="text"
              value={formData.locationText}
              onChange={handleChange}
              placeholder={isLost ? 'e.g. 2nd Floor, Table near windows' : 'e.g. Desk 14, Lecture Hall B'}
              className="w-full px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                background: '#ebf5ff',
                border: '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="eventDate"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Date {isLost ? 'Lost' : 'Found'} <span style={{ color: '#93979f' }}>(optional)</span>
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                background: '#ebf5ff',
                border: '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>
        </div>

        {/* 6. Description Textarea */}
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
          >
            Distinctive Features &amp; Clues <span style={{ color: '#93979f' }}>(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any stickers, keychains, scratches, case styles, or identifiers that help confirm ownership..."
            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              background: '#ebf5ff',
              border: '1.5px solid #e8f1f8',
              color: '#0a0d12',
              outlineColor: '#0069e0',
            }}
          />
        </div>

        {/* 7. Enhanced Image Upload Zone */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
          >
            Photograph Attachment <span style={{ color: '#93979f' }}>(optional)</span>
          </label>
          <ImageUploader
            currentImageUrl={imageUrl}
            onUploadComplete={(url) => {
              setImageUrl(url)
              setUploadError('')
            }}
            onUploadError={(msg) => {
              setUploadError(msg)
            }}
          />
          {uploadError && (
            <p
              className="mt-2 text-xs p-3 rounded-2xl"
              style={{ background: '#fff2be', color: '#854d0e', border: '1px solid #fde047' }}
            >
              Note: Image upload could not be completed ({uploadError}). You may still submit without a photo.
            </p>
          )}
        </div>

        {/* 8. Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 btn-charcoal justify-center text-center py-4 text-base cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
          style={{ width: '100%' }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Registering item on campus network…</span>
            </>
          ) : (
            isLost ? 'Submit Lost Item Report →' : 'Publish Found Item Listing →'
          )}
        </button>
      </form>
    </div>
  )
}
