const SMART_ENDPOINT_KEY = 'ugvo7csimlxjrn11fgjphue5';
const SMART_API_URL = 'https://smart.shopee.io/apis/smart/v1/orchestrator/deployments/invoke';

const PROMPT = 'Analyze this meeting transcript and generate structured meeting minutes as JSON.\n\n' +
  'Output ONLY a valid JSON object. No markdown fences, no explanation — raw JSON only.\n\n' +
  'Required JSON structure:\n' +
  '{\n' +
  '  "title": "Inferred meeting title based on content",\n' +
  '  "date": "Meeting date if mentioned, otherwise null",\n' +
  '  "participants": ["Array of participant names found in transcript"],\n' +
  '  "summary": "2-3 paragraph executive summary covering main topics, context, and outcomes",\n' +
  '  "keyDecisions": [{"id":"d1","decision":"Specific decision made","rationale":"Reasoning if mentioned, else null","owner":"Person responsible or null"}],\n' +
  '  "actionItems": [{"id":"a1","task":"Clear action to be taken","owner":"Person responsible (TBD if unclear)","deadline":"Deadline or TBD","priority":"high or medium or low"}],\n' +
  '  "openQuestions": [{"id":"q1","question":"Unresolved question","raisedBy":"Who raised it or null","context":"Brief context"}]\n' +
  '}\n\n' +
  'Rules:\n' +
  '- Extract REAL information from the transcript — do not fabricate details\n' +
  '- If a section has no items return an empty array []\n' +
  '- Action item owners should be names not roles\n' +
  '- Be concise but complete in the summary\n' +
  '- For SPX/Shopee context: participants may discuss OMS, WMS, SLS, SPX systems, logistics ops, delivery stations, parcel tracking, last-mile delivery\n\n' +
  'Transcript:\n';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Meeting Minutes Generator — SPX')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function generateMinutes(transcript) {
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      endpoint_deployment_hash_id: SMART_ENDPOINT_KEY,
      query: PROMPT + transcript,
      session_id: ''
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(SMART_API_URL, options);
  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code !== 200) {
    throw new Error('SMART API error ' + code + ': ' + body.substring(0, 300));
  }

  const data = JSON.parse(body);
  const text = data.answer || data.response ||
    (data.data && (data.data.answer || data.data.response)) || '';

  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
