const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

// Remove computer-generated disclaimer lines from any text block
function stripDisclaimers(text) {
  if (!text) return text
  return text
    .split('\n')
    .filter((line) => {
      const l = line.replace(/\*+/g, '').trim()
      return !/computer.generated|transcript.*edited for clarity|speaker attribution|should be validated against source/i.test(l)
    })
    .join('\n')
    .trim()
}

// Truncate to first 1-2 sentences, max ~180 chars
function concise(text, maxLen = 180) {
  if (!text) return ''
  const s = text.replace(/\s+/g, ' ').trim()
  if (s.length <= maxLen) return s
  // Try cutting at sentence boundary within limit
  const cut = s.slice(0, maxLen)
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (lastStop > 40) return cut.slice(0, lastStop + 1).trim()
  return cut.replace(/\s\S*$/, '').trim() + '…'
}

// Word overlap ratio between two strings (ignores short words)
function wordOverlap(a, b) {
  const words = (s) => new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3))
  const wa = words(a)
  const wb = words(b)
  if (!wa.size || !wb.size) return 0
  const shared = [...wa].filter((w) => wb.has(w)).length
  return shared / Math.min(wa.size, wb.size)
}

// Parse markdown keyHighlights string into array of { id, title, body }
function parseHighlightsArray(md) {
  if (!md) return []
  const chunks = md.split(/^###\s+/m).filter(Boolean)
  if (chunks.length > 1) {
    return chunks.map((chunk, i) => {
      const lines = chunk.trim().split('\n')
      const title = lines[0]
        .replace(/^\d+[.)]\s*/, '')
        .replace(/^[^\w\d(]+/, '')
        .replace(/\*\*/g, '')
        .trim()
      const body = lines
        .slice(1)
        .filter((l) => l.trim() && !l.match(/^#{1,3}\s/))
        .map((l) => l.replace(/^[*-]\s+/, '').replace(/\*\*/g, '').trim())
        .join(' ')
      return { id: `h${i + 1}`, title, body: concise(stripDisclaimers(body)) }
    }).filter((item) => item.title)
  }
  // Fallback: split by ## headings
  const items = []
  let current = null
  for (const line of md.split('\n')) {
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) {
      if (current) items.push(current)
      current = { title: h2[1].replace(/\*\*/g, '').trim(), bodyLines: [] }
    } else if (current && line.trim()) {
      current.bodyLines.push(line.replace(/^[*-]\s+/, '').replace(/\*\*/g, '').trim())
    }
  }
  if (current) items.push(current)
  if (items.length) {
    return items.map((item, i) => ({
      id: `h${i + 1}`,
      title: item.title,
      body: item.bodyLines.join(' '),
    }))
  }
  return [{ id: 'h1', title: '', body: md.replace(/\*\*/g, '').trim() }]
}

export function parseMinutesMarkdown(markdown) {
  // ── Split into ## sections ──────────────────────────────────────────
  const sections = {}
  let currentKey = '_top'
  let buf = []
  for (const line of markdown.split('\n')) {
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      sections[currentKey] = buf.join('\n')
      currentKey = h2[1].trim()
      buf = []
    } else {
      buf.push(line)
    }
  }
  sections[currentKey] = buf.join('\n')

  const top = sections['_top'] || ''

  const field = (pat) => {
    const m = top.match(new RegExp(`\\*\\*${pat}\\*\\*\\s*:?\\s*([^\\n]+)`))
    return m ? m[1].replace(/\*\*/g, '').trim() : null
  }

  // ── Title ───────────────────────────────────────────────────────────
  const h1m = markdown.match(/^#\s+(.+)$/m)
  const title =
    field('Meeting Title') ||
    field('Title') ||
    (h1m ? h1m[1].replace(/\*\*/g, '').trim() : 'Meeting Minutes')

  // ── Date ────────────────────────────────────────────────────────────
  const date = field('Date[^*]*') || field('Date') || null

  // ── Participants ─────────────────────────────────────────────────────
  let participants = []
  const att = field('Attendees?') || field('Participants?')
  if (att) participants = att.split(',').map((s) => s.trim()).filter(Boolean)

  // ── Key Highlights → array of { id, title, body } ──────────────────
  const highlightKeys = Object.keys(sections).filter((k) =>
    /overview|summary|discussion|decision/i.test(k)
  )
  const highlightsMd = highlightKeys
    .map((k) => `## ${k}\n${sections[k]}`)
    .join('\n\n')
    .trim()
  const rawHighlights = parseHighlightsArray(highlightsMd)

  // ── Action Items ─────────────────────────────────────────────────────
  const actKey = Object.keys(sections).find((k) => /action item/i.test(k))
  const actionItems = []
  if (actKey) {
    const section = sections[actKey]
    let firstTr = true
    for (const trm of section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      if (firstTr) { firstTr = false; continue }
      const tds = [...trm[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      if (tds.length < 2) continue
      actionItems.push({
        id: `a${actionItems.length + 1}`,
        topic: concise(stripDisclaimers(stripHtml(tds[0]?.[1] || '')), 120),
        keyHighlights: concise(stripDisclaimers(stripHtml(tds[1]?.[1] || '')), 160),
        nextSteps: '',
        pic: stripHtml(tds[2]?.[1] || 'TBD') || 'TBD',
        deadline: stripHtml(tds[3]?.[1] || 'TBD') || 'TBD',
      })
    }
    if (!actionItems.length) {
      for (const row of section.match(/^\|.+\|$/gm) || []) {
        if (/^[\s|:-]+$/.test(row)) continue
        const cells = row.split('|').map((c) => c.trim()).filter(Boolean)
        if (cells.length < 2 || /task|topic|action/i.test(cells[0])) continue
        actionItems.push({
          id: `a${actionItems.length + 1}`,
          topic: cells[0],
          keyHighlights: cells[1] || '',
          nextSteps: '',
          pic: cells[2] || 'TBD',
          deadline: cells[3] || 'TBD',
        })
      }
    }
  }

  // ── Deduplicate + cap at 3 most important highlights ────────────────
  const keyHighlights = rawHighlights
    .filter((h) => {
      if (!h.title) return true
      return !actionItems.some((a) => wordOverlap(h.title, a.topic) > 0.6)
    })
    .slice(0, 3)

  // ── Appendix → array of { id, name, url } (user fills in) ──────────
  const appendix = []

  return { title, date, participants, keyHighlights, actionItems, appendix }
}
