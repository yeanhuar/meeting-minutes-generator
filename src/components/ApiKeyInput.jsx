import { useState } from 'react'

export default function ApiKeyInput({ initialKey, onSubmit }) {
  const [key, setKey] = useState(initialKey)
  const [show, setShow] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (key.trim()) onSubmit(key.trim())
  }

  return (
    <div className="center-card">
      <div className="card setup-card">
        <div className="card-icon">🔑</div>
        <h2>Connect Claude AI</h2>
        <p className="text-muted">
          Enter your Anthropic API key to start generating meeting minutes.
          Your key is stored locally in your browser only.
        </p>

        <form onSubmit={handleSubmit} className="api-key-form">
          <div className="input-group">
            <input
              type={show ? 'text' : 'password'}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="input"
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              className="btn-ghost input-toggle"
              onClick={() => setShow((s) => !s)}
              title={show ? 'Hide key' : 'Show key'}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={!key.trim()}>
            Continue →
          </button>
        </form>

        <p className="hint">
          Get your API key at <strong>console.anthropic.com</strong>
        </p>
      </div>
    </div>
  )
}
