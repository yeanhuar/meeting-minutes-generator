const SMART_AGENT_GROUP_ID = 27941
const SMART_BASE = 'https://smart.shopee.io'
const SMART_INVOKE_URL = `${SMART_BASE}/apis/smart/v1/orchestrator/platform/invoke`
const SMART_DEBUG_TREE_URL = `${SMART_BASE}/apis/smart/v1/orchestrator/get_debug_tree`

function makeThreadId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const rand = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${rand(16)}_${rand(5)}`
}

function extractAnswer(data) {
  const tree = data?.data?.debug_tree?.message_tree
  if (!Array.isArray(tree) || tree.length === 0) return null
  const lastHuman = tree[tree.length - 1]
  const finalAi = lastHuman?.child_messages?.find((m) => m.is_final_ai_answer_message)
  return finalAi?.content || null
}

async function pollDebugTree(threadId, token, { intervalMs = 2000, timeoutMs = 120_000 } = {}) {
  const deadline = Date.now() + timeoutMs
  const body = JSON.stringify({
    agent_group_id: SMART_AGENT_GROUP_ID,
    channel: 'smart_platform',
    session_id: `smart_deployed_${SMART_AGENT_GROUP_ID}`,
    session_type: 'deployed',
    thread_id: threadId,
    webhook_hash_id: '',
  })

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs))
    const res = await fetch(SMART_DEBUG_TREE_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
    })
    if (!res.ok) continue
    const data = await res.json()
    if (data?.data?.status === 'idle') {
      const answer = extractAnswer(data)
      if (answer) return answer
      throw new Error('Agent finished but returned no content.')
    }
  }
  throw new Error('Timed out waiting for agent response after 2 minutes.')
}

export async function generateMinutes(transcript, token) {
  const authToken = import.meta.env.VITE_SMART_TOKEN || token
  const threadId = makeThreadId()

  const res = await fetch(SMART_INVOKE_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({
      is_live_app_permission_check: true,
      source_agent_group_id: SMART_AGENT_GROUP_ID,
      session_type: 'deployed',
      session_id: `smart_deployed_${SMART_AGENT_GROUP_ID}`,
      thread_id: threadId,
      message: transcript,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SMART API error ${res.status}: ${body.slice(0, 300)}`)
  }

  const invokeData = await res.json()
  if (!invokeData?.data?.success) {
    throw new Error('SMART invoke failed: ' + JSON.stringify(invokeData).slice(0, 300))
  }

  return pollDebugTree(invokeData?.data?.thread_id || threadId, authToken)
}
