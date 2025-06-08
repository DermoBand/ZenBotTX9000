import LZString from 'lz-string';

export interface ChatMessage {
  role: string;
  content: string;
  type?: 'reasoning' | 'response';
}

export interface StorageSchema {
  version: number;
  apiKey: string;
  messages: ChatMessage[];
  customModels: string[];
  selectedModel?: string;
  systemPrompt?: string;
  maxTokens?: number;
  theme?: 'dark' | 'light';
  suggestedModels?: string[];
  migratedToV2?: boolean;
}

export const saveToStorage = (key: string, data: StorageSchema) => {
  const compressed = LZString.compress(JSON.stringify(data));
  localStorage.setItem(key, compressed);
};

export const loadFromStorage = (key: string): StorageSchema | null => {
  const compressed = localStorage.getItem(key);
  if (!compressed) return null;
  try {
    const decompressed = LZString.decompress(compressed);
    let data = JSON.parse(decompressed) as StorageSchema;

    // Migration logic
    if (data && data.version === 1) {
      data = {
        ...data,
        version: 2,
        selectedModel: data.selectedModel || 'deepseek-r1:0528', // Default model
        systemPrompt: data.systemPrompt || 'You are a helpful assistant.', // Default prompt
        maxTokens: data.maxTokens || 4096, // Default maxTokens
        theme: data.theme || 'dark', // Default theme
        suggestedModels: data.suggestedModels || [],
        migratedToV2: true,
      };
    }
    return data;
  } catch {
    // If parsing or migration fails, clear potentially corrupted data
    localStorage.removeItem(key);
    return null;
  }
};

export const clearStorage = (key: string) => {
  localStorage.removeItem(key);
};
// Helper function to clear a specific key from localStorage.