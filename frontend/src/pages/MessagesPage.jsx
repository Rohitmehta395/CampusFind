import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getConversationsRequest,
  getMessagesRequest,
  sendMessageRequest,
  markConversationReadRequest,
  startConversationRequest,
} from '../api/conversations'
import { getItemByIdRequest } from '../api/items'

/**
 * Full-page messaging hub for CampusFind.
 * Allows finders and claimants to communicate, clarify proofs, and coordinate safe recovery.
 */
export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationsError, setConversationsError] = useState('')

  const [activeConversationId, setActiveConversationId] = useState(
    searchParams.get('conversationId') ? Number(searchParams.get('conversationId')) : null
  )
  const [activeConversation, setActiveConversation] = useState(null)
  const [activeItem, setActiveItem] = useState(null)

  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const pollTimerRef = useRef(null)
  const inFlightRef = useRef(false)

  // Scroll messages to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  // Fetch conversations list
  const fetchConversations = useCallback(async (selectInitial = false) => {
    try {
      setConversationsLoading(true)
      const data = await getConversationsRequest()
      setConversations(data || [])
      setConversationsError('')

      // If URL specified a conversationId, select it
      const paramConvId = searchParams.get('conversationId')
        ? Number(searchParams.get('conversationId'))
        : null

      if (paramConvId) {
        setActiveConversationId(paramConvId)
      } else if (selectInitial && data && data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id)
      }
    } catch (err) {
      setConversationsError(err.response?.data?.error || err.message || 'Failed to load conversations')
    } finally {
      setConversationsLoading(false)
    }
  }, [searchParams, activeConversationId])

  // Handle direct navigation via ?itemId=X&otherUserId=Y
  useEffect(() => {
    const itemIdParam = searchParams.get('itemId')
    const otherUserIdParam = searchParams.get('otherUserId')

    if (itemIdParam && otherUserIdParam) {
      const initParamConv = async () => {
        try {
          const result = await startConversationRequest(otherUserIdParam, itemIdParam)
          if (result && result.id) {
            setActiveConversationId(result.id)
            setSearchParams({ conversationId: result.id })
            fetchConversations()
          }
        } catch (err) {
          console.error('Failed to initiate conversation from params', err)
        }
      }
      initParamConv()
    } else {
      fetchConversations(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update active conversation object when activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null)
      setActiveItem(null)
      setMessages([])
      return
    }

    const found = conversations.find((c) => c.id === activeConversationId)
    if (found) {
      setActiveConversation(found)
      if (found.itemId) {
        getItemByIdRequest(found.itemId)
          .then((item) => setActiveItem(item))
          .catch(() => setActiveItem(null))
      } else {
        setActiveItem(null)
      }
    }
  }, [activeConversationId, conversations])

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (isPolling = false) => {
    if (!activeConversationId) return
    if (isPolling && inFlightRef.current) return
    if (isPolling && document.visibilityState === 'hidden') return

    if (!isPolling) {
      setMessagesLoading(true)
      setMessagesError('')
    }

    inFlightRef.current = true
    try {
      const data = await getMessagesRequest(activeConversationId, 1, 50)
      const fresh = data.messages || []

      setMessages((prev) => {
        if (!isPolling) {
          setTimeout(() => scrollToBottom(false), 50)
          return fresh
        }
        if (fresh.length !== prev.length || (fresh.length > 0 && fresh[fresh.length - 1].id !== prev[prev.length - 1]?.id)) {
          markConversationReadRequest(activeConversationId).catch(() => {})
          setTimeout(() => scrollToBottom(true), 50)
          return fresh
        }
        return prev
      })

      if (!isPolling) {
        await markConversationReadRequest(activeConversationId).catch(() => {})
      }
    } catch (err) {
      if (!isPolling) {
        setMessagesError(err.response?.data?.error || err.message || 'Failed to load messages')
      }
    } finally {
      inFlightRef.current = false
      if (!isPolling) {
        setMessagesLoading(false)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }, [activeConversationId])

  // Trigger message load when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(false)
    }
  }, [activeConversationId, fetchMessages])

  // Background polling for active conversation (every 4 seconds)
  useEffect(() => {
    if (!activeConversationId) return

    pollTimerRef.current = setInterval(() => {
      fetchMessages(true)
    }, 4000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [activeConversationId, fetchMessages])

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !activeConversationId || sending) return

    setSending(true)
    setMessagesError('')
    try {
      const newMsg = await sendMessageRequest(activeConversationId, trimmed)
      setMessages((prev) => [...prev, newMsg])
      setText('')
      setTimeout(() => scrollToBottom(true), 50)
      // Update snippet in conversation list locally
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: { text: trimmed, senderId: user.id, createdAt: new Date().toISOString() } }
            : c
        )
      )
    } catch (err) {
      setMessagesError(err.response?.data?.error || err.message || 'Failed to send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Quick preset text helper
  const handleQuickQuestion = (phrase) => {
    setText(phrase)
    inputRef.current?.focus()
  }

  const handleSelectConversation = (conv) => {
    setActiveConversationId(conv.id)
    setSearchParams({ conversationId: conv.id })
  }

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const filteredConversations = conversations.filter((c) => {
    if (!filterQuery.trim()) return true
    const q = filterQuery.toLowerCase()
    const nameMatch = c.otherUser?.name?.toLowerCase().includes(q)
    const itemMatch = String(c.itemId).includes(q)
    const lastMsgMatch = c.lastMessage?.text?.toLowerCase().includes(q)
    return nameMatch || itemMatch || lastMsgMatch
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col">
      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: '#0a0d12' }}>
            Messages & Handover Chat
          </h1>
          <p className="text-sm mt-1" style={{ color: '#535862' }}>
            Communicate directly with students who have or claimed your items to coordinate safe returns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/browse"
            className="px-4 py-2 rounded-full text-xs font-medium border hover:bg-white transition-all"
            style={{ borderColor: '#d5e6f0', color: '#535862', background: '#fafdff' }}
          >
            ← Back to Browse
          </Link>
        </div>
      </div>

      {/* ── Main Chat Interface Box ── */}
      <div
        className="flex-1 flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-lg min-h-[640px] max-h-[780px]"
        style={{
          background: '#ffffff',
          border: '1.5px solid #e8f1f8',
        }}
      >
        {/* ── Left Sidebar: Conversations List ── */}
        <aside
          className={`w-full md:w-80 lg:w-96 flex flex-col border-r shrink-0 ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
          style={{ borderColor: '#e8f1f8', background: '#fafdff' }}
        >
          {/* Search Bar */}
          <div className="p-4 border-b" style={{ borderColor: '#e8f1f8' }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full text-xs rounded-2xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: '#ebf5ff',
                  border: '1px solid #d5e6f0',
                  color: '#0a0d12',
                }}
              />
              <svg
                className="w-4 h-4 absolute left-3 top-3 text-[#93979f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: '#f0f4f8' }}>
            {conversationsLoading && (
              <div className="p-8 text-center text-xs font-medium" style={{ color: '#93979f' }}>
                Loading conversations…
              </div>
            )}

            {conversationsError && (
              <div className="p-4 m-3 rounded-2xl text-xs bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                {conversationsError}
              </div>
            )}

            {!conversationsLoading && filteredConversations.length === 0 && (
              <div className="p-8 text-center text-xs" style={{ color: '#93979f' }}>
                {conversations.length === 0
                  ? 'No active chats yet. When you file a claim or receive one, a thread will appear here.'
                  : 'No matching conversations found.'}
              </div>
            )}

            {!conversationsLoading &&
              filteredConversations.map((c) => {
                const isSelected = c.id === activeConversationId
                const initials = c.otherUser?.name
                  ? c.otherUser.name.slice(0, 2).toUpperCase()
                  : 'U'

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectConversation(c)}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-[#ebf5ff]' : 'hover:bg-[#f4f9fd]'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                      style={{
                        background: isSelected ? '#181d27' : '#ebf5ff',
                        color: isSelected ? '#ffffff' : '#0069e0',
                      }}
                    >
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs truncate" style={{ color: '#0a0d12' }}>
                          {c.otherUser?.name || `User #${c.otherUser?.id || ''}`}
                        </span>
                        {c.lastMessage?.createdAt && (
                          <span className="text-[10px] shrink-0" style={{ color: '#93979f' }}>
                            {formatMessageTime(c.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {c.itemId && (
                        <div className="mt-0.5">
                          <span
                            className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: '#e8f1f8', color: '#0069e0' }}
                          >
                            Item #{c.itemId}
                          </span>
                        </div>
                      )}

                      <p className="text-xs truncate mt-1" style={{ color: '#535862' }}>
                        {c.lastMessage?.text || 'Conversation initiated'}
                      </p>
                    </div>

                    {c.unreadCount > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 self-center"
                        style={{ background: '#0069e0', color: '#ffffff' }}
                      >
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        </aside>

        {/* ── Right Panel: Chat Thread ── */}
        <section className={`flex-1 flex flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          {!activeConversationId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3" style={{ background: '#fafdff' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ background: '#ebf5ff', color: '#0069e0' }}
              >
                💬
              </div>
              <h2 className="text-base font-semibold" style={{ color: '#0a0d12' }}>
                Your Campus Messages
              </h2>
              <p className="text-xs max-w-sm" style={{ color: '#535862' }}>
                Select a conversation from the left to arrange handover, verify item details, or clarify claims.
              </p>
            </div>
          ) : (
            <>
              {/* ── Active Chat Header ── */}
              <header
                className="p-4 sm:px-6 border-b flex items-center justify-between gap-4 shrink-0"
                style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#ebf5ff] text-[#535862]"
                    aria-label="Back to conversations"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                    style={{ background: '#ebf5ff', color: '#0069e0' }}
                  >
                    {activeConversation?.otherUser?.name
                      ? activeConversation.otherUser.name.slice(0, 2).toUpperCase()
                      : '💬'}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm truncate" style={{ color: '#0a0d12' }}>
                      {activeConversation?.otherUser?.name || 'Student'}
                    </h2>
                    <p className="text-xs truncate flex items-center gap-1" style={{ color: '#535862' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Verified Student</span>
                    </p>
                  </div>
                </div>

                {/* Right Item Badge & Link */}
                {activeItem && (
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/items/${activeItem.id}`}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-[#ebf5ff] transition-all flex items-center gap-1.5"
                      style={{ borderColor: '#d5e6f0', color: '#0069e0', background: '#ffffff' }}
                    >
                      <span className="font-semibold">Item:</span>
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeItem.title}</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </header>

              {/* ── Message Log Stream ── */}
              <div
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3"
                style={{ background: '#fafdff' }}
              >
                {messagesLoading && (
                  <div className="h-full flex items-center justify-center text-xs" style={{ color: '#93979f' }}>
                    Loading conversation messages…
                  </div>
                )}

                {messagesError && (
                  <div className="p-3 rounded-2xl text-xs bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                    {messagesError}
                  </div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                      style={{ background: '#ebf5ff', color: '#0069e0' }}
                    >
                      👋
                    </div>
                    <p className="text-sm font-semibold" style={{ color: '#0a0d12' }}>
                      Say Hello & Coordinate
                    </p>
                    <p className="text-xs max-w-sm" style={{ color: '#535862' }}>
                      Ask for proof details or arrange a safe public location to return the item.
                    </p>
                  </div>
                )}

                {!messagesLoading &&
                  messages.map((m) => {
                    const isMine = Number(m.senderId) === Number(user?.id)

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                            isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
                          }`}
                          style={
                            isMine
                              ? { background: '#181d27', color: '#ffffff' }
                              : {
                                  background: '#ffffff',
                                  color: '#0a0d12',
                                  border: '1.5px solid #e8f1f8',
                                }
                          }
                        >
                          {m.text}
                        </div>
                        <div className="flex items-center gap-1 px-1 text-[10px]" style={{ color: '#93979f' }}>
                          <span>{formatMessageTime(m.createdAt)}</span>
                          {isMine && <span>{m.isRead ? '• Read' : '• Sent'}</span>}
                        </div>
                      </div>
                    )
                  })}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Handover Quick Questions Helpers ── */}
              <div
                className="px-4 py-2 border-t flex items-center gap-2 overflow-x-auto shrink-0"
                style={{ background: '#ffffff', borderColor: '#f0f4f8' }}
              >
                <span className="text-[11px] font-medium shrink-0" style={{ color: '#93979f' }}>
                  Quick Suggestions:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion('Can you describe any unique marks, stickers, or wallpaper?')}
                  className="px-2.5 py-1 rounded-full text-[11px] hover:bg-[#ebf5ff] transition-colors shrink-0"
                  style={{ background: '#f4f9fd', color: '#535862', border: '1px solid #e8f1f8' }}
                >
                  Ask for unique marks
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion('Can we meet outside the campus library service desk?')}
                  className="px-2.5 py-1 rounded-full text-[11px] hover:bg-[#ebf5ff] transition-colors shrink-0"
                  style={{ background: '#f4f9fd', color: '#535862', border: '1px solid #e8f1f8' }}
                >
                  Meet at Library Desk
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuestion('I handed the item over to Campus Security Office.')}
                  className="px-2.5 py-1 rounded-full text-[11px] hover:bg-[#ebf5ff] transition-colors shrink-0"
                  style={{ background: '#f4f9fd', color: '#535862', border: '1px solid #e8f1f8' }}
                >
                  Left with Campus Security
                </button>
              </div>

              {/* ── Message Input Bar ── */}
              <footer
                className="p-3 sm:p-4 border-t shrink-0"
                style={{ background: '#ffffff', borderColor: '#e8f1f8' }}
              >
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type a message (Enter to send, Shift+Enter for new line)..."
                    disabled={messagesLoading || sending || !activeConversationId}
                    maxLength={2000}
                    className="flex-1 resize-none rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 transition-all max-h-32"
                    style={{
                      background: '#ebf5ff',
                      border: '1.5px solid #e8f1f8',
                      color: '#0a0d12',
                      outlineColor: '#0069e0',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending || !activeConversationId}
                    className="px-4 py-3 rounded-2xl font-semibold text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                    style={{ background: '#181d27', color: '#ffffff' }}
                  >
                    {sending ? (
                      '…'
                    ) : (
                      <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                  </button>
                </form>
                <div className="flex items-center justify-between pt-1.5 px-1 text-[11px]" style={{ color: '#93979f' }}>
                  <span>Press Enter to send</span>
                  <span>{text.length}/2000</span>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
