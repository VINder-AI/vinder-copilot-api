import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const runtime = 'edge'; // Required on Vercel

export async function POST(req: Request) {
  const { input } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    stream: true,
    messages: [
      {
        role: 'system',
        content: 'You are a friendly VINder AI assistant who helps match people to the perfect EV. Keep it smart, playful, and fun.'
      },
      {
        role: 'user',
        content: input
      }
    ]
  });

  // Format the OpenAI stream for your frontend
  const stream = OpenAIStream(response, {
    onToken(token) {
      return `data: ${JSON.stringify({
        delta: {
          content: [{ text: { value: token } }]
        }
      })}\n\n`;
    }
  });

  return new StreamingTextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
