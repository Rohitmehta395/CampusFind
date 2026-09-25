/**
 * Uploads an image file directly from the browser to Cloudinary using an unsigned upload preset.
 * This call bypasses the CampusFind backend and axiosClient completely, ensuring no JWT/Authorization
 * headers are transmitted to third-party endpoints.
 *
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded image
 * @throws {Error} If credentials are missing, or if Cloudinary rejects the upload
 */
export async function uploadImageToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary configuration is missing. Ensure VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET are set in frontend/.env'
    )
  }

  if (!file) {
    throw new Error('No file provided for upload')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data?.error?.message || `Cloudinary upload failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    if (!data.secure_url) {
      throw new Error('Cloudinary response did not contain a secure_url')
    }

    return data.secure_url
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Cloudinary upload server')
    }
    throw err
  }
}
