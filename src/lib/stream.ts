/**
 * Consume a plain-text streaming HTTP response chunk by chunk.
 *
 * Both API routes (LangChain `.stream()` and the Vercel AI SDK
 * `toTextStreamResponse()`) emit raw UTF-8 text, so the client just reads the
 * body and appends. This keeps the UI independent of any SDK's wire protocol.
 */
export async function consumeTextStream(
  response: Response,
  onChunk: (text: string) => void,
): Promise<void> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
