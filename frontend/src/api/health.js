import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/campusfind-backend'

/**
 * Checks the backend service health status.
 *
 * @returns {Promise<object>} The JSON response payload from the backend.
 */
export async function checkHealth() {
  const response = await axios.get(`${API_BASE_URL}/api/health`)
  return response.data
}
