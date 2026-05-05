import { useState } from 'react'

export default function TokenInput({ initialToken, onSubmit }) {
  const [token, setToken] = useState(initialToken || '')
  const [show, setShow] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const t = token.trim()
    if (!t) return
    onSubmit(t)
  }

  return (
    <div className="center-card">
      <div className="card setup-card">
        <div className="card-icon">🔑</div>
        <h2>SMART Bearer Token</h2>
        <p className="text-muted hint">
          Paste your SMART platform token below. It's saved locally and never sent anywhere except SMART.
        </p>

        <form className="api-key-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Bearer eyJ..."
              autoComplete="off"
            />
            <button
              type="button"
              className="input-toggle btn-ghost"
              onClick={() => setShow((s) => !s)}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>
          <button className="btn-primary" type="submit" disabled={!token.trim()}>
            Save &amp; Continue
          </button>
        </form>

        <p className="hint" style={{ marginTop: 20 }}>
          <strong>How to get your token:</strong><br />
          1. Open <a href="https://smart.shopee.io" target="_blank" rel="noreferrer">smart.shopee.io</a> and open any agent<br />
          2. Open DevTools → Network tab → send any message<br />
          3. Click the <code>invoke</code> request → Request Headers<br />
          4. Copy the <code>Authorization</code> value and paste it here
        </p>
      </div>
    </div>
  )
}
