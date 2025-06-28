// Updated chat.js using OpenAI Assistants API
import { Readable } from "stream";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { messages } = req.body;

  try {
    // 1. Create a thread
    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
    });

    const thread = await threadRes.json();

    // 2. Add user message to thread
    await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "user",
        content: messages[1].content
      }),
    });

    // 3. Run the assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant_id: "asst_8Iw8xHDNqFYSLva0KmRChr4C",
        stream: false
      }),
    });

    const run = await runRes.json();

    // 4. Poll until run completes
    let status = run.status;
    while (status === "queued" || status === "in_progress") {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
      const pollRes = await poll.json();
      status = pollRes.status;
    }

    // 5. Get messages
    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });

    const msgJson = await messagesRes.json();
    const text = msgJson.data.find((m) => m.role === "assistant")?.content?.[0]?.text?.value;

    res.status(200).json({ response: text });
  } catch (err) {
    console.error("Assistants API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
