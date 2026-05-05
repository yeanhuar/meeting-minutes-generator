import { useState, useCallback } from 'react'
import TranscriptUploader from './components/TranscriptUploader.jsx'
import ProcessingView from './components/ProcessingView.jsx'
import MinutesDisplay from './components/MinutesDisplay.jsx'
import { parseTranscript } from './lib/parseTranscript.js'
import { generateMinutes } from './lib/claudeApi.js'
import { parseMinutesMarkdown } from './lib/parseMinutes.js'

const STEPS = { UPLOAD: 'upload', PROCESSING: 'processing', RESULTS: 'results' }

export default function App() {
  const [step, setStep] = useState(STEPS.UPLOAD)
  const [minutes, setMinutes] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')

  const process = useCallback(async (transcript, name) => {
    setError(null)
    setFileName(name)
    setStep(STEPS.PROCESSING)
    try {
      const rawMarkdown = await generateMinutes(transcript)
      setMinutes(parseMinutesMarkdown(rawMarkdown))
      setStep(STEPS.RESULTS)
    } catch (err) {
      setError(err.message)
      setStep(STEPS.UPLOAD)
    }
  }, [])

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
