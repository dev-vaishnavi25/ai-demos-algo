'use client';

import { useState } from 'react';
import { Chip } from '@/components/Chip';
import { consumeTextStream } from '@/lib/stream';

const FORMATS = [
  'a short blog post',
  'a tweet thread',
  'a product description',
  'a cold outreach email',
  'a LinkedIn post',
  'a four-line poem',
];
const TONES = ['professional', 'casual', 'witty', 'persuasive', 'enthusiastic'];

export default function GeneratePage() {
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState(FORMATS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!topic.trim()) return;
    setBusy(true);
    setOutput('');
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, format, tone }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      await consumeTextStream(res, (chunk) => setOutput((prev) => prev + chunk));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Chip lib="langchain" />
        <h1 className="text-2xl font-semibold">Prompt → Content</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          A LangChain <span className="font-mono text-langchain">LCEL</span> chain —{' '}
          <span className="font-mono text-xs">PromptTemplate → ChatGoogleGenerativeAI →
          StringOutputParser</span>{' '}
          — streams the result. Your format and tone are injected as template variables.
        </p>
      </header>

      <section className="card space-y-4">
        <div>
          <label className="label">Topic</label>
          <input
            className="field"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && generate()}
            placeholder="e.g. why a Web Worker keeps the UI responsive during ML inference"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Format</label>
            <select className="field" value={format} onChange={(e) => setFormat(e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tone</label>
            <select className="field" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={!topic.trim() || busy}>
          {busy ? 'Generating…' : 'Generate'}
        </button>
      </section>

      {(output || busy) && (
        <section className="card space-y-2">
          <h2 className="text-sm font-semibold text-zinc-300">Output</h2>
          <div className="output">
            {output}
            {busy && <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-langchain align-middle" />}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
