import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const runtime = 'edge'; // Required for streaming on Vercel Edge

export async function POST(req: Request) {
  const { input } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a friendly EV assistant. Keep it playful and helpful.'
      },
      {
        role: 'user',
        content: input
      }
    ]
  });

  // Pipe OpenAI stream into a generic StreamingTextResponse
  const stream = OpenAIStream(response, {
    onToken(token) {
      // Format each token as a streaming chunk
      const formatted = {
        delta: {
          content: [{ text: { value: token } }]
        }
      };
      // Stream-friendly JSON payload
      return `data: ${JSON.stringify(formatted)}\n\n`;
    }
  });

  return new StreamingTextResponse(stream);
}
