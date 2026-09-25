import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createItemRequest } from '../api/items'
import ImageUploader from './ImageUploader'

const CATEGORY_OPTIONS = [
  'Electronics',
  'Bags & Backpacks',
  'Clothing',
  'Books & Notebooks',
  'Keys',
  'ID Cards & Wallets',
  'Jewelry & Watches',
  'Bottles & Containers',
  'Other',
]

/**
 * Shared form component for reporting either a lost or found item.
 *
 * @param {Object} props
 * @param {'LOST'|'FOUND'} props.type - The item classification
 */
export default function ItemReportForm({ type }) {
  const isLost = type === 'LOST'
  const heading = isLost ? 'Report a Lost Item' : 'Report a Found Item'
  const subtext = isLost
    ? 'Provide details to help the campus community find and return your lost item'
    : 'Provide details about an item you found so its owner can recover it'

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    color: '',
    brand: '',
    description: '',
    locationText: '',
    eventDate: '',
  })
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errorField === name) {
      setErrorField('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorField('')
    setSuccessMsg('')
    setLoading(true)

    try {
      await createItemRequest({
        type,
        ...formData,
        imageUrl: imageUrl.trim() || undefined,
      })

      setSuccessMsg(
        isLost
          ? 'Lost item report submitted successfully! Redirecting...'
          : 'Found item report submitted successfully! Redirecting...'
      )

      setTimeout(() => {
        navigate('/my-listings')
      }, 1200)
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
    <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtext}</p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-lg text-sm bg-rose-50 text-rose-700 border border-rose-200 flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="mb-4 p-3 rounded-lg text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title (Required) */}
        <div>
          <label
            htmlFor="title"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Title <span className="text-rose-500">*</span>
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
                ? 'e.g. Blue Hydro Flask, Silver MacBook Pro 14"'
                : 'e.g. Black Casio Calculator, Set of House Keys'
            }
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'title'
                ? 'border-rose-400 bg-rose-50/30'
                : 'border-slate-300'
            }`}
          />
        </div>

        {/* Category (Required) */}
        <div>
          <label
            htmlFor="category"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'category'
                ? 'border-rose-400 bg-rose-50/30'
                : 'border-slate-300'
            }`}
          >
            <option value="">Select a category...</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Color and Brand row (Optional) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="color"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Color <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="color"
              name="color"
              type="text"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g. Navy Blue, Matte Black"
              className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
                errorField === 'color'
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="brand"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Brand <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="brand"
              name="brand"
              type="text"
              value={formData.brand}
              onChange={handleChange}
              placeholder="e.g. Apple, Casio, Hydro Flask"
              className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
                errorField === 'brand'
                  ? 'border-rose-400 bg-rose-50/30'
                  : 'border-slate-300'
              }`}
            />
          </div>
        </div>

        {/* Location Text (Optional) */}
        <div>
          <label
            htmlFor="locationText"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Location Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="locationText"
            name="locationText"
            type="text"
            value={formData.locationText}
            onChange={handleChange}
            placeholder={
              isLost
                ? 'Where was it last seen? (e.g. Science Library 2nd floor, Student Union)'
                : 'Where was it found? (e.g. Math Hall 101 Desk 3B, Dining Hall Table 4)'
            }
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'locationText'
                ? 'border-rose-400 bg-rose-50/30'
                : 'border-slate-300'
            }`}
          />
        </div>

        {/* Event Date (Optional) */}
        <div>
          <label
            htmlFor="eventDate"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Date {isLost ? 'Lost' : 'Found'} <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            value={formData.eventDate}
            onChange={handleChange}
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'eventDate'
                ? 'border-rose-400 bg-rose-50/30'
                : 'border-slate-300'
            }`}
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add any distinctive features, stickers, scratches, or details..."
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'description'
                ? 'border-rose-400 bg-rose-50/30'
                : 'border-slate-300'
            }`}
          />
        </div>

        {/* Photo Upload (Optional) */}
        <div>
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
            <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              Note: Image upload could not be completed ({uploadError}). You may still submit your report without an image or try uploading again.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting report...</span>
            </>
          ) : (
            isLost ? 'Submit Lost Item Report' : 'Submit Found Item Report'
          )}
        </button>
      </form>
    </div>
  )
}
