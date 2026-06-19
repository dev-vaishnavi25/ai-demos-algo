// VOICE -> CONTENT (second half), via the Vercel AI SDK streaming to Gemini.
//
// The transcript is produced in the browser by Transformers.js (Whisper); this
// route turns that rough spoken idea into polished content. `streamText` +
// `toTextStreamResponse()` give a one-liner streaming response.

import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { GEMINI_API_KEY, MISSING_KEY_MESSAGE, MODEL_ID } from '@/lib/models';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  }

  const { transcript, format } = (await req.json()) as {
    transcript?: string;
    format?: string;
  };

  if (!transcript?.trim()) {
    return new Response('No transcript provided. Record or upload some audio first.', {
      status: 400,
    });
  }

  // @ai-sdk/google reads GOOGLE_GENERATIVE_AI_API_KEY from the environment.
  const result = streamText({
    model: google(MODEL_ID),
    system:
      `You turn a spoken idea — transcribed and possibly rough — into a polished ${
        format || 'short blog post'
      }. ` +
      'Preserve the speaker’s intent and key points. Clean up filler and false starts. ' +
      'Output only the final content.',
    prompt: `Spoken idea (transcript):\n"""${transcript.trim()}"""`,
  });

  return result.toTextStreamResponse();
}
