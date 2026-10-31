import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { checkHealth } from '../api/health'
import { getAllItemsRequest } from '../api/items'
import ItemCard from '../components/ItemCard'
import { CATEGORY_OPTIONS } from '../constants/categories'
import { CAMPUS_LANDMARKS } from '../constants/landmarks'
import HeroIllustration from '../components/illustrations/HeroIllustration'
import SafeHandoverIllustration from '../components/illustrations/SafeHandoverIllustration'

/**
 * Enhanced Home Page — Geniestudio daylight notebook design.
 *
 * Components & Sections:
 * 1. Hero Section with responsive grid, display typography, search pill, and custom HeroIllustration
 * 2. Trust Strip with campus metrics and live backend health status
 * 3. Browse by Category grid with pastel wash cards
 * 4. Recent Campus Activity directory grid with real items
 * 5. How Smart Matching Works with 3-step numbered cards
 * 6. Campus Recovery Stories / Student Testimonials
 * 7. Smart Campus Recovery vs Traditional Bulletin Board Comparison
 * 8. Safe Campus Handover Protocol with SafeHandoverIllustration
 * 9. Interactive Daylight FAQ Accordion
 * 10. Campus Landmark Hub GIS card
 */
export default function HomePage() {
  const navigate = useNavigate()
  const [healthStatus, setHealthStatus] = useState('loading')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentItems, setRecentItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  // Check backend health
  useEffect(() => {
    let isMounted = true
    checkHealth()
      .then(() => { if (isMounted) setHealthStatus('success') })
      .catch(() => { if (isMounted) setHealthStatus('error') })
    return () => { isMounted = false }
  }, [])

  // Fetch recent items preview
  useEffect(() => {
    let isMounted = true
    getAllItemsRequest({ limit: 4 })
      .then((data) => {
        if (isMounted) {
          setRecentItems(data.items || [])
          setLoadingItems(false)
        }
      })
      .catch(() => { if (isMounted) setLoadingItems(false) })
    return () => { isMounted = false }
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    navigate(searchQuery.trim() ? `/browse?q=${encodeURIComponent(searchQuery.trim())}` : '/browse')
  }

  // Category pastel cycle
  const categoryPastels = [
    { bg: '#f1e6ff', icon: '💻', count: '12 active' },
    { bg: '#d3f6e3', icon: '🎒', count: '8 active' },
    { bg: '#cce7ff', icon: '🪪', count: '15 active' },
    { bg: '#fff2be', icon: '🔑', count: '9 active' },
    { bg: '#ffd1b8', icon: '📚', count: '6 active' },
    { bg: '#f1e6ff', icon: '👕', count: '11 active' },
    { bg: '#d3f6e3', icon: '⌚', count: '4 active' },
    { bg: '#cce7ff', icon: '📦', count: '18 active' },
  ]

  // Daylight FAQ data
  const faqData = [
    {
      q: 'How does Smart Proximity Matching actually locate my item?',
      a: 'When you log an item, you select the closest campus landmark (e.g. Science Library, Student Union). Our proximity engine pairs lost and found reports within a 200-meter GPS radius and correlates category, brand keywords, and timestamp windows to notify both parties automatically.',
    },
    {
      q: 'What is required to prove ownership of a high-value item?',
      a: 'Finders do not hand over valuables blindly. Claimants must submit private identifying details such as device serial digits, lock-screen descriptions, sticker placement, or distinctive scratches that are kept private and verified only by the finder.',
    },
    {
      q: 'Where do safe campus handovers take place?',
      a: 'We strongly discourage meetups after dark or in secluded locations. Recommended drop-off points are official university reception desks, campus security offices, and Student Union helpdesks during daylight operating hours.',
    },
    {
      q: 'Can I report an item without uploading a photograph?',
      a: 'Yes! While photos boost recovery rates by over 40%, you can submit a text-only report with detailed color, brand, and landmark descriptions.',
    },
  ]

  return (
    <div className="w-full flex flex-col" style={{ background: '#ebf5ff' }}>

      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="w-full pt-12 pb-16 sm:pt-20 sm:pb-24 px-5 sm:px-8 relative overflow-hidden">
        {/* Soft daylight ambient background washes */}
        <div
          aria-hidden="true"
          className="absolute -top-24 right-1/4 w-96 h-96 rounded-full opacity-40 pointer-events-none blur-3xl"
          style={{ background: '#cce7ff' }}
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-4 w-72 h-72 rounded-full opacity-35 pointer-events-none blur-3xl"
          style={{ background: '#f1e6ff' }}
        />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* System status pill */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium"
                style={{ background: '#fafdff', color: '#535862', border: '1px solid #e8f1f8' }}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthStatus === 'success'
                      ? 'bg-emerald-500 animate-pulse'
                      : healthStatus === 'error'
                      ? 'bg-rose-400'
                      : 'bg-amber-400 animate-pulse'
                  }`}
                />
                {healthStatus === 'success'
                  ? 'Campus Recovery Network Online • 80+ Landmarks Active'
                  : healthStatus === 'error'
                  ? 'Backend Offline — Local Mode'
                  : 'Connecting to Campus Services…'}
              </div>

              {/* Editorial Headline */}
              <h1
                className="font-medium tracking-tight"
                style={{
                  fontSize: 'clamp(38px, 6.5vw, 68px)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.03em',
                  color: '#0a0d12',
                }}
              >
                Find what you've
                {' '}
                <span style={{ color: '#0069e0' }}>lost</span>
                {' '}on campus
              </h1>

              <p
                className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed"
                style={{ color: '#535862', letterSpacing: '-0.01em' }}
              >
                CampusFind pairs misplaced belongings with honest student finders using landmark GPS proximity, automated category matching, and encrypted claim verification.
              </p>

              {/* Daylight Search Pill */}
              <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto lg:mx-0 pt-2">
                <div
                  className="flex items-center gap-2 p-2 rounded-full shadow-sm border transition-all"
                  style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
                >
                  <div className="pl-3 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Airpods, water bottle, blue backpack…"
                    className="flex-1 bg-transparent text-sm px-2 focus:outline-none"
                    style={{ color: '#0a0d12' }}
                    aria-label="Search for items"
                  />
                  <button
                    type="submit"
                    className="btn-charcoal-sm shrink-0"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Dual Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link to="/report-lost" className="btn-charcoal">
                  Report Lost Item
                </Link>
                <Link
                  to="/report-found"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border transition-colors hover:bg-white"
                  style={{ borderColor: '#d5e6f0', color: '#535862', background: 'transparent' }}
                >
                  Report Found Item
                </Link>
              </div>
            </div>

            {/* Right Illustration Column (5 cols) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <HeroIllustration className="w-full max-w-[480px] h-auto drop-shadow-md" />
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Trust Strip ───────────────────────────────────────────────── */}
      <section
        className="w-full py-8 px-5 sm:px-8 border-y"
        style={{ background: '#cce7ff', borderColor: '#b5d9ff' }}
      >
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-around gap-6 sm:gap-12">
          {[
            { label: 'Campus Landmarks', value: `${CAMPUS_LANDMARKS.length}+`, icon: '📍' },
            { label: 'Active Categories', value: `${CATEGORY_OPTIONS.length}`, icon: '🏷️' },
            { label: 'Proximity Engine', value: '<200m Radius', icon: '🎯' },
            { label: 'Claim Protocol', value: '100% Private', icon: '🛡️' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="text-center sm:text-left flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <div
                  className="text-lg sm:text-xl font-semibold"
                  style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: '#535862' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Category Explorer ─────────────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block" style={{ background: '#fafdff', color: '#0069e0' }}>
                Curated Categories
              </span>
              <h2
                className="text-2xl sm:text-4xl font-medium tracking-tight mt-1"
                style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
              >
                Browse by possession type
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#535862' }}>
                Quick filters to pinpoint misplaced tech, accessories, and student essentials.
              </p>
            </div>
            <Link
              to="/browse"
              className="text-sm font-medium shrink-0 transition-colors"
              style={{ color: '#0069e0' }}
            >
              Explore all categories →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORY_OPTIONS.slice(0, 8).map((cat, i) => {
              const pastel = categoryPastels[i % categoryPastels.length]
              return (
                <Link
                  key={cat}
                  to={`/browse?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col justify-between p-6 sm:p-7 rounded-[32px] transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0069e0]"
                  style={{ background: pastel.bg, minHeight: 160 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl select-none" role="img" aria-hidden="true">
                      {pastel.icon}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/70 text-slate-700">
                      {pastel.count}
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-base font-semibold leading-snug group-hover:text-[#0069e0] transition-colors"
                      style={{ color: '#0a0d12', letterSpacing: '-0.01em' }}
                    >
                      {cat}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: '#535862' }}>
                      Filter listings →
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 4. Recent Activity Directory ─────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8" style={{ background: '#fafdff' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block" style={{ background: '#ebf5ff', color: '#0069e0' }}>
                Live Campus Feed
              </span>
              <h2
                className="text-2xl sm:text-4xl font-medium tracking-tight mt-1"
                style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
              >
                Recent campus listings
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#535862' }}>
                Latest lost reports and verified recoveries across university premises.
              </p>
            </div>
            <Link
              to="/browse"
              className="text-sm font-medium shrink-0 transition-colors"
              style={{ color: '#0069e0' }}
            >
              View directory →
            </Link>
          </div>

          {loadingItems ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[32px] animate-pulse"
                  style={{ background: '#ebf5ff', height: 280 }}
                />
              ))}
            </div>
          ) : recentItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div
              className="text-center py-16 px-6 rounded-[32px]"
              style={{ background: '#ebf5ff' }}
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-base font-semibold" style={{ color: '#0a0d12' }}>
                Directory Ready for Submissions
              </h3>
              <p className="text-xs max-w-sm mx-auto mt-1" style={{ color: '#93979f' }}>
                No active listings currently logged. Be the first to report a missing possession or register a found item.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link to="/report-lost" className="btn-charcoal-sm">Report Lost</Link>
                <Link to="/report-found" className="btn-charcoal-sm">Report Found</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. How Smart Matching Works ──────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block" style={{ background: '#fafdff', color: '#0069e0' }}>
              Intelligent Pipeline
            </span>
            <h2
              className="text-2xl sm:text-4xl font-medium tracking-tight mt-1"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              How Smart Matching works
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#535862' }}>
              We eliminated the endless scrolling of chat boards with automated landmark proximity calculations and private ownership claims.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                color: '#f1e6ff',
                title: 'Landmark Tagging',
                body: 'When posting an item, tag the closest campus zone (Library, CS Hall, Student Union) and enter color, brand, and optional photos.',
                badge: 'Proximity Setup',
              },
              {
                step: '2',
                color: '#cce7ff',
                title: 'AI Proximity Engine',
                body: 'The engine evaluates geographic coordinates, timestamp proximity, item categories, and title keywords to generate confidence scores.',
                badge: 'Automated Scoring',
              },
              {
                step: '3',
                color: '#d3f6e3',
                title: 'Private Ownership Claim',
                body: 'Claimants provide unique proof (device serial number, lockscreen image, sticker placements). The finder reviews and approves before handover.',
                badge: 'Verified Handover',
              },
            ].map(({ step, color, title, body, badge }) => (
              <div
                key={step}
                className="p-8 sm:p-10 rounded-[32px] flex flex-col justify-between gap-6 shadow-sm border transition-transform hover:-translate-y-1"
                style={{ background: color, borderColor: '#ffffff' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold"
                      style={{ background: '#181d27', color: '#fafdff' }}
                    >
                      {step}
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/70 text-slate-800">
                      {badge}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: '#0a0d12', letterSpacing: '-0.01em' }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#535862' }}>
                    {body}
                  </p>
                </div>

                <div className="pt-2 text-xs font-semibold" style={{ color: '#0a0d12' }}>
                  Step 0{step} →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Comparison: Traditional vs CampusFind ─────────────────────── */}
      <section className="w-full py-16 sm:py-20 px-5 sm:px-8" style={{ background: '#fafdff' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block" style={{ background: '#ebf5ff', color: '#0069e0' }}>
              Why It's Different
            </span>
            <h2
              className="text-2xl sm:text-4xl font-medium tracking-tight mt-1"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Traditional Boards vs. CampusFind
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#535862' }}>
              Why WhatsApp chats, Discord servers, and cork noticeboards fail students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional Card */}
            <div
              className="p-8 sm:p-10 rounded-[32px] space-y-5 border"
              style={{ background: '#fff1f2', borderColor: '#fecdd3' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">❌</span>
                <h3 className="text-base font-semibold" style={{ color: '#be123c' }}>
                  Traditional Social &amp; Cork Boards
                </h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm" style={{ color: '#881337' }}>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Lost in the stream:</strong> Posts get buried in campus chats within 2 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Zero location intelligence:</strong> No GPS mapping or campus landmark filtering.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Vulnerable handovers:</strong> Anyone can claim an item with no verifiable proof of ownership.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Manual searching:</strong> Students must monitor 4 different apps hoping for a match.</span>
                </li>
              </ul>
            </div>

            {/* CampusFind Card */}
            <div
              className="p-8 sm:p-10 rounded-[32px] space-y-5 border"
              style={{ background: '#d3f6e3', borderColor: '#a7f3d0' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">✓</span>
                <h3 className="text-base font-semibold" style={{ color: '#047857' }}>
                  CampusFind Recovery Protocol
                </h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm" style={{ color: '#065f46' }}>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Always indexed:</strong> Persistent directory searchable by category, date, and keyword.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>OpenStreetMap GIS:</strong> Pinpoint exact buildings, libraries, and dining halls.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Proof verification:</strong> Private serial numbers and identifiers verified by finder first.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span><strong>Automated alerts:</strong> Instant notifications the moment a matching counterpart is posted.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Safe Campus Handover Protocol ─────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 flex justify-center">
              <SafeHandoverIllustration className="w-full max-w-[420px] h-auto drop-shadow-sm" />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block" style={{ background: '#fafdff', color: '#0069e0' }}>
                Campus Community Protocol
              </span>
              <h2
                className="text-2xl sm:text-4xl font-medium tracking-tight"
                style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
              >
                Safe, verified campus handovers
              </h2>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: '#535862' }}>
                Student safety is paramount. High-value electronics and credentials are never exchanged in unmonitored zones. We partner with Student Union helpdesks and building security for verified daylight handovers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl" style={{ background: '#fafdff' }}>
                  <div className="text-lg mb-1">🏢</div>
                  <h4 className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Daylight Helpdesks</h4>
                  <p className="text-xs mt-1" style={{ color: '#93979f' }}>
                    Central library and Student Union desks serve as neutral, verified exchange locations.
                  </p>
                </div>
                <div className="p-5 rounded-2xl" style={{ background: '#fafdff' }}>
                  <div className="text-lg mb-1">🔐</div>
                  <h4 className="text-xs font-semibold" style={{ color: '#0a0d12' }}>Zero Sensitive Leaks</h4>
                  <p className="text-xs mt-1" style={{ color: '#93979f' }}>
                    Claims require secret proof (passcode, serial, mark) kept strictly between owner and finder.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Recovery Stories / Testimonials ───────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8" style={{ background: '#fafdff' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block" style={{ background: '#ebf5ff', color: '#0069e0' }}>
              Student Proof
            </span>
            <h2
              className="text-2xl sm:text-4xl font-medium tracking-tight mt-1"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Real campus recoveries
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#535862' }}>
              Hear how fellow students recovered their possessions in record time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Left my MacBook Air in the 3rd-floor library study carrel. A student posted it within 10 minutes, and the proximity match alerted me right away!",
                name: "Aarav S.",
                dept: "Computer Science, Year 3",
                item: "MacBook Air M2",
                pastel: "#f1e6ff",
              },
              {
                quote: "Lost my dorm keys at the sports pavilion. The finder checked my claim verification with the engraved keychain initials and returned them safely.",
                name: "Meera K.",
                dept: "Architecture, Year 2",
                item: "Dorm Keyring",
                pastel: "#d3f6e3",
              },
              {
                quote: "I found a student wallet near the dining common and logged it. The owner verified the student ID number privately in 20 minutes. Seamless process!",
                name: "Rohan D.",
                dept: "Mechanical Eng, Year 4",
                item: "Leather Wallet",
                pastel: "#cce7ff",
              },
            ].map(({ quote, name, dept, item, pastel }, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[32px] flex flex-col justify-between gap-6 border"
                style={{ background: '#ebf5ff', borderColor: '#e8f1f8' }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: pastel, color: '#0a0d12' }}>
                      {item}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">✓ Returned</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#535862' }}>
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t flex items-center gap-3" style={{ borderColor: '#d5e6f0' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: '#181d27', color: '#ffffff' }}>
                    {name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#0a0d12' }}>{name}</div>
                    <div className="text-[11px]" style={{ color: '#93979f' }}>{dept}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Interactive Daylight FAQ ──────────────────────────────────── */}
      <section className="w-full py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full inline-block" style={{ background: '#fafdff', color: '#0069e0' }}>
              Common Questions
            </span>
            <h2
              className="text-2xl sm:text-4xl font-medium tracking-tight"
              style={{ color: '#0a0d12', letterSpacing: '-0.02em' }}
            >
              Frequently asked questions
            </h2>
            <p className="text-sm" style={{ color: '#535862' }}>
              Everything you need to know about campus matching and ownership security.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqData.map((faq, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="rounded-[28px] border overflow-hidden transition-all"
                  style={{
                    background: '#fafdff',
                    borderColor: isOpen ? '#cce7ff' : '#e8f1f8',
                    boxShadow: isOpen ? 'rgba(0, 105, 224, 0.04) 0px 8px 24px 0px' : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="w-full text-left p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span
                      className="text-sm sm:text-base font-medium leading-snug"
                      style={{ color: '#0a0d12', letterSpacing: '-0.01em' }}
                    >
                      {faq.q}
                    </span>
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-transform"
                      style={{
                        background: isOpen ? '#181d27' : '#ebf5ff',
                        color: isOpen ? '#ffffff' : '#535862',
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm leading-relaxed border-t" style={{ borderColor: '#ebf5ff', color: '#535862' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 10. Campus Landmark Hub GIS Banner ────────────────────────────── */}
      <section className="w-full pb-20 px-5 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div
            className="rounded-[32px] p-8 sm:p-14 relative overflow-hidden"
            style={{ background: '#181d27' }}
          >
            <div
              aria-hidden="true"
              className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-15 pointer-events-none"
              style={{ background: '#0099ff' }}
            />

            <div className="relative z-10 max-w-2xl space-y-5">
              <span
                className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: '#0069e0', color: '#fafdff', letterSpacing: '0.08em' }}
              >
                Campus GIS Network
              </span>
              <h2
                className="text-2xl sm:text-4xl font-medium"
                style={{ color: '#fafdff', letterSpacing: '-0.02em' }}
              >
                Mapped across all university zones
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#93979f' }}>
                Every campus building, library, cafeteria, and residential quad is calibrated with GPS coordinates to narrow recoveries down to the precise corner an item was misplaced.
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {CAMPUS_LANDMARKS.slice(0, 10).map((landmark) => (
                  <span
                    key={landmark.name}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: '#0069e020', color: '#cce7ff', border: '1px solid #0069e040' }}
                  >
                    📍 {landmark.name}
                  </span>
                ))}
              </div>

              <div className="pt-3">
                <Link
                  to="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-85 shadow-md"
                  style={{ background: '#fafdff', color: '#0a0d12' }}
                >
                  Explore Interactive Campus Map →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
