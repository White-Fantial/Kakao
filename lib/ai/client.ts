const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 20_000;

type ChatCompletionChoice = {
  message?: {
    content?: string | null;
  } | null;
} | null;

type ChatCompletionResponse = {
  choices?: ChatCompletionChoice[];
  error?: {
    message?: string;
  };
};

type GenerateJsonInput = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
};

function normalizeApiBaseUrl(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function getTimeoutMs() {
  const raw = Number(process.env.AI_TEXT_TIMEOUT_MS ?? '');
  if (!Number.isFinite(raw) || raw < 1_000 || raw > 120_000) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.floor(raw);
}

export function isAiGenerationConfigured() {
  return Boolean(process.env.AI_TEXT_API_KEY);
}

export async function generateJsonWithChatModel<T>({
  systemPrompt,
  userPrompt,
  temperature = 0.8,
  maxTokens = 900,
}: GenerateJsonInput): Promise<T> {
  const apiKey = process.env.AI_TEXT_API_KEY;
  if (!apiKey) {
    throw new Error('AI_TEXT_API_KEY가 설정되지 않아 자동 생성을 사용할 수 없어요.');
  }

  const model = process.env.AI_TEXT_MODEL || DEFAULT_MODEL;
  const baseUrl = normalizeApiBaseUrl(process.env.AI_TEXT_API_BASE_URL || DEFAULT_OPENAI_BASE_URL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    if (!response.ok) {
      const message = payload?.error?.message?.trim();
      throw new Error(message ? `LLM 호출 실패: ${message}` : `LLM 호출 실패: HTTP ${response.status}`);
    }

    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('LLM 응답이 비어 있어요.');
    }

    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LLM 응답 시간이 초과되었어요. 잠시 후 다시 시도해 주세요.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
