import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  startConversationRequest,
  getMessagesRequest,
  sendMessageRequest,
  markConversationReadRequest,
} from '../api/conversations'
import { reviewClaimRequest } from '../api/claims'

/**
 * Interactive direct messaging modal connecting finder and claimant.
 * Supports:
 * - Live chat with 3.5s REST polling while open
 * - Auto-scroll to latest messages
 * - Contextual item chip & other participant info
 * - Direct claim approval & handover resolution inside the chat header
 */
export default function ChatModal({
  isOpen,
  onClose,
  conversationId: propConversationId,
  otherUserId,
  item,
  claim,
  onClaimReviewed,
}) {
  const { user } = useAuth()
  const [conversationId, setConversationId] = useState(propConversationId || null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [approvingClaim, setApprovingClaim] = useState(false)
  const [approvalSuccess, setApprovalSuccess] = useState(false)

  const messagesEndRef = useRef(null)
  const pollTimerRef = useRef(null)
  const inFlightRef = useRef(false)
  const inputRef = useRef(null)

  const isOwner = Boolean(user && item && Number(user.id) === Number(item.reporterId))
  const canApproveFromChat = Boolean(isOwner && claim && claim.status === 'PENDING' && item.status === 'ACTIVE')

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  // Fetch or initialize conversation
  const initConversation = useCallback(async () => {
    if (!isOpen) return
    setError('')
    setLoading(true)

    try {
      let activeConvId = propConversationId

      if (!activeConvId && otherUserId) {
        const conv = await startConversationRequest(otherUserId, item?.id || null)
        activeConvId = conv.id
        setConversationId(conv.id)
        if (conv.otherUser) {
          setOtherUser(conv.otherUser)
        }
      }

      if (activeConvId) {
        setConversationId(activeConvId)
        const data = await getMessagesRequest(activeConvId, 1, 50)
        setMessages(data.messages || [])
        await markConversationReadRequest(activeConvId).catch(() => {})
        setTimeout(() => scrollToBottom(false), 80)
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Could not load conversation')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, propConversationId, otherUserId, item?.id])

  useEffect(() => {
    if (isOpen) {
      initConversation()
    } else {
      setMessages([])
      setConversationId(null)
      setOtherUser(null)
      setError('')
      setApprovalSuccess(false)
    }
  }, [isOpen, initConversation])

  // Polling for incoming messages
  const pollMessages = useCallback(async () => {
    if (!isOpen || !conversationId || inFlightRef.current) return
    if (document.visibilityState === 'hidden') return

    inFlightRef.current = true
    try {
      const data = await getMessagesRequest(conversationId, 1, 50)
      const freshMessages = data.messages || []

      setMessages((prev) => {
        if (freshMessages.length !== prev.length || (freshMessages.length > 0 && freshMessages[freshMessages.length - 1].id !== prev[prev.length - 1]?.id)) {
          markConversationReadRequest(conversationId).catch(() => {})
          setTimeout(() => scrollToBottom(true), 60)
          return freshMessages
        }
        return prev
      })
    } catch {
      // Silent polling failure
    } finally {
      inFlightRef.current = false
    }
  }, [isOpen, conversationId])

  useEffect(() => {
    if (!isOpen || !conversationId) return

    pollTimerRef.current = setInterval(pollMessages, 3500)
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [isOpen, conversationId, pollMessages])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Send message
  const handleSend = async (e) => {
    if (e) e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || !conversationId || sending) return

    setSending(true)
    setError('')
    try {
      const newMsg = await sendMessageRequest(conversationId, trimmed)
      setMessages((prev) => [...prev, newMsg])
      setText('')
      setTimeout(() => scrollToBottom(true), 60)
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send message')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Handle key press inside textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle direct claim approval inside chat
  const handleApproveClaim = async () => {
    if (!claim?.id) return
    setApprovingClaim(true)
    setError('')
    try {
      await reviewClaimRequest(claim.id, 'APPROVED')
      setApprovalSuccess(true)
      if (onClaimReviewed) {
        onClaimReviewed(claim.id, 'APPROVED')
      }
      // Send automated polite handover confirmation in chat
      if (conversationId) {
        await sendMessageRequest(
          conversationId,
          '✓ Claim approved! Let\'s coordinate safe handover details here (e.g. Campus Information Desk or Student Center).'
        ).catch(() => {})
        pollMessages()
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to approve claim')
    } finally {
      setApprovingClaim(false)
    }
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl h-[88vh] max-h-[680px] flex flex-col rounded-3xl overflow-hidden shadow-2xl transition-all"
        style={{
          background: '#ffffff',
          border: '1.5px solid #e8f1f8',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <header
          className="p-4 sm:px-6 sm:py-4 border-b flex flex-col gap-2 shrink-0"
          style={{ background: '#fafdff', borderColor: '#e8f1f8' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0"
                style={{ background: '#ebf5ff', color: '#0069e0' }}
              >
                {otherUser?.name ? otherUser.name.charAt(0).toUpperCase() : '💬'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: '#0a0d12' }}>
                    {otherUser?.name || 'Student'}
                  </h3>
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: '#10b981' }}
                    title="Live connection"
                  />
                </div>
                <p className="text-xs truncate flex items-center gap-1" style={{ color: '#535862' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Verified Student</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={conversationId ? `/messages?conversationId=${conversationId}` : '/messages'}
                className="p-2 rounded-full text-xs font-medium hover:bg-[#ebf5ff] transition-colors"
                style={{ color: '#535862' }}
                title="Open full page chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#f2f4f7] text-[#535862] hover:text-[#0a0d12] transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Item Context Chip & Claim Handover Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: '#f0f4f8' }}>
            {item && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#535862' }}>
                <span className="font-medium text-[#0a0d12]">Item:</span>
                <span className="truncate max-w-[220px] font-medium" style={{ color: '#0069e0' }}>
                  {item.title}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-semibold" style={{ background: '#ebf5ff', color: '#0069e0' }}>
                  {item.type}
                </span>
              </div>
            )}

            {/* Resolve / Approve claim CTA inside the chat header */}
            {canApproveFromChat && !approvalSuccess && (
              <button
                type="button"
                disabled={approvingClaim}
                onClick={handleApproveClaim}
                className="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                style={{ background: '#047857', color: '#ffffff' }}
              >
                {approvingClaim ? 'Approving…' : '✓ Approve Claim & Resolve'}
              </button>
            )}

            {approvalSuccess && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                style={{ background: '#d3f6e3', color: '#047857' }}
              >
                ✓ Claim Approved & Handover In Progress
              </span>
            )}
          </div>
        </header>

        {/* ── Chat Messages Stream ── */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3"
          style={{ background: '#fafdff' }}
        >
          {loading && (
            <div className="h-full flex items-center justify-center text-xs" style={{ color: '#93979f' }}>
              Loading messages…
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-2xl text-xs"
              style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}
            >
              {error}
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: '#ebf5ff', color: '#0069e0' }}
              >
                💬
              </div>
              <p className="text-sm font-semibold" style={{ color: '#0a0d12' }}>
                Coordinate Ownership & Handover
              </p>
              <p className="text-xs max-w-sm" style={{ color: '#535862' }}>
                Ask identifying questions (unique marks, lock screens, serial digits) and agree on a safe campus meeting point like Campus Security or the Student Center.
              </p>
            </div>
          )}

          {!loading &&
            messages.map((m) => {
              const isMine = Number(m.senderId) === Number(user?.id)

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[82%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
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

        {/* ── Input Bar ── */}
        <footer
          className="p-3 sm:p-4 border-t shrink-0"
          style={{ background: '#ffffff', borderColor: '#e8f1f8' }}
        >
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder="Type your message (Enter to send, Shift+Enter for new line)..."
              disabled={loading || sending || !conversationId}
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
              disabled={!text.trim() || sending || !conversationId}
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
      </div>
    </div>
  )
}
