import { useState, useRef } from 'react'
import { uploadImageToCloudinary } from '../api/cloudinary'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Reusable image uploader component for direct-to-Cloudinary image uploads.
 * Includes client-side guardrails (file type & 5MB size limit), local preview via URL.createObjectURL,
 * upload loading state, error display, and invocation of onUploadComplete(url).
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
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
        Item Photo <span className="text-slate-400 font-normal">(optional, max 5MB)</span>
      </label>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-3 p-2.5 rounded-lg text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-start gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview or Drop Area */}
      {previewUrl ? (
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col items-center justify-center p-3">
          <div className="relative w-full h-48 sm:h-56 flex items-center justify-center overflow-hidden rounded-lg bg-slate-900/5">
            <img
              src={previewUrl}
              alt="Item preview"
              className="max-h-full max-w-full object-contain rounded"
            />

            {/* Uploading Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs font-medium">Uploading to Cloudinary...</span>
              </div>
            )}
          </div>

          {/* Action Row */}
          {!uploading && (
            <div className="mt-3 flex items-center gap-2 w-full justify-between">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Image ready
              </span>

              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
              >
                Remove Photo
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/60 rounded-xl p-6 text-center transition-colors flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Click to upload</span> or drag and drop
          </div>
          <p className="text-[11px] text-slate-400">PNG, JPG, WebP up to 5MB</p>
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
