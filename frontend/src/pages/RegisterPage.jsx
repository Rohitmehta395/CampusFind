import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Register page component with user registration form and automatic login.
 */
export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorField('')
    setLoading(true)

    try {
      // 1. Create account
      await register(name, email, password)
      // 2. Automatically log in the user for seamless UX
      await login(email, password)
      navigate('/my-listings')
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed'
      const field = err.response?.data?.field || ''
      setError(message)
      setErrorField(field)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-200">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Register
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create an account to report or claim lost items
        </p>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'name' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@campus.edu"
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'email' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className={`w-full px-3.5 py-2 rounded-lg border text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition ${
              errorField === 'password' ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-slate-900 hover:underline"
        >
          Sign in here
        </Link>
      </p>
    </div>
  )
}
