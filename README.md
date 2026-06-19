# AI Trio Playground

Three AI libraries, one Next.js app — each used for the job it does best, powered by the **Gemini API** (free daily tier).

| Library | Runs | Used for |
| --- | --- | --- |
| 🟠 **Transformers.js** (`@huggingface/transformers`) | In the browser | Whisper transcription + distilbart summarization, no key, no server |
| 🟢 **LangChain.js** (`@langchain/google-genai`) | Server | Composable prompt→model→parser chains (LCEL), streamed |
| 🔵 **Vercel AI SDK** (`@ai-sdk/google`) | Server | A tiny uniform streaming API for LLM responses |

## Demos

| Route | Pipeline | Libraries |
| --- | --- | --- |
| `/voice` — **Voice → Content** | mic/upload → Whisper (in browser) → Gemini | Transformers.js + Vercel AI SDK |
| `/generate` — **Prompt → Content** | `PromptTemplate → ChatGoogleGenerativeAI → StringOutputParser` | LangChain.js |
| `/summarize` — **Summarize** | same text, local distilbart **vs.** cloud Gemini | Transformers.js + Vercel AI SDK |

## Setup

```bash
npm install

# Optional: enables the cloud demos. Get a free key at https://aistudio.google.com/apikey
cp .env.example .env.local
# then paste your key into GOOGLE_GENERATIVE_AI_API_KEY

npm run dev
```

Open <http://localhost:3000>.

> The **Voice** and **Summarize** pages work with **no API key** using Transformers.js alone.
> The first run of each in-browser model downloads its weights (Whisper ~75 MB, distilbart ~funnel)
> from the Hugging Face Hub; subsequent runs are cached by the browser.

## How it fits together

```
Browser                                   Server (Next.js route handlers)
─────────────────────────────────         ──────────────────────────────────────
Web Worker
  └─ Transformers.js
       ├─ Whisper  (speech → text) ──┐
       └─ distilbart (summarize)     │
                                      │  POST /api/voice-content
  fetch + stream reader  ────────────┼─▶  Vercel AI SDK  · streamText → Gemini
                                      │  POST /api/summarize
                                      │     Vercel AI SDK  · streamText → Gemini
                                      └▶ POST /api/generate
                                            LangChain.js   · LCEL .stream() → Gemini
```

Both route styles emit **plain UTF-8 text streams**, consumed on the client by a small
`fetch` + `ReadableStream` reader (`src/lib/stream.ts`). That keeps the UI decoupled from any
single SDK's wire protocol.

## Configuration

- **Model** — set once in `src/lib/models.ts` (`MODEL_ID`). Default: `gemini-3-flash-preview`
  (fast, multimodal, free-tier-friendly). Try `gemini-3.1-pro-preview` for stronger reasoning or
  `gemini-3.1-flash-lite-preview` for the cheapest path.
- **In-browser models** — set in `src/lib/transformers/worker.ts`
  (`Xenova/whisper-tiny.en`, `Xenova/distilbart-cnn-6-6`).

### Swapping the provider

Both server frameworks use a provider package, so switching off Gemini is a small change:

- **Vercel AI SDK:** replace `@ai-sdk/google`'s `google(MODEL_ID)` with another provider, e.g.
  `@ai-sdk/openai`'s `openai('gpt-...')` or `@ai-sdk/anthropic`'s `anthropic('claude-...')`.
- **LangChain.js:** replace `ChatGoogleGenerativeAI` with `ChatOpenAI` (`@langchain/openai`) or
  `ChatAnthropic` (`@langchain/anthropic`).

## Project layout

```
src/
  app/
    page.tsx                overview + comparison table
    voice/page.tsx          Transformers.js (Whisper) → Vercel AI SDK
    generate/page.tsx       LangChain.js chain
    summarize/page.tsx      Transformers.js vs Vercel AI SDK
    api/
      voice-content/route.ts  Vercel AI SDK · streamText
      summarize/route.ts      Vercel AI SDK · streamText
      generate/route.ts       LangChain.js · LCEL .stream()
  components/                Nav, Chip
  lib/
    models.ts               cloud model id + key handling
    libraries.ts            shared library metadata
    stream.ts               client stream reader
    useTransformersWorker.ts  React hook over the worker
    transformers/worker.ts  in-browser ML (runs off the main thread)
```

## Notes

- A modern browser is required for the in-browser demos (Web Workers, WebAssembly, and
  `AudioContext` resampling). Microphone access needs `localhost` or HTTPS.
- Transformers.js downloads model weights from the Hugging Face Hub on first use.
- The Gemini free tier has per-minute and per-day request limits; heavy use may return 429s.
