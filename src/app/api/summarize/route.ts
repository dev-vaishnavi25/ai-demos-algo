// SUMMARIZE (cloud path), via the Vercel AI SDK streaming to Gemini.
//
// The /summarize page calls this AND an in-browser Transformers.js model, so you
// can compare a local distilled model against a frontier LLM on the same text.

import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { GEMINI_API_KEY, MISSING_KEY_MESSAGE, MODEL_ID } from '@/lib/models';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  }

  const { text } = (await req.json()) as { text?: string };

  if (!text || text.trim().length < 20) {
    return new Response('Provide at least a couple of sentences to summarize.', { status: 400 });
  }

  const result = streamText({
    model: google(MODEL_ID),
    system:
      'You are a precise summarizer. Capture the key points faithfully and concisely. ' +
      'Respond with 3–5 bullet points, each on its own line starting with "• ".',
    prompt: `Summarize the following text:\n\n${text.trim()}`,
  });

  return result.toTextStreamResponse();
}
