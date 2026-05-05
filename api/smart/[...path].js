export default async function handler(req, res) {
  const pathParts = req.query.path || []
  const targetPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts
  const url = `https://smart.shopee.io/${targetPath}`

  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMART_TOKEN}`,
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method)
        ? JSON.stringify(req.body)
        : undefined,
    })
    const data = await upstream.json()
    res.status(upstream.status).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
