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

export default axiosClient
