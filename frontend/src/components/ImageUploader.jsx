import { useState, useRef } from 'react'
import { uploadImageToCloudinary } from '../api/cloudinary'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Reusable image uploader component for direct-to-Cloudinary image uploads.
 * Includes client-side guardrails (file type & 5MB size limit), local preview via URL.createObjectURL,
 * upload loading state, error display, and invocation of onUploadComplete(url).
 *
 * Design: Geniestudio daylight notebook style — 24px rounded dashed upload zone,
 * pastel error badges, and pill remove buttons.
 *
 * @param {Object} props
 * @param {function(string): void} props.onUploadComplete - Callback receiving the uploaded Cloudinary secure URL
 * @param {string} [props.currentImageUrl] - Optional existing image URL to display initially
 * @param {function(string): void} [props.onUploadError] - Optional callback receiving error messages
 */
export default function ImageUploader({ onUploadComplete, currentImageUrl = '', onUploadError }) {
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl)
  const [uploadedUrl, setUploadedUrl] = useState(currentImageUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    // Guardrail 1: MIME type check
    if (!file.type.startsWith('image/')) {
      const msg = 'Invalid file type. Please select an image file (e.g. JPG, PNG, WebP).'
      setError(msg)
      if (onUploadError) onUploadError(msg)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Guardrail 2: Max file size (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const msg = 'File size exceeds 5MB limit. Please select a smaller image.'
      setError(msg)
      if (onUploadError) onUploadError(msg)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Generate local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    // Execute direct direct upload to Cloudinary
    setUploading(true)
    try {
      const secureUrl = await uploadImageToCloudinary(file)
      setUploadedUrl(secureUrl)
      setPreviewUrl(secureUrl)
      if (onUploadComplete) {
        onUploadComplete(secureUrl)
      }
    } catch (err) {
      const msg = err.message || 'Image upload failed. Please try again.'
      setError(msg)
      if (onUploadError) onUploadError(msg)
      // Reset preview on failure if no prior successful upload exists
      if (!uploadedUrl) {
        setPreviewUrl('')
      }
    } finally {
      setUploading(false)
      URL.revokeObjectURL(localPreview)
    }
  }

  const handleRemove = () => {
    setPreviewUrl('')
    setUploadedUrl('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onUploadComplete) {
      onUploadComplete('')
    }
  }

  return (
    <div className="w-full">
      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-3 p-3 rounded-2xl text-xs flex items-start gap-2"
          style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview or Drop Area */}
      {previewUrl ? (
        <div
          className="relative rounded-2xl overflow-hidden flex flex-col items-center justify-center p-4 border"
          style={{ background: '#ebf5ff', borderColor: '#d5e6f0' }}
        >
          <div className="relative w-full h-48 sm:h-56 flex items-center justify-center overflow-hidden rounded-xl bg-white/60">
            <img
              src={previewUrl}
              alt="Item preview"
              className="max-h-full max-w-full object-contain rounded-lg"
            />

            {/* Uploading Overlay */}
            {uploading && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'rgba(24, 29, 39, 0.75)', color: '#ffffff' }}
              >
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-medium">Uploading to cloud…</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          {!uploading && (
            <div className="mt-3 flex items-center gap-2 w-full justify-between">
              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#047857' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Image ready
              </span>

              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer"
                style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
              >
                Remove Photo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2"
          style={{
            borderColor: '#d5e6f0',
            background: '#ebf5ff',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0069e0'
            e.currentTarget.style.background = '#e0f0ff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d5e6f0'
            e.currentTarget.style.background = '#ebf5ff'
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: '#cce7ff', color: '#0069e0' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-xs" style={{ color: '#535862' }}>
            <span className="font-semibold" style={{ color: '#0a0d12' }}>Click to upload</span> or drag and drop
          </div>
          <p className="text-[11px]" style={{ color: '#93979f' }}>PNG, JPG, WebP up to 5MB</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="image-file-input"
        data-testid="image-file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
