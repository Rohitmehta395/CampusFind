import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Enhanced Register Page with clear student guidance, password visibility,
 * and Geniestudio daylight styling.
 */
export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [loading, setLoading] = useState(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrorField('')
    setLoading(true)

    try {
      await register(name, email, password)
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
    <div
      className="flex-1 flex items-center justify-center px-4 py-16"
      style={{ background: '#ebf5ff' }}
    >
      <div
        className="max-w-md w-full p-8 sm:p-10 border transition-all"
        style={{
          background: '#fafdff',
          borderRadius: '32px',
          borderColor: '#e8f1f8',
          boxShadow: 'rgba(4, 69, 144, 0.08) 0px 16px 36px 0px',
        }}
      >
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
            style={{ background: '#181d27' }}
          >
            <svg className="w-7 h-7" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="#fafdff" strokeWidth="1.5" />
              <path d="M10 6l1.8 3.5-3.5 1.7L10 6z" fill="#0099ff" />
              <path d="M10 14l-1.8-3.5 3.5-1.7L10 14z" fill="#fafdff" fillOpacity="0.75" />
            </svg>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-medium tracking-tight"
            style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
          >
            Create Student Account
          </h1>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: '#93979f' }}>
            Join the university recovery network to report items and submit encrypted claims.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-2xl text-xs flex items-start gap-2.5"
            style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Full Student Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                errorField === 'name' ? 'border-rose-400 bg-rose-50/30' : ''
              }`}
              style={{
                background: '#ebf5ff',
                border: errorField === 'name' ? '1.5px solid #be123c' : '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
            >
              Campus Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@campus.edu"
              className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                errorField === 'email' ? 'border-rose-400 bg-rose-50/30' : ''
              }`}
              style={{
                background: '#ebf5ff',
                border: errorField === 'email' ? '1.5px solid #be123c' : '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#0a0d12', letterSpacing: '0.04em' }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className={`w-full px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all ${
                errorField === 'password' ? 'border-rose-400 bg-rose-50/30' : ''
              }`}
              style={{
                background: '#ebf5ff',
                border: errorField === 'password' ? '1.5px solid #be123c' : '1.5px solid #e8f1f8',
                color: '#0a0d12',
                outlineColor: '#0069e0',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 btn-charcoal justify-center text-center py-3.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating student profile…</span>
              </>
            ) : (
              'Create Account →'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs" style={{ color: '#93979f' }}>
          Already registered?{' '}
          <Link
            to="/login"
            className="font-medium transition-colors"
            style={{ color: '#0069e0' }}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}
