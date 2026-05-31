export async function generateAssignment(topic, type, files, trapType) {
  // Build a prompt that includes topic, trap, and file names (or content placeholders)
  const fileList = files.map(f => f.name || f).join(', ') || 'no files provided';
  const prompt = `You are an educator generating a ${type} assignment on the topic "${topic}". Use the following knowledge base files as context: ${fileList}. Include a logic trap of type "${trapType}" as described:
  - memory: strict 127-byte buffer limitation.
  - no-standard-lib: no standard library usage.
  - edge-case: reject input length exactly 13.
  - quantum-sync: integrate Spectra-Sync Guard.
Provide a JSON object with fields: title, description, trapQuestion, trapExplanation.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0.7,
      system: 'You generate concise assignment specifications in JSON.',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    console.error('Anthropic API error', response.status);
    throw new Error('AI service failed');
  }

  const data = await response.json();
  // Assume the assistant's content is a JSON string
  const content = data.content?.[0]?.text?.trim();
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse AI response', e);
    throw e;
  }
}
