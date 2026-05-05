import { useState, useMemo } from 'react'
import { buildHtmlEmail } from '../lib/emailTemplate.js'

const GOOGLE_CLIENT_ID = '824221876888-h1j6hrm73iuksq9it5eg5ojpfvs973h5.apps.googleusercontent.com'
const SCOPES =
  'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.compose'

// Resource room / bot emails to exclude from recipients
const EXCLUDED_DOMAINS = ['resource.calendar.google.com', 'calendar.google.com']
function isExcluded(email) {
  return EXCLUDED_DOMAINS.some((d) => email.endsWith('@' + d) || email.includes('.' + d))
}

function loadGis() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

function buildGreeting(title, dateStr) {
  return `Hi team,\n\nPlease find the meeting minutes from ${title || 'this meeting'}${dateStr ? ` held on ${dateStr}` : ''}.\n\nKindly review and reply with any corrections if any. Thank you!`
}

function toInputDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1')
  const d2 = new Date(cleaned)
  if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
}

async function fetchEventsForDate(token, dateStr) {
  const base = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  const timeMin = new Date(base); timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(base); timeMax.setHours(23, 59, 59, 999)
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `maxResults=100&orderBy=startTime&singleEvents=true` +
    `&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.items || []
}

async function sendEmail(token, to, cc, bcc, subject, htmlBody) {
  let header = `To: ${to}\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\nSubject: ${subject}`
  if (cc?.trim()) header += `\r\nCc: ${cc.trim()}`
  if (bcc?.trim()) header += `\r\nBcc: ${bcc.trim()}`
  header += `\r\n\r\n`
  const raw = btoa(unescape(encodeURIComponent(header + htmlBody)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))
  return data.id
}

export default function SendModal({ minutes, onClose }) {
  const [step, setStep] = useState('calendar')
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => toInputDate(minutes.date))

  const [recipients, setRecipients] = useState(
    minutes.participants?.filter((p) => p.includes('@') && !isExcluded(p)).join(', ') || ''
  )
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')
  const [showBcc, setShowBcc] = useState(false)
  const [subject, setSubject] = useState(
    `[Meeting Minutes] ${minutes.title || 'Meeting'}${minutes.date ? ` (${minutes.date})` : ''}`
  )
  const [greeting, setGreeting] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const emailTitle = subject.replace(/^\[Meeting Minutes\]\s*/i, '').replace(/\s*\(.*?\)\s*$/, '').trim() || minutes.title
  const htmlEmail = useMemo(
    () => buildHtmlEmail({ ...minutes, title: emailTitle, greeting }),
    [minutes, emailTitle, greeting]
  )

  const connect = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      await loadGis()
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (resp) => {
          if (resp.error) { setErrorMsg(resp.error); setLoading(false); return }
          setAccessToken(resp.access_token)
          try {
            const evs = await fetchEventsForDate(resp.access_token, selectedDate)
            setEvents(evs)
          } catch (e) { setErrorMsg('Could not load calendar events: ' + String(e)) }
          setLoading(false)
        },
      })
      tc.requestAccessToken({ prompt: '' })
    } catch (e) { setErrorMsg(String(e)); setLoading(false) }
  }

  const refetchForDate = async (date) => {
    if (!accessToken) return
    setLoading(true)
    try {
      const evs = await fetchEventsForDate(accessToken, date)
      setEvents(evs)
    } catch (e) { setErrorMsg('Could not load events: ' + String(e)) }
    setLoading(false)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
    if (accessToken) refetchForDate(e.target.value)
  }

  const pickEvent = (ev) => {
    const emails = (ev.attendees || [])
      .filter((a) => !a.self && a.email && !isExcluded(a.email))
      .map((a) => a.email)
      .join(', ')
    setRecipients(emails)
    const evTitle = ev.summary || minutes.title
    setSubject(`[Meeting Minutes] ${evTitle}`)
    const evDate = ev.start?.dateTime
      ? new Date(ev.start.dateTime).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' })
      : ev.start?.date || minutes.date || ''
    setGreeting(buildGreeting(evTitle, evDate))
    setStep('preview')
  }

  const skipToPreview = () => {
    if (!greeting) setGreeting(buildGreeting(minutes.title, minutes.date))
    setStep('preview')
  }

  const doSend = async (token) => {
    setSending(true)
    setErrorMsg('')
    try {
      await sendEmail(token, recipients, cc, bcc, subject, htmlEmail)
      setSent(true)
    } catch (e) {
      setErrorMsg('Failed to send: ' + String(e))
    }
    setSending(false)
  }

  const handleSend = async () => {
    if (accessToken) { doSend(accessToken); return }
    // No token yet — authenticate for gmail.compose then send
    setSending(true)
    setErrorMsg('')
    try {
      await loadGis()
      const tc = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.compose',
        callback: async (resp) => {
          if (resp.error) { setErrorMsg(resp.error); setSending(false); return }
          setAccessToken(resp.access_token)
          await doSend(resp.access_token)
        },
      })
      tc.requestAccessToken({ prompt: '' })
    } catch (e) {
      setErrorMsg(String(e))
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {step === 'preview' && (
              <button className="btn-ghost" onClick={() => setStep('calendar')} style={{ fontSize: 20 }}>←</button>
            )}
            <h3>{step === 'calendar' ? '📅 Pick Calendar Event' : '✉️ Review & Send'}</h3>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#b91c1c' }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}

        {/* ── STEP 1: Calendar picker ───────────────────────────────── */}
        {step === 'calendar' && (
          <>
            <div className="modal-field">
              <label className="modal-label">Meeting Date</label>
              <input type="date" className="input" value={selectedDate} onChange={handleDateChange} />
            </div>

            {!accessToken && !loading && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={connect} style={{ flex: 1 }}>
                  📅 Connect Google Calendar
                </button>
                <button className="btn-secondary" onClick={skipToPreview}>Skip →</button>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 14px' }} />
                Loading events…
              </div>
            )}

            {events && !loading && (
              <div className="cal-events">
                <p className="text-muted small" style={{ marginBottom: 8 }}>
                  {events.length} event{events.length !== 1 ? 's' : ''} on {selectedDate} — select to auto-fill recipients:
                </p>
                {events.length === 0 && (
                  <p className="empty-state">No events found. Try a different date above.</p>
                )}
                {events.map((ev) => (
                  <button key={ev.id} className="cal-event-row" onClick={() => pickEvent(ev)}>
                    <span className="cal-event-title">{ev.summary || '(No title)'}</span>
                    <span className="text-muted small">
                      {ev.start?.dateTime
                        ? new Date(ev.start.dateTime).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
                        : 'All day'}
                      {ev.attendees ? ` · ${ev.attendees.filter((a) => !a.self && !isExcluded(a.email || '')).length} others` : ''}
                    </span>
                  </button>
                ))}
                <button className="btn-ghost" onClick={skipToPreview} style={{ marginTop: 8, fontSize: 13 }}>
                  Skip — add recipients manually →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Preview & send ────────────────────────────────── */}
        {step === 'preview' && (
          <>
            {/* To / CC / BCC */}
            <div className="modal-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="modal-label">To</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!cc && (
                    <button className="ep-add-btn" style={{ fontSize: 11 }} onClick={() => setCc(' ')}>+ CC</button>
                  )}
                  {!showBcc && (
                    <button className="ep-add-btn" style={{ fontSize: 11 }} onClick={() => setShowBcc(true)}>+ BCC</button>
                  )}
                </div>
              </div>
              <input className="input" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="person@shopee.com, another@shopee.com" />
            </div>

            {(cc || cc === ' ') && (
              <div className="modal-field">
                <label className="modal-label">CC</label>
                <input className="input" value={cc.trim()} onChange={(e) => setCc(e.target.value)} placeholder="cc@shopee.com" autoFocus />
              </div>
            )}

            {showBcc && (
              <div className="modal-field">
                <label className="modal-label">BCC</label>
                <input className="input" value={bcc} onChange={(e) => setBcc(e.target.value)} placeholder="bcc@shopee.com" />
              </div>
            )}

            <div className="modal-field">
              <label className="modal-label">Subject</label>
              <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="modal-field">
              <label className="modal-label">Opening Message</label>
              <textarea
                className="input"
                rows={5}
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7, fontSize: 13 }}
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Email Preview</label>
              <iframe
                srcDoc={htmlEmail}
                title="Email preview"
                style={{ width: '100%', height: 380, border: '1px solid var(--border)', borderRadius: 8 }}
              />
            </div>

            {sent ? (
              <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 14 }}>
                ✓ Email sent successfully!
              </div>
            ) : (
              <div className="modal-actions">
                <button
                  className="btn-primary"
                  onClick={handleSend}
                  disabled={!recipients.trim() || sending}
                  style={{ flex: 1 }}
                >
                  {sending ? 'Sending…' : '✉️ Send Email'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
