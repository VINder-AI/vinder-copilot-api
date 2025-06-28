export default async function handler(req, res) {
  // CORS headers to allow local dev + Framer
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject all non-POST methods
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Read user messages
  const { messages } = req.body;

  try {
    // Call OpenAI with streaming
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        stream: true,
        messages,
      }),
    });

    // Forward stream to client
    res.setHeader("Content-Type", "text/event-stream");
    response.body.pipe(res);
  } catch (err) {
    console.error("OpenAI stream error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
