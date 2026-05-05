import { useState } from 'react'
import SendModal from './SendModal.jsx'

export default function MinutesDisplay({ minutes, fileName, onReset }) {
  const [data, setData] = useState(minutes)
  const [copied, setCopied] = useState(false)
  const [showSend, setShowSend] = useState(false)

  // ── Key Highlights ─────────────────────────────────────────────────
  const updateHighlight = (id, field, value) =>
    setData((d) => ({
      ...d,
      keyHighlights: d.keyHighlights.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
    }))
  const removeHighlight = (id) =>
    setData((d) => ({ ...d, keyHighlights: d.keyHighlights.filter((h) => h.id !== id) }))
  const addHighlight = () => {
    const id = `h${Date.now()}`
    setData((d) => ({ ...d, keyHighlights: [...d.keyHighlights, { id, title: '', body: '' }] }))
  }

  // ── Action Items ───────────────────────────────────────────────────
  const updateItem = (id, field, value) =>
    setData((d) => ({
      ...d,
      actionItems: d.actionItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  const removeItem = (id) =>
    setData((d) => ({ ...d, actionItems: d.actionItems.filter((i) => i.id !== id) }))
  const addActionItem = () => {
    const id = `a${Date.now()}`
    setData((d) => ({
      ...d,
      actionItems: [
        ...d.actionItems,
        { id, topic: '', keyHighlights: '', nextSteps: '', pic: 'TBD', deadline: 'TBD' },
      ],
    }))
  }

  // ── Appendix links ─────────────────────────────────────────────────
  const updateLink = (id, field, value) =>
    setData((d) => ({
      ...d,
      appendix: d.appendix.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }))
  const removeLink = (id) =>
    setData((d) => ({ ...d, appendix: d.appendix.filter((l) => l.id !== id) }))
  const addLink = () => {
    const id = `l${Date.now()}`
    setData((d) => ({ ...d, appendix: [...d.appendix, { id, name: '', url: '' }] }))
  }

  // ── Copy to clipboard ──────────────────────────────────────────────
  const copyToClipboard = async () => {
    const lines = [
      `# [Meeting Minutes] ${data.title || 'Meeting Minutes'}`,
      data.date ? `Date: ${data.date}` : null,
      '',
      '## Key Highlights',
      ...(data.keyHighlights || []).map((h) => `- **${h.title}:** ${h.body}`),
      '',
      '## Action Items',
      ...(data.actionItems || []).map(
        (a, i) =>
          `${i + 1}. **${a.topic}**\n   Key Highlights: ${a.keyHighlights}\n   Next Steps: ${a.nextSteps}\n   PIC: ${a.pic}  |  Deadline: ${a.deadline}`
      ),
      '',
      '## Appendix',
      ...(data.appendix || []).map((l) => `- ${l.name}${l.url ? ': ' + l.url : ''}`),
    ].filter((l) => l !== null)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="results-layout">
      {showSend && <SendModal minutes={data} onClose={() => setShowSend(false)} />}

      {/* Toolbar */}
      <div className="results-header">
        <p className="text-muted small" style={{ margin: 0 }}>
          Click any field to edit inline
        </p>
        <div className="results-actions">
          <button className="btn-secondary" onClick={onReset}>↑ New Transcript</button>
          <button className="btn-secondary" onClick={copyToClipboard}>
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
          <button className="btn-primary" onClick={() => setShowSend(true)}>
            📧 Send Minutes
          </button>
        </div>
      </div>

      {/* Email-style preview card with inline editing */}
      <div className="ep-card">

        {/* Orange header */}
        <div className="ep-header">
          <input
            className="ep-title-input"
            value={data.title || ''}
            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
            placeholder="Meeting title…"
          />
          {data.date && <p className="ep-date">{data.date}</p>}
        </div>

        {/* Key Highlights */}
        <div className="ep-section">
          <div className="ep-section-top">
            <span className="ep-label">Key Highlights</span>
            <button className="ep-add-btn" onClick={addHighlight}>+ Add</button>
          </div>
          {data.keyHighlights.length === 0 && (
            <p className="ep-empty">No highlights — click "+ Add" to add one</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.keyHighlights.map((h) => (
              <div key={h.id} className="ep-hl-row">
                <span className="ep-bullet">•</span>
                <div className="ep-hl-body">
                  <div className="ep-hl-title-row">
                    <input
                      className="ep-hl-title"
                      value={h.title}
                      onChange={(e) => updateHighlight(h.id, 'title', e.target.value)}
                      placeholder="Topic title"
                    />
                    <span className="ep-colon">:</span>
                  </div>
                  <textarea
                    className="ep-hl-desc"
                    value={h.body}
                    onChange={(e) => updateHighlight(h.id, 'body', e.target.value)}
                    placeholder="Description…"
                    rows={2}
                  />
                </div>
                <button className="ep-remove" onClick={() => removeHighlight(h.id)}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="ep-section">
          <div className="ep-section-top">
            <span className="ep-label">Action Items</span>
            <button className="ep-add-btn" onClick={addActionItem}>+ Add Row</button>
          </div>
          {data.actionItems.length === 0 && (
            <p className="ep-empty">No action items</p>
          )}
          {data.actionItems.length > 0 && (
            <div className="ep-table-wrap">
              <table className="ep-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>No.</th>
                    <th style={{ width: '18%' }}>Topics</th>
                    <th style={{ width: '26%' }}>Key Highlights</th>
                    <th style={{ width: '26%' }}>Next Steps</th>
                    <th style={{ width: '11%' }}>PIC</th>
                    <th style={{ width: '11%' }}>Deadline</th>
                    <th style={{ width: '4%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.actionItems.map((item, idx) => (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff8f7' : '#fff' }}>
                      <td className="ep-td-num">{idx + 1}</td>
                      <td className="ep-td">
                        <textarea className="ep-cell ep-cell-bold" value={item.topic} onChange={(e) => updateItem(item.id, 'topic', e.target.value)} placeholder="Topic…" rows={2} />
                      </td>
                      <td className="ep-td">
                        <textarea className="ep-cell" value={item.keyHighlights} onChange={(e) => updateItem(item.id, 'keyHighlights', e.target.value)} placeholder="What was discussed…" rows={2} />
                      </td>
                      <td className="ep-td">
                        <textarea className="ep-cell" value={item.nextSteps} onChange={(e) => updateItem(item.id, 'nextSteps', e.target.value)} placeholder="Next steps…" rows={2} />
                      </td>
                      <td className="ep-td">
                        <textarea className="ep-cell" value={item.pic} onChange={(e) => updateItem(item.id, 'pic', e.target.value)} placeholder="PIC" rows={2} />
                      </td>
                      <td className="ep-td">
                        <textarea className="ep-cell" value={item.deadline} onChange={(e) => updateItem(item.id, 'deadline', e.target.value)} placeholder="Deadline" rows={2} />
                      </td>
                      <td className="ep-td-action">
                        <button className="ep-remove" onClick={() => removeItem(item.id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appendix */}
        <div className="ep-section" style={{ borderBottom: 'none' }}>
          <div className="ep-section-top">
            <span className="ep-label">Appendix</span>
            <button className="ep-add-btn" onClick={addLink}>+ Add Link</button>
          </div>
          {data.appendix.length === 0 && (
            <p className="ep-empty">No links — click "+ Add Link" to attach documents</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.appendix.map((link) => (
              <div key={link.id} className="ep-link-row">
                <input
                  className="ep-link-name"
                  value={link.name}
                  onChange={(e) => updateLink(link.id, 'name', e.target.value)}
                  placeholder="Document name…"
                />
                <input
                  className="ep-link-url"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  placeholder="https://…"
                />
                {link.url && (
                  <a href={link.url} target="_blank" rel="noreferrer" className="ep-link-open">↗</a>
                )}
                <button className="ep-remove" onClick={() => removeLink(link.id)}>×</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
