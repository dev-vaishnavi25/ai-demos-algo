'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FileProgress {
  file: string;
  progress: number; // 0..100
}

type RawProgress = {
  status?: string;
  file?: string;
  progress?: number;
};

export type WorkerStatus = 'idle' | 'loading' | 'running' | 'done' | 'error';

/**
 * React hook around the Transformers.js Web Worker.
 *
 * `run(task, payload)` returns a promise resolving to the model output. While a
 * model downloads for the first time, `progress` reports per-file download %.
 */
export function useTransformersWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacks = useRef(new Map<number, { resolve: (v: string) => void; reject: (e: Error) => void }>());
  const idCounter = useRef(0);

  const [status, setStatus] = useState<WorkerStatus>('idle');
  const [progress, setProgress] = useState<FileProgress[]>([]);

  useEffect(() => {
    const worker = new Worker(new URL('./transformers/worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent) => {
      const { id, type } = event.data;

      if (type === 'progress') {
        const p = event.data.progress as RawProgress;
        setStatus('loading');
        if (p?.status === 'progress' && p.file) {
          setProgress((prev) => {
            const rest = prev.filter((x) => x.file !== p.file);
            return [...rest, { file: p.file!, progress: Math.round(p.progress ?? 0) }];
          });
        }
      } else if (type === 'ready') {
        setStatus('running');
        setProgress([]);
      } else if (type === 'result') {
        setStatus('done');
        callbacks.current.get(id)?.resolve(event.data.result as string);
        callbacks.current.delete(id);
      } else if (type === 'error') {
        setStatus('error');
        callbacks.current.get(id)?.reject(new Error(event.data.error as string));
        callbacks.current.delete(id);
      }
    };

    return () => worker.terminate();
  }, []);

  const run = useCallback((task: 'transcribe' | 'summarize', payload: unknown) => {
    return new Promise<string>((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Worker not ready'));
        return;
      }
      const id = ++idCounter.current;
      callbacks.current.set(id, { resolve, reject });
      setStatus('loading');
      worker.postMessage({ id, task, payload });
    });
  }, []);

  return { run, status, progress };
}
