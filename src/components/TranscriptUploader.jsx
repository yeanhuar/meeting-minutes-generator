import { useState, useRef, useCallback } from 'react'

const ACCEPTED_EXTS = ['.vtt', '.txt', '.docx']

export default function TranscriptUploader({ onUpload, onPasteText, error }) {
  const [dragging, setDragging] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const inputRef = useRef(null)

  const handleFile = useCallback(
    (file) => {
      if (!file) return
      const ext = '.' + file.name.split('.').pop().toLowerCase()
      if (!ACCEPTED_EXTS.includes(ext)) {
        alert(`Unsupported file type "${ext}". Please upload ${ACCEPTED_EXTS.join(', ')}`)
        return
      }
      onUpload(file)
    },
    [onUpload],
  )

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile],
  )

  const handlePasteSubmit = (e) => {
    e.preventDefault()
    const text = pasteValue.trim()
    if (!text) return
    onPasteText(text)
  }

  return (
    <div className="center-card">
      <div className="card upload-card">
        <h2>Upload Meeting Transcript</h2>
        <p className="text-muted">
          Paste your transcript or upload a file
        </p>

        <form className="paste-form" onSubmit={handlePasteSubmit}>
          <textarea
            className="paste-textarea"
            placeholder="Paste your transcript here — from Google Docs, Teams, Zoom, or anywhere…"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            rows={7}
          />
          <button
            className="btn-primary paste-btn"
            type="submit"
            disabled={!pasteValue.trim()}
          >
            Generate Minutes
          </button>
        </form>

        <div className="upload-divider"><span>or upload a file</span></div>

        <div
          className={`drop-zone${dragging ? ' dragging' : ''}`}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <div className="drop-icon">📄</div>
          <p className="drop-text">Drag & drop your transcript here</p>
          <p className="drop-sub">or click to browse files</p>
          <p className="drop-types">.vtt &nbsp;·&nbsp; .txt &nbsp;·&nbsp; .docx</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTS.join(',')}
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {error && <div className="error-banner">⚠️ {error}</div>}
      </div>
    </div>
  )
}
