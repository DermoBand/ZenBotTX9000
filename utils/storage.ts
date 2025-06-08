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
}

export const saveToStorage = (key: string, data: any) => {
  const compressed = LZString.compress(JSON.stringify(data));
  localStorage.setItem(key, compressed);
};

export const loadFromStorage = <T>(key: string): T | null => {
  const compressed = localStorage.getItem(key);
  if (!compressed) return null;
  try {
    const decompressed = LZString.decompress(compressed);
    return JSON.parse(decompressed) as T;
  } catch {
    return null;
  }
};

export const clearStorage = (key: string) => {
  localStorage.removeItem(key);
};