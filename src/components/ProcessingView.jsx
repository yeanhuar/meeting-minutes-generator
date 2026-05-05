export default function ProcessingView({ fileName }) {
  return (
    <div className="center-card">
      <div className="card processing-card">
        <div className="spinner" />
        <h2>Analyzing Transcript</h2>
        <p className="text-muted file-name">{fileName}</p>
        <p className="text-muted">
          Claude is reading your transcript and generating structured meeting minutes…
        </p>
        <div className="processing-steps">
          <div className="step">📖 Parsing transcript</div>
          <div className="step">🧠 Extracting decisions &amp; action items</div>
          <div className="step">✍️ Drafting structured minutes</div>
        </div>
      </div>
    </div>
  )
}
