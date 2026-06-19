import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';

export const metadata: Metadata = {
  title: 'AI Trio Playground — Transformers.js · LangChain.js · Vercel AI SDK',
  description:
    'Three AI libraries, one app: in-browser Whisper transcription, LangChain content chains, and Vercel AI SDK streaming — powered by the Gemini API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-12 pt-6 text-xs text-zinc-500">
          Transformers.js runs in your browser · LangChain.js &amp; Vercel AI SDK call Gemini on
          the server.
        </footer>
      </body>
    </html>
  );
}
