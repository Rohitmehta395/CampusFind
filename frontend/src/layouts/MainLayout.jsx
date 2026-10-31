import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import { checkHealth } from '../api/health'

/**
 * Main layout component providing:
 * - Elevated daylight floating navigation bar
 * - Real-time campus connection status pill
 * - Quick "+ Report Item" dropdown CTA
 * - Professional User Profile avatar with dropdown account menu
 * - Responsive mobile drawer with pastel touchpoints
 * - Geniestudio daylight notebook footer
 */
export default function MainLayout() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [backendOnline, setBackendOnline] = useState(false)
  const userMenuRef = useRef(null)
  const reportMenuRef = useRef(null)
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false)
      }
      if (reportMenuRef.current && !reportMenuRef.current.contains(event.target)) {
        setReportDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setReportDropdownOpen(false)
    setUserDropdownOpen(false)
  }, [location.pathname])

  const getInitials = (currentUser) => {
    if (!currentUser) return 'U'
    if (currentUser.name && currentUser.name.trim()) {
      const parts = currentUser.name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }
    if (currentUser.email) {
      return currentUser.email[0].toUpperCase()
    }
    return 'U'
  }

  // Check backend health periodically for connection badge
  useEffect(() => {
    let isMounted = true
    const check = () => {
      checkHealth()
        .then(() => { if (isMounted) setBackendOnline(true) })
        .catch(() => { if (isMounted) setBackendOnline(false) })
    }
    check()
    const timer = setInterval(check, 30000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [])

  const navLinkClasses = ({ isActive }) =>
    `px-3.5 py-1.5 text-sm font-medium transition-all rounded-full ${
      isActive
        ? 'text-[#0a0d12] bg-[#ebf5ff] font-semibold'
        : 'text-[#535862] hover:text-[#0a0d12] hover:bg-white/80'
    }`

  const mobileNavLinkClasses = ({ isActive }) =>
    `block px-4 py-3 rounded-2xl text-base font-medium transition-all ${
      isActive
        ? 'bg-[#ebf5ff] text-[#0a0d12] font-semibold'
        : 'text-[#535862] hover:text-[#0a0d12] hover:bg-[#f6f7f8]'
    }`

  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden" style={{ background: '#ebf5ff' }}>

      {/* ── Elevated Daylight Floating Header ── */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 pt-3 pb-2 transition-all">
        <div
          className="max-w-[1200px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4 rounded-full border shadow-sm backdrop-blur-md transition-all"
          style={{
            background: 'rgba(250, 253, 255, 0.94)',
            borderColor: '#e8f1f8',
            boxShadow: 'rgba(4, 69, 144, 0.04) 0px 8px 24px 0px',
          }}
        >

          {/* Brand Identity */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none shrink-0"
          >
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
              style={{ background: '#181d27' }}
            >
              {/* Compass icon with daylight accent */}
              <svg className="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7.5" stroke="#fafdff" strokeWidth="1.5" />
                <path d="M10 6l1.8 3.5-3.5 1.7L10 6z" fill="#0099ff" />
                <path d="M10 14l-1.8-3.5 3.5-1.7L10 14z" fill="#fafdff" fillOpacity="0.75" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span
                className="text-base font-semibold tracking-tight leading-tight"
                style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
              >
                CampusFind
              </span>
              <span className="text-[10px] font-medium leading-none flex items-center gap-1" style={{ color: '#93979f' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: backendOnline ? '#10b981' : '#f59e0b' }}
                />
                {backendOnline ? 'Campus Live' : 'Connecting…'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center" aria-label="Desktop Navigation">
            <NavLink to="/" end className={navLinkClasses}>Home</NavLink>
            <NavLink to="/browse" className={navLinkClasses}>Browse Directory</NavLink>
            <NavLink to="/my-listings" className={navLinkClasses}>My Listings</NavLink>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Quick Report Dropdown */}
            <div className="relative" ref={reportMenuRef}>
              <button
                type="button"
                onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
                className="btn-charcoal-sm cursor-pointer"
                aria-expanded={reportDropdownOpen}
              >
                <span>+ Report Item</span>
                <svg className="w-3.5 h-3.5 transition-transform" style={{ transform: reportDropdownOpen ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {reportDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 p-2 rounded-2xl border shadow-lg space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                  style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
                >
                  <Link
                    to="/report-lost"
                    onClick={() => setReportDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#fff1f2] transition-colors group"
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: '#fecdd3', color: '#be123c' }}>
                      🔍
                    </span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Report Lost Item</div>
                      <div className="text-[10px]" style={{ color: '#93979f' }}>Misplaced a possession</div>
                    </div>
                  </Link>

                  <Link
                    to="/report-found"
                    onClick={() => setReportDropdownOpen(false)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#d3f6e3] transition-colors group"
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: '#a7f3d0', color: '#047857' }}>
                      📦
                    </span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Report Found Item</div>
                      <div className="text-[10px]" style={{ color: '#93979f' }}>Recovered someone's item</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-2 pl-1">
                {/* Notification Bell */}
                <NotificationBell />

                {/* Professional User Profile Avatar & Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 py-1 pl-1 pr-2.5 rounded-full border transition-all duration-150 cursor-pointer hover:shadow-xs group focus:outline-none focus:ring-2 focus:ring-[#0069e0]"
                    style={{
                      background: userDropdownOpen ? '#ffffff' : '#fafdff',
                      borderColor: userDropdownOpen ? '#0069e0' : '#e8f1f8',
                    }}
                    aria-expanded={userDropdownOpen}
                    aria-label="User account menu"
                  >
                    {/* Circle Avatar with User Initials */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs tracking-wider shadow-2xs group-hover:scale-105 transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, #181d27 0%, #2d3748 100%)',
                        color: '#ffffff',
                      }}
                    >
                      {getInitials(user)}
                    </div>

                    {/* Down Chevron */}
                    <svg
                      className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{
                        color: '#535862',
                        transform: userDropdownOpen ? 'rotate(180deg)' : 'none',
                      }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu Card */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 p-2 rounded-2xl border shadow-lg space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                      style={{
                        background: '#ffffff',
                        borderColor: '#e8f1f8',
                        boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 28px 0px, rgba(10, 13, 18, 0.04) 0px 2px 4px 0px',
                      }}
                    >
                      {/* User Identity Header */}
                      <div className="px-3 py-2.5 rounded-xl border-b mb-1" style={{ borderColor: '#f1f5f9' }}>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0 shadow-2xs"
                            style={{ background: '#181d27' }}
                          >
                            {getInitials(user)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold truncate" style={{ color: '#0a0d12' }}>
                              {user.name || 'Campus Student'}
                            </div>
                            <div className="text-[11px] truncate" style={{ color: '#535862' }} title={user.email}>
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: '#d3f6e3', color: '#047857' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {user.role === 'ADMIN' ? 'Campus Admin' : 'Verified Student'}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <Link
                        to="/my-listings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-[#ebf5ff] group"
                        style={{ color: '#0a0d12' }}
                      >
                        <span className="text-sm">📋</span>
                        <span className="flex-1">My Reported Listings</span>
                      </Link>

                      <Link
                        to="/report-lost"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-[#ebf5ff] group"
                        style={{ color: '#0a0d12' }}
                      >
                        <span className="text-sm">🔍</span>
                        <span className="flex-1">Report Lost Item</span>
                      </Link>

                      <Link
                        to="/report-found"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-[#ebf5ff] group"
                        style={{ color: '#0a0d12' }}
                      >
                        <span className="text-sm">📦</span>
                        <span className="flex-1">Report Found Item</span>
                      </Link>

                      {/* Divider */}
                      <div className="my-1 border-t" style={{ borderColor: '#f1f5f9' }} />

                      {/* Logout Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-rose-50 cursor-pointer text-left group"
                        style={{ color: '#be123c' }}
                      >
                        <svg className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-white"
                  style={{ color: '#535862' }}
                >
                  Sign In
                </NavLink>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors hover:bg-white"
                  style={{ borderColor: '#d5e6f0', color: '#0a0d12', background: '#fafdff' }}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Bell + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ background: '#ebf5ff', color: '#535862' }}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-2 p-4 rounded-3xl border shadow-lg space-y-2 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
          >
            <NavLink to="/" end className={mobileNavLinkClasses}>Home</NavLink>
            <NavLink to="/browse" className={mobileNavLinkClasses}>Browse Directory</NavLink>
            <NavLink to="/my-listings" className={mobileNavLinkClasses}>My Listings</NavLink>

            <div className="pt-2 border-t grid grid-cols-2 gap-2" style={{ borderColor: '#e8f1f8' }}>
              <Link
                to="/report-lost"
                className="p-3 rounded-2xl text-center text-xs font-semibold flex flex-col items-center gap-1"
                style={{ background: '#fff1f2', color: '#be123c' }}
              >
                <span>🔍</span> Report Lost
              </Link>
              <Link
                to="/report-found"
                className="p-3 rounded-2xl text-center text-xs font-semibold flex flex-col items-center gap-1"
                style={{ background: '#d3f6e3', color: '#047857' }}
              >
                <span>📦</span> Report Found
              </Link>
            </div>

            {user ? (
              <div className="pt-3 border-t space-y-3" style={{ borderColor: '#e8f1f8' }}>
                <div className="flex items-center gap-2.5 px-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0"
                    style={{ background: '#181d27' }}
                  >
                    {getInitials(user)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate" style={{ color: '#0a0d12' }}>
                      {user.name || 'Campus Student'}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: '#535862' }}>
                      {user.email}
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: '#d3f6e3', color: '#047857' }}
                  >
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  style={{ background: '#fff1f2', color: '#be123c' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: '#e8f1f8' }}>
                <Link
                  to="/login"
                  className="py-2.5 text-center rounded-2xl text-xs font-medium border"
                  style={{ borderColor: '#d5e6f0', color: '#535862' }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-charcoal-sm justify-center py-2.5 text-xs text-center"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>

      {/* ── Geniestudio Daylight Footer ── */}
      {isAuthPage ? (
        <footer className="py-6 text-center text-xs" style={{ color: '#93979f' }}>
          <p>© {new Date().getFullYear()} CampusFind. Built for University Campus Communities.</p>
        </footer>
      ) : (
        <footer style={{ background: '#fafdff', borderTop: '1px solid #e8f1f8' }} className="mt-auto">
          {/* Charcoal CTA Band */}
          <div className="py-14 sm:py-20 px-5 sm:px-8" style={{ background: '#181d27' }}>
            <div className="max-w-[1200px] mx-auto text-center space-y-5">
              <span
                className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: '#0069e0', color: '#ffffff', letterSpacing: '0.08em' }}
              >
                Rapid Campus Recovery
              </span>
              <h2
                className="text-2xl sm:text-4xl font-medium tracking-tight"
                style={{ color: '#fafdff', letterSpacing: '-0.02em' }}
              >
                Lost something on campus today?
              </h2>
              <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: '#93979f' }}>
                Report it in less than 60 seconds. Our landmark algorithm alerts students who find matching items nearby.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-3">
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-85 shadow-md"
                  style={{ background: '#fafdff', color: '#0a0d12' }}
                >
                  Browse All Items
                </Link>
                <Link
                  to="/report-lost"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border transition-opacity hover:opacity-75"
                  style={{ borderColor: '#3b3d41', color: '#fafdff' }}
                >
                  Report Lost Item
                </Link>
              </div>
            </div>
          </div>

          {/* Link Grid */}
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-3 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#181d27' }}>
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="7.5" stroke="#fafdff" strokeWidth="1.5" />
                      <path d="M10 6l1.8 3.5-3.5 1.7L10 6z" fill="#0099ff" />
                    </svg>
                  </div>
                  <span className="font-semibold text-sm" style={{ color: '#0a0d12' }}>CampusFind</span>
                </div>
                <p className="text-xs leading-relaxed max-w-sm" style={{ color: '#93979f' }}>
                  University lost and found network connecting lost possessions to rightful owners using automated landmark proximity algorithms and encrypted claim verification.
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: '#535862' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Verified Campus Protocol 10.1</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0a0d12', letterSpacing: '0.06em' }}>Quick Links</h4>
                <ul className="space-y-2 text-xs" style={{ color: '#535862' }}>
                  <li><Link to="/browse" className="hover:text-[#0a0d12] transition-colors">Campus Directory</Link></li>
                  <li><Link to="/report-lost" className="hover:text-[#0a0d12] transition-colors">Report Lost Item</Link></li>
                  <li><Link to="/report-found" className="hover:text-[#0a0d12] transition-colors">Report Found Item</Link></li>
                  <li><Link to="/my-listings" className="hover:text-[#0a0d12] transition-colors">My Listings &amp; Claims</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0a0d12', letterSpacing: '0.06em' }}>Safety &amp; Handover</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#93979f' }}>
                  Always arrange possession handovers at official university information desks during daylight hours. Never transfer money or reveal private credentials.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderColor: '#e8f1f8', color: '#93979f' }}>
              <p>© {new Date().getFullYear()} CampusFind. Built for University Campus Communities.</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#93979f' }} />
                  Stateless JWT Security
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#93979f' }} />
                  OpenStreetMap GIS
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
