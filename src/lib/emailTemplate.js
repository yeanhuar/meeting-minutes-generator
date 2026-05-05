// keyHighlights is now an array of { title, body }
function highlightsToHtml(highlights) {
  if (!highlights?.length) return ''
  return `<table style="border:0;width:100%;border-collapse:collapse">` +
    highlights.map((item) =>
      `<tr>
        <td style="padding:0 0 10px;vertical-align:top;width:12px;color:#EE4D2D;font-size:18px;line-height:1">•</td>
        <td style="padding:0 0 10px 8px;line-height:1.65;color:#374151;font-size:13px">
          ${item.title ? `<strong style="color:#111827">${item.title}:</strong> ` : ''}${item.body || ''}
        </td>
      </tr>`
    ).join('') +
    `</table>`
}

// appendix is now an array of { name, url }
function appendixToHtml(links) {
  if (!links?.length) return ''
  return links.map((link) =>
    link.url
      ? `<p style="margin:3px 0;font-size:13px;color:#374151;line-height:1.65">
           <a href="${link.url}" style="color:#EE4D2D;text-decoration:none">${link.name || link.url}</a>
         </p>`
      : `<p style="margin:3px 0;font-size:13px;color:#374151;line-height:1.65">${link.name}</p>`
  ).join('')
}

export function buildHtmlEmail({ title, date, participants, keyHighlights, actionItems, appendix, greeting }) {
  const attendeeStr = (participants || []).join(', ') || 'Team'

  const actionRows = (actionItems || [])
    .map(
      (a, i) =>
        `<tr style="vertical-align:top;background:${i % 2 === 0 ? '#fff8f7' : '#ffffff'}">
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#6b7280;text-align:center;width:4%">${i + 1}</td>
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#111827;font-weight:600;width:18%;word-break:break-word">${a.topic}</td>
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#374151;width:26%;word-break:break-word">${a.keyHighlights || '—'}</td>
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#374151;width:26%;word-break:break-word">${a.nextSteps || '—'}</td>
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#374151;width:12%;word-break:break-word">${a.pic}</td>
          <td style="padding:8px;border:1px solid #f3e5e1;font-size:12px;color:#374151;width:14%;word-break:break-word">${a.deadline}</td>
        </tr>`
    )
    .join('')

  const appendixHtml = appendixToHtml(appendix)

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:14px">

${greeting ? `<div style="max-width:700px;margin:0 auto 16px;font-size:14px;color:#111827;line-height:1.7;white-space:pre-wrap">${greeting}</div>` : ''}

<div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e4e7ec;box-shadow:0 1px 4px rgba(0,0,0,.08)">

  <!-- Orange header -->
  <div style="background:#EE4D2D;padding:22px 28px">
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.25">${title}</h1>
    ${date ? `<p style="margin:6px 0 0;color:rgba(255,255,255,.9);font-size:13px">${date}</p>` : ''}
  </div>

  <!-- Key Highlights -->
  <div style="padding:24px 28px;border-bottom:1px solid #f0f0f0">
    <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Key Highlights</p>
    ${highlightsToHtml(keyHighlights)}
  </div>

  <!-- Action Items -->
  ${
    actionItems?.length
      ? `<div style="padding:24px 28px;border-bottom:1px solid #f0f0f0">
    <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Action Items</p>
    <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed">
      <thead>
        <tr style="background:#EE4D2D;color:#ffffff">
          <th style="padding:8px;text-align:center;font-weight:600;width:4%">No.</th>
          <th style="padding:8px;text-align:left;font-weight:600;width:18%">Topics</th>
          <th style="padding:8px;text-align:left;font-weight:600;width:26%">Key Highlights</th>
          <th style="padding:8px;text-align:left;font-weight:600;width:26%">Next Steps</th>
          <th style="padding:8px;text-align:left;font-weight:600;width:12%">PIC</th>
          <th style="padding:8px;text-align:left;font-weight:600;width:14%">Deadline</th>
        </tr>
      </thead>
      <tbody>${actionRows}</tbody>
    </table>
  </div>`
      : ''
  }

  <!-- Appendix -->
  ${
    appendixHtml
      ? `<div style="padding:24px 28px;border-bottom:1px solid #f0f0f0">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em">Appendix</p>
    ${appendixHtml}
  </div>`
      : ''
  }

  <!-- Disclaimer -->
  <div style="padding:10px 28px;background:#fafafa;border-top:1px solid #f0f0f0;font-size:11px;color:#9ca3af;font-style:italic">
    Note: This transcript was computer-generated and subsequently edited for clarity.
  </div>

  <!-- Footer -->
  <div style="padding:12px 28px;font-size:11px;color:#9ca3af;text-align:center">
    Generated by Meeting Minutes Generator &nbsp;·&nbsp; SPX Supply Chain PM Tool
  </div>

</div>
</body>
</html>`
}
