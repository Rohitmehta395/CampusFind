import axiosClient from './axiosClient'

/**
 * Checks the backend service health status using the shared axiosClient.
 *
 * @returns {Promise<object>} The JSON response payload from the backend.
 */
export async function checkHealth() {
  const response = await axiosClient.get('/api/health')
  return response.data
}
