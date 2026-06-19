import Link from 'next/link';
import { Chip } from '@/components/Chip';
import { LIBRARIES, type LibKey } from '@/lib/libraries';

const DEMOS: {
  href: string;
  title: string;
  blurb: string;
  libs: LibKey[];
  flow: string;
}[] = [
  {
    href: '/voice',
    title: 'Voice → Content',
    blurb:
      'Record or upload audio. Whisper transcribes it locally in your browser, then Gemini turns the spoken idea into a polished draft.',
    libs: ['transformers', 'vercel'],
    flow: 'mic → Transformers.js (Whisper) → Vercel AI SDK → Gemini',
  },
  {
    href: '/generate',
    title: 'Prompt → Content',
    blurb:
      'Pick a format and tone, give a topic. A LangChain LCEL chain (prompt → model → parser) streams the result token by token.',
    libs: ['langchain'],
    flow: 'PromptTemplate → ChatGoogleGenerativeAI → StringOutputParser',
  },
  {
    href: '/summarize',
    title: 'Summarize',
    blurb:
      'Summarize the same text two ways — a distilled model running in your browser vs. a frontier LLM in the cloud — and compare.',
    libs: ['transformers', 'vercel'],
    flow: 'Transformers.js (distilbart)  vs.  Vercel AI SDK → Gemini',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Three AI libraries, one app.
        </h1>
        <p className="max-w-2xl text-zinc-400">
          A hands-on tour of{' '}
          <span className="text-transformers">Transformers.js</span>,{' '}
          <span className="text-langchain">LangChain.js</span>, and the{' '}
          <span className="text-vercel">Vercel AI SDK</span> — each used for the job it does best,
          across voice-to-content, prompt-to-content, and summarization. Cloud calls run on the{' '}
          <span className="text-zinc-200">Gemini API</span> (free daily tier); the in-browser demos
          need no key at all.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Chip lib="transformers" />
          <Chip lib="langchain" />
          <Chip lib="vercel" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {DEMOS.map((demo) => (
          <Link key={demo.href} href={demo.href} className="card group transition hover:border-zinc-600">
            <div className="flex flex-wrap gap-1.5">
              {demo.libs.map((lib) => (
                <Chip key={lib} lib={lib} />
              ))}
            </div>
            <h2 className="mt-3 text-lg font-semibold group-hover:text-white">{demo.title}</h2>
            <p className="mt-1.5 text-sm text-zinc-400">{demo.blurb}</p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-zinc-500">{demo.flow}</p>
            <span className="mt-4 inline-block text-sm text-zinc-300 group-hover:text-white">
              Open demo →
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">What each library is for</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Library</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Best at</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(Object.keys(LIBRARIES) as LibKey[]).map((key) => {
                const lib = LIBRARIES[key];
                return (
                  <tr key={key} className="align-top">
                    <td className="px-4 py-3">
                      <div className={`font-medium ${lib.text}`}>{lib.name}</div>
                      <div className="font-mono text-[11px] text-zinc-500">{lib.pkg}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${
                          lib.runsOn === 'browser'
                            ? 'border-transformers/40 bg-transformers/10 text-transformers'
                            : 'border-zinc-700 text-zinc-300'
                        }`}
                      >
                        {lib.runsOn === 'browser' ? 'in the browser' : 'on the server'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{lib.tagline}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-zinc-500">
          Set <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">GOOGLE_GENERATIVE_AI_API_KEY</code>{' '}
          in <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">.env.local</code> to enable the
          cloud demos. The Voice and Summarize pages also work key-free using only Transformers.js.
        </p>
      </section>
    </div>
  );
}
