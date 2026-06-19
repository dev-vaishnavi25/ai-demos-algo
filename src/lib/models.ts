/**
 * Single source of truth for the cloud model used by the LangChain.js and
 * Vercel AI SDK demos.
 *
 * `gemini-3-flash-preview` is fast, multimodal, and covered by the Gemini API's
 * free daily request tier — a good default for content generation + summaries.
 * Swap to `gemini-3.1-pro-preview` for higher-quality reasoning, or
 * `gemini-3.1-flash-lite-preview` for the cheapest/fastest path.
 */
export const MODEL_ID = 'gemini-3-flash-preview';

/** Read once so every route fails the same friendly way when the key is absent. */
export const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const MISSING_KEY_MESSAGE =
  'No GOOGLE_GENERATIVE_AI_API_KEY found. Add it to .env.local (get a free key at ' +
  'https://aistudio.google.com/apikey) and restart the dev server. ' +
  'The in-browser Transformers.js demos work without a key.';
