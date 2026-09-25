import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Main layout component providing top navigation shell and child route outlet.
 * Conditionally displays authenticated navigation links ("Report Lost", "Report Found", "Logout")
 * when a user is signed in, or unauthenticated links ("Login", "Register") when signed out.
 * "Home" and "Browse" remain publicly accessible in both auth states.
 */
export default function MainLayout() {
  const { user, logout } = useAuth()

  const navLinkClasses = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 hover:text-slate-700 transition-colors"
          >
            CampusFind
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <NavLink to="/" end className={navLinkClasses}>
              Home
            </NavLink>

            <NavLink to="/browse" className={navLinkClasses}>
              Browse
            </NavLink>

            {user ? (
              <>
                <NavLink to="/report-lost" className={navLinkClasses}>
                  Report Lost
                </NavLink>
                <NavLink to="/report-found" className={navLinkClasses}>
                  Report Found
                </NavLink>
                <NavLink to="/my-listings" className={navLinkClasses}>
                  My Listings
                </NavLink>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClasses}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClasses}>
                  Register
                </NavLink>
                <NavLink to="/my-listings" className={navLinkClasses}>
                  My Listings
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Outlet />
      </main>
    </div>
  )
}
