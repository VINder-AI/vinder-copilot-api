export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messages } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'Missing OpenAI API Key' });
    return;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      stream: true,
      messages
    })
  });

  res.setHeader('Content-Type', 'text/event-stream');
  response.body.pipe(res);
}