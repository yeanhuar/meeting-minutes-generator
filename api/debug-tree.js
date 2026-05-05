export default async function handler(req, res) {
  try {
    const token = process.env.SMART_TOKEN
    if (!token) {
      return res.status(500).json({ error: 'SMART_TOKEN env var not set' })
    }
    const upstream = await fetch(
      'https://smart.shopee.io/apis/smart/v1/orchestrator/get_debug_tree',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(req.body),
      }
    )
    const text = await upstream.text()
    res.status(upstream.status).setHeader('Content-Type', 'application/json').end(text)
  } catch (e) {
    console.error('debug-tree error:', e)
    res.status(500).json({ error: e.message })
  }
}
