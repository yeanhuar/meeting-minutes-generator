export async function fetchGoogleDoc(url) {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) throw new Error('Invalid Google Docs URL. Paste a link like: docs.google.com/document/d/…')

  const docId = match[1]
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`

  const response = await fetch(exportUrl, { credentials: 'include' })
  if (!response.ok) {
    throw new Error(
      `Could not access the Google Doc (${response.status}). Make sure you are logged into Google and the doc is shared with you.`,
    )
  }
  return response.text()
}

export async function parseTranscript(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'txt') {
    return readAsText(file)
  }
  if (ext === 'vtt') {
    const raw = await readAsText(file)
    return parseVtt(raw)
  }
  if (ext === 'docx') {
    return parseDocx(file)
  }

  throw new Error(`Unsupported file type: .${ext}. Please upload a .vtt, .txt, or .docx file.`)
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function parseVtt(raw) {
  const lines = raw.split('\n')
  const textLines = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (
      !trimmed ||
      trimmed === 'WEBVTT' ||
      trimmed.startsWith('NOTE') ||
      trimmed.startsWith('STYLE') ||
      /^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->\s+/.test(trimmed) ||
      /^\d+$/.test(trimmed)
    ) continue
    textLines.push(trimmed)
  }

  return textLines.join('\n')
}

async function parseDocx(file) {
  const { default: mammoth } = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}
