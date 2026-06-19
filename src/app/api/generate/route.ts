// PROMPT -> CONTENT, via LangChain.js (LCEL) streaming to Gemini.
//
// Demonstrates LangChain's compositional style: a PromptTemplate, a chat model,
// and an output parser piped into one runnable, streamed token by token.

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { GEMINI_API_KEY, MISSING_KEY_MESSAGE, MODEL_ID } from '@/lib/models';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return new Response(MISSING_KEY_MESSAGE, { status: 400 });
  }

  const { topic, format, tone } = (await req.json()) as {
    topic?: string;
    format?: string;
    tone?: string;
  };

  if (!topic?.trim()) {
    return new Response('Please provide a topic to write about.', { status: 400 });
  }

  const model = new ChatGoogleGenerativeAI({
    model: MODEL_ID,
    apiKey: GEMINI_API_KEY,
    maxOutputTokens: 1500,
    temperature: 0.7,
  });

  // PromptTemplate -> Model -> StringOutputParser. The parser makes the chain
  // stream plain strings instead of message chunks.
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      'You are an expert content writer. Write {format} in a {tone} tone. ' +
        'Return only the finished content — no preamble, notes, or meta commentary.',
    ],
    ['human', 'Topic: {topic}'],
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const lcStream = await chain.stream({
    topic: topic.trim(),
    format: format || 'a short blog post',
    tone: tone || 'professional',
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of lcStream) {
          controller.enqueue(encoder.encode(token));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`\n\n[stream error] ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
