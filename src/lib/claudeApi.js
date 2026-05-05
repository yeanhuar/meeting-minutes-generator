export async function generateMinutes(transcript) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body.slice(0, 300)}`)
  }

  const data = await res.json()
  if (!data.content) throw new Error('No content returned from API')
  return data.content
}
