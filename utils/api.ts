import { ChatMessage } from './storage';

export const checkApiKey = async (apiKey: string, model: string): Promise<boolean> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const models = await response.json();
      return models.data.some((m: any) => m.id === model);
    }
    return false;
  } catch {
    return false;
  }
};

export const fetchModels = async (apiKey: string): Promise<string[]> => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (response.ok) {
      const models = await response.json();
      return models.data
        .filter((m: any) => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
        .map((m: any) => m.id);
    }
    return [];
  } catch {
    return [];
  }
};

export const streamResponse = async (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens: number,
  onChunk: (chunk: string, type: 'reasoning' | 'response') => void,
  signal: AbortSignal
) => {
  // Streams chat responses from the OpenRouter API.
  // Handles parsing Server-Sent Events (SSE) and calling onChunk with content.
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: maxTokens,
        stream: true,
      }),
      signal,
    });

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;
      const lines = buffer.split('\n').filter((line) => line.startsWith('data: '));
      buffer = buffer.split('\n').slice(lines.length).join('\n');

      for (const line of lines) {
        if (line === 'data: [DONE]') continue; // End of stream signal
        try {
          const data = JSON.parse(line.replace('data: ', ''));
          if (data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
            // Basic type differentiation (can be made more robust if needed)
            const type = content.includes('**Reasoning**') ? 'reasoning' : 'response';
            onChunk(content, type);
          }
        } catch (e) {
          // console.error('Error parsing stream data:', e); // Optional: log parsing errors for debugging
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    throw error;
  }
};