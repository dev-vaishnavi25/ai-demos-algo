/** Shared metadata for the three libraries, used by chips and the home page. */
export type LibKey = 'transformers' | 'langchain' | 'vercel';

export const LIBRARIES: Record<
  LibKey,
  {
    name: string;
    pkg: string;
    tagline: string;
    /** Tailwind text-color class for this library's accent. */
    text: string;
    /** Tailwind border-color class (uses /40 opacity). */
    border: string;
    /** Tailwind bg-color class (uses /10 opacity). */
    bg: string;
    runsOn: 'browser' | 'server';
  }
> = {
  transformers: {
    name: 'Transformers.js',
    pkg: '@huggingface/transformers',
    tagline: 'Run ML models locally in the browser — no server, no API key.',
    text: 'text-transformers',
    border: 'border-transformers/40',
    bg: 'bg-transformers/10',
    runsOn: 'browser',
  },
  langchain: {
    name: 'LangChain.js',
    pkg: '@langchain/google-genai',
    tagline: 'Compose prompts, models, and parsers into streaming chains (LCEL).',
    text: 'text-langchain',
    border: 'border-langchain/40',
    bg: 'bg-langchain/10',
    runsOn: 'server',
  },
  vercel: {
    name: 'Vercel AI SDK',
    pkg: '@ai-sdk/google',
    tagline: 'A tiny, uniform streaming API for LLM responses across providers.',
    text: 'text-vercel',
    border: 'border-vercel/40',
    bg: 'bg-vercel/10',
    runsOn: 'server',
  },
};
