'use client';

import { useRef, useState } from 'react';
import { Chip } from '@/components/Chip';
import { consumeTextStream } from '@/lib/stream';
import { useTransformersWorker } from '@/lib/useTransformersWorker';

const FORMATS = ['a short blog post', 'a tweet thread', 'a professional email', 'meeting notes'];

/** Decode any audio blob/file to a 16 kHz mono Float32Array (what Whisper wants). */
async function decodeTo16kMono(data: Blob): Promise<Float32Array> {
  const arrayBuffer = await data.arrayBuffer();
  // Constructing the context at 16 kHz makes decodeAudioData resample for us.
  const AudioCtx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: 16000 });
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
  } finally {
    await ctx.close();
  }
}

export default function VoicePage() {
  const { run, status, progress } = useTransformersWorker();

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [generated, setGenerated] = useState('');
  const [format, setFormat] = useState(FORMATS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function transcribe(audio: Blob) {
    setError('');
    setTranscript('');
    setGenerated('');
    try {
      const samples = await decodeTo16kMono(audio);
      const text = await run('transcribe', { audio: samples });
      setTranscript(text || '(no speech detected)');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function startRecording() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribe(new Blob(chunks.current, { type: recorder.mimeType }));
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch {
      setError('Could not access the microphone. Grant permission, or upload an audio file below.');
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await transcribe(file);
    e.target.value = '';
  }

  async function generate() {
    if (!transcript) return;
    setBusy(true);
    setGenerated('');
    setError('');
    try {
      const res = await fetch('/api/voice-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, format }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      await consumeTextStream(res, (chunk) => setGenerated((prev) => prev + chunk));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const loading = status === 'loading';
  const transcribing = status === 'running';

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Chip lib="transformers" />
          <Chip lib="vercel" />
        </div>
        <h1 className="text-2xl font-semibold">Voice → Content</h1>
        <p className="max-w-2xl text-sm text-zinc-400">
          Audio is transcribed <strong className="text-zinc-200">entirely in your browser</strong>{' '}
          with Whisper via Transformers.js — nothing is uploaded. The transcript is then sent to
          Gemini through the Vercel AI SDK to become polished content.
        </p>
      </header>

      {/* Step 1: capture audio */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">1 · Capture audio</h2>
        <div className="flex flex-wrap items-center gap-3">
          {!recording ? (
            <button className="btn-primary" onClick={startRecording} disabled={loading || transcribing}>
              ● Record
            </button>
          ) : (
            <button className="btn bg-red-500 text-white hover:bg-red-400" onClick={stopRecording}>
              ■ Stop
            </button>
          )}
          <span className="text-xs text-zinc-500">or</span>
          <label className="btn-ghost cursor-pointer">
            Upload audio
            <input type="file" accept="audio/*" className="hidden" onChange={onFile} />
          </label>
          {recording && <span className="animate-pulse text-xs text-red-400">recording…</span>}
        </div>

        {(loading || transcribing) && (
          <div className="space-y-2 text-xs text-zinc-400">
            <p>{loading ? 'Downloading Whisper model (first run only)…' : 'Transcribing…'}</p>
            {progress.map((p) => (
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
          </div>
        )}
      </section>

      {/* Step 2: transcript */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-zinc-300">2 · Transcript</h2>
        <textarea
          className="field min-h-[6rem]"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Your transcript appears here. You can edit it before generating."
        />
      </section>

      {/* Step 3: generate */}
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300">3 · Turn it into…</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="field max-w-xs" value={format} onChange={(e) => setFormat(e.target.value)}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button className="btn-primary" onClick={generate} disabled={!transcript || busy}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
        {generated && <div className="output">{generated}</div>}
      </section>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
