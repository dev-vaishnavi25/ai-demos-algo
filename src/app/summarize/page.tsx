'use client';

import { useState } from 'react';
import { Chip } from '@/components/Chip';
import { consumeTextStream } from '@/lib/stream';
import { useTransformersWorker } from '@/lib/useTransformersWorker';

const SAMPLE = `Transformers.js lets you run Hugging Face models directly in the browser using ONNX Runtime, with no server round-trip. Because inference happens on the user's device, data never leaves the page, latency after the first model download is low, and there are no per-request API costs. The trade-offs are model size — weights must be downloaded once — and that small distilled models are less capable than large hosted ones. It pairs well with a Web Worker so heavy computation does not block the main thread, keeping the interface responsive while a model loads or runs.`;

export default function SummarizePage() {
  const { run, status, progress } = useTransformersWorker();

  const [text, setText] = useState('');
  const [local, setLocal] = useState('');
  const [cloud, setCloud] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);
  const [localBusy, setLocalBusy] = useState(false);
  const [error, setError] = useState('');

  async function summarizeLocal() {
    if (text.trim().length < 20) return;
    setError('');
    setLocal('');
    setLocalBusy(true);
    try {
      setLocal(await run('summarize', { text }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLocalBusy(false);
    }
  }

  async function summarizeCloud() {
    if (text.trim().length < 20) return;
    setError('');
    setCloud('');
    setCloudBusy(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      await consumeTextStream(res, (chunk) => setCloud((prev) => prev + chunk));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCloudBusy(false);
    }
  }

  const modelLoading = status === 'loading';

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip lib="transformers" />
          <Chip lib="vercel" />
        </div>
        <h1 className="text-2xl font-semibold">Summarize — local vs. cloud</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Run the same text through a distilled summarization model in your browser
          (Transformers.js) and a frontier LLM in the cloud (Vercel AI SDK → Gemini). Compare
          quality, speed, and the trade-offs.
        </p>
      </header>

      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <label className="label mb-0">Text to summarize</label>
          <button className="text-xs text-zinc-400 hover:text-zinc-200" onClick={() => setText(SAMPLE)}>
            Load sample
          </button>
        </div>
        <textarea
          className="field min-h-[10rem]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an article, transcript, or a few paragraphs…"
        />
        <p className="text-xs text-zinc-500">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {/* Local */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <Chip lib="transformers" />
            <span className="font-mono text-[10px] text-zinc-500">distilbart · in-browser</span>
          </div>
          <button
            className="btn-ghost w-full"
            onClick={summarizeLocal}
            disabled={localBusy || text.trim().length < 20}
          >
            {modelLoading ? 'Loading model…' : localBusy ? 'Summarizing…' : 'Summarize locally'}
          </button>
          {modelLoading &&
            progress.map((p) => (
              <div key={p.file} className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                  <span className="truncate">{p.file}</span>
                  <span>{p.progress}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded bg-zinc-800">
                  <div className="h-full bg-transformers transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          <div className="output">{local || <span className="text-zinc-600">No key required — runs on your device.</span>}</div>
        </div>

        {/* Cloud */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <Chip lib="vercel" />
            <span className="font-mono text-[10px] text-zinc-500">gemini · streamed</span>
          </div>
          <button
            className="btn-ghost w-full"
            onClick={summarizeCloud}
            disabled={cloudBusy || text.trim().length < 20}
          >
            {cloudBusy ? 'Summarizing…' : 'Summarize with Gemini'}
          </button>
          <div className="output">
            {cloud || <span className="text-zinc-600">Needs GOOGLE_GENERATIVE_AI_API_KEY.</span>}
            {cloudBusy && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-vercel align-middle" />}
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
