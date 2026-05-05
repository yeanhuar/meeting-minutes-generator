export default async function handler(req, res) {
  const upstream = await fetch(
    'https://smart.shopee.io/apis/smart/v1/orchestrator/platform/invoke',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMART_TOKEN}`,
      },
      body: JSON.stringify(req.body),
    }
  )
  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
