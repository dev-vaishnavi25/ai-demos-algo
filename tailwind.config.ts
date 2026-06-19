import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Per-library signature colors, reused as chips/accents across the app.
        transformers: '#f59e0b', // amber  — Transformers.js (in-browser ML)
        langchain: '#10b981', // emerald — LangChain.js (orchestration)
        vercel: '#38bdf8', // sky     — Vercel AI SDK (streaming UI)
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
