import { Readable } from "stream";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { messages } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        stream: true,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI error: ${error}`);
    }

    const stream = Readable.fromWeb(response.body);
    res.setHeader("Content-Type", "text/event-stream");
    stream.pipe(res);
  } catch (err) {
    console.error("OpenAI stream error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
