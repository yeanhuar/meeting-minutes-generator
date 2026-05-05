import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a meeting minutes generator for Shopee SPX Supply Chain PMs. Given a raw meeting transcript, produce structured meeting minutes in the following exact format:

# [Meeting Title]

**Meeting Title**: [title]
**Date**: [date, e.g. 5 May 2026]
**Attendees**: [comma-separated list of attendees with emails if available]

## Discussion Summary

### [Topic 1]
[2-3 sentence summary of what was discussed and decided]

### [Topic 2]
[2-3 sentence summary]

### [Topic 3]
[2-3 sentence summary]

## Action Items

<table>
<tr><th>Task / Topic</th><th>Key Highlights</th><th>PIC</th><th>Deadline</th></tr>
[For each action item:]
<tr><td>[task]</td><td>[key highlight or context]</td><td>[person responsible]</td><td>[deadline or TBD]</td></tr>
</table>

Rules:
- Extract up to 3 key discussion topics for the Discussion Summary
- Each topic should be a ### heading with a concise 1-3 sentence body
- Extract all action items, decisions, and follow-ups into the Action Items table
- If a date is not mentioned, omit the Date field
- If attendees are not mentioned, omit the Attendees field
- Keep summaries factual and concise
- Do not add disclaimers or notes about the transcript quality`

export default async function handler(req, res) {
  try {
    const { transcript } = req.body
    if (!transcript) return res.status(400).json({ error: 'Missing transcript' })

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: transcript }],
    })

    res.status(200).json({ content: message.content[0].text })
  } catch (e) {
    console.error('generate error:', e)
    res.status(500).json({ error: e.message })
  }
}
