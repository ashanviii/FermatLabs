import 'server-only';
import { assertServerOnly, completeJson, providerError } from './providers/groq';

export { AIConfigurationError, AIProviderError } from './providers/groq';

assertServerOnly();

export type JsonCompletionOptions = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export async function groqJsonCompletion<T>({
  user,
  temperature = 0.2,
  maxTokens = 1600,
  signal,
}: JsonCompletionOptions): Promise<T> {
  assertServerOnly();
  if (typeof user !== 'string') throw providerError('AI_INVALID_CONTEXT', 400);
  if (Buffer.byteLength(user, 'utf8') > 32 * 1024) {
    throw providerError('AI_INPUT_TOO_LARGE', 413);
  }
  let context: unknown;
  try {
    context = JSON.parse(user);
  } catch {
    throw providerError('AI_INVALID_CONTEXT', 400);
  }
  return completeJson(context, process.env, {}, { temperature, maxTokens, signal }) as Promise<T>;
}
