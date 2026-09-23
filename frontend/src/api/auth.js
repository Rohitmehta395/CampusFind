import axiosClient from './axiosClient'

/**
 * Sends a login request to authenticate credentials and receive a JWT.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: {id: number, name: string, email: string, role: string}}>}
 */
export async function loginRequest(email, password) {
  const response = await axiosClient.post('/api/auth/login', { email, password })
  return response.data
}

/**
 * Sends a registration request to create a new user.
 *
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{id: number, name: string, email: string, role: string, createdAt: string}>}
 */
export async function registerRequest(name, email, password) {
  const response = await axiosClient.post('/api/auth/register', { name, email, password })
  return response.data
}
