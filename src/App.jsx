import { useState, useCallback } from 'react'
import TranscriptUploader from './components/TranscriptUploader.jsx'
import ProcessingView from './components/ProcessingView.jsx'
import MinutesDisplay from './components/MinutesDisplay.jsx'
import TokenInput from './components/TokenInput.jsx'
import { parseTranscript } from './lib/parseTranscript.js'
import { generateMinutes } from './lib/claudeApi.js'
import { parseMinutesMarkdown } from './lib/parseMinutes.js'

const STEPS = { SETUP: 'setup', UPLOAD: 'upload', PROCESSING: 'processing', RESULTS: 'results' }
const TOKEN_KEY = 'smart_bearer_token'

export default function App() {
  const [step, setStep] = useState(() =>
    localStorage.getItem(TOKEN_KEY) ? STEPS.UPLOAD : STEPS.SETUP
  )
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [minutes, setMinutes] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')

  const handleTokenSubmit = (t) => {
    localStorage.setItem(TOKEN_KEY, t)
    setToken(t)
    setStep(STEPS.UPLOAD)
  }

  const process = useCallback(async (transcript, name) => {
    setError(null)
    setFileName(name)
    setStep(STEPS.PROCESSING)
    try {
      const rawMarkdown = await generateMinutes(transcript, localStorage.getItem(TOKEN_KEY) || token)
      setMinutes(parseMinutesMarkdown(rawMarkdown))
      setStep(STEPS.RESULTS)
    } catch (err) {
      setError(err.message)
      setStep(STEPS.UPLOAD)
    }
  }, [token])

  const handleFileUpload = useCallback(async (file) => {
    const transcript = await parseTranscript(file).catch((err) => { throw err })
    if (!transcript.trim()) throw new Error('The file appears to be empty or has no readable text.')
    process(transcript, file.name)
  }, [process])

  const handlePasteText = useCallback((text) => {
    process(text, 'Pasted transcript')
  }, [process])

  const handleReset = () => {
    setMinutes(null)
    setError(null)
    setFileName('')
    setStep(STEPS.UPLOAD)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-logo">📋</span>
            <div>
              <h1 className="header-title">Meeting Minutes Generator</h1>
              <p className="header-sub">Supply Chain PM Tool · Powered by SMART</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {step === STEPS.SETUP && (
          <TokenInput initialToken={token} onSubmit={handleTokenSubmit} />
        )}
        {step === STEPS.UPLOAD && (
          <TranscriptUploader onUpload={handleFileUpload} onPasteText={handlePasteText} error={error} />
        )}
        {step === STEPS.PROCESSING && (
          <ProcessingView fileName={fileName} />
        )}
        {step === STEPS.RESULTS && minutes && (
          <MinutesDisplay minutes={minutes} fileName={fileName} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}
