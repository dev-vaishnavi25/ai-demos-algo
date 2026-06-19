/// <reference lib="webworker" />
//
// Web Worker that runs Transformers.js models in the browser.
//
// Keeping inference off the main thread means model downloads (tens of MB) and
// compute don't freeze the UI. Models are fetched from the Hugging Face Hub on
// first use and cached by the browser thereafter.
//
// The Transformers.js *runtime* is imported from a CDN at runtime (not bundled).
// Its ONNX Runtime Web backend ships emscripten glue that uses `import.meta`,
// which the app bundler can't parse — loading it as a native ESM module in the
// worker sidesteps that entirely. The npm package stays installed purely for its
// types (`typeof import(...)` is erased at build time and never bundled).

type TransformersModule = typeof import('@huggingface/transformers');
type PipelineTask = Parameters<TransformersModule['pipeline']>[0];
type CallablePipeline = (input: unknown, options?: Record<string, unknown>) => Promise<unknown>;

let modulePromise: Promise<TransformersModule> | null = null;

function loadTransformers(): Promise<TransformersModule> {
  if (!modulePromise) {
    // A string literal (not a variable) so the bundler reliably honors
    // `webpackIgnore` and leaves this as a native runtime import.
    modulePromise = import(
      /* webpackIgnore: true */
      // @ts-expect-error — remote ESM module resolved at runtime, not by the bundler
      'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1'
    ) as Promise<TransformersModule>;
  }
  return modulePromise;
}

type Task = 'transcribe' | 'summarize';

const MODELS: Record<Task, { type: PipelineTask; model: string }> = {
  // Whisper tiny (English) — ~75MB, fast, great for a demo.
  transcribe: { type: 'automatic-speech-recognition', model: 'Xenova/whisper-tiny.en' },
  // DistilBART fine-tuned on CNN/DailyMail — abstractive summarization.
  summarize: { type: 'summarization', model: 'Xenova/distilbart-cnn-6-6' },
};

// Cache each pipeline so the model loads only once per task.
const instances: Partial<Record<Task, CallablePipeline>> = {};

async function getPipeline(task: Task, onProgress: (p: unknown) => void): Promise<CallablePipeline> {
  const { pipeline, env } = await loadTransformers();
  env.allowLocalModels = false; // only use remote (Hub) models

  if (!instances[task]) {
    const { type, model } = MODELS[task];
    const create = pipeline as unknown as (
      task: PipelineTask,
      model: string,
      options: { progress_callback: (p: unknown) => void },
    ) => Promise<CallablePipeline>;
    instances[task] = await create(type, model, { progress_callback: onProgress });
  }
  return instances[task]!;
}

interface IncomingMessage {
  id: number;
  task: Task;
  payload: { audio?: Float32Array; text?: string };
}

self.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const { id, task, payload } = event.data;
  const post = (type: string, data: Record<string, unknown> = {}) =>
    self.postMessage({ id, type, ...data });

  try {
    const pipe = await getPipeline(task, (progress) => post('progress', { progress }));
    post('ready');

    if (task === 'transcribe') {
      const output = (await pipe(payload.audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
      })) as { text: string };
      post('result', { result: output.text.trim() });
    } else {
      const output = (await pipe(payload.text, {
        max_new_tokens: 160,
        min_length: 30,
      })) as Array<{ summary_text: string }>;
      post('result', { result: output[0].summary_text.trim() });
    }
  } catch (err) {
    post('error', { error: err instanceof Error ? err.message : String(err) });
  }
});
