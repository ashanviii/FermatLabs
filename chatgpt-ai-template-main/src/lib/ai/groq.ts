const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class AIConfigurationError extends Error {
  constructor(message = 'Fermat AI is not configured.') {
    super(message);
    this.name = 'AIConfigurationError';
  }
}

export class AIProviderError extends Error {
  status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = 'AIProviderError';
    this.status = status;
  }
}

type JsonCompletionOptions = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

export async function groqJsonCompletion<T>({
  system,
  user,
  temperature = 0.2,
  maxTokens = 1_800,
  signal,
}: JsonCompletionOptions): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new AIConfigurationError();

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_completion_tokens: maxTokens,
    }),
    signal,
  });

  if (!response.ok) {
    // Do not write provider bodies to application logs: JSON validation errors
    // can contain generated text derived from private trip context.
    console.error('Groq request failed', response.status);
    if (response.status === 429) {
      throw new AIProviderError('The free AI allowance is busy. Please try again shortly.', 429);
    }
    throw new AIProviderError('Fermat AI could not generate suggestions right now.');
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new AIProviderError('Fermat AI returned an incomplete response.');
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AIProviderError('Fermat AI returned an invalid response.');
  }
}
