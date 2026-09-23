import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/campusfind-backend'

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor: attach JWT bearer token if present in localStorage
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusfind_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle token expiration / 401 Unauthorized responses globally
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || ''
      // Skip global redirect for auth endpoints (login/register) to preserve inline form error handling
      const isAuthEndpoint =
        requestUrl.includes('/api/auth/login') ||
        requestUrl.includes('/api/auth/register')

      if (!isAuthEndpoint) {
        localStorage.removeItem('campusfind_token')
        localStorage.removeItem('campusfind_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.axiosClient = axiosClient
}

export default axiosClient
