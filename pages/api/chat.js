// /api/chat.js
import { Readable } from 'stream';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message } = req.body;
  const assistant_id = 'asst_8Iw8xHDNqFYSLva0KmRChr4C';

  try {
    // Step 1: Create thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
      }
    });
    const { id: thread_id } = await threadRes.json();

    // Step 2: Add message to thread
    await fetch(`https://api.openai.com/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({ role: 'user', content: message })
    });

    // Step 3: Run assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v1'
      },
      body: JSON.stringify({ assistant_id, stream: true })
    });

    if (!runRes.ok) {
      const error = await runRes.text();
      throw new Error(`Run failed: ${error}`);
    }

    // Step 4: Stream response back
    const nodeStream = Readable.fromWeb(runRes.body);
    res.setHeader('Content-Type', 'text/event-stream');
    nodeStream.pipe(res);

  } catch (err) {
    console.error('Assistant API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
