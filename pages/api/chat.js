// /pages/api/chat.js
import { Readable } from 'stream';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { input } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  try {
    // 1. Create thread
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2',
    };

    const threadResp = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST', headers
    });
    const { id: threadId } = await threadResp.json();

    // 2. Add message
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ role: 'user', content: input })
    });

    // 3. Run assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST', headers,
      body: JSON.stringify({ assistant_id: 'asst_8Iw8xHDNqFYSLva0KmRChr4C', stream: true })
    });

    if (!runRes.ok || !runRes.body) {
      const err = await runRes.text();
      throw new Error(err);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const reader = runRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        res.write('data: [DONE]\n\n');
        break;
      }
      const chunk = decoder.decode(value);
      res.write(`data: ${chunk}\n\n`);
    }
    res.end();
  } catch (err) {
    console.error("VINderGPT error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
