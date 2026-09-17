import { useState, useEffect } from 'react'
import { checkHealth } from './api/health'

export default function App() {
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [serviceName, setServiceName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    checkHealth()
      .then((data) => {
        if (isMounted) {
          setStatus('success')
          setServiceName(data.service || 'campusfind-backend')
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStatus('error')
          setErrorMessage(err.message || 'Backend unreachable')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-slate-200">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          CampusFind
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Smart Campus Lost &amp; Found
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100">
          {status === 'loading' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              Checking backend health...
            </div>
          )}

          {status === 'success' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Backend status: ok ({serviceName})
            </div>
          )}

          {status === 'error' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Backend unreachable ({errorMessage})
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
